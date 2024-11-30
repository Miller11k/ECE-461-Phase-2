import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * POST `/change-username` - Allows a user to change their username.
 * 
 * @name POST /change-username
 * @function
 * @memberof module:routes/user
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void} Sends a JSON response indicating success or error
 */
router.post('/', async (req, res) => {

    try {
        // Extract and validate the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            console.error('Invalid or missing X-Authorization header.');
            res.status(403).json({ error: "Invalid or missing X-Authorization header" });
            return;
        }

        // Extract the token from the header, removing the "Bearer " prefix if present
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

        // Decode the token to get user details
        const decodedToken = await decodeAuthenticationToken(x_authorization);

        if (!decodedToken || !decodedToken.username) {
            console.error('Authentication failed. Invalid token.');
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        const currentUsername = decodedToken.username;
        const { newUsername } = req.body.newUsername ? req.body : { newUsername: req.body.new_username };

        // Ensure new username is provided and not the same as the current username
        if (!newUsername || currentUsername === newUsername) {
            console.error('Invalid or unchanged username.');
            res.status(400).json({ success: false, message: "Invalid or unchanged username" });
            return;
        }

        // Update the username in the database
        const updateResult = await userDBClient.query(
            `UPDATE ${employeeDB} SET username = $1 WHERE username = $2`,
            [newUsername, currentUsername]
        );


        // Check if any row was updated
        if (updateResult.rowCount === 0) {
            console.error('User not found or update failed.');
            res.status(404).json({ success: false, message: "User not found or update failed" });
            return;
        }

        res.json({ success: true, message: "Username updated successfully" });

    } catch (error) {
        console.error('Error occurred:', error);

        if ((error as any).code === '23505') {
            console.error('Username already in use.');
            res.status(400).json({ success: false, message: "Username already in use" });
        } else {
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    }
});

export default router;