/**
 * @module AuthenticationRouter
 * Defines the authentication endpoint for user validation and token generation.
 */

import express from 'express';
import { Request, Response, Router } from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import validator from 'validator';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { validatePassword } from '../../helpers/passwordHelper.js';
import { generateAuthenticationToken } from '../../helpers/jwtHelper.js';
import { shouldLog } from '../../helpers/logHelper.js';

const router = express.Router();

// Middleware for parsing JSON
router.use(bodyParser.json());

// Schema for request validation using Joi
const authSchema = Joi.object({
  User: Joi.object({
    name: Joi.string().min(3).max(30).required(),
    isAdmin: Joi.boolean().required(),
  }).required(),
  Secret: Joi.object({
    password: Joi.string().min(8).required(),
  }).required(),
});

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

  let log_get_package = parseInt(process.env.LOG_PUT_AUTHENTICATE || '0', 10);
  let log_all = parseInt(process.env.LOG_ALL || '0', 10);
  let should_log = shouldLog(log_get_package, log_all);

  console.log('\n\n\n*-------------------------------------------*');
  console.log('PUT /authenticate endpoint hit');
  console.log('*-------------------------------------------*');
  
  if(should_log){
    console.log('Request body:', req.body);
  }

  // Validate the request body against the schema
  const { error } = authSchema.validate(req.body);
  if (error) {
    if(should_log){
      console.error('Validation error:', error.details);
    }
    res.status(400).json({ success: false, message: 'Invalid input', details: error.details });
    return;
  }

  const { User: { name: username, isAdmin: input_is_admin }, Secret: { password } } = req.body;
  if(should_log){
    console.log('Parsed input:', { username, input_is_admin, password });
  }

  try {
    // Sanitize inputs to prevent malicious payloads
    const sanitizedUsername = validator.trim(validator.escape(username));
    const sanitizedPassword = validator.trim(password);
    if(should_log){
      console.log('Sanitized input:', { sanitizedUsername, sanitizedPassword });
    }

    // Ensure username doesn't contain potentially dangerous patterns
    if (!validator.isAlphanumeric(sanitizedUsername.replace(/[_-]/g, ''))) {
      if(should_log){
        console.error('Invalid username format:', sanitizedUsername);
      }
      res.status(400).json({ success: false, message: 'Invalid username format' });
      return;
    }

    // Query the database for the user's information using parameterized queries
    const query = `
      SELECT first_name, last_name, salt, password, tokens, is_admin 
      FROM ${employeeDB} 
      WHERE username = $1
    `;
    if(should_log){
      console.log('Executing database query:', query);
    }
    const result = await userDBClient.query(query, [sanitizedUsername]);
    if(should_log){
      console.log('Query result:', result.rows);
    }

    // If no user found (based on username)
    if (result.rows.length === 0) {
      if(should_log){
        console.warn('No user found for username:', sanitizedUsername);
      }
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
      return;
    }

    // Extract user details
    const { first_name, last_name, salt, password: storedPassword, is_admin } = result.rows[0];
    if(should_log){
      console.log('Retrieved user details:', { first_name, last_name, is_admin });
    }

    // Check if the admin status matches
    if (is_admin !== input_is_admin) {
      if(should_log){
        console.warn('Admin status mismatch:', { input_is_admin, is_admin });
      }
      res.status(401).json({ success: false, message: 'Admin status mismatch' });
      return;
    }

    // Validate the password using the salt for the username
    const isValid = validatePassword(sanitizedPassword, storedPassword, salt);
    if(should_log){
      console.log('Password validation result:', isValid);
    }
    if (!isValid) {
      if(should_log){
        console.warn('Invalid password for username:', sanitizedUsername);
      }
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
      return;
    }

    // Generate an authentication token
    const token = await generateAuthenticationToken(first_name, last_name, username, is_admin);
    if(should_log){
      console.log('Generated token:', token);
    }

    // Return the token as the response
    res.json(`bearer ${token}`);
  } catch (error) {
    if(should_log){
      console.error('Error occurred during authentication:', error);
    }
    // Check if error is an instance of Error
    if (error instanceof Error) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      // Handle other types of errors (e.g., strings or objects)
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  }  
});

// Export the router
export default router;