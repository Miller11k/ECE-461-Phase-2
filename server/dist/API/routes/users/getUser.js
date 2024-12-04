/**
 * @module RetrieveUserDetailsRoute
 * Handles the endpoint for retrieving user details based on an authentication token.
 */
import { Router } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
// Create a new router instance to define and group related routes
const router = Router();
/**
 * POST `/` - Retrieves user details based on a provided authentication token.
 *
 * @route POST /
 * @group Users - Operations related to user management.
 *
 * @param {Request} req - The HTTP request object.
 * @param {string} req.body.token - The authentication token.
 *
 * @param {Response} res - The HTTP response object.
 *
 * @returns {Object} A JSON response:
 * - `success: true` and user details (`firstName`, `lastName`, `username`, `isAdmin`) if the token is valid.
 * - `success: false` and an error message if the token is invalid or missing.
 *
 * @example
 * // Request body:
 * {
 *   "token": "Bearer <JWT>"
 * }
 *
 * // Successful response:
 * {
 *   "success": true,
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "username": "johndoe",
 *   "isAdmin": false
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
    let { token } = req.body; // Get the token from the API request body
    // Check if the token is provided
    if (!token) {
        res.status(400).json({ success: false, message: 'Token is required' });
        return;
    }
    // Remove "bearer " prefix if present (case-insensitive)
    if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice(7); // Remove "bearer " (length of 7)
    }
    try {
        // Decode and verify the authentication token
        const decodedPayload = await decodeAuthenticationToken(token);
        // If the token is invalid or corrupted
        if (!decodedPayload) {
            res.status(401).json({ success: false, message: 'Invalid token' });
            return;
        }
        const { firstName, lastName, username, isAdmin } = decodedPayload;
        // Respond with the user's details
        res.json({
            success: true,
            firstName,
            lastName,
            username,
            isAdmin,
        });
    }
    catch (error) {
        // Handle unexpected errors
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
});
export default router;
