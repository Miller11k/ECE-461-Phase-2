import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB, metricsDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * DELETE / - Resets the registry by clearing the `packages`, `dependencies`, and `package_metrics` tables.
 * 
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * 
 * @description This endpoint requires an X-Authorization header containing a valid JWT.
 * Only admin users are allowed to perform this operation. The endpoint clears the relevant
 * database tables in a transactional manner to reset the registry state.
 */
router.delete('/', async (req, res) => {
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];

        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }

        // Extract the token from the header
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

        // Verify user authentication using the provided token and retrieve the salt
        const result = await userDBClient.query(
            `SELECT "salt" FROM ${employeeDB} WHERE "X-Authorization" = $1`,
            [x_authorization]
        );

        // Check if JWT is valid
        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Extract the salt from the query result
        const salt = result.rows[0].salt;

        const decoded_jwt = decodeAuthenticationToken(x_authorization, salt);

        if(!decoded_jwt){
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Check if user has permission to delete registry
        const { isAdmin } = decoded_jwt;

        // If user is not admin, does not have permission to reset
        if(!isAdmin){
            res.status(403).json({ success: false, message: 'You do not have permission to reset the registry.' });
            return;
        }

        // Begin transaction
        await packagesDBClient.query('BEGIN');

        // Clear the `packages` table
        await packagesDBClient.query(`DELETE FROM ${packageDB}`);
        
        // Clear the `dependencies` table
        await packagesDBClient.query(`DELETE FROM ${dependenciesDB}`);
        
        // Clear the `package_metrics` table
        await packagesDBClient.query(`DELETE FROM ${metricsDB}`);

        // Commit transaction
        await packagesDBClient.query('COMMIT');

        res.status(200).json({ success: true, message: 'Registry is reset.' });
        return;

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

export default router;