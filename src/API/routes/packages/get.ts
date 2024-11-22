/* Handles `/package/{id}` (GET) */
import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';


// Create a new router instance to define and group related routes
const router = Router();


router.get('/:id', async (req, res) => {
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader) {
            res.status(403).json({ error: "Missing X-Authorization header" });
            return;
        }

        if (typeof authHeader !== 'string') {
            res.status(403).json({ error: "Invalid X-Authorization header (must be a string)" });
            return;
        }

        // Extract the token from the header
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

        // Verify user authentication using the provided token
        const result = await userDBClient.query(
            `SELECT * FROM ${employeeDB} WHERE "X-Authorization" = $1`,
            [x_authorization]
        );

        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Extract the package ID from the URL parameter
        const packageID = req.params.id;

        // Check if the package ID is provided
        if (!packageID) {
            res.status(400).json({ error: "Package ID is required but was not provided." });
            return;
        }

        // Fetch package details from the database (NEED TO CHANGE REPO LINK COLUMN)
        const packageResult = await packagesDBClient.query(
            `SELECT 
                COALESCE("Name", 'Unknown') AS name, 
                COALESCE("Version", 'Unknown') AS version, 
                COALESCE("Content", '') AS content, 
                COALESCE("JSProgram", '') AS js_program 
             FROM ${packageDB} 
             WHERE "ID" = $1`,
            [packageID]
        );        
        

        if (packageResult.rows.length === 0) {
            res.status(404).json({ error: `No package found with ID: ${packageID}` });
            return;
        }

        // Extract package details
        const packageData = packageResult.rows[0];

        // Respond with the formatted metadata and data structure
        res.status(200).json({
            metadata: {
                Name: packageData.name || "Unknown",
                Version: packageData.version || "Unknown",
                ID: packageID
            },
            data: {
                Content: packageData.content || "",
                JSProgram: packageData.js_program || ""
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

export default router;