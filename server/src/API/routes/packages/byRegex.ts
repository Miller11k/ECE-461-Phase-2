/**
 * @module routes/package/byRegEx
 * Handles the `/package/byRegEx` endpoint (POST) for searching packages by regular expression.
 */

import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { packagesDBClient, packageDB, userDBClient } from '../../config/dbConfig.js';
import { fetchReadmeMatches } from '../../helpers/s3Helper.js';
import { createRequire } from 'module';
import RE2 from 're2'; // Import RE2
import { shouldLog } from '../../helpers/logHelper.js';


const require = createRequire(import.meta.url);
const safeRegex = require('safe-regex');



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
  let log_get_package = parseInt(process.env.LOG_POST_BYREGEX || '0', 10);
  let log_all = parseInt(process.env.LOG_ALL || '0', 10);
  let should_log = shouldLog(log_get_package, log_all);
  
  try {
    console.log('*-------------------------------------------*');
    console.log('POST /package/byRegEx endpoint hit');
    console.log('*-------------------------------------------*');

    // Extract and validate the 'X-Authorization' header
    const authHeader = req.headers['x-authorization'];
    if(should_log){
      console.log('Authorization Header:', authHeader);
    }
    if (!authHeader || typeof authHeader !== 'string') {
      if(should_log){
        console.log('Invalid or missing X-Authorization header.');
      }
      res.status(403).json({ error: 'Invalid or missing X-Authorization header' });
      return;
    }

    const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();
    if(should_log){
      console.log('Extracted Authorization Token:', x_authorization);
    }

    // Decode the JWT token
    const decoded_jwt = await decodeAuthenticationToken(x_authorization);
    if(should_log){
      console.log('Decoded JWT:', decoded_jwt);
    }
    if (!decoded_jwt) {
      if(should_log){
        console.log('Authentication failed.');
      }
      res.status(403).json({ error: 'Authentication failed.' });
      return;
    }

    const username = decoded_jwt.username;
    if(should_log){
      console.log('Authenticated Username:', username);
    }

    // Verify user exists in the database
    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );
    if(should_log){
      console.log('User Query Result:', userResult.rows);
    }
    if (userResult.rows.length === 0) {
      if(should_log){
        console.log('User not found in the database.');
      }
      res.status(403).json({ error: 'User not found.' });
      return;
    }

    // Extract and validate 'RegEx' from the request body
    const { RegEx } = req.body;
    if(should_log){
      console.log('Provided RegEx:', RegEx);
    }
    if (!RegEx || typeof RegEx !== 'string') {
      if(should_log){
        console.log('RegEx must be provided and of type string.');
      }
      res.status(400).json({ error: 'RegEx must be provided in the request body' });
      return;
    }

    let regexPattern;
    try {
      regexPattern = new RE2(RegEx, 'i'); // Case-insensitive RE2 regex
      if(should_log){
        console.log('Compiled RE2 Regex:', regexPattern);
      }
    } catch (err) {
      if (err instanceof Error) {
        if(should_log){
          console.log('Invalid regular expression for RE2:', err.message);
        }
        res.status(400).json({ error: 'Invalid regular expression for RE2' });
      } else {
        if(should_log){
          console.log('Unknown error in RE2 regex:', err);
        }
        res.status(400).json({ error: 'Unknown error occurred' });
      }
      return;
    }    
    // Fetch all packages from the database
    if(should_log){
      console.log('Fetching packages from database...');
    }
    const query = `
      SELECT "ID", "Name", "Version", "Content"
      FROM ${packageDB}
    `;
    const resultPackages = await packagesDBClient.query(query);
    if(should_log){
      console.log('Fetched Packages:', resultPackages.rows.length);
    }

    const allPackages = resultPackages.rows;
    const matchingPackages = [];

    // Check packages against the regex using RE2
    if(should_log){
      console.log('Checking packages against the provided regex...');
    }
    for (const pkg of allPackages) {
      const { ID: packageID, Name: packageName, Version: packageVersion, Content: content } = pkg;
      if(should_log){
        console.log('Checking package:', packageName);
      }

      // Match against package name using RE2
      if (regexPattern.test(packageName)) {
        if(should_log){
          console.log(`Package name matched: ${packageName}`);
        }
        matchingPackages.push({ Name: packageName, Version: packageVersion, ID: packageID.toString() });
        continue;
      }

      // Match against README content using RE2
      if (content) {
        const regexPatternString = regexPattern.source; // Convert RE2 regex back to its string representation
        const matches = await fetchReadmeMatches(content, regexPatternString);
        if(should_log){
          console.log('README Matches:', matches);
        }
        if (matches && matches.length > 0) {
          if(should_log){
            console.log(`README content matched for package: ${packageName}`);
          }
          matchingPackages.push({ Name: packageName, Version: packageVersion, ID: packageID.toString() });
        }
      }
    }

    // Respond with matching packages or an error if none found
    if (matchingPackages.length === 0) {
      if(should_log){
        console.log('No packages found matching the regex.');
      }
      res.status(404).json({ error: 'No packages found matching the regex' });
    } else {
      if(should_log){
        console.log('Matching Packages:', matchingPackages);
      }
      res.status(200).json(matchingPackages);
    }
  } catch (error) {
    if(should_log){
      console.error('Error in POST /package/byRegEx:', error);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;