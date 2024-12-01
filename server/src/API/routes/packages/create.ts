import express, { Router } from 'express';
import type { Request, Response } from 'express';
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
 * It accepts either 'Content' (base64 encoded zip) or 'URL' in the request body.
 * The package is processed and stored, and metadata is returned.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received POST /package request');

    const authHeader = req.headers['x-authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
      return;
    }

    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();

    const decoded_jwt = verifyAuthenticationToken(x_authorization);
    if (!decoded_jwt) {
      res.status(403).json({ success: false, message: 'Authentication failed.' });
      return;
    }

    const username = decoded_jwt.username;
    console.log('Authenticated username:', username);

    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );
    if (userResult.rows.length === 0) {
      res.status(403).json({ success: false, message: 'User not found.' });
      return;
    }

    const { Content, URL, Name } = req.body;

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
      console.log('Processing URL upload');
    
      const tempZipPath = `/tmp/github-upload-${Date.now()}.zip`;
      const repoUrl = URL;
    
      console.log(`Cloning and zipping repository from URL: ${repoUrl}`);
    
      const cloneSuccess = await cloneAndZipRepo(repoUrl, tempZipPath);
      if (!cloneSuccess) {
        res.status(400).json({ error: 'Failed to clone and zip repository from URL' });
        return;
      }
    
      console.log(`Repository cloned and zipped successfully to ${tempZipPath}`);
    
      // Extract package.json to get package details
      const packageJson = await extractPackageJsonFromZip(tempZipPath);
      if (!packageJson) {
        res.status(400).json({ error: 'Invalid package content: package.json not found.' });
        return;
      }

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

      fs.unlinkSync(tempZipPath); // Clean up temporary file
    }

    // Handle Content upload
    if (Content) {
      console.log('Processing Base64 Content upload');

      packageName = Name;
      const tempZipPath = `/tmp/${packageName}-${Date.now()}.zip`;
      await saveBase64AsZip(Content, tempZipPath);

      // Extract package.json to get package details
      const packageJson = await extractPackageJsonFromZip(tempZipPath);
      if (!packageJson) {
        res.status(400).json({ error: 'Invalid package content: package.json not found.' });
        return;
      }

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

      fs.unlinkSync(tempZipPath); // Clean up temporary file
    }

    // Save package metadata to database
    console.log('Saving package metadata to database');
    await packagesDBClient.query(
      `INSERT INTO ${packageDB} ("ID", "Name", "Version", "repo_link", "is_internal", "Content")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        packageID,
        packageName,
        packageVersion,
        URL || 'ContentUpload',
        !!Content,
        `s3://${process.env.S3_PERMANENT_BUCKET_NAME}/${s3FolderKey}`,
      ]
    );

    console.log('Package successfully saved with ID:', packageID);

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
    console.error('Error in POST /package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;