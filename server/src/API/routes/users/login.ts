/**
 * @module LoginRoute
 * Handles the `/login` endpoint for user authentication.
 */

import { Request, Response, Router } from 'express';
import { validatePassword } from '../../helpers/passwordHelper.js';
// import { generateSessionToken } from '../../helpers/tokenHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { generateAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * POST `/login` - Endpoint for user login.
 * 
 * @route POST /login
 * @group Users - Operations related to user authentication.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {string} req.body.username - Username for authentication.
 * @param {string} req.body.password - Password for authentication.
 * 
 * @param {Response} res - The HTTP response object.
 * 
 * @returns {Object} A JSON response:
 * - `success: true` and a token if authentication is successful.
 * - `success: false` and an error message if authentication fails.
 * 
 * @example
 * // Request body:
 * {
 *   "username": "johndoe",
 *   "password": "securepassword"
 * }
 * 
 * // Successful response:
 * {
 *   "success": true,
 *   "token": "bearer <JWT>"
 * }
 * 
 * @example
 * // Error response (invalid credentials):
 * {
 *   "success": false,
 *   "message": "Invalid Credentials"
 * }
 */
router.post("/", async (req: Request, res: Response) => {
  console.log("Received request at POST /login");
  // Destructure the flat structure
  const { username, password } = req.body;

  // Validate the input structure
  if (!username || !password) {
    res
      .status(400)
      .json({
        success: false,
        message: "Username and password are required in a flat structure.",
      });
    return;
  }

  try {
    // Query the database for the user
    const result = await userDBClient.query(
      `SELECT first_name, last_name, salt, password, is_admin FROM ${employeeDB} WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid Credentials" });
      return;
    }

    const {
      first_name,
      last_name,
      salt,
      password: storedPassword,
      is_admin,
    } = result.rows[0];

    // Validate the password
    const isValid = validatePassword(password, storedPassword, salt);

    if (!isValid) {
      res.status(401).json({ success: false, message: "Invalid Credentials" });
      return;
    }

    // Generate the token
    const token = await generateAuthenticationToken(
      first_name,
      last_name,
      username,
      is_admin
    );

    // Send success response
    res.json({ success: true, token: `bearer ${token}` });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;