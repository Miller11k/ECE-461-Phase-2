import { Router } from 'express';

// Import User Related Routes
import createUserRoute from './users/createUser.js';
import loginRoute from './users/login.js';
import authenticateRoute from './users/authenticate.js';
import getUserRoute from './users/getUser.js';
import changeUsernameRoute from './users/changeUsername.js';
import clearTokensRoute from './users/clearTokens.js';
import changePasswordRoute from './users/changePassword.js';
import deleteTokenRoute from './users/deleteToken.js';

// Import Metric Related routes
// import insertMetricRoute from './metrics/insertMetric';

// Create a router instance to group and manage related user routes
const router = Router();

// Define routes for user-related operations
router.use('/create-user', createUserRoute); // Handle user creation
router.use('/login', loginRoute); // Handle user login
router.use('/authenticate', authenticateRoute); // Verify user authentication
router.use('/get-user', getUserRoute); // Fetch user details
router.use('/change-username', changeUsernameRoute); // Change a user's username
router.use('/clear-tokens', clearTokensRoute); // Clear all tokens for a user
router.use('/change-password', changePasswordRoute); // Change a user's password
router.use('/delete-token', deleteTokenRoute); // Delete a specific token for a user

// Placeholder for future metric-related route
// router.use('/insert-metric', insertMetricRoute);

// Export the configured router
export default router;