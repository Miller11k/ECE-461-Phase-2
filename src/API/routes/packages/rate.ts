/* Handles `/package/{id}/rate` (GET) */
import { Request, Response, Router } from 'express';

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from `.env` file
dotenv.config();

export const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false, // Adjust based on your SSL configuration
        ca: process.env.DB_SSL_CA // Use if you have a CA certificate
    },
});

// Create a new router instance to define and group related routes
const router = Router();


router.get('/:id/rate', async (req, res) => {
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
           res.status(403).json({ error: "Missing or invalid X-Authorization header" });
           return;
        }

        // Extract the package ID from the route parameter
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: "Package ID is missing or invalid" });
            return;
        }

        // Query the database for metrics
        const query = `SELECT * FROM package_metrics WHERE package_id = $1`;
        const { rows } = await pool.query(query, [packageId]);

        if (rows.length === 0) {
            res.status(404).json({ error: "Package metrics not found" });
            return;
        }

        // Return the metrics
        res.status(200).json(rows[0]);



    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }

});

export default router;