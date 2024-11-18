import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to clear all session tokens for a user.
 * @route POST /clear-tokens
 * @param req.body.username {string} Username of the user whose tokens will be cleared.
 * @param req.body.token {string} Session token for authentication.
 * @returns {object} Success status if tokens are cleared, or an error message.
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
    const result = await userDBClient.query(
      `SELECT first_name, last_name, tokens FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    // If user is not found (based on username)
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });  // Return resource not found error
      return;
    }

    const { first_name, last_name, tokens } = result.rows[0]; // Get user data

    // Check if the token is valid
    if (!tokens || !tokens.includes(token)) {
      res.status(401).json({ success: false, message: 'Invalid token' }); // Return authentication error
      return;
    }

    // Clear the tokens for the user, and return result if successful
    const updateResult = await userDBClient.query(
      `UPDATE ${employeeDB} 
       SET tokens = NULL 
       WHERE username = $1 
       RETURNING first_name, last_name, tokens`,
      [username]
    );

    if (updateResult.rows.length > 0) { // If successfully updated
      const updatedUser = updateResult.rows[0]; // Save new user data

      res.json({success: true, message: 'Tokens cleared successfully'});  // Respond with success message

    } else {
      res.status(500).json({ success: false, message: 'Failed to clear tokens' });  // Return internal server error
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
  }
});

export default router;