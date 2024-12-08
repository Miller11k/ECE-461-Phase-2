import { Request, Response, Router } from 'express';
import { packagesDBClient, packageDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { validate as isValidUUID } from 'uuid';
import { shouldLog } from '../../helpers/logHelper.js';

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
router.get('/:id/cost', async (req: Request, res: Response) => {
  const log_get_package = parseInt(process.env.LOG_GET_PACKAGE_ID_COST || '0', 10);
  const log_all = parseInt(process.env.LOG_ALL || '0', 10);
  const should_log = shouldLog(log_get_package, log_all);

  console.log('*-------------------------------------------*');
  console.log('GET /package/:id/cost endpoint hit');
  console.log('*-------------------------------------------*');

  try {
      // Validate the `X-Authorization` header
      const authHeader = req.headers['x-authorization'];
      
      if(should_log) console.log('Authorization Header:', authHeader);

      if (!authHeader || typeof authHeader !== 'string') {
        if(should_log) console.warn('Authentication failed: Missing or invalid Authorization header.');
          res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
          return;
      }

    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice('bearer '.length).trim()
          : authHeader.trim();
    if(should_log) console.log('Extracted Token:', x_authorization);

    const decoded_jwt = await decodeAuthenticationToken(x_authorization);
    if(should_log) console.log('Decoded JWT:', decoded_jwt);

      if (!decoded_jwt) {
          console.warn('Authentication failed: Invalid JWT.');
          res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
          return;
      }

    // Validate the package ID
    const packageId = req.params.id;
    if(should_log) console.log('Package ID:', packageId);

    if (!packageId || !isValidUUID(packageId)) {
        if(should_log) console.warn('Invalid Package ID:', packageId);
        res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
        return;
    }

    const includeDependencies = req.query.dependency === 'true';
    if(should_log) console.log('Include Dependencies:', includeDependencies);

    // Query for the main package costs
    const packageQuery = `
        SELECT "standalone_cost", "total_cost"
        FROM ${packageDB}
        WHERE "ID" = $1
    `;
    if(should_log) console.log('Executing Package Query:', packageQuery, [packageId]);

    const packageResult = await packagesDBClient.query(packageQuery, [packageId]);
    if(should_log) console.log('Package Query Result:', packageResult.rows);

    if (packageResult.rows.length === 0) {
    if(should_log) console.warn('Package not found:', packageId);
        res.status(404).json({ error: 'Package does not exist.' });
        return;
    }

    const { standalone_cost, total_cost } = packageResult.rows[0];
    if(should_log) console.log('Standalone Cost:', standalone_cost, 'Total Cost:', total_cost);

    if (!includeDependencies) {
        if(should_log) console.log('Returning standalone cost.');
        res.status(200).json({
            [packageId]: {
                totalCost: Number(standalone_cost),
            },
        });
        return;
    }

    // Fetch all dependencies and their costs
    const dependenciesQuery = `
        SELECT "Dependency ID", "standalone_cost", "total_cost"
        FROM ${dependenciesDB}
        WHERE "Package ID" = $1
    `;
    if(should_log) console.log('Executing Dependencies Query:', dependenciesQuery, [packageId]);

    const dependenciesResult = await packagesDBClient.query(dependenciesQuery, [packageId]);
    if(should_log) console.log('Dependencies Query Result:', dependenciesResult.rows);

    const response: Record<string, any> = {
        [packageId]: {
            standaloneCost: Number(standalone_cost),
            totalCost: Number(total_cost),
        },
    };

    for (const row of dependenciesResult.rows) {
        const dependencyId = row["Dependency ID"];
        if(should_log) console.log('Processing Dependency:', dependencyId);
        response[dependencyId] = {
            standaloneCost: Number(row.standalone_cost),
            totalCost: Number(row.total_cost),
        };
    }

    if(should_log) console.log('Final Response:', response);
    res.status(200).json(response);

  } catch (error) {
    if(should_log) console.error('[ERROR] Internal server error:', error);
      res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
  }
});

export default router;