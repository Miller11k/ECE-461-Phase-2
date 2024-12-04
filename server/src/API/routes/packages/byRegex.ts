/**
 * @module routes/package/byRegEx
 * Handles the `/package/byRegEx` endpoint (POST) for searching packages by regular expression.
 */

import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { packagesDBClient, packageDB, userDBClient } from '../../config/dbConfig.js';
import { fetchReadmeMatches } from '../../helpers/s3Helper.js';

const router = Router();

/**
 * POST `/package/byRegEx` - Search packages by regular expression.
 * 
 * @route POST /package/byRegEx
 * @group Packages - Operations related to package management.
 * 
 * @param {Request} req - Express request object.
 * @param {string} req.body.RegEx - The regular expression to search for.
 * @param {Response} res - Express response object.
 * 
 * @returns {Object} A JSON response with an array of matching packages:
 * - Each package contains `Name`, `Version`, and `ID`.
 * 
 * @description
 * This endpoint allows authenticated users to search for packages whose names or README files match a given regular expression.
 * 
 * @example
 * // Request body:
 * {
 *   "RegEx": "example-.*"
 * }
 * 
 * @example
 * // Successful response:
 * [
 *   {
 *     "Name": "example-package",
 *     "Version": "1.0.0",
 *     "ID": "123e4567-e89b-12d3-a456-426614174000"
 *   }
 * ]
 * 
 * @example
 * // Error response (no matches found):
 * {
 *   "error": "No packages found matching the regex"
 * }
 */
router.post('/byRegEx', async (req: Request, res: Response) => {
  try {
    // Extract the 'X-Authorization' header
    const authHeader = req.headers['x-authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      res.status(403).json({ error: 'Invalid or missing X-Authorization header' });
      return;
    }

    // Extract the token from the header, removing the "Bearer " prefix if present
    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();

    // Decode the JWT token to get user information
    const decoded_jwt = await decodeAuthenticationToken(x_authorization);

    // If no user matches the token, respond with 403
    if (!decoded_jwt) {
      res.status(403).json({ success: false, message: 'Authentication failed.' });
      return;
    }

    const username = decoded_jwt.username;

    // Verify user exists in the database
    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(403).json({ success: false, message: 'User not found.' });
      return;
    }

    // Extract 'RegEx' from the request body
    const { RegEx } = req.body;

    if (!RegEx || typeof RegEx !== 'string') {
      res.status(400).json({ error: 'RegEx must be provided in the request body' });
      return;
    }

    let regexPattern;
    try {
      // Create a new regular expression object
      regexPattern = new RegExp(RegEx, 'i');
    } catch (err) {
      res.status(400).json({ error: 'Invalid regular expression' });
      return;
    }

    // Fetch all packages from the database
    const query = `
      SELECT "ID", "Name", "Version", "Content"
      FROM ${packageDB}
    `;
    const resultPackages = await packagesDBClient.query(query);

    const allPackages = resultPackages.rows;
    const matchingPackages = [];

    // Iterate through each package to check for matches
    for (const pkg of allPackages) {
      const packageID = pkg.ID;
      const packageName = pkg.Name;
      const packageVersion = pkg.Version;
      const content = pkg.Content;

      // Check if the regex matches the package name
      if (regexPattern.test(packageName)) {
        matchingPackages.push({
          Name: packageName,
          Version: packageVersion,
          ID: packageID.toString(),
        });
        continue; // Move to next package since name matched
      }

      // If 'Content' exists, check the README file
      if (content) {
        const matches = await fetchReadmeMatches(content, regexPattern);
        if (matches && matches.length > 0) {
          matchingPackages.push({
            Name: packageName,
            Version: packageVersion,
            ID: packageID.toString(),
          });
        }
      }
    }

    // If no matching packages are found, respond with 404
    if (matchingPackages.length === 0) {
      res.status(404).json({ error: 'No packages found matching the regex' });
      return;
    }

    // Respond with the list of matching packages
    res.status(200).json(matchingPackages);
  } catch (error) {
    // Log the error and respond with 500 in case of an unexpected error
    console.error('Error in POST /package/byRegEx:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;