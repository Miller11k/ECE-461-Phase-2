/**
 * @module CreateUserRoute
 * Handles the `/create-user` endpoint for creating a new user.
 */
import { Router } from 'express';
import { createSalt, generatePassword } from '../../helpers/passwordHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
// Create a new router instance to define and group related routes
const router = Router();
/**
 * POST `/create-user` - Endpoint to create a new user.
 *
 * @route POST /create-user
 * @group Users - Operations related to user management.
 *
 * @param {Request} req - The HTTP request object.
 * @param {string} req.body.first_name - First name of the user.
 * @param {string} req.body.last_name - Last name of the user.
 * @param {string} req.body.username - Username for the account.
 * @param {string} req.body.plaintext_password - Plaintext password for the account.
 * @param {boolean} req.body.is_admin - Admin status of the user.
 *
 * @param {Response} res - The HTTP response object.
 *
 * @returns {Object} A JSON response:
 * - `success: true` if the user is created successfully.
 * - `success: false` and an error message if the operation fails.
 *
 * @example
 * // Request body:
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "username": "johndoe",
 *   "plaintext_password": "securepassword",
 *   "is_admin": false
 * }
 *
 * // Successful response:
 * {
 *   "success": true
 * }
 *
 * @example
 * // Error response (username already in use):
 * {
 *   "success": false,
 *   "error": "Username already in use"
 * }
 *
 * @example
 * // Error response (internal server error):
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
 */
router.post('/', async (req, res) => {
    const { first_name, last_name, username, plaintext_password, is_admin } = req.body; // Get data from API request
    // Generate a salt and hash the plaintext password
    const salt = createSalt();
    const cipher_password = generatePassword(plaintext_password, salt);
    // const x_authentication = await generateAuthenticationToken(first_name, last_name, username, is_admin, salt);
    try {
        // Insert the new user into the database
        await userDBClient.query(`INSERT INTO ${employeeDB} (username, password, salt, first_name, last_name, is_admin) VALUES ($1, $2, $3, $4, $5, $6)`, [username, cipher_password, salt, first_name, last_name, is_admin]
        // [username, cipher_password, salt, first_name, last_name, is_admin, x_authentication]
        );
        res.json({ success: true }); // Respond with success message
    }
    catch (error) {
        if (error.code === '23505') { // Handle case where username is already used
            res.status(400).json({ success: false, error: 'Username already in use' }); // Return client error
        }
        else {
            res.status(500).json({ success: false, error: error.message }); // Return internal server error
        }
    }
});
export default router;
