/**
 * @module ClearTokensRoute
 * Handles the `/clear-tokens` endpoint for clearing all session tokens for a user.
 */
import { Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
// Create a new router instance to define and group related routes
const router = Router();
/**
 * POST `/clear-tokens` - Clears all session tokens for a specific user.
 *
 * @route POST /clear-tokens
 * @group Users - Operations related to user management.
 *
 * @param {Request} req - The HTTP request object.
 * @param {string} req.body.username - The username of the user whose tokens will be cleared.
 * @param {string} req.body.token - The session token for authentication.
 *
 * @param {Response} res - The HTTP response object.
 *
 * @returns {Object} A JSON response:
 * - `success: true` and a success message if the tokens are cleared.
 * - `success: false` and an error message if the operation fails.
 *
 * @example
 * // Request body:
 * {
 *   "username": "johndoe",
 *   "token": "valid-session-token"
 * }
 *
 * // Successful response:
 * {
 *   "success": true,
 *   "message": "Tokens cleared successfully"
 * }
 *
 * @example
 * // Error response (user not found):
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 *
 * @example
 * // Error response (invalid token):
 * {
 *   "success": false,
 *   "message": "Invalid token"
 * }
 */
router.post('/', async (req, res) => {
    const { username, token } = req.body; // Get data from API request
    // Check for complete request
    if (!username || !token) {
        res.status(400).json({ success: false, message: 'Username and token are required' }); // Return client error
        return;
    }
    try {
        // Check if the token exists for the given username
        const result = await userDBClient.query(`SELECT first_name, last_name, tokens FROM ${employeeDB} WHERE username = $1`, [username]);
        // If user is not found (based on username)
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' }); // Return resource not found error
            return;
        }
        const { first_name, last_name, tokens } = result.rows[0]; // Get user data
        // Check if the token is valid
        if (!tokens || !tokens.includes(token)) {
            res.status(401).json({ success: false, message: 'Invalid token' }); // Return authentication error
            return;
        }
        // Clear the tokens for the user, and return result if successful
        const updateResult = await userDBClient.query(`UPDATE ${employeeDB} 
       SET tokens = NULL 
       WHERE username = $1 
       RETURNING first_name, last_name, tokens`, [username]);
        if (updateResult.rows.length > 0) { // If successfully updated
            const updatedUser = updateResult.rows[0]; // Save new user data
            res.json({ success: true, message: 'Tokens cleared successfully' }); // Respond with success message
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to clear tokens' }); // Return internal server error
        }
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message }); // Return internal server error
    }
});
export default router;
