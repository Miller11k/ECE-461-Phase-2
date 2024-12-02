/**
 * @module MainRouter
 * Aggregates and organizes all route definitions for the application.
 */

import { Router } from 'express';

// Import User-Related Routes
import createUserRoute from './users/createUser.js';
import loginRoute from './users/login.js';
import getUserRoute from './users/getUser.js';
import changeUsernameRoute from './users/changeUsername.js';
import clearTokensRoute from './users/clearTokens.js';
import changePasswordRoute from './users/changePassword.js';
import deleteTokenRoute from './users/deleteToken.js';

// Import Package Related Routes
import packageRoutes from "./packages/index.js"
import packagesRoute from './packages/packages.js'

// Import All Other Needed Routes
import resetRoute from './other/reset.js'
import authenticateRoute from './other/authenticate.js';
import tracksRoute from './other/tracks.js'

// Create a router instance to group and manage related user routes
const router = Router();

/**
 * User-Related Routes
 * 
 * @route /create-user - Handle user creation.
 * @route /login - Handle user login.
 * @route /get-user - Fetch user details.
 * @route /change-username - Change a user's username.
 * @route /clear-tokens - Clear all tokens for a user.
 * @route /change-password - Change a user's password.
 * @route /delete-token - Delete a specific token for a user.
 */
router.use('/create-user', createUserRoute); // Handle user creation
router.use('/login', loginRoute); // Handle user login
router.use('/get-user', getUserRoute); // Fetch user details
router.use('/change-username', changeUsernameRoute); // Change a user's username
router.use('/clear-tokens', clearTokensRoute); // Clear all tokens for a user
router.use('/change-password', changePasswordRoute); // Change a user's password
router.use("/delete-token", deleteTokenRoute); // Delete a specific token for a user

/**
 * Package-Related Routes
 *
 * @route /package - Handle individual package operations.
 * @route /packages - Handle package list and query operations.
 */
router.use("/package", packageRoutes);
router.use("/packages", packagesRoute);

/**
 * Other Routes
 *
 * @route /reset - Reset application state.
 * @route /authenticate - Verify user authentication.
 * @route /tracks - Fetch planned tracks.
 */
router.use("/reset", resetRoute);
router.use("/authenticate", authenticateRoute); // Verify user authentication
router.use("/tracks", tracksRoute);

// Export the configured router
export default router;