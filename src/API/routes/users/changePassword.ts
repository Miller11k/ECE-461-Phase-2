import { Request, Response, Router } from 'express';
import { createSalt, generatePassword } from '../../helpers/passwordHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { generateAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to change a user's password.
 * @route POST /change-password
 * @param req.body.username {string} The username of the user.
 * @param req.body.token {string} Session token for authentication.
 * @param req.body.newPassword {string} The new password to be set.
 * @returns {object} Success status if the password is updated, or an error message.
 */
router.post('/', async (req, res) => {
  const { username, token, newPassword } = req.body;  // Get data from API request
  
  // Check for full response
  if (!username || !token || !newPassword) {
    res.status(400).json({ success: false, message: 'All fields are required' }); // Return client error
    return;
  }

  // Check if password is empty
  if (newPassword.trim() === '') {
    res.status(400).json({ success: false, message: 'New password cannot be blank' });  // Return client error
    return;
  }

  try {
    // Get user details along with the salt and existing tokens
    const result = await userDBClient.query(
      `SELECT first_name, last_name, is_admin, salt, password, tokens FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    // If user not found (by username)
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });  // Return resource not found error
      return;
    }

    const { first_name, last_name, is_admin, salt, password: currentPassword, tokens } = result.rows[0]; // Get user data
    
    // Validate the token
    if (!tokens || !tokens.includes(token)) {
      res.status(401).json({ success: false, message: 'Invalid token provided' });  // Return authentication error
      return;
    }

    const cipher_password = generatePassword(newPassword, salt);  // Encrypt new password to see if already in use

    // Check if password already in use
    if (currentPassword === cipher_password) {
      res.status(400).json({ success: false, message: 'New password cannot be the same as the current password' }); // Return client error
      return;
    }

    // Generate a new salt and hashed password
    const newSalt = createSalt();
    const newHashedPassword = generatePassword(newPassword, newSalt);
    const new_x_authentication = generateAuthenticationToken(first_name, last_name, username, is_admin, newSalt);

    // Update the password in the database
    await userDBClient.query(
      `UPDATE ${employeeDB} SET password = $1, "X-Authorization" = $2, salt = $3 WHERE username = $4`,
      [newHashedPassword, new_x_authentication, newSalt, username]
    );

    res.json({ success: true, message: 'Password changed successfully' });  // Respond with success message

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
  }
});

export default router;