import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';

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
 * It calculates both the standalone and total size cost of a given package and its transitive dependencies.
 */
router.get('/:id/cost', async (req: Request, res: Response) => {
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

        if (!decoded_jwt) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        // Extract package ID from request params
        const packageId = req.params.id;
        if (!packageId) {
            res.status(400).json({ error: "Package ID is required." });
            return;
        }

        // Query to get package standalone size
        const packageResult = await packagesDBClient.query(
            `SELECT package_name, version, file_location FROM ${packageDB} WHERE package_id = $1`,
            [packageId]
        );

        if (packageResult.rows.length === 0) {
            res.status(404).json({ error: "Package not found." });
            return;
        }

        const { package_name, version, file_location } = packageResult.rows[0];

        // Calculate standalone cost (size of the package zip file)
        let standaloneCost = 0;
        if (file_location) {
            // Assuming we have a function to get the size of the file
            standaloneCost = await getFileSize(file_location); 
        }

        // Query to get dependencies
        const dependenciesResult = await packagesDBClient.query(
            `SELECT dependency_url FROM ${dependenciesDB} WHERE package_id = $1`,
            [packageId]
        );

        // Calculate the total cost including transitive dependencies
        let totalCost = standaloneCost;
        const visitedPackages = new Set();

        async function calculateDependencyCost(dependencyUrl: string): Promise<number> {
            if (visitedPackages.has(dependencyUrl)) {
                return 0; // Prevent infinite loops due to circular dependencies
            }
            visitedPackages.add(dependencyUrl);

            const depResult = await packagesDBClient.query(
                `SELECT package_id, file_location FROM ${packageDB} WHERE repo_link = $1`,
                [dependencyUrl]
            );

            if (depResult.rows.length === 0) {
                return 0; // Dependency not found in the registry
            }

            const { package_id, file_location } = depResult.rows[0];
            let dependencyCost = 0;

            if (file_location) {
                dependencyCost = await getFileSize(file_location);
            }

            // Recursively calculate the cost of sub-dependencies
            const subDependenciesResult = await packagesDBClient.query(
                `SELECT dependency_url FROM ${dependenciesDB} WHERE package_id = $1`,
                [package_id]
            );

            for (const subDep of subDependenciesResult.rows) {
                dependencyCost += await calculateDependencyCost(subDep.dependency_url);
            }

            return dependencyCost;
        }

        for (const dep of dependenciesResult.rows) {
            totalCost += await calculateDependencyCost(dep.dependency_url);
        }

        res.status(200).json({
            packageId,
            package_name,
            version,
            standaloneCost,
            totalCost
        });
        return;

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

// Mock function to get file size from a location (e.g., S3)
async function getFileSize(fileLocation: string): Promise<number> {
    // Implement the logic to get file size from the given file location
    // For now, we'll return a mocked value
    return 50.0; // Size in MB
}

export default router;
