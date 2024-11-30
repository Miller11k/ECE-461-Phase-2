// /* Handles `/package/{id}/rate` (GET) */
// import { Request, Response, Router } from 'express';
// import pg from 'pg'; // Default import for CommonJS module
// const { Pool } = pg; // Destructure the Pool from the default import

// import dotenv from 'dotenv';

// // Load environment variables from `.env` file
// dotenv.config();

// export const pool = new Pool({
//     host: process.env.METRICS_DB_HOST,
//     user: process.env.METRICS_DB_USER,
//     password: process.env.METRICS_DB_PASSWORD,
//     database: process.env.METRICS_DB_NAME,
//     port: Number(process.env.METRICS_DB_PORT),
// });

// // // Create a new router instance to define and group related routes
// const router = Router();


// // router.get('/:id/rate', async (req, res) => {
// //     try {
// //         // Extract the X-Authorization header
// //         const authHeader = req.headers['x-authorization'];

// //         // Validate the X-Authorization header
// //         if (!authHeader || typeof authHeader !== 'string') {
// //            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
// //            return;
// //         }

// //         // Extract the package ID from the route parameter
// //         const packageId = req.params.id;

// //         if (!packageId) {
// //             res.status(400).json({ error: "Package ID is missing or invalid" });
// //             return;
// //         }

// //         // Query the database for metrics
// //         const tableName = process.env.METRICS_DB_TABLE;
// //         const query = `SELECT * FROM ${tableName} WHERE package_id = $1`;
// //         const { rows } = await pool.query(query, [packageId]);

// //         if (rows.length === 0) {
// //             res.status(404).json({ error: "Package metrics not found" });
// //             return;
// //         }

// //         // Return the metrics
// //         res.status(200).json(rows[0]);



// //     } catch (error) {
// //         res.status(500).json({ error: "Internal server error" });
// //         return;
// //     }

// // });

// // export default router;


// router.get('/:id/rate', async (req, res) => {
//     try {
//         // Extract the X-Authorization header
//         const authHeader = req.headers['x-authorization'];

//         if (!authHeader || typeof authHeader !== 'string') {
//             console.error("Missing or invalid X-Authorization header");
//             res.status(403).json({ error: "Missing or invalid X-Authorization header" });
//             return;
//         }

//         const packageId = req.params.id;

//         if (!packageId) {
//             console.error("Package ID is missing or invalid");
//             res.status(400).json({ error: "Package ID is missing or invalid" });
//             return;
//         }

//         // Ensure tableName is not undefined
//         const tableName = process.env.METRICS_DB_TABLE;
//         if (!tableName) {
//             console.error("Environment variable METRICS_DB_TABLE is missing");
//             res.status(500).json({ error: "Server misconfiguration" });
//             return;
//         }

//         console.log(`Fetching metrics for package ID: ${packageId} from table: ${tableName}`);

//         // Query the database for metrics
//         const query = `SELECT * FROM ${tableName} WHERE package_id = $1`;
//         const { rows } = await pool.query(query, [packageId]);

//         if (rows.length === 0) {
//             console.error(`No metrics found for package ID: ${packageId}`);
//             res.status(404).json({ error: "Package metrics not found" });
//             return;
//         }

//         // Return the metrics
//         console.log(`Metrics found for package ID: ${packageId}`, rows[0]);
//         res.status(200).json(rows[0]);

//     } catch (error) {
//         console.error("Error occurred while fetching package metrics:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// export default router;

import { Request, Response, Router } from 'express';
import pg from 'pg'; // PostgreSQL client
import dotenv from 'dotenv';

// Load environment variables from `.env` file
dotenv.config();

const { Pool } = pg;

// Initialize the PostgreSQL connection pool
const pool = new Pool({
    host: process.env.METRICS_DB_HOST,
    user: process.env.METRICS_DB_USER,
    password: process.env.METRICS_DB_PASSWORD,
    database: process.env.METRICS_DB_NAME,
    port: Number(process.env.METRICS_DB_PORT),
});

// Validate required environment variables
if (!process.env.METRICS_DB_HOST || 
    !process.env.METRICS_DB_USER || 
    !process.env.METRICS_DB_PASSWORD || 
    !process.env.METRICS_DB_NAME || 
    !process.env.METRICS_DB_PORT || 
    !process.env.METRICS_DB_TABLE) {
    console.error("Error: Missing one or more required environment variables for database configuration.");
    process.exit(1);
}

// Create a new router instance
const router = Router();

/**
 * GET /package/{id}/rate
 * Retrieves metrics for a given package ID.
 */
router.get('/:id/rate', async (req: Request, res: Response) => {
    try {
        // Extract and validate the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            console.warn(`[WARN] Missing or invalid X-Authorization header`);
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        // Extract the package ID from the route parameter
        const packageId = req.params.id;
        if (!packageId) {
            console.warn(`[WARN] Package ID is missing or invalid`);
            res.status(400).json({ error: "Package ID is missing or invalid" });
            return;
        }

        console.log(`[DEBUG] Fetching metrics for package ID: ${packageId}`);

        // Query the database for metrics
        const tableName = process.env.METRICS_DB_TABLE;
        const query = `SELECT * FROM ${tableName} WHERE package_id = $1`;
        const { rows } = await pool.query(query, [packageId]);

        // Check if the package metrics were found
        if (rows.length === 0) {
            console.warn(`[WARN] No metrics found for package ID: ${packageId}`);
            res.status(404).json({ error: "Package metrics not found" });
            return;
        }

        // Return the metrics as JSON
        console.log(`[DEBUG] Metrics found for package ID ${packageId}:`, rows[0]);
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`[ERROR] Internal server error:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
