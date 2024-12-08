/**
 * @module routes/package
 * Handles the `/package/:id` endpoint (GET) for retrieving package metadata and content by ID.
 */

import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { fetchPackage, getS3Path } from '../../helpers/s3Helper.js';
import { decodeAuthenticationToken, displayDecodedPayload } from '../../helpers/jwtHelper.js';
import { validate as isValidUUID } from 'uuid';
import { shouldLog } from '../../helpers/logHelper.js';


// Create a new router instance to define and group related routes
const router = Router();

/**
 * GET `/package/:id` - Retrieves package metadata and content by ID.
 * 
 * @route GET /package/:id
 * @group Packages - Operations related to package management.
 * 
 * @param {Request} req - Express request object.
 * @param {string} req.params.id - The unique ID of the package.
 * @param {Response} res - Express response object.
 * 
 * @returns {Object} A JSON response with the package metadata and content:
 * - `metadata`: Contains `Name`, `Version`, and `ID`.
 * - `data`: Contains the `Content` as a Base64-encoded string.
 * 
 * @example
 * // Successful response:
 * {
 *   "metadata": {
 *     "Name": "example-package",
 *     "Version": "1.0.0",
 *     "ID": "123e4567-e89b-12d3-a456-426614174000"
 *   },
 *   "data": {
 *     "Content": "<Base64-encoded content>"
 *   }
 * }
 * 
 * @example
 * // Error response (invalid ID):
 * {
 *   "error": "Invalid package ID format."
 * }
 * 
 * @example
 * // Error response (not found):
 * {
 *   "error": "No package found with ID: 123e4567-e89b-12d3-a456-426614174000"
 * }
 */
router.get('/:id', async (req, res) => {

    let log_get_package = parseInt(process.env.LOG_GET_PACKAGE_ID || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_get_package, log_all);
    
    try {

        console.log('\n\n\n*-------------------------------------------*');
        console.log('GET /package/:id endpoint hit');
        console.log('*-------------------------------------------*');
        
        if(should_log){
            console.log('Request params:', req.params);
        }
        
        // Extract and validate the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        if(should_log){
            console.log('Extracted X-Authorization header:', authHeader);
        }

        if (!authHeader || typeof authHeader !== 'string') {
            if(should_log){
                console.log('Invalid or missing X-Authorization header');
            }
            res.status(403).json({ error: "Invalid or missing X-Authorization header" });
            return;
        }

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

        if (!decoded_jwt) {
            if(should_log){
                console.log('Authentication failed. Token invalid or expired.');
            }
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        const packageID = req.params.id;
        if(should_log){
            console.log('Received package ID:', packageID);
        }

        // Validate the ID format; if invalid, respond with 404
        if (!isValidUUID(packageID)) {
            if(should_log){
                console.log(`Invalid package ID format: ${packageID}`);
            }
            res.status(404).json({ error: `No package found with ID: ${packageID}` });
            return;
        }

        // Proceed to query the database for a valid UUID
        if(should_log){
            console.log(`Querying the database for package ID: ${packageID}`);
        }
        const packageResult = await packagesDBClient.query(
            `SELECT "Name", "Version", "Content" 
             FROM ${packageDB} 
             WHERE "ID" = $1`,
            [packageID]
        );
        if(should_log){
            console.log('Database query result:', packageResult.rows);
        }

        if (packageResult.rows.length === 0) {
            if(should_log){
                console.log(`No package found with ID: ${packageID}`);
            }
            res.status(404).json({ error: `No package found with ID: ${packageID}` });
            return;
        }

        const { Name, Version, Content } = packageResult.rows[0];
        if(should_log){
            console.log('Retrieved package details from database:', { Name, Version, Content });
            console.log(`Fetching package content for Content ID: ${Content}`);
        }
        const content_string = await fetchPackage(Content);
        if(should_log){
            console.log('Fetched package content as Base64 string:', content_string);
        }

        const responseJson = {
            metadata: {
                Name,
                Version,
                ID: packageID
            },
            data: {
                Content: content_string
            }
        };
        if(should_log){
            console.log('Sending response with package details:', responseJson);
        }
        res.status(200).json(responseJson);

    } catch (error) {
        if(should_log){
            console.error('An unexpected error occurred:', error);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;