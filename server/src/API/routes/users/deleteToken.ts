/**
 * @module DeleteTokenRoute
 * Handles the `/delete-token` endpoint for deleting a specific session token for a user.
 */

import { Request, Response, Router } from "express";
import { userDBClient, employeeDB } from "../../config/dbConfig.js";

// Create a new router instance to define and group related routes
const router = Router();

/**
 * DELETE `/delete-token` - Deletes a specific session token for a user.
 *
 * @route DELETE /delete-token
 * @group Users - Operations related to user management.
 *
 * @param {Request} req - The HTTP request object.
 * @param {string} req.body.username - The username of the user.
 * @param {string} req.body.token - The token to be removed from the user's tokens array.
 *
 * @param {Response} res - The HTTP response object.
 *
 * @returns {Object} A JSON response:
 * - `success: true` and a success message if the token is deleted.
 * - `success: false` and an error message if the operation fails.
 *
 * @example
 * // Request body:
 * {
 *   "username": "johndoe",
 *   "token": "session-token-to-delete"
 * }
 *
 * // Successful response:
 * {
 *   "success": true,
 *   "message": "Token deleted successfully"
 * }
 *
 * @example
 * // Error response (token not found or user does not exist):
 * {
 *   "success": false,
 *   "message": "Token not found or user does not exist"
 * }
 */
router.delete("/", async (req, res) => {
  const { username, token } = req.body; // Get data from API request

  // Check for full response
  if (!username || !token) {
    res
      .status(400)
      .json({ success: false, message: "Username and token are required" }); // Return client error
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
      res
        .status(404)
        .json({
          success: false,
          message: "Token not found or user does not exist",
        }); // Returns resource not found error
      return;
    }

    res.json({ success: true, message: "Token deleted successfully" }); // Respond with success message
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message }); // Return internal server error
  }
});

export default router;
