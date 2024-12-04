import { Router } from 'express';
import { userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import { saveBase64AsZip, extractPackageJsonFromZip, cloneAndZipRepo, } from '../../helpers/zipHelper.js';
import { uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
import fs from 'fs';
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
router.post('/', async (req, res) => {
    try {
        // Extract the 'X-Authorization' header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            console.error('Missing or invalid X-Authorization header');
            res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
            return;
        }
        // Extract the token from the header, removing the "Bearer " prefix if present
        const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice('bearer '.length).trim()
            : authHeader.trim();
        console.log('Extracted token:', x_authorization);
        // Decode the JWT token to get user information
        const decoded_jwt = await decodeAuthenticationToken(x_authorization);
        // If no user matches the token, respond with 403
        if (!decoded_jwt) {
            console.error('Authentication failed: Invalid token');
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }
        const username = decoded_jwt.username;
        console.log('Authenticated username:', username);
        // Check if the user exists in the database
        const userResult = await userDBClient.query(`SELECT * FROM public.users WHERE username = $1`, [username]);
        if (userResult.rows.length === 0) {
            console.error('User not found in database:', username);
            res.status(403).json({ success: false, message: 'User not found.' });
            return;
        }
        console.log('User found in database:', username);
        // Extract 'Content', 'URL', and 'Name' from the request body
        const { Content, URL, Name } = req.body;
        console.log('Request body:', req.body);
        // Validate the request body
        if (!Content && !URL) {
            console.error("Either 'Content' or 'URL' must be provided.");
            res.status(400).json({ error: "Either 'Content' or 'URL' must be provided." });
            return;
        }
        if (Content && URL) {
            console.error("Only one of 'Content' or 'URL' should be provided, not both.");
            res.status(400).json({ error: "Only one of 'Content' or 'URL' should be provided, not both." });
            return;
        }
        if (Content && !Name) {
            console.error("When 'Content' is provided, 'Name' must also be provided.");
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
            // Clone and zip the GitHub repository
            const cloneSuccess = await cloneAndZipRepo(repoUrl, tempZipPath);
            if (!cloneSuccess) {
                console.error('Failed to clone and zip repository from URL:', repoUrl);
                res.status(400).json({ error: 'Failed to clone and zip repository from URL' });
                return;
            }
            console.log(`Repository cloned and zipped successfully to ${tempZipPath}`);
            // Extract package.json to get package details
            const packageJson = await extractPackageJsonFromZip(tempZipPath);
            if (!packageJson) {
                console.error('Invalid package content: package.json not found in', tempZipPath);
                res.status(400).json({ error: 'Invalid package content: package.json not found.' });
                return;
            }
            console.log('Extracted package.json:', packageJson);
            packageName = packageJson.name || 'unknown-package';
            packageVersion = packageJson.version || '1.0.0';
            packageID = generatePackageID(packageName, packageVersion);
            s3FolderKey = `${packageID}/`;
            console.log('Package details - Name:', packageName, 'Version:', packageVersion, 'ID:', packageID);
            // Check if the package already exists
            const existingPackage = await packagesDBClient.query(`SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`, [packageName, packageVersion]);
            if (existingPackage.rows.length > 0) {
                console.error('Package already exists:', packageName, packageVersion);
                res.status(409).json({ error: 'Package already exists' });
                return;
            }
            console.log('Package does not exist, proceeding to upload.');
            // Upload unzipped content to S3
            const s3BucketName = process.env.S3_PERMANENT_BUCKET_NAME || '';
            console.log('Uploading package to S3 bucket:', s3BucketName);
            const uploadSuccess = await uploadUnzippedToS3(tempZipPath, s3BucketName, s3FolderKey);
            if (!uploadSuccess) {
                console.error('Failed to upload package to S3');
                res.status(500).json({ error: 'Failed to upload package to S3' });
                return;
            }
            console.log('Package uploaded to S3 successfully.');
            // Clean up temporary zip file
            fs.unlinkSync(tempZipPath);
            console.log('Temporary zip file deleted:', tempZipPath);
        }
        // Handle Content upload (Base64 encoded zip)
        if (Content) {
            console.log('Processing Base64 Content upload');
            packageName = Name;
            const tempZipPath = `/tmp/${packageName}-${Date.now()}.zip`;
            console.log('Saving Base64 content as zip file:', tempZipPath);
            await saveBase64AsZip(Content, tempZipPath);
            // Extract package.json to get package details
            const packageJson = await extractPackageJsonFromZip(tempZipPath);
            if (!packageJson) {
                console.error('Invalid package content: package.json not found in', tempZipPath);
                res.status(400).json({ error: 'Invalid package content: package.json not found.' });
                return;
            }
            console.log('Extracted package.json:', packageJson);
            packageVersion = packageJson.version || '1.0.0';
            packageID = generatePackageID(packageName, packageVersion);
            s3FolderKey = `${packageID}/`;
            console.log('Package details - Name:', packageName, 'Version:', packageVersion, 'ID:', packageID);
            // Check if the package already exists
            const existingPackage = await packagesDBClient.query(`SELECT * FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2`, [packageName, packageVersion]);
            if (existingPackage.rows.length > 0) {
                console.error('Package already exists:', packageName, packageVersion);
                res.status(409).json({ error: 'Package already exists' });
                return;
            }
            console.log('Package does not exist, proceeding to upload.');
            // Upload unzipped content to S3
            const s3BucketName = process.env.S3_PERMANENT_BUCKET_NAME || '';
            console.log('Uploading package to S3 bucket:', s3BucketName);
            const uploadSuccess = await uploadUnzippedToS3(tempZipPath, s3BucketName, s3FolderKey);
            if (!uploadSuccess) {
                console.error('Failed to upload package to S3');
                res.status(500).json({ error: 'Failed to upload package to S3' });
                return;
            }
            console.log('Package uploaded to S3 successfully.');
            // Clean up temporary zip file
            fs.unlinkSync(tempZipPath);
            console.log('Temporary zip file deleted:', tempZipPath);
        }
        // Save package metadata to database
        console.log('Saving package metadata to database');
        await packagesDBClient.query(`INSERT INTO ${packageDB} ("ID", "Name", "Version", "repo_link", "is_internal", "Content")
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            packageID,
            packageName,
            packageVersion,
            URL || 'ContentUpload',
            !!Content,
            `s3://${process.env.S3_PERMANENT_BUCKET_NAME}/${s3FolderKey}`,
        ]);
        console.log('Package metadata saved to database.');
        // Respond with success
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
    }
    catch (error) {
        // Log the error stack trace for debugging
        console.error('Error in POST /package:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
