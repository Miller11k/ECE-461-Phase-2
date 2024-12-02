/**
 * @module AuthenticationRouter
 * Defines the authentication endpoint for user validation and token generation.
 */

import { Request, Response, Router } from 'express';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { validatePassword } from '../../helpers/passwordHelper.js';
import { generateAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * Endpoint to authenticate a user and generate a session token.
 * 
 * @route PUT /
 * @param {Request} req - The HTTP request object.
 * @param {Object} req.body - The request body containing user credentials.
 * @param {string} req.body.User.name - The username of the user.
 * @param {boolean} req.body.User.isAdmin - Indicates if the user is an admin.
 * @param {string} req.body.Secret.password - The password of the user.
 * @param {Response} res - The HTTP response object.
 * @returns {Object} A JSON response with the authentication result:
 * - `success: true` and a `token` if authentication is successful.
 * - `success: false` and an error `message` if authentication fails.
 * 
 * @example
 * // Request body:
 * {
 *   "User": {
 *     "name": "johndoe",
 *     "isAdmin": false
 *   },
 *   "Secret": {
 *     "password": "mypassword123"
 *   }
 * }
 * 
 * // Successful response:
 * {
 *   "success": true,
 *   "token": "bearer <token>"
 * }
 * 
 * // Failed response:
 * {
 *   "success": false,
 *   "message": "Invalid Credentials"
 * }
 */
router.put('/', async (req, res) => {
  const { User: { name: username, isAdmin: input_is_admin }, Secret: { password } } = req.body;

  try {
    // Retrieve user details based on username
    const result = await userDBClient.query(
      `SELECT first_name, last_name, salt, password, tokens, is_admin FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    // If no user found (based on username)
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
      return;
    }

    // Extract the user details based on username
    const { first_name, last_name, salt, password: storedPassword, tokens, is_admin } = result.rows[0];

    if(is_admin != input_is_admin){
      res.status(401).json({ success: false, message: 'Admin status mismatch'})
      return;
    }
    
    // Validate the password using the salt for the username
    const isValid = validatePassword(password, storedPassword, salt);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
      return;
    }

    const x_authentication = await generateAuthenticationToken(first_name, last_name, username, is_admin);
    // const x_authentication = await generateAuthenticationToken(first_name, last_name, username, is_admin, salt);

    // Return the new token as the response
    res.json({ success: true, token: `bearer ${x_authentication}` });

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message }); // Return internal server error
  }
});

export default router;