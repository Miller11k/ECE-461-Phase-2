import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to authenticate a user based on a session token.
 * @route POST /authenticate
 * @param req.body.username {string} Username of the user.
 * @param req.body.token {string} Session token for authentication.
 * @returns {object} Success status with username and token if valid, or an error message.
 */
router.post('/', async (req, res) => {
  const { username, token } = req.body; // Get data from API request
  console.log("Authentication");

  try {
    // Retrieve user details based on username
    const result = await userDBClient.query(
      `SELECT tokens FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    // If no user found (based on username)
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid Username' });  // Return authentication error
      return;
    }

    const { tokens } = result.rows[0];  // Get tokens for user

    // Check for token issues
    if (!tokens || !tokens.includes(token)) {
      res.status(400).json({ success: false, message: 'Invalid token' }); // Return client error
      return;
    }

    res.json({ success: true, username: username, token: token });  // Respond with success message
    return;

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
  }
});

export default router;