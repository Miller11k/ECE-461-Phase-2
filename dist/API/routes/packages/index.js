import { Router } from 'express';
import createPackageRoute from './create.js';
import getPackageRoute from './get.js';
import invalidGetPackageRoute from './invalidGet.js';
import updatePackageRoute from './update.js';
import ratePackageRoute from './rate.js';
import costPackageRoute from './cost.js';
import byRegexPackageRoute from './byRegex.js';
const router = Router();
// Define package-related routes
router.get('/:id/rate', ratePackageRoute); // GET /package/{id}/rate
router.get('/:id/cost', costPackageRoute); // GET /package/{id}/cost
router.post('/byRegEx', byRegexPackageRoute); // POST /package/byRegEx
// More general routes go last
router.post('/:id', updatePackageRoute); // POST /package/:id
router.get('/:id', getPackageRoute); // GET /package/:id
router.get('/', invalidGetPackageRoute); // GET /package
// Root route for creating packages
router.post('/', createPackageRoute); // POST /package
export default router;
