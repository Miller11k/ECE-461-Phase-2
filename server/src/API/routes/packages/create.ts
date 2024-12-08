/**
 * @module routes/package
 * Handles the `/package` endpoint (POST) for uploading or ingesting new packages.
 */

// External dependencies
import express, { Request, Response, Router } from 'express';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Internal dependencies
import { userDBClient, packagesDBClient, packageDB, metricsDB, dependenciesDB } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import {
  saveBase64AsZip,
  extractPackageJsonFromZip,
  convertZipToBase64,
  cloneAndZipRepo,
  encodeFileToBase64
} from '../../helpers/zipHelper.js';
import { uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
import { processUrls  } from '../../../metricsCalculation/cli.js';
import { shouldLog } from '../../helpers/logHelper.js';
import { get_standalone_cost, get_total_cost } from '../../helpers/fileHelper.js';
import { randomUUID } from 'crypto';
import { url } from 'inspector';
import { convertMetricsToFloat } from '../../helpers/metricHelper.js';
import { getSemanticVersion } from '../../helpers/versionHelper.js';
import { extractGitHubUrl } from '../../helpers/urlHelper.js'
import { get_all_costs } from '../../helpers/costHelper.js';

const router = Router();


type DependencyCosts = {
  standaloneCost: number;
  totalCost: number;
};




/**
 * POST `/package` - Upload or ingest a new package.
 * 
 * @route POST /package
 * @group Packages - Operations related to package management.
 * 
 * @param {Request} req - Express request object.
 * @param {string} [req.body.Content] - Base64-encoded zip file content (optional).
 * @param {string} [req.body.URL] - URL to a GitHub repository (optional).
 * @param {string} [req.body.Name] - Name of the package (required if Content is provided).
 * @param {Response} res - Express response object.
 * 
 * @returns {Object} A JSON response with the package metadata and data:
 * - `metadata`: Contains `Name`, `Version`, and `ID`.
 * - `data`: Contains the `Content` or `URL` provided in the request.
 * 
 * @description
 * This endpoint allows authenticated users to upload or ingest a new package.
 * It accepts either 'Content' (Base64-encoded zip file) or 'URL' to a GitHub repository in the request body.
 * The package is processed and stored, and metadata is returned.
 * 
 * @example
 * // Request body with Content:
 * {
 *   "Name": "example-package",
 *   "Content": "<Base64-encoded zip file content>"
 * }
 * 
 * @example
 * // Request body with URL:
 * {
 *   "URL": "https://github.com/username/repository"
 * }
 * 
 * @example
 * // Successful response:
 * {
 *   "metadata": {
 *     "Name": "example-package",
 *     "Version": "1.0.0",
 *     "ID": "123e4567-e89b-12d3-a456-426614174000"
 *   },
 *   "data": {
 *     "Content": "<Base64-encoded content>"
 *     // or "URL": "https://github.com/username/repository"
 *   }
 * }
 * 
 * @example
 * // Error response (missing Content and URL):
 * {
 *   "error": "Either 'Content' or 'URL' must be provided."
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  let log_post_package = parseInt(process.env.LOG_POST_PACKAGE || '0', 10);
  let log_all = parseInt(process.env.LOG_ALL || '0', 10);
  let should_log = shouldLog(log_post_package, log_all);
  try {
    console.log('*-------------------------------------------*');
    console.log('POST /package endpoint hit');
    console.log('*-------------------------------------------*');

    // Extract and validate the authorization header
    const authHeader = req.headers['x-authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      if (should_log) console.error('Missing or invalid X-Authorization header');
      res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
      return;
    }

    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length).trim()
      : authHeader.trim();

    if (should_log) console.log('Decoded token:', token);

    // Decode and validate the authentication token
    const decoded_jwt = await decodeAuthenticationToken(token);
    if (!decoded_jwt) {
      if (should_log) console.error('Authentication failed.');
      res.status(403).json({ error: 'Authentication failed.' });
      return;
    }

    // Check if the user exists in the database
    const username = decoded_jwt.username;
    if (should_log) console.log('Authenticated username:', username);

    const userResult = await userDBClient.query(
      `SELECT * FROM public.users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      if (should_log) console.error('User not found.');
      res.status(403).json({ error: 'User not found.' });
      return;
    }

    if (should_log) console.log("Here 1: User authenticated and verified");

    // Extract and validate the body parameters
    const { Version, Content, URL, Name, debloat } = req.body;
    
    const debloatValue = debloat ?? false;
    if(should_log){
      console.log(`Version: ${Version || '{NOT PROVIDED}'}`);
      console.log(`Content: ${Content? "{PROVIDED}" : "{NOT PROVIDED}"}`);
      console.log(`URL: ${URL || '{NOT PROVIDED}'}`);
      console.log(`Name: ${Name || '{NOT PROVIDED}'}`);
      console.log(`Debloat: ${debloatValue ? 'true' : 'false'}`);
    }

    if (!Content && !URL) {
      if (should_log) console.error("Either 'Content' or 'URL' must be provided.");
      res.status(400).json({ error: "Either 'Content' or 'URL' must be provided." });
      return;
    }

    if (Content && URL) {
      if (should_log) console.error("Both 'Content' and 'URL' cannot be provided together.");
      res.status(400).json({ error: "Both 'Content' and 'URL' cannot be provided together." });
      return;
    }

    if (should_log) console.log('Here 3: Valid Content/URL input');

    let package_version = '';
    let package_name = '';
    let package_json = null;
    let repo_link = '';
    let standalone_cost = 0;
    let total_cost = 0;
    let s3FolderUrl = '';
    let is_internal = false;
    let tempZipPath: string | undefined;
    let content = '';

    if (Content) {
      if (should_log) console.log('Processing Base64 content...');
      content = Content;
      is_internal = true;

      package_json = await extractPackageJsonFromZip(Content);
      if (should_log) console.log('Extracted package.json:', package_json);

      if (!package_json) {
        if (should_log) console.error('Invalid pack age.json or missing GitHub URL.');
        res.status(400).json({ error: 'Invalid package.json or missing GitHub URL.' });
        return;
      }

      package_name = Name || package_json.name;
      package_version = Version || package_json.version;
      if(should_log) console.log(`FULL VERSION BEFORE SEMANTIC FILTER ${package_version}`);
      package_version = getSemanticVersion(package_version); // Normalize the version
      if(should_log) console.log(`FULL VERSION AFTER SEMANTIC FILTER ${package_version}`);
      repo_link = extractGitHubUrl(package_json, package_name) || ''  ;
      if(should_log) console.log(`REPO LINK ${repo_link}`);

      if (should_log) console.log(`Extracted repo_link: ${repo_link}`);
    }

    if (URL) {
      // TODO: Add a check that given URL is correct
      let URL_valid = false;
      try {
        const response = await fetch(URL, { method: 'HEAD' });

        if (response.ok) {
            URL_valid = true;
        } else {
            URL_valid = false;
        }
      } catch (error) {
        URL_valid = false;
      }

      if(should_log) console.log(`URL ${URL} ${URL_valid ? "is" : "is not"} valid`);


      if (should_log) console.log('Processing GitHub URL...');
      try {
        const tempZipPath = `/tmp/${randomUUID()}.zip`;
        const success = await cloneAndZipRepo(URL, tempZipPath);

        if (success) {
          content = await encodeFileToBase64(tempZipPath);

          package_json = await extractPackageJsonFromZip(content);

          if (should_log) {
            if(should_log) console.log('Base64 Encoded Content:', content);
            if(should_log) console.log('Extracted package.json from GitHub URL:', package_json);
          }

          if (!package_json) {
            if(should_log) console.log("Unable to find package.json");
            res.status(400).json({ error: 'Unable to locate package.json' });
            return;
          }

          repo_link = URL;
          await fs.promises.unlink(tempZipPath);
        } else {
          res.status(400).json({ error: 'Failed to clone and zip repository.' });
          return;
        }
      } catch (error) {
        if (should_log) console.error('Error processing GitHub URL:', error);
        res.status(500).json({ error: 'Internal server error.' });
      }
    }

    
    package_version = getSemanticVersion(Version || package_json.version);
    package_name = Name || package_json.name;

    console.log(`FINAL REPOSITORY NAME = ${package_name}`);

    // After determining package_name and package_version
if (!package_name) {
    if (should_log) console.error('Invalid package name.');
    res.status(400).json({ error: 'Invalid package name.' });
    return;
  }
  
  console.log(`FINAL REPOSITORY NAME = ${package_name}`);
  console.log(`FINAL PACKAGE VERSION = ${package_version}`);
  
  // Check if the package is already in the database
  const existingPackageQuery = `
    SELECT "ID" FROM ${packageDB} WHERE "Name" = $1 AND "Version" = $2
  `;
  const existingPackageResult = await packagesDBClient.query(existingPackageQuery, [package_name, package_version]);
  
  if (existingPackageResult.rows.length > 0) {
    const existingID = existingPackageResult.rows[0].ID;
    if (should_log) console.log(`Package already exists with ID: ${existingID}`);
    res.status(409).json({
      error: 'Package already exists in the database.',
      metadata: { ID: existingID, Name: package_name, Version: package_version },
    });
    return;
  }
  
  // Proceed with generating a new package ID
  const ID = generatePackageID(package_name, package_version);
  if (should_log) console.log(`Generated package ID: ${ID}`);
  

    let dependencyCosts: Record<string, DependencyCosts> = {};
    let dependencySizes = {}; // Define dependencySizes outside try-catch
    let totalCost = 0;
    let totalFolderSize = 0;

    try {
      if(should_log) console.log('CONTENT INPUT:', content);
    
      // Ensure standalone cost is calculated correctly
      const standaloneCostResult = await get_standalone_cost(content);
      if (standaloneCostResult == null) {
        throw new Error('Failed to calculate standalone cost.');
      }
      standalone_cost = parseFloat(standaloneCostResult.toFixed(2));
      if(should_log) console.log('Standalone Cost:', standalone_cost);
    
      // Ensure total cost and dependency costs are calculated correctly
      const costsResult = await get_all_costs(content);
      if (!costsResult || !costsResult.dependencyCosts || Object.keys(costsResult.dependencyCosts).length === 0) {
        throw new Error('No dependencies found. Check get_all_costs implementation.');
      }
      dependencyCosts = costsResult.dependencyCosts;
    
      const totalCostResult = await get_total_cost(content);
      if (totalCostResult == null) {
        throw new Error('Failed to calculate total cost.');
      }
      total_cost = parseFloat(totalCostResult.toFixed(2));
      if(should_log) console.log(`TOTAL COST ${total_cost}`);
    
      // Debugging costs before insertion
      if(should_log) console.log('Calculated Dependency Costs:', JSON.stringify(dependencyCosts, null, 2));
    
      for (const [dependencyName, costs] of Object.entries(dependencyCosts)) {
        if(should_log) console.log(
          `Dependency: ${dependencyName}, Standalone: ${costs.standaloneCost}, Total: ${costs.totalCost}`
        );
      }
    } catch (error) {
      if(should_log) console.error('Error in cost calculation:', error);
      res.status(500).json({ error: 'Failed to calculate costs.' });
      return;
    }
    
    


    if (should_log) {
      console.log(`Standalone Cost: ${standalone_cost}`);
      console.log(`Total Cost: ${total_cost}`);
    }

    const metricsResults = await processUrls([repo_link], is_internal, package_name);
    if(should_log){
      console.log(`Version: ${package_version || '{NOT FOUND}'}`);
      console.log(`Content: ${content? "{PROVIDED}" : "{NOT PROVIDED}"}`);  // Should ALWAYS be provided at this point
      console.log(`URL: ${repo_link || '{NOT FOUND}'}`);
      console.log(`Name: ${package_name || '{NOT FOUND}'}`);
      console.log(`Debloat: ${debloatValue ? 'true' : 'false'}`);
    }

    if (should_log) console.log('Metrics Results:', metricsResults);
    if(should_log) console.log('Metrics Results:', metricsResults);

      if (metricsResults.NetScore > 0.5) {
        if (should_log) console.log('NetScore is acceptable, uploading to S3...');
        const bucketName = process.env.S3_BUCKET_NAME;
        if(bucketName){
          const uploadSuccess = await uploadUnzippedToS3(content, bucketName, `${package_name}/${package_version}/`);
          if (should_log) console.log('S3 Upload Success:', uploadSuccess);
          s3FolderUrl = `s3://${bucketName}/${package_name}/${package_version}/`;
        } else {
          res.status(400).json({error: "Unable to upload to S3 bucket"});
          return;
        }
      } else {
        res.status(424).json({error: "Package is not uploaded due to the disqualified rating"});
        return;
      }


    await packagesDBClient.query('BEGIN');
    if (should_log) console.log('Database transaction started.');

    const insertPackageQuery = `
      INSERT INTO ${packageDB} 
      ("ID", "Name", "Version", "Content", "repo_link", "is_internal", "debloat", "standalone_cost", "total_cost") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    if (should_log) console.log('Inserting package into database...');

    await packagesDBClient.query(insertPackageQuery, [
      ID,
      package_name,
      package_version,
      s3FolderUrl,
      repo_link,
      is_internal,
      debloatValue,
      standalone_cost,
      total_cost,
    ]);

    if (should_log) console.log('Package inserted successfully.');

    if (should_log) console.log('Inserting dependencies into database...');

    type DependencyCosts = {
      standaloneCost: number;
      totalCost: number;
  };
    
  // Example of using dependencyCosts
  if(should_log) console.log('Dependency Costs before insertion:', JSON.stringify(dependencyCosts, null, 2));
  if (!dependencyCosts || Object.keys(dependencyCosts).length === 0) {
    if(should_log) console.error('No dependencies to insert.');
    throw new Error('Dependency Costs object is unexpectedly empty.');
  }

  for (const [dependencyName, costs] of Object.entries(dependencyCosts)) {
      const { standaloneCost, totalCost } = costs;
      const dependencyID = randomUUID();
  
      const insertDependencyQuery = `
          INSERT INTO ${dependenciesDB} ("Package ID", "Dependency ID", "name", "standalone_cost", "total_cost")
          VALUES ($1, $2, $3, $4, $5)
      `;
  
      await packagesDBClient.query(insertDependencyQuery, [
          ID,
          dependencyID,
          dependencyName,
          standaloneCost,
          totalCost,
      ]);
  
      if(should_log) console.log(
          `Inserted dependency: ${dependencyName}, Standalone Cost: ${standaloneCost} MB, Total Cost: ${totalCost} MB, Dependency ID: ${dependencyID}`
      );
  }  

    if (should_log) console.log('Dependencies inserted successfully.');

    // Insert metrics into metrics table
    const insertMetricsQuery = `
      INSERT INTO ${metricsDB} 
      (
        "rampup", "busfactor", "correctness", "licensescore", 
        "responsivemaintainer", "netscore", "netscorelatency", "rampuplatency", 
        "busfactorlatency", "correctnesslatency", "licensescorelatency", 
        "responsivemaintainerlatency", "goodpinningpractice", 
        "goodpinningpracticelatency", "pullrequest", 
        "pullrequestlatency", "package_id"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;
    if (should_log) console.log('Inserting metrics into database...');

    await packagesDBClient.query(insertMetricsQuery, [
      metricsResults.RampUp,
      metricsResults.BusFactor,
      metricsResults.Correctness,
      metricsResults.License,
      metricsResults.ResponsiveMaintainer,
      metricsResults.NetScore,
      metricsResults.NetScore_Latency,
      metricsResults.RampUp_Latency,
      metricsResults.BusFactor_Latency,
      metricsResults.Correctness_Latency,
      metricsResults.License_Latency,
      metricsResults.ResponsiveMaintainer_Latency,
      metricsResults.DependencyPinning,
      0, // Assuming no latency value for good pinning practice
      metricsResults.CodeReviewFraction, // Map CodeReviewFraction to pullrequest
      0, // Assuming no latency value for pullrequest
      ID // package_id matches the inserted package ID
    ]);
    if (should_log) console.log('Metrics inserted successfully.');

    // Commit transaction
    await packagesDBClient.query('COMMIT');
    if (should_log) console.log('Database transaction committed.');

    res.status(201).json({
      metadata: { Name: package_name, Version: package_version, ID },
      data: { Content: s3FolderUrl, URL: repo_link },
    });
  } catch (error) {
    if (should_log) console.error('Error in /package endpoint:', error);

    await packagesDBClient.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

export default router;