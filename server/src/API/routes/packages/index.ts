/**
 * @module PackageRouter
 * Defines and groups package-related routes for handling package operations.
 */

import { Router } from 'express';
import createPackageRoute from './create.js';
import getPackageRoute from './get.js';
import invalidGetPackageRoute from './invalidGet.js'
import updatePackageRoute from './update.js';
import ratePackageRoute from './rate.js';
import costPackageRoute from './cost.js';
import byRegexPackageRoute from './byRegex.js';

const router = Router();

/**
 * GET `/package/:id/rate` - Retrieves the rating of a package by ID.
 * @see {@link ./rate.js}
 */
router.get('/:id/rate', ratePackageRoute);

/**
 * GET `/package/:id/cost` - Retrieves the cost of a package by ID.
 * @see {@link ./cost.js}
 */
router.get('/:id/cost', costPackageRoute);

/**
 * POST `/package/byRegEx` - Retrieves packages matching a regular expression.
 * @see {@link ./byRegex.js}
 */
router.post('/byRegEx', byRegexPackageRoute);

/**
 * POST `/package/:id` - Updates a package by ID.
 * @see {@link ./update.js}
 */
router.post('/:id', updatePackageRoute);

/**
 * GET `/package/:id` - Retrieves a package's metadata and content by ID.
 * @see {@link ./get.js}
 */
router.get('/:id', getPackageRoute);

/**
 * GET `/package` - Handles invalid GET requests to the root package route.
 * @see {@link ./invalidGet.js}
 */
router.get('/', invalidGetPackageRoute);


/**
 * POST `/package` - Creates a new package.
 * @see {@link ./create.js}
 */
router.post("/", createPackageRoute);

export default router;