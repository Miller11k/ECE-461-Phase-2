import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken, displayDecodedPayload } from '../../helpers/jwtHelper.js';
import { calculatePackageCost } from '../../helpers/packageHelper.js';
import { validate as isValidUUID } from 'uuid';


// Create a new router instance to define and group related routes
const router = Router();

/**
 * GET /package/:id/cost - Retrieves the size cost of a package and its dependencies.
 *
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 *
 * @description This endpoint requires an X-Authorization header containing a valid JWT.
 * The endpoint returns the size cost of a package, including its dependencies if requested.
 */
router.get('/:id/cost', async (req, res) => {
    console.log("req.query", req.query);
    console.log("req.params", req.params);
    console.log("req.headers", req.headers);

    console.log('Incoming request to /package/:id/cost');
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

        // Extract package ID from request parameters
        const packageId = req.params.id; 

        // Debugging - Log package ID
        console.debug(`Requested package ID: ${packageId}`);

        // Check if package ID is valid
        if (!packageId || !isValidUUID(packageId)) {
            res.status(400).json({ error: "Invalid package ID format." });
            return;
        }

        // Calculate package cost using helper function
        const costResult = await calculatePackageCost(packageId, req.query.dependency === 'true');

        // Debugging - Log final response
        console.debug('Final response:', costResult);

        res.status(200).json(costResult);
    } catch (error) {
        console.error('Internal server error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
