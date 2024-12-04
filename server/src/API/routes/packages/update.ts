import { Request, Response, Router } from 'express';
import { packagesDBClient, packageDB } from '../../config/dbConfig.js';

// Create a new router instance to define and group related routes
const router = Router();

router.post('/:id', async (req, res) => {
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        // Extract package ID from request parameters
        const packageId = req.params.id;
        const { sizeMb } = req.body;

        // Validate the sizeMb parameter
        if (sizeMb === undefined) {
            res.status(400).json({ error: "Missing required field: sizeMb." });
            return;
        }

        // Update the package size in the database
        await packagesDBClient.query(
            `UPDATE ${packageDB} SET size_mb = $1 WHERE package_id = $2`,
            [sizeMb, packageId]
        );

        res.status(200).json({ success: true, message: 'Package updated successfully.' });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
