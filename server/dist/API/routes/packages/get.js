/**
 * @module routes/package
 * Handles the `/package/:id` endpoint (GET) for retrieving package metadata and content by ID.
 */
import { Router } from 'express';
import { packagesDBClient, packageDB } from '../../config/dbConfig.js';
import { fetchPackage } from '../../helpers/s3Helper.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { validate as isValidUUID } from 'uuid';
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
        const packageID = req.params.id;
        if (!packageID || !isValidUUID(packageID)) {
            res.status(400).json({ error: "Invalid package ID format." });
            return;
        }
        const packageResult = await packagesDBClient.query(`SELECT "Name", "Version", "Content" 
             FROM ${packageDB} 
             WHERE "ID" = $1`, [packageID]);
        // If the package is not found, respond with 404
        if (packageResult.rows.length === 0) {
            res.status(404).json({ error: `No package found with ID: ${packageID}` });
            return;
        }
        // Extract package details with exact property names
        const { Name, Version, Content } = packageResult.rows[0];
        const content_string = await fetchPackage(Content);
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
    }
    catch (error) {
        // Log the error and respond with 500 in case of an unexpected error
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
