/**
 * Handles the `/package/{id}` endpoint (GET).
 * This route fetches metadata and content of a package by its ID, ensuring user authentication.
 * 
 * @module routes/package
 */

import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { fetchPackage, getS3Path } from '../../helpers/s3Helper.js';
import { decodeAuthenticationToken, displayDecodedPayload } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * GET `/package/:id` - Retrieves package metadata and content by ID.
 * 
 * @name GET /package/:id
 * @function
 * @memberof module:routes/package
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void} Sends a JSON response with package details or an error
 */
router.get('/:id', async (req, res) => {
    try {
        // Extract and validate the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            // Respond with 403 if the header is missing or invalid
            res.status(403).json({ error: "Invalid or missing X-Authorization header" });
            return;
        }

        // Extract the token from the header, removing the "Bearer " prefix if present
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

        const decoded_jwt = await decodeAuthenticationToken(x_authorization);


        // If no user matches the token, respond with 403
        if (!decoded_jwt) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Extract the package ID from the URL parameter
        const packageID = req.params.id;
        if (!packageID) {
            // Respond with 400 if the package ID is missing
            res.status(400).json({ error: "Package ID is required but was not provided." });
            return;
        }

        const packageResult = await packagesDBClient.query(
            `SELECT "Name", "Version", "Content" 
             FROM ${packageDB} 
             WHERE "ID" = $1`,
            [packageID]
        );
        
        // If the package is not found, respond with 404
        if (packageResult.rows.length === 0) {
            res.status(404).json({ error: `No package found with ID: ${packageID}` });
            return;
        }
        
        // Extract package details with exact property names
        const { Name, Version, Content } = packageResult.rows[0];

        // Get location of zip in S3 to return as string (base64 encoding)
        const content_loc = getS3Path(Content);
        if(!content_loc){
            res.status(404).json({ error: `Package content not found for ID: ${packageID}` });
            return;
        }
        const content_string = await fetchPackage(content_loc);
        
        // Format the response JSON to include metadata and content
        const responseJson = {
            metadata: {
                Name,
                Version,
                ID: packageID
            },
            data: {
                // Content  // For testing purposes
                Content: content_string
            }
        };
        
        // Send the successful response with package details
        res.status(200).json(responseJson);

    } catch (error) {
        // Log the error and respond with 500 in case of an unexpected error
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;