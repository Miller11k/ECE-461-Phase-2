import { Request, Response, Router } from 'express';
import { validatePassword } from '../../helpers/passwordHelper.js';
import { generateSessionToken } from '../../helpers/tokenHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint for user login.
 * @route POST /login
 * @param req.body.username {string} Username for authentication.
 * @param req.body.password {string} Password for authentication.
 * @returns {object} Success status with token or error message.
 */
router.post('/', async (req, res) => {
  const { username, password } = req.body;  // Get data from API request

  try {
    // Retrieve user details based on username
    const result = await userDBClient.query(
      `SELECT salt, password, tokens FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    // If no user found (based on username)
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
      return;
    }

    // Extract the user details based on username
    const { salt, password: storedPassword, tokens } = result.rows[0];

    // Validate the password using the salt for the username
    const isValid = validatePassword(password, storedPassword, salt);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
      return;
    }

    // Generate a new token
    const newToken = generateSessionToken();

    // Check if the token already exists
    if (tokens && tokens.includes(newToken)) {
      res.status(400).json({ success: false, message: 'Token already exists' });  // Return client error
      return;
    }

    // Update the tokens array by appending the new token
    await userDBClient.query(
      `UPDATE ${employeeDB} SET tokens = array_append(tokens, $1) WHERE username = $2`,
      [newToken, username]
    );

    // Return the new token as the response
    res.json({ success: true, username: username, token: newToken });

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message }); // Return internal server error
  }
});

export default router;