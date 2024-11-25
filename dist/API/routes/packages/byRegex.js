import { Router } from 'express';
import { verifyAuthenticationToken } from '../../helpers/jwtHelper.js';
import { packagesDBClient, packageDB, userDBClient } from '../../config/dbConfig.js';
import { fetchReadmeMatches } from '../../helpers/s3Helper.js';
const router = Router();
router.post('/byRegEx', async (req, res) => {
    try {
        console.log('Received request at POST /package/byRegEx');
        const authHeader = req.headers['x-authorization'];
        console.log('Authorization Header:', authHeader);
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: 'Invalid or missing X-Authorization header' });
            return;
        }
        const x_authorization = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice('bearer '.length).trim()
            : authHeader.trim();
        console.log('Extracted Bearer Token:', x_authorization);
        const decoded_jwt = await verifyAuthenticationToken(x_authorization);
        if (!decoded_jwt) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }
        const username = decoded_jwt.username;
        console.log('Authenticated Username:', username);
        // Further logging as needed
        const userResult = await userDBClient.query(`SELECT * FROM public.users WHERE username = $1`, [username]);
        console.log('User Query Result:', userResult.rows);
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
        }
        catch (err) {
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
            const { id: packageID, name: packageName, version: packageVersion, content } = pkg;
            if (regexPattern.test(pkg.Name)) {
                matchingPackages.push({
                    Name: pkg.Name,
                    Version: pkg.Version,
                    ID: pkg.ID.toString(),
                });
            }
            if (content) {
                const matches = await fetchReadmeMatches(content, regexPattern);
                if (matches && matches.length > 0) {
                    console.log('Match Found in Content for Package:', packageName);
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
    }
    catch (error) {
        console.error('Error in POST /package/byRegEx:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
