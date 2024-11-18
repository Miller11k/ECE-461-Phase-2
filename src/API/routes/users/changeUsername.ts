import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';


// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to change a user's username.
 * @route POST /change-username
 * @param req.body.currentUsername {string} The user's current username.
 * @param req.body.token {string} Session token for authentication.
 * @param req.body.newUsername {string} The new username to be assigned.
 * @returns {object} Success status if the username is updated, or an error message.
 */
router.post('/', async (req, res) => {
  const { currentUsername, token, newUsername } = req.body; // Get data from API request

  // Ensure new username is not the same username
  if (currentUsername === newUsername) {
    res.status(401).json({ success: false, message: "New username is same as old" }); // Return authentication error
    return;
  }

  try {
    // Query to get user tokens
    const result = await userDBClient.query(
      `SELECT tokens FROM ${employeeDB} WHERE username = $1`,
      [currentUsername]
    );

    // If user not found (based on username)
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Username does not exist' }); // Return authentication error
      return;
    }

    const { tokens } = result.rows[0];  // Get data from user

    // Validate the token
    if (!tokens || !tokens.includes(token)) {
      res.status(401).json({ success: false, message: 'Invalid token' }); // Return authentication error
      return;
    }


    // Update the username
    const updateResult = await userDBClient.query(
      `UPDATE ${employeeDB} SET username = $1 WHERE username = $2`,
      [newUsername, currentUsername]
    );

    // Check if any row was updated
    if (updateResult.rowCount === 0) {
      res.status(500).json({ success: false, message: 'Failed to update username' }); // Return internal server error
      return;
    }

    res.json({ success: true, message: 'Username updated successfully' });  // Respond with success message

  } catch (error) {
    if ((error as any).code === '23505') {  // Check if username is already in use
      res.status(400).json({ success: false, error: 'Username already in use' }); // Return client error
    } else {
      res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
    }
  }
});

export default router;