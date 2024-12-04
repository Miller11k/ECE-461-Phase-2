/**
 * @module ChangePasswordRoute
 * Handles the `/change-password` endpoint for changing a user's password.
 */

import { Request, Response, Router } from 'express';
import { createSalt, generatePassword } from '../../helpers/passwordHelper.js';
import { userDBClient, employeeDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';

// Create a new router instance to define and group related routes
const router = Router();

/**
 * POST `/change-password` - Endpoint to change a user's password.
 * 
 * @route POST /change-password
 * @group Users - Operations related to user management.
 * 
 * @param {Request} req - Express request object.
 * @param {string} req.headers['x-authorization'] - The token for authentication.
 * @param {string} req.body.newPassword - The new password to be set.
 * @param {string} req.body.new_password - The new password to be set (alternative key).
 * 
 * @param {Response} res - Express response object.
 * 
 * @returns {Object} A JSON response:
 * - `success: true` and a success message if the password is updated.
 * - `success: false` and an error message if the operation fails.
 * 
 * @example
 * // Request headers:
 * {
 *   "x-authorization": "Bearer <JWT>"
 * }
 * 
 * // Request body:
 * {
 *   "newPassword": "myNewSecurePassword"
 * }
 * 
 * // Successful response:
 * {
 *   "success": true,
 *   "message": "Password changed successfully"
 * }
 * 
 * @example
 * // Error response (invalid token):
 * {
 *   "success": false,
 *   "message": "Authentication failed."
 * }
 * 
 * @example
 * // Error response (password not provided):
 * {
 *   "success": false,
 *   "message": "New password cannot be blank"
 * }
 */
router.post('/', async (req, res) => {
    try {
        // Extract and validate the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            console.error('Invalid or missing X-Authorization header.');
            res.status(403).json({ error: "Invalid or missing X-Authorization header" });
            return;
        }

        // Extract the token from the header, removing the "Bearer " prefix if present
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();

        // Decode the token to get user details
        const decodedToken = await decodeAuthenticationToken(x_authorization);

        if (!decodedToken || !decodedToken.username) {
            console.error('Authentication failed. Invalid token.');
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }

        const username = decodedToken.username;
        const newPassword = req.body.newPassword || req.body.new_password;

        // Ensure new password is provided and not blank
        if (!newPassword || newPassword.trim() === '') {
            console.error('New password is missing or blank.');
            res.status(400).json({ success: false, message: 'New password cannot be blank' });
            return;
        }

        // Get user details along with the salt and existing password
        const result = await userDBClient.query(
            `SELECT salt, password FROM ${employeeDB} WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            console.error('User not found in the database.');
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const { salt, password: currentPassword } = result.rows[0];

        // Hash the new password with the current salt and compare
        const cipherPassword = generatePassword(newPassword, salt);

        if (currentPassword === cipherPassword) {
            console.error('New password matches the current password.');
            res.status(400).json({ success: false, message: 'New password cannot be the same as the current password' });
            return;
        }

        // Generate a new salt and hashed password
        const newSalt = createSalt();
        const newHashedPassword = generatePassword(newPassword, newSalt);

        // Update the password and salt in the database
        const updateResult = await userDBClient.query(
            `UPDATE ${employeeDB} SET password = $1, salt = $2 WHERE username = $3`,
            [newHashedPassword, newSalt, username]
        );

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});

export default router;
