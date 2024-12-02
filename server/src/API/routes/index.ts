import { Router } from 'express';

// Import User Related Routes
import createUserRoute from './users/createUser.js';
import loginRoute from './users/login.js';
import getUserRoute from './users/getUser.js';
import changeUsernameRoute from './users/changeUsername.js';
import clearTokensRoute from './users/clearTokens.js';
import changePasswordRoute from './users/changePassword.js';
import deleteTokenRoute from './users/deleteToken.js';

// Import Metric Related routes
// import insertMetricRoute from './metrics/insertMetric';

// Import Package Related Routes
import packageRoutes from "./packages/index.js"
import packagesRoute from './packages/packages.js'

// Import All Other Needed Routes
import resetRoute from './other/reset.js'
import authenticateRoute from './other/authenticate.js';
import tracksRoute from './other/tracks.js'

// Create a router instance to group and manage related user routes
const router = Router();

// Define routes for user-related operations
router.use('/create-user', createUserRoute); // Handle user creation
router.use('/login', loginRoute); // Handle user login
router.use('/get-user', getUserRoute); // Fetch user details
router.use('/change-username', changeUsernameRoute); // Change a user's username
router.use('/clear-tokens', clearTokensRoute); // Clear all tokens for a user
router.use('/change-password', changePasswordRoute); // Change a user's password
router.use('/delete-token', deleteTokenRoute); // Delete a specific token for a user

// Placeholder for future metric-related route
// router.use('/insert-metric', insertMetricRoute);

// Define Package Route
router.use('/package', packageRoutes);
router.use('/packages', packagesRoute);

// Define All Other Needed Routes
router.use('/reset', resetRoute);
router.use('/authenticate', authenticateRoute); // Verify user authentication
router.use('/tracks', tracksRoute);

// Export the configured router
export default router;