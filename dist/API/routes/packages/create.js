// routes/packages/create.ts
import { Router } from 'express';
import { userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { verifyAuthenticationToken } from '../../helpers/jwtHelper.js';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import { saveBase64AsZip, extractPackageJsonFromZip, cloneAndZipRepo } from '../../helpers/zipHelper.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
// Create a new router instance to define and group related routes
const router = Router();
// Initialize the S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.IAM_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
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
router.post('/', async (req, res) => {
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
        // Verify that the user exists in the database
        const result = await userDBClient.query(`SELECT * FROM public.employee_logins WHERE username = $1`, [username]);
        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'User not found.' });
            return;
        }
        // Proceed with the rest of the code
        console.log('User authenticated successfully');
        // Validate the request body
        const { metadata, data } = req.body;
        if (!data) {
            res.status(400).json({ error: "Request body must include 'data' object." });
            return;
        }
        const { Content, URL, JSProgram, debloat, Name } = data;
        if ((Content && URL) || (!Content && !URL)) {
            res.status(400).json({ error: "Either 'Content' or 'URL' must be provided, not both." });
            return;
        }
        if (Content && !Name) {
            res.status(400).json({ error: "When 'Content' is provided, 'Name' must also be provided." });
            return;
        }
        let packageName = '';
        let packageVersion = '';
        let packageID = '';
        let s3Key = '';
        let repoLink = '';
        let isInternal = false;
        let uploadMethod = '';
        if (Content) {
            // Handle Content upload
            packageName = Name;
            uploadMethod = 'Content';
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
            // For Content uploads, the version will start from '1.0.0'
            packageVersion = '1.0.0';
            // Generate package ID
            packageID = generatePackageID(packageName, packageVersion);
            // Check if the package already exists
            const existingPackage = await packagesDBClient.query(`SELECT * FROM ${packageDB} WHERE package_name = $1 AND package_version = $2`, [packageName, packageVersion]);
            if (existingPackage.rows.length > 0) {
                res.status(409).json({ error: 'Package already exists' });
                return;
            }
            // Upload to S3
            s3Key = `${packageID}.zip`;
            const fileStream = fs.createReadStream(tempZipPath);
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
                Key: s3Key,
                Body: fileStream,
            }));
            // Clean up temp files
            fs.unlinkSync(tempZipPath);
        }
        else if (URL) {
            // Handle URL ingestion
            uploadMethod = 'URL';
            repoLink = URL; // Use the provided URL as the repository link
            isInternal = false; // Assuming URL uploads are external
            // Assume you have a helper function to clone and zip the repo
            const tempRepoPath = `/tmp/repo-${Date.now()}`;
            const tempZipPath = `/tmp/${Date.now()}.zip`;
            await cloneAndZipRepo(URL, tempRepoPath, tempZipPath);
            // Extract package.json
            const packageJson = await extractPackageJsonFromZip(tempZipPath);
            if (!packageJson) {
                res.status(400).json({ error: 'Invalid repository content: package.json not found.' });
                return;
            }
            packageName = packageJson.name;
            packageVersion = packageJson.version || '1.0.0'; // Default to '1.0.0' if version not provided
            if (!packageName) {
                res.status(400).json({ error: 'Name not found in package.json' });
                return;
            }
            // Generate package ID
            packageID = generatePackageID(packageName, packageVersion);
            // Check if the package already exists
            const existingPackage = await packagesDBClient.query(`SELECT * FROM ${packageDB} WHERE package_name = $1 AND package_version = $2`, [packageName, packageVersion]);
            if (existingPackage.rows.length > 0) {
                res.status(409).json({ error: 'Package already exists' });
                return;
            }
            // Upload to S3
            s3Key = `${packageID}.zip`;
            const fileStream = fs.createReadStream(tempZipPath);
            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
                Key: s3Key,
                Body: fileStream,
            }));
            // Clean up temp files
            fs.unlinkSync(tempZipPath);
            // Remove temp repo folder
            fs.rmSync(tempRepoPath, { recursive: true, force: true });
        }
        // Store package metadata in the database
        await packagesDBClient.query(`INSERT INTO ${packageDB} (package_name, package_version, repo_link, is_internal, s3_link)
       VALUES ($1, $2, $3, $4, $5)`, [packageName, packageVersion, repoLink, isInternal, s3Key]);
        // Return success response
        res.status(201).json({
            package_name: packageName,
            package_version: packageVersion,
            package_id: packageID,
        });
        return;
    }
    catch (error) {
        console.error('Error in POST /package:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
export default router;
