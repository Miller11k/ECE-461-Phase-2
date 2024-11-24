import { Request, Response, Router } from 'express';
import { createSalt, generatePassword } from '../../helpers/passwordHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { generateAuthenticationToken } from '../../helpers/jwtHelper.js';



// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to create a new user.
 * @route POST /create-user
 * @param req.body.first_name {string} First name of the user.
 * @param req.body.last_name {string} Last name of the user.
 * @param req.body.username {string} Username for the account.
 * @param req.body.plaintext_password {string} Plaintext password for the account.
 * @param req.body.is_admin {boolean} Admin status of the user.
 * @returns {object} Success or error message.
 */
router.post('/', async (req, res) => {
  const { first_name, last_name, username, plaintext_password, is_admin } = req.body; // Get data from API request

  // Generate a salt and hash the plaintext password
  const salt = createSalt();
  const cipher_password = generatePassword(plaintext_password, salt);
  // const x_authentication = await generateAuthenticationToken(first_name, last_name, username, is_admin, salt);

  try {
    // Insert the new user into the database
    await userDBClient.query(
      `INSERT INTO ${employeeDB} (username, password, salt, first_name, last_name, is_admin, "X-Authorization") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [username, cipher_password, salt, first_name, last_name, is_admin]
      // [username, cipher_password, salt, first_name, last_name, is_admin, x_authentication]

    );

    res.json({ success: true });  // Respond with success message
  } catch (error) {
    if ((error as any).code === '23505') {  // Handle case where username is already used
      res.status(400).json({ success: false, error: 'Username already in use' }); // Return client error
    } else {
      res.status(500).json({ success: false, error: (error as Error).message });  // Return internal server error
    }
  }
});

export default router;

