import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to delete a specific session token for a user.
 * @route DELETE /delete-token
 * @param req.body.username {string} The username of the user.
 * @param req.body.token {string} The token to be removed from the user's tokens array.
 * @returns {object} Success status if the token is deleted, or an error message.
 */
router.delete('/', async (req, res) => {
  const { username, token } = req.body; // Get data from API request

  // Check for full response
  if (!username || !token) {
    res.status(400).json({ success: false, message: 'Username and token are required' }); // Return client error
    return;
  }

  try {
    // Remove the token from the tokens array (returns a result if successful)
    const result = await userDBClient.query(
      `UPDATE ${employeeDB} SET tokens = array_remove(tokens, $1) WHERE username = $2`,
      [token, username]
    );

    // Check if any row was updated
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Token not found or user does not exist' });  // Returns resource not found error
      return;
    }

    res.json({ success: true, message: 'Token deleted successfully' }); // Respond with success message
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
  }
});

export default router;