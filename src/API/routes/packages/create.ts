// routes/packages/create.ts

import { Request, Response, Router } from 'express';
import { userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { verifyAuthenticationToken } from '../../helpers/jwtHelper.js';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import {
  saveBase64AsZip,
  extractPackageJsonFromZip,
  cloneAndZipRepo,
} from '../../helpers/zipHelper.js';
import { uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
import fs from 'fs';
import semver from 'semver';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * POST /package - Upload or ingest a new package.
 *
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 *
 * @description This endpoint allows authenticated users to upload or ingest a new package.
 * It accepts either 'Content' (base64 encoded zip) or 'URL' in the request body, along with 'JSProgram'.
 * The package is processed and stored, and metadata is returned.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received POST /package request');

    // Extract the X-Authorization header
    const authHeader = req.headers['x-authorization'];

    // Validate the X-Authorization header
    if (!authHeader || typeof authHeader !== 'string') {
      res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
      return;
    }

    // Extract the token from the header
    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();

    // Verify JWT token using JWT_SECRET
    const decoded_jwt = verifyAuthenticationToken(x_authorization);

    if (!decoded_jwt) {
      res.status(403).json({ success: false, message: 'Authentication failed.' });
      return;
    }

    const username = decoded_jwt.username;

    console.log('Authenticated username:', username);

    // Verify that the user exists in the database
    console.log('Database connection details:', userDBClient);
    const result = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );
    console.log('User query result:', result.rows);

    if (result.rows.length === 0) {
      res.status(403).json({ success: false, message: 'User not found.' });
      return;
    }

    console.log('User authenticated successfully');

    // Validate the request body according to the OpenAPI spec
    const { Content, URL, JSProgram, debloat, Name } = req.body;

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
    let s3Link = '';
    let repoLink = '';
    let isInternal = false;
    let s3FolderKey = '';

    if (Content) {
      // Handle Content upload
      packageName = Name;
      repoLink = 'ContentUpload'; // Since there's no repository link
      isInternal = true; // Assuming content uploads are internal

      // Save Base64 content to a zip file
      const tempZipPath = `/tmp/${packageName}-${Date.now()}.zip`;
      await saveBase64AsZip(Content, tempZipPath);

      // Extract package.json to get the version
      const packageJson = await extractPackageJsonFromZip(tempZipPath);
      if (!packageJson) {
        res.status(400).json({ error: 'Invalid package content: package.json not found.' });
        return;
      }

      packageVersion = packageJson.version || '1.0.0';

      // Generate package ID
      packageID = generatePackageID(packageName, packageVersion);

      // Check if the package already exists
      console.log('Checking for existing package with query:');
      console.log(
        `SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`,
        [packageName, packageVersion]
      );

      const existingPackage = await packagesDBClient.query(
        `SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`,
        [packageName, packageVersion]
      );
      console.log('Existing package result:', existingPackage.rows);

      if (existingPackage.rows.length > 0) {
        res.status(409).json({ error: 'Package already exists' });
        return;
      }

      // Upload unzipped content to S3
      const s3BucketName = process.env.S3_PERMANENT_BUCKET_NAME || '';
      s3FolderKey = `${packageID}/`;

      const zipBase64 = fs.readFileSync(tempZipPath).toString('base64');

      const uploadSuccess = await uploadUnzippedToS3(zipBase64, s3BucketName, s3FolderKey);

      if (!uploadSuccess) {
        res.status(500).json({ error: 'Failed to upload package to S3' });
        return;
      }

      s3Link = `s3://${s3BucketName}/${s3FolderKey}`;

      // Clean up temp files
      fs.unlinkSync(tempZipPath);
    }

    // Log data before inserting into the database
    console.log('Inserting package into database with values:');
    console.log({
      ID: packageID,
      Name: packageName,
      Version: packageVersion,
      repo_link: repoLink,
      is_internal: isInternal,
      Content: s3Link,
    });

    // Store package metadata in the database
    await packagesDBClient.query(
      `INSERT INTO ${packageDB} ("ID", "Name", "Version", "repo_link", "is_internal", "Content")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [packageID, packageName, packageVersion, repoLink, isInternal, s3Link]
    );

    console.log('Package inserted successfully.');

    // Prepare response data
    const responseData: any = {
      metadata: {
        Name: packageName,
        Version: packageVersion,
        ID: packageID,
      },
      data: {},
    };

    if (Content) {
      responseData.data.Content = Content;
    }

    if (URL) {
      responseData.data.URL = URL;
    }

    if (JSProgram) {
      responseData.data.JSProgram = JSProgram;
    }

    // Return success response
    res.status(201).json(responseData);
    return;
  } catch (error) {
    console.error('Error in POST /package:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;