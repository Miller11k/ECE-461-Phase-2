/**
 * @module PackagesRoute
 * Handles the `/packages` endpoint for fetching packages based on queries and authentication.
 */

import { Request, Response, Router } from 'express';
import { employeeDB, userDBClient, packagesDBClient, packageDB } from '../../config/dbConfig.js';
import semver from 'semver';
import { decodeAuthenticationToken, displayDecodedPayload } from '../../helpers/jwtHelper.js';
import { shouldLog } from '../../helpers/logHelper.js';

const router = Router();

/**
 * POST `/packages` - Fetch packages based on queries and authentication.
 * 
 * This endpoint supports:
 * - Pagination using the `offset` query parameter.
 * - Filtering packages by `Name` and `Version` using the request body.
 * - Special cases for fetching all packages when `Name` is set to `*` and `Version` is not provided.
 * 
 * @route POST /packages
 * @group Packages - Operations related to fetching packages.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {string} req.query.offset - (Optional) Pagination offset (default is 0).
 * @param {string} req.headers.x-authorization - A valid JWT for authentication.
 * @param {Array<Object>} req.body - The package query parameters.
 * @param {string} req.body.Name - The name of the package (use `*` for wildcard).
 * @param {string} [req.body.Version] - The version or version range of the package.
 * 
 * @param {Response} res - The HTTP response object.
 * 
 * @returns {Array<Object>} A JSON array of packages matching the query.
 * 
 * @example
 * // Request body:
 * [
 *   { "Name": "example-package", "Version": "1.0.0" },
 *   { "Name": "another-package", "Version": "Carat (^1.0.0)" }
 * ]
 * 
 * // Successful response:
 * [
 *   { "Version": "1.0.0", "Name": "example-package", "ID": "123" },
 *   { "Version": "1.1.0", "Name": "another-package", "ID": "456" }
 * ]
 * 
 * @example
 * // Error response (invalid version format):
 * { "error": "Invalid Version format: X.Y.Z" }
 */
router.post("/", async (req: Request, res: Response) => {
  let log_get_package = parseInt(process.env.LOG_POST_PACKAGES || '0', 10);
  let log_all = parseInt(process.env.LOG_ALL || '0', 10);
  let should_log = shouldLog(log_get_package, log_all);

  console.log('\n\n\n*-------------------------------------------*');
  console.log('POST /packages endpoint hit');
  console.log('*-------------------------------------------*');

  try {
    if(should_log) console.log("Received POST request at /packages");
    // Extract pagination offset, default to 0 if not provided
    const offset = parseInt(req.query.offset as string) || 0;
    const max_responses = 10; // Limit responses to 10 (prevents attack vector)
    if(should_log){
      console.log(`Pagination offset: ${offset}, Max responses: ${max_responses}`);
    }

    // Extract and validate the X-Authorization header
    const authHeader = req.headers["x-authorization"];

    // Log the headers being sent
    for (const headerName in req.headers) {
      if (headerName.toLowerCase() === 'x-authorization') {
        if(should_log){
          console.log(`Header name received: ${headerName}`);
        }
      }
    }

    if (!authHeader || typeof authHeader !== "string") {
      if(should_log){
        console.log("Invalid or missing X-Authorization header");
      }
      // Respond with 403 if the header is missing or invalid
      res
        .status(403)
        .json({ error: "Invalid or missing X-Authorization header" });
      return;
    }

    // Extract the token from the header, removing the "Bearer " prefix if present
    const x_authorization = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice("bearer ".length).trim()
      : authHeader.trim();
    if(should_log){
      console.log(`Extracted authorization token: ${x_authorization}`);
    }

    const decoded_jwt = await decodeAuthenticationToken(x_authorization);

    // If no user matches the token, respond with 403
    if (!decoded_jwt) {
      if(should_log){
        console.log("Authentication failed: Invalid JWT token");
      }
      res
        .status(403)
        .json({ success: false, message: "Authentication failed." });
      return;
    }
    if(should_log){
      console.log("Decoded JWT payload:", decoded_jwt);
    }

    // Validate the request body
    if (!req.body) {
      if(should_log){
        console.log("Request body is missing");
      }
      res
        .status(400)
        .json({ error: "Request body is required but was not provided." });
      return;
    }

    const packageQueries = req.body;
    if(should_log){
      console.log("Package queries received:", packageQueries);
    }

    // Ensure the request body is an array
    if (!Array.isArray(packageQueries)) {
      if(should_log){
        console.log("Invalid request body format: Not an array");
      }
      res.status(400).json({ error: "Request body must be an array." });
      return;
    }

    // Check if the request body contains exactly one query with "Name" set to "*"
    // and no "Version" field specified
    if (
      packageQueries.length === 1 && // Ensure there's only one query in the request body
      packageQueries[0].Name === "*" && // Check if the Name field is a wildcard ("*")
      !packageQueries[0].Version // Ensure the Version field is not provided
    ) {
      if(should_log){
        console.log("Special case: Fetching all packages with pagination");
      }
      // Special case: Fetch all packages with pagination applied
      const allPackages = await packagesDBClient.query(
        `SELECT "Version", "Name", "ID" FROM ${packageDB} LIMIT $1 OFFSET $2`, // SQL query to fetch packages
        [max_responses, offset] // Apply pagination using LIMIT and OFFSET
      );

      // Respond with the fetched packages in a structured JSON format
      if(should_log){
        console.log("Fetched packages:", allPackages.rows);
      }
      res.status(200).json(
        allPackages.rows.map((row) => ({
          Version: row.Version, // Package version
          Name: row.Name, // Package name
          ID: row.ID, // Package ID
        }))
      );
      return; // Exit early since the special case is handled
    }

    // If no queries are provided, fetch all packages with pagination
    if (packageQueries.length === 0) {
      const allPackages = await packagesDBClient.query(
        `SELECT "Version", "Name", "ID" FROM ${packageDB} LIMIT $1 OFFSET $2`,
        [max_responses, offset]
      );

      if(should_log){
        console.log("Processing package queries...");
      }
      res.status(200).json(
        allPackages.rows.map((row) => ({
          Version: row.Version,
          Name: row.Name,
          ID: row.ID,
        }))
      );
      return;
    }

    const results = [];
    if(should_log){
      console.log("Processing package queries...");
    }

    // Process each query in the request body
    // Updated section for processing package queries
    for (const query of packageQueries) {
      if(should_log){
        console.log("Processing query:", query);
      }

      // Validate that the "Name" property exists and is a string
      if (typeof query.Name !== "string") {
        if(should_log){
          console.log("Invalid query format: Name is not a string");
        }
        res.status(400).json({ error: "Invalid input format. Name must be a string." });
        return;
      }

      // Handle the case where "Version" is not specified
      if (!query.Version) {
        if(should_log){
          console.log(`Version not specified for package '${query.Name}', defaulting to all versions.`);
        }
      }

      // Parse and validate version formats from the query if provided
      const versionRanges = query.Version
        ? query.Version.split("\n")
            .map((v: string) => v.trim())
            .filter(Boolean) // Remove invalid/empty strings
        : []; // Default to an empty array if no version is specified

      if(should_log){
        console.log("Extracted version ranges:", versionRanges);
      }

      // Collect unique version format types
      const uniqueFormats = new Set(
        query.Version
          ? query.Version.split("\n")
              .map((v: string) => {
                if (v.startsWith("Exact (")) return "Exact";
                if (v.startsWith("Bounded range (")) return "Bounded range";
                if (v.startsWith("Carat (")) return "Carat";
                if (v.startsWith("Tilde (")) return "Tilde";
                return null;
              })
              .filter(Boolean) // Collect format types
          : []
      );
      if(should_log){
        console.log("Unique version format types detected:", Array.from(uniqueFormats));
      }

      // Ensure only one version format type is used
      if (uniqueFormats.size > 1) {
        res.status(400).json({
          error: `Invalid Version format. Version cannot be a combination of different types: ${Array.from(
            uniqueFormats
          ).join(", ")}.`,
        });
        return;
      }

      // Validate that all version ranges are semver-compliant
      for (const versionRange of versionRanges) {
        if (!semver.validRange(versionRange)) {
          res
            .status(400)
            .json({ error: `Invalid Version format: ${versionRange}` });
          return;
        }
      }

      if(should_log){
        console.log(
        `Executing query: SELECT "Version", "Name", "ID" FROM ${packageDB} WHERE "Name" LIKE $1 LIMIT $2 OFFSET $3`,
        [query.Name === "*" ? "%" : query.Name, max_responses, offset]
        );
      }

      // Fetch packages from the database based on query parameters
      const queryResult = await packagesDBClient.query(
        `SELECT "Version", "Name", "ID" FROM ${packageDB} WHERE "Name" LIKE $1 LIMIT $2 OFFSET $3`,
        [query.Name === "*" ? "%" : query.Name, max_responses, offset]
      );

      if(should_log){
        console.log(`Fetched ${queryResult.rows.length} rows from the database.`);
        console.log("Query Results:", queryResult.rows);
      }

      // Filter results by version ranges, if specified
      const filteredResults = queryResult.rows.filter((row) => {
        return (
          versionRanges.length === 0 || // Return all versions if no range is specified
          versionRanges.some((range: string) =>
            semver.satisfies(row.Version, range)
          )
        );
      });

      if(should_log){
        console.log(`Filtered results count: ${filteredResults.length}`);
      }

      results.push(
        ...filteredResults.map((row) => ({
          Version: row.Version,
          Name: row.Name,
          ID: row.ID,
        }))
      );
    }


    if(should_log){
      console.log("Final results being added:", results);
    }
    // Return the aggregated results
    res.status(200).json(results);
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;