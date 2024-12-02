"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
// Import User Related Routes
var createUser_js_1 = require("./users/createUser.js");
var login_js_1 = require("./users/login.js");
var getUser_js_1 = require("./users/getUser.js");
var changeUsername_js_1 = require("./users/changeUsername.js");
var clearTokens_js_1 = require("./users/clearTokens.js");
var changePassword_js_1 = require("./users/changePassword.js");
var deleteToken_js_1 = require("./users/deleteToken.js");
// Import Metric Related routes
// import insertMetricRoute from './metrics/insertMetric';
// Import Package Related Routes
var index_js_1 = require("./packages/index.js");
var packages_js_1 = require("./packages/packages.js");
// Import All Other Needed Routes
var reset_js_1 = require("./other/reset.js");
var authenticate_js_1 = require("./other/authenticate.js");
var tracks_js_1 = require("./other/tracks.js");
// Create a router instance to group and manage related user routes
var router = (0, express_1.Router)();
// Define routes for user-related operations
router.use('/create-user', createUser_js_1.default); // Handle user creation
router.use('/login', login_js_1.default); // Handle user login
router.use('/get-user', getUser_js_1.default); // Fetch user details
router.use('/change-username', changeUsername_js_1.default); // Change a user's username
router.use('/clear-tokens', clearTokens_js_1.default); // Clear all tokens for a user
router.use('/change-password', changePassword_js_1.default); // Change a user's password
router.use('/delete-token', deleteToken_js_1.default); // Delete a specific token for a user
// Placeholder for future metric-related route
// router.use('/insert-metric', insertMetricRoute);
// Define Package Route
router.use('/package', index_js_1.default);
router.use('/packages', packages_js_1.default);
// Define All Other Needed Routes
router.use('/reset', reset_js_1.default);
router.use('/authenticate', authenticate_js_1.default); // Verify user authentication
router.use('/tracks', tracks_js_1.default);
// Export the configured router
exports.default = router;
