import { Router } from 'express';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { packagesDBClient, packageDB, userDBClient } from '../../config/dbConfig.js';
import { fetchReadmeMatches } from '../../helpers/s3Helper.js';
const router = Router();
/**
 * POST /package/byRegEx - Search for packages using a regular expression.
 */
router.post('/', async (req, res) => {
    try {
        console.log('Received request at POST /package/byRegEx');
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            // Respond with 403 if the header is missing or invalid
            res.status(403).json({ error: "Invalid or missing X-Authorization header" });
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
        console.log(`Token decoded successfully for username: ${username}`);
        // Check if the user exists in the database
        const userResult = await userDBClient.query(`SELECT * FROM public.employee_logins WHERE username = $1`, [username]);
        console.log(`Query result for username '${username}':`, userResult.rows);
        if (userResult.rows.length === 0) {
            console.error(`User not found in database: ${username}`);
            res.status(403).json({ success: false, message: 'User not found.' });
            return;
        }
        console.log('User authentication successful');
        // Validate the request body
        const { RegEx } = req.body;
        if (!RegEx || typeof RegEx !== 'string') {
            console.error('Invalid or missing RegEx in request body:', req.body);
            res.status(400).json({ error: 'RegEx must be provided in the request body' });
            return;
        }
        console.log(`RegEx received: ${RegEx}`);
        // Validate the RegEx pattern
        let regexPattern;
        try {
            regexPattern = new RegExp(RegEx, 'i'); // 'i' for case-insensitive matching
        }
        catch (err) {
            console.error('Invalid RegEx pattern:', err);
            res.status(400).json({ error: 'Invalid regular expression' });
            return;
        }
        console.log('RegEx pattern validated successfully');
        // Fetch all packages from the database
        const query = `
      SELECT package_id, package_name, package_version, s3_link
      FROM ${packageDB}
    `;
        const resultPackages = await packagesDBClient.query(query);
        const allPackages = resultPackages.rows;
        console.log(`Fetched ${allPackages.length} packages from the database`);
        // Collect matching packages
        const matchingPackages = [];
        for (const pkg of allPackages) {
            const packageID = pkg.package_id;
            const packageName = pkg.package_name;
            const packageVersion = pkg.package_version;
            const s3Link = pkg.s3_link; // Assuming s3_link is stored in this column
            console.log(`Checking package: ${packageName} (ID: ${packageID}, Version: ${packageVersion})`);
            // Check if package name matches the RegEx
            if (regexPattern.test(packageName)) {
                console.log(`Package name matched RegEx: ${packageName}`);
                matchingPackages.push({
                    Name: packageName,
                    Version: packageVersion,
                    ID: packageID.toString(),
                });
                continue;
            }
            // Check if README matches the RegEx
            console.log(`Searching README for package ID: ${packageID}`);
            // Use the helper function to fetch and search the README
            // s3Link should be something like 's3://bucket-name/packageID/'
            const matches = await fetchReadmeMatches(s3Link, regexPattern);
            if (matches && matches.length > 0) {
                console.log(`README matched RegEx for package ID: ${packageID}`);
                matchingPackages.push({
                    Name: packageName,
                    Version: packageVersion,
                    ID: packageID.toString(),
                });
            }
        }
        if (matchingPackages.length === 0) {
            console.warn('No packages matched the given RegEx');
            res.status(404).json({ error: 'No packages found matching the regex' });
            return;
        }
        console.log(`Found ${matchingPackages.length} matching packages`);
        res.status(200).json(matchingPackages);
    }
    catch (error) {
        console.error('Error in POST /package/byRegEx:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
