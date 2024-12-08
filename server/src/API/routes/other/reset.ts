/**
 * @module RegistryResetRouter
 * Defines the endpoint for resetting the registry, clearing database tables, and cleaning up the S3 bucket.
 */

import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB, metricsDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { deleteAllS3BucketContents } from '../../helpers/s3Helper.js';
import { shouldLog } from '../../helpers/logHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to reset the registry by clearing the `packages`, `dependencies`, and `package_metrics` tables,
 * as well as deleting all contents in the associated S3 bucket.
 * 
 * @route DELETE /
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * 
 * @description
 * This endpoint requires an `X-Authorization` header containing a valid JWT.
 * Only admin users are authorized to perform this operation.
 * The operation clears relevant database tables in a transactional manner and ensures
 * that all contents in the S3 bucket are also deleted.
 * 
 * @returns {Object} A JSON response:
 * - On success: `{ success: true, message: 'Registry is reset.' }`
 * - On failure: `{ success: false, message: <error message> }`
 * 
 * @example
 * // Request Headers:
 * {
 *   "X-Authorization": "Bearer <JWT>"
 * }
 * 
 * // Successful response:
 * {
 *   "success": true,
 *   "message": "Registry is reset."
 * }
 * 
 * // Failed response:
 * {
 *   "success": false,
 *   "message": "You do not have permission to reset the registry."
 * }
 */
router.delete('/', async (req, res) => {

    let log_get_package = parseInt(process.env.LOG_DELETE_RESET || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_get_package, log_all);

    console.log('\n\n\n*-------------------------------------------*');
    console.log('DELETE /reset endpoint hit');
    console.log('*-------------------------------------------*');
    try {
        if(should_log){
            console.log('Received request to reset registry.');
        }
        // Extract the X-Authorization header
        
        // Log the headers being sent
        for (const headerName in req.headers) {
            if (headerName.toLowerCase() === 'x-authorization') {
                if(should_log){
                    console.log(`Header name received: ${headerName}`);
                }
            }
        }
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
            if(should_log){
                console.log('Invalid or missing authorization header.');
            }
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        // Extract the token from the header
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();
        if(should_log){
            console.log('Extracted token:', x_authorization);
        }

            
        const decoded_jwt = await decodeAuthenticationToken(x_authorization);
        if(should_log){
            console.log('Decoded JWT:', decoded_jwt);
        }

        if(!decoded_jwt){
            if(should_log){
                console.log('JWT decoding failed.');
            }
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Check if user has permission to delete registry
        const { isAdmin } = decoded_jwt;
        if(should_log){
            console.log('User isAdmin:', isAdmin);
        }

        // If user is not admin, does not have permission to reset
        if(!isAdmin){
            if(should_log){
                console.log('User does not have admin privileges.');
            }
            res.status(403).json({ success: false, message: 'You do not have permission to reset the registry.' });
            return;
        }

        // Begin transaction
        if(should_log){
            console.log('Beginning transaction.');
        }
        await packagesDBClient.query('BEGIN');

        // Clear the `packages` table
        if(should_log){
            console.log(`Clearing table: ${packageDB}`);
        }
        await packagesDBClient.query(`DELETE FROM ${packageDB}`);
        
        // Clear the `dependencies` table
        if(should_log){
            console.log(`Clearing table: ${dependenciesDB}`);
        }
        await packagesDBClient.query(`DELETE FROM ${dependenciesDB}`);
        
        // Clear the `package_metrics` table
        if(should_log){
            console.log(`Clearing table: ${metricsDB}`);
        }
        await packagesDBClient.query(`DELETE FROM ${metricsDB}`);

        if(should_log){
            console.log("Resetting metric_id back to 0");
        }

        await packagesDBClient.query(`ALTER SEQUENCE package_metrics_metric_id_seq RESTART WITH 1`);

        // Delete all contents in the S3 bucket
        const s3BucketName = process.env.S3_BUCKET_NAME!;
        if(should_log){
            console.log(`Deleting contents of S3 bucket: ${s3BucketName}`);
        }
        const s3DeletionSuccess = await deleteAllS3BucketContents(s3BucketName);

        if (!s3DeletionSuccess) {
            if(should_log){
                console.log('Failed to clear S3 bucket. Rolling back transaction.');
            }
            // Rollback transaction if S3 clearing fails
            await packagesDBClient.query('ROLLBACK');
            res.status(500).json({ success: false, message: 'S3 bucket clearing failed. Changes rolled back.' });
            return;
        }

        // Commit transaction if S3 clearing is successful
        if(should_log){
            console.log('S3 bucket cleared successfully. Committing transaction.');
        }
        await packagesDBClient.query('COMMIT');


        res.status(200).json({ success: true, message: 'Registry is reset.' });
        if(should_log){
            console.log('Registry reset successfully.');
        }
        return;

    } catch (error) {
        if(should_log){
            console.error('Error occurred during registry reset:', error);
        }
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

export default router;