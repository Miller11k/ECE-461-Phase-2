import { Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
// Create a new router instance to define and group related routes
const router = Router();
/**
 * Endpoint to retrieve a user's details based on their username and token.
 * @route GET /get-user
 * @param req.query.username {string} Username of the user to retrieve details for.
 * @param req.query.token {string} Session token for authentication.
 * @returns {object} Success status with the user's first and last name if valid, or an error message.
 */
router.post('/', async (req, res) => {
    const { username, token } = req.body; // Get data from API request
    // Check for complete request
    if (!username || !token) {
        res.status(400).json({ success: false, message: 'Username and token are required' }); // Return client error
        return;
    }
    try {
        // Query to check if the token exists for the given username
        const result = await userDBClient.query(`SELECT first_name, last_name, tokens FROM ${employeeDB} WHERE username = $1`, [username]);
        // If no user is found (based on username)
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' }); // Return resource not found error
            return;
        }
        const { first_name, last_name, tokens } = result.rows[0]; // Get data from user
        // Check if the token is valid
        if (!tokens || !tokens.includes(token)) {
            res.status(401).json({ success: false, message: 'Invalid token' }); // Return authentication error
            return;
        }
        // Return the user's first and last name
        res.json({ success: true, first_name, last_name }); // Respond with success message
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message }); // Return internal server error
    }
});
export default router;
