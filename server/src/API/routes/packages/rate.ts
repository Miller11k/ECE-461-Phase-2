// /* Handles `/package/{id}/rate` (GET) */

import { Request, Response, Router } from 'express';
import pg from 'pg'; // PostgreSQL client
import dotenv from 'dotenv';

// Load environment variables from `.env` file
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.METRICS_DB_HOST,
    user: process.env.METRICS_DB_USER,
    password: process.env.METRICS_DB_PASSWORD,
    database: process.env.METRICS_DB_NAME,
    port: Number(process.env.METRICS_DB_PORT),
    ssl: {
        rejectUnauthorized: false, 
    },
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
        console.log(authHeader);
        console.log("START");
        console.log(process.env);
        console.log(process.env.METRICS_DB_HOST?.trim());
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

        const columnQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name NOT IN ('metric_id', 'package_id');
        `;
        const columnRes = await pool.query(columnQuery, [tableName]);
        const columns = columnRes.rows.map(row => row.column_name).join(', ');

        if (!columns) {
            console.error('No valid columns found in the table.');
            return;
        }

        const query = `SELECT ${columns} FROM ${tableName} WHERE package_id = $1`;
        const { rows } = await pool.query(query, [packageId]);

        // Check if the package metrics were found
        if (rows.length === 0) {
            console.warn(`[WARN] No metrics found for package ID: ${packageId}`);
            res.status(404).json({ error: "Package metrics not found" });
            return;
        }

        // Define the desired order of keys
        const desiredOrder = [
            "BusFactor",
            "BusFactorLatency",
            "Correctness",
            "CorrectnessLatency",
            "RampUp",
            "RampUpLatency",
            "ResponsiveMaintainer",
            "ResponsiveMaintainerLatency",
            "LicenseScore",
            "LicenseScoreLatency",
            "GoodPinningPractice",
            "GoodPinningPracticeLatency",
            "PullRequest",
            "PullRequestLatency",
            "NetScore",
            "NetScoreLatency",
        ];

        // Map database column names to desired keys
        const keyMapping: Record<string, string> = {
            busfactor: "BusFactor",
            busfactorlatency: "BusFactorLatency",
            correctness: "Correctness",
            correctnesslatency: "CorrectnessLatency",
            rampup: "RampUp",
            rampuplatency: "RampUpLatency",
            responsivemaintainer: "ResponsiveMaintainer",
            responsivemaintainerlatency: "ResponsiveMaintainerLatency",
            licensescore: "LicenseScore",
            licensescorelatency: "LicenseScoreLatency",
            goodpinningpractice: "GoodPinningPractice",
            goodpinningpracticelatency: "GoodPinningPracticeLatency",
            pullrequest: "PullRequest",
            pullrequestlatency: "PullRequestLatency",
            netscore: "NetScore",
            netscorelatency: "NetScoreLatency",
        };

        // Format the data in the desired order
        const data = rows[0] as Record<string, string>;
        const formattedData: Record<string, number> = {};
        for (const key of desiredOrder) {
            const dbKey = Object.keys(keyMapping).find(k => keyMapping[k] === key);
            if (dbKey && data[dbKey] !== undefined) {
                formattedData[key] = parseFloat(data[dbKey]);
            }
        }

        // Return the metrics in the specified order
        console.log(`[DEBUG] Metrics found for package ID ${packageId}:`, formattedData);
        res.status(200).json(formattedData);
    } catch (error) {
        console.error(`[ERROR] Internal server error:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
