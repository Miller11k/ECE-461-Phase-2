import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB, metricsDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { deleteAllS3BucketContents } from '../../helpers/s3Helper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * DELETE / - Resets the registry by clearing the `packages`, `dependencies`, and `package_metrics` tables.
 * 
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * 
 * @description This endpoint requires an X-Authorization header containing a valid JWT.
 * Only admin users are allowed to perform this operation. The endpoint clears the relevant
 * database tables in a transactional manner to reset the registry state.
 */
router.delete('/', async (req, res) => {
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        // Extract the token from the header
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

            
        const decoded_jwt = await decodeAuthenticationToken(x_authorization);

        if(!decoded_jwt){
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Check if user has permission to delete registry
        const { isAdmin } = decoded_jwt;

        // If user is not admin, does not have permission to reset
        if(!isAdmin){
            res.status(403).json({ success: false, message: 'You do not have permission to reset the registry.' });
            return;
        }

        // Begin transaction
        await packagesDBClient.query('BEGIN');

        // Clear the `packages` table
        await packagesDBClient.query(`DELETE FROM ${packageDB}`);
        
        // Clear the `dependencies` table
        await packagesDBClient.query(`DELETE FROM ${dependenciesDB}`);
        
        // Clear the `package_metrics` table
        await packagesDBClient.query(`DELETE FROM ${metricsDB}`);

        // Delete all contents in the S3 bucket
        const s3BucketName = process.env.S3_BUCKET_NAME!;
        const s3DeletionSuccess = await deleteAllS3BucketContents(s3BucketName);

        if (!s3DeletionSuccess) {
            // Rollback transaction if S3 clearing fails
            await packagesDBClient.query('ROLLBACK');
            res.status(500).json({ success: false, message: 'S3 bucket clearing failed. Changes rolled back.' });
            return;
        }

        // Commit transaction if S3 clearing is successful
        await packagesDBClient.query('COMMIT');


        res.status(200).json({ success: true, message: 'Registry is reset.' });
        return;

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

export default router;