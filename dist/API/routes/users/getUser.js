import { Router } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
// Create a new router instance to define and group related routes
const router = Router();
/**
 * Endpoint to retrieve user details based on a token.
 * @route POST /
 * @param req.body.token {string} Authentication token.
 * @returns {object} Success status with the user's details or an error message.
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
