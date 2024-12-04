import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { packagesDBClient, packageDB, userDBClient } from '../../config/dbConfig.js';
import { fetchReadmeMatches } from '../../helpers/s3Helper.js';

const router = Router();

router.post('/byRegEx', async (req: Request, res: Response) => {
  try {
    console.log('Received request at POST /package/byRegEx');

    const authHeader = req.headers['x-authorization'];
    console.log('Authorization Header:', authHeader);

    if (!authHeader || typeof authHeader !== 'string') {
      res.status(403).json({ error: 'Invalid or missing X-Authorization header' });
      return;
    }

    // Extract the token from the header, removing the "Bearer " prefix if present
    const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : authHeader.trim();

    const decoded_jwt = await decodeAuthenticationToken(x_authorization);


    // If no user matches the token, respond with 403
    if (!decoded_jwt) {
        res.status(403).json({ success: false, message: 'Authentication failed.' });
        return;
    }

    const username = decoded_jwt.username;
    console.log('Authenticated Username:', username);

    // Verify user exists
    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(403).json({ success: false, message: 'User not found.' });
      return;
    }

    const { RegEx } = req.body;
    console.log('Provided RegEx:', RegEx);

    if (!RegEx || typeof RegEx !== 'string') {
      res.status(400).json({ error: 'RegEx must be provided in the request body' });
      return;
    }

    let regexPattern;
    try {
      regexPattern = new RegExp(RegEx, 'i');
    } catch (err) {
      console.error('Invalid Regular Expression:', err);
      res.status(400).json({ error: 'Invalid regular expression' });
      return;
    }

    const query = `
      SELECT "ID", "Name", "Version", "Content"
      FROM ${packageDB}
    `;
    const resultPackages = await packagesDBClient.query(query);
    console.log('Fetched Packages:', resultPackages.rows);

    const allPackages = resultPackages.rows;
    const matchingPackages = [];

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

      // Check README if content exists
      if (content) {
        console.log(`Checking README for package ID: ${packageID}`);
        const matches = await fetchReadmeMatches(content, regexPattern);
        if (matches && matches.length > 0) {
          console.log('Match Found in README for Package:', packageName);
          matchingPackages.push({
            Name: packageName,
            Version: packageVersion,
            ID: packageID.toString(),
          });
        }
      }
    }

    console.log('Matching Packages:', matchingPackages);

    if (matchingPackages.length === 0) {
      res.status(404).json({ error: 'No packages found matching the regex' });
      return;
    }

    res.status(200).json(matchingPackages);
  } catch (error) {
    console.error('Error in POST /package/byRegEx:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;