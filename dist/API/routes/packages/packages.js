import { Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import semver from 'semver';
const router = Router();
/**
 * POST /packages
 * Fetch packages based on queries and authentication.
 * Supports pagination and version filtering.
 *
 * @param {Request} req - Includes "offset" in query, "X-Authorization" in headers, and package queries in the body.
 * @param {Response} res - Returns package metadata or errors for invalid input/authentication.
 */
router.post('/', async (req, res) => {
    try {
        // Extract pagination offset, default to 0 if not provided
        const offset = parseInt(req.query.offset) || 0;
        const max_responses = 10; // Limit responses to 10 (prevents attack vector)
        // Validate the authorization header
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: "Missing or invalid X-Authorization header" });
            return;
        }
        // Extract the token from the header
        const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice("bearer ".length).trim()
            : authHeader.trim();
        // Verify user authentication using the provided token
        const result = await userDBClient.query(`SELECT * FROM ${employeeDB} WHERE "X-Authorization" = $1`, [x_authorization]);
        if (result.rows.length === 0) {
            res.status(403).json({ success: false, message: 'Authentication failed.' });
            return;
        }
        // Validate the request body
        if (!req.body) {
            res.status(400).json({ error: "Request body is required but was not provided." });
            return;
        }
        const packageQueries = req.body;
        // Ensure the request body is an array
        if (!Array.isArray(packageQueries)) {
            res.status(400).json({ error: "Request body must be an array." });
            return;
        }
        // Check if the request body contains exactly one query with "Name" set to "*"
        // and no "Version" field specified
        if (packageQueries.length === 1 && // Ensure there's only one query in the request body
            packageQueries[0].Name === "*" && // Check if the Name field is a wildcard ("*")
            !packageQueries[0].Version // Ensure the Version field is not provided
        ) {
            // Special case: Fetch all packages with pagination applied
            const allPackages = await packagesDBClient.query(`SELECT "Version", "Name", "ID" FROM ${packageDB} LIMIT $1 OFFSET $2`, // SQL query to fetch packages
            [max_responses, offset] // Apply pagination using LIMIT and OFFSET
            );
            // Respond with the fetched packages in a structured JSON format
            res.status(200).json(allPackages.rows.map(row => ({
                Version: row.Version, // Package version
                Name: row.Name, // Package name
                ID: row.ID, // Package ID
            })));
            return; // Exit early since the special case is handled
        }
        // If no queries are provided, fetch all packages with pagination
        if (packageQueries.length === 0) {
            const allPackages = await packagesDBClient.query(`SELECT "Version", "Name", "ID" FROM ${packageDB} LIMIT $1 OFFSET $2`, [max_responses, offset]);
            res.status(200).json(allPackages.rows.map(row => ({
                Version: row.Version,
                Name: row.Name,
                ID: row.ID,
            })));
            return;
        }
        const results = [];
        // Process each query in the request body
        for (const query of packageQueries) {
            // Validate that the "Name" property exists and is a string
            if (typeof query.Name !== 'string') {
                res.status(400).json({ error: "Invalid input format. Name must be a string." });
                return;
            }
            // Parse and validate version formats from the query
            const versionRanges = query.Version
                ? query.Version.split('\n').map((v) => {
                    v = v.trim();
                    // Check if the version starts with "Exact ("
                    if (v.startsWith("Exact (")) {
                        const exactVersion = v.match(/Exact \(([^)]+)\)/)?.[1];
                        return exactVersion || ""; // Extract the version inside "Exact (____)"
                    }
                    // Check if the version starts with "Bounded range ("
                    else if (v.startsWith("Bounded range (")) {
                        const boundedRange = v.match(/Bounded range \(([^)]+)\)/)?.[1];
                        return boundedRange?.replace(/-/g, " - ") || ""; // Extract the bounded range and format with spaces
                    }
                    // Check if the version starts with "Carat ("
                    else if (v.startsWith("Carat (")) {
                        const caratVersion = v.match(/Carat \(([^)]+)\)/)?.[1];
                        return caratVersion ? `${caratVersion}` : ""; // Extract the version inside "Carat (____)"
                    }
                    // Check if the version starts with "Tilde ("
                    else if (v.startsWith("Tilde (")) {
                        const tildeVersion = v.match(/Tilde \(([^)]+)\)/)?.[1];
                        return tildeVersion ? `${tildeVersion}` : ""; // Extract the version inside "Tilde (____)"
                    }
                    // Handle regular version formats directly
                    else {
                        return v; // Handle regular input like 1.2.3-2.1.0
                    }
                }).filter(Boolean) // Remove invalid/empty strings
                : [];
            // Collect unique version format types
            const uniqueFormats = new Set(query.Version.split('\n').map((v) => {
                if (v.startsWith("Exact ("))
                    return "Exact";
                if (v.startsWith("Bounded range ("))
                    return "Bounded range";
                if (v.startsWith("Carat ("))
                    return "Carat";
                if (v.startsWith("Tilde ("))
                    return "Tilde";
                return null;
            }).filter(Boolean) // Collect format types
            );
            // Ensure only one version format type is used
            if (uniqueFormats.size > 1) {
                res.status(400).json({
                    error: `Invalid Version format. Version cannot be a combination of different types: ${Array.from(uniqueFormats).join(', ')}.`,
                });
                return;
            }
            // Validate that all version ranges are semver-compliant
            for (const versionRange of versionRanges) {
                if (!semver.validRange(versionRange)) {
                    res.status(400).json({ error: `Invalid Version format: ${versionRange}` });
                    return;
                }
            }
            // Fetch packages from the database based on query parameters
            const queryResult = await packagesDBClient.query(`SELECT "Version", "Name", "ID" FROM ${packageDB} WHERE "Name" LIKE $1 LIMIT $2 OFFSET $3`, [query.Name === "*" ? "%" : query.Name, max_responses, offset]);
            // Filter results by version ranges, if specified
            const filteredResults = queryResult.rows.filter(row => {
                return versionRanges.length === 0 || versionRanges.some((range) => semver.satisfies(row.Version, range));
            });
            results.push(...filteredResults.map(row => ({
                Version: row.Version,
                Name: row.Name,
                ID: row.ID,
            })));
        }
        // Return the aggregated results
        res.status(200).json(results);
    }
    catch (error) {
        // Handle unexpected errors
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
