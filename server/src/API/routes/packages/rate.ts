import { Request, Response, Router } from 'express';
import pg from 'pg'; // PostgreSQL client
import dotenv from 'dotenv';
import { shouldLog } from '../../helpers/logHelper.js';
import { validate as isValidUUID } from 'uuid'; // Import UUID validation function

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

const router = Router();

/**
 * GET /package/{id}/rate
 * Retrieves metrics for a given package ID.
 */
router.get('/:id/rate', async (req: Request, res: Response) => {
    let log_get_package = parseInt(process.env.LOG_GET_PACKAGE_ID_RATE || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_get_package, log_all);
    
    console.log('\n\n\n*-------------------------------------------*');
    console.log('POST /package/:id/rate endpoint hit');
    console.log('*-------------------------------------------*');
    try {
        if (should_log) {
            console.log('[DEBUG] Incoming request to /package/:id/rate');
            console.log('[DEBUG] Request headers:', req.headers);
            console.log('[DEBUG] Request params:', req.params);
            console.log('[DEBUG] Request query:', req.query);
        }

        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            if (should_log) {
                console.warn(`[WARN] Missing or invalid X-Authorization header`);
            }
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        const packageId = req.params.id;

        // Validate the UUID
        if (!isValidUUID(packageId)) {
            if (should_log) {
                console.warn(`[WARN] Invalid UUID provided: ${packageId}`);
            }
            res.status(404).json({ error: "Package not found" });
            return;
        }

        if (should_log) {
            console.log(`[DEBUG] Fetching metrics for package ID: ${packageId}`);
        }

        const tableName = process.env.METRICS_DB_TABLE;

        // Check if the package ID exists in the database
        const existsQuery = `SELECT 1 FROM ${tableName} WHERE package_id = $1`;
        const existsRes = await pool.query(existsQuery, [packageId]);
        if (existsRes.rowCount === 0) {
            if (should_log) {
                console.warn(`[WARN] No metrics found for package ID: ${packageId}`);
            }
            res.status(404).json({ error: "Package not found" });
            return;
        }

        if (should_log) {
            console.log(`[DEBUG] Querying information schema for columns in table: ${tableName}`);
        }
        const columnQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1
            AND column_name NOT IN ('metric_id', 'package_id');
        `;
        const columnRes = await pool.query(columnQuery, [tableName]);
        if (should_log) {
            console.log('[DEBUG] Columns query result:', columnRes.rows);
        }

        const columns = columnRes.rows.map(row => row.column_name).join(', ');

        if (!columns) {
            if (should_log) {
                console.error('[ERROR] No valid columns found in the table.');
            }
            res.status(500).json({ error: "Internal server error" });
            return;
        }

        if (should_log) {
            console.log(`[DEBUG] Querying metrics table for package ID: ${packageId}`);
        }
        const query = `SELECT ${columns} FROM ${tableName} WHERE package_id = $1`;
        const { rows } = await pool.query(query, [packageId]);
        if (should_log) {
            console.log('[DEBUG] Metrics query result:', rows);
        }

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

        const data = rows[0] as Record<string, string>;
        const formattedData: Record<string, number> = {};
        for (const key of desiredOrder) {
            const dbKey = Object.keys(keyMapping).find(k => keyMapping[k] === key);
            if (dbKey && data[dbKey] !== undefined) {
                formattedData[key] = parseFloat(data[dbKey]);
            }
        }

        if (should_log) {
            console.log(`[DEBUG] Metrics found for package ID ${packageId}:`, formattedData);
        }
        res.status(200).json(formattedData);
    } catch (error) {
        if (should_log) {
            console.error(`[ERROR] Internal server error:`, error);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;