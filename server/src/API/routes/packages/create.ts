import { Request, Response, Router } from 'express';
import { userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import {
  saveBase64AsZip,
  extractPackageJsonFromZip,
  cloneAndZipRepo,
} from '../../helpers/zipHelper.js';
import { uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
import fs from 'fs';
import semver from 'semver';

const router = Router();

/**
 * POST `/package` - Upload or ingest a new package.
 * 
 * @route POST /package
 * @group Packages - Operations related to package management.
 * 
 * @param {Request} req - Express request object.
 * @param {string} [req.body.Content] - Base64-encoded zip file content (optional).
 * @param {string} [req.body.URL] - URL to a GitHub repository (optional).
 * @param {string} [req.body.Name] - Name of the package (required if Content is provided).
 * @param {Response} res - Express response object.
 * 
 * @returns {Object} A JSON response with the package metadata and data:
 * - `metadata`: Contains `Name`, `Version`, and `ID`.
 * - `data`: Contains the `Content` or `URL` provided in the request.
 * 
 * @description
 * This endpoint allows authenticated users to upload or ingest a new package.
 * It accepts either 'Content' (Base64-encoded zip file) or 'URL' to a GitHub repository in the request body.
 * The package is processed and stored, and metadata is returned.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Extract the 'X-Authorization' header
    const authHeader = req.headers['x-authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
      return;
    }

    // Extract the token from the header, removing the "Bearer " prefix if present
    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();

    // Decode the JWT token to get user information
    const decoded_jwt = await decodeAuthenticationToken(x_authorization);

    // If no user matches the token, respond with 403
    if (!decoded_jwt) {
      res.status(403).json({ success: false, message: 'Authentication failed.' });
      return;
    }

    const username = decoded_jwt.username;

    // Check if the user exists in the database
    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );
    if (userResult.rows.length === 0) {
      res.status(403).json({ success: false, message: 'User not found.' });
      return;
    }

    // Extract 'Content', 'URL', 'Name', and other package details from the request body
    const { Content, URL, Name, sizeMb, isInternal } = req.body;

    // Validate the request body
    if (!Content && !URL) {
      res.status(400).json({ error: "Either 'Content' or 'URL' must be provided." });
      return;
    }

    if (Content && URL) {
      res.status(400).json({ error: "Only one of 'Content' or 'URL' should be provided, not both." });
      return;
    }

    if (Content && !Name) {
      res.status(400).json({ error: "When 'Content' is provided, 'Name' must also be provided." });
      return;
    }

    let packageName = '';
    let packageVersion = '';
    let packageID = '';
    let s3FolderKey = '';

    // Handle GitHub URL-based repository processing
    if (URL) {
      // Define a temporary path for the zip file
      const tempZipPath = `/tmp/github-upload-${Date.now()}.zip`;
      const repoUrl = URL;

      // Clone and zip the GitHub repository
      const cloneSuccess = await cloneAndZipRepo(repoUrl, tempZipPath);
      if (!cloneSuccess) {
        res.status(400).json({ error: 'Failed to clone and zip repository from URL' });
        return;
      }

      // Extract package.json to get package details
      const packageJson = await extractPackageJsonFromZip(tempZipPath);
      if (!packageJson) {
        res.status(400).json({ error: 'Invalid package content: package.json not found.' });
        return;
      }

      // Extract package name and version from package.json
      packageName = packageJson.name || 'unknown-package';
      packageVersion = packageJson.version || '1.0.0';
      packageID = generatePackageID(packageName, packageVersion);
      s3FolderKey = `${packageID}/`;

      // Check if the package already exists
      const existingPackage = await packagesDBClient.query(
        `SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`,
        [packageName, packageVersion]
      );
      if (existingPackage.rows.length > 0) {
        res.status(409).json({ error: 'Package already exists' });
        return;
      }

      // Upload unzipped content to S3
      const s3BucketName = process.env.S3_PERMANENT_BUCKET_NAME || '';
      const uploadSuccess = await uploadUnzippedToS3(tempZipPath, s3BucketName, s3FolderKey);

      if (!uploadSuccess) {
        res.status(500).json({ error: 'Failed to upload package to S3' });
        return;
      }

      // Clean up temporary zip file
      fs.unlinkSync(tempZipPath);
    }

    // Handle Content upload (Base64-encoded zip)
    if (Content) {
      // Set the package name from the request
      packageName = Name;
      const tempZipPath = `/tmp/${packageName}-${Date.now()}.zip`;

      // Save the Base64 content as a zip file
      await saveBase64AsZip(Content, tempZipPath);

      // Extract package.json to get package details
      const packageJson = await extractPackageJsonFromZip(tempZipPath);
      if (!packageJson) {
        res.status(400).json({ error: 'Invalid package content: package.json not found.' });
        return;
      }

      // Extract package version from package.json
      packageVersion = packageJson.version || '1.0.0';
      packageID = generatePackageID(packageName, packageVersion);
      s3FolderKey = `${packageID}/`;

      // Check if the package already exists
      const existingPackage = await packagesDBClient.query(
        `SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`,
        [packageName, packageVersion]
      );
      if (existingPackage.rows.length > 0) {
        res.status(409).json({ error: 'Package already exists' });
        return;
      }

      // Upload unzipped content to S3
      const s3BucketName = process.env.S3_PERMANENT_BUCKET_NAME || '';
      const uploadSuccess = await uploadUnzippedToS3(tempZipPath, s3BucketName, s3FolderKey);

      if (!uploadSuccess) {
        res.status(500).json({ error: 'Failed to upload package to S3' });
        return;
      }

      // Clean up temporary zip file
      fs.unlinkSync(tempZipPath);
    }

    // Insert the new package into the database
    await packagesDBClient.query(
      `INSERT INTO ${packageDB} ("ID", "Name", "Version", "repo_link", "is_internal", "Content", "size_mb")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        packageID,
        packageName,
        packageVersion,
        URL || 'ContentUpload',
        !!Content,
        `s3://${process.env.S3_PERMANENT_BUCKET_NAME}/${s3FolderKey}`,
        sizeMb || 0,
      ]
    );

    // Respond with success
    res.status(201).json({
      metadata: {
        Name: packageName,
        Version: packageVersion,
        ID: packageID,
      },
      data: {
        ...(Content && { Content }),
        ...(URL && { URL }),
      },
    });
  } catch (error) {
    // Log the error and respond with 500 in case of an unexpected error
    console.error('Error in POST /package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
