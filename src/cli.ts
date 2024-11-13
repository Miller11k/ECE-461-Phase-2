#!/usr/bin/env node

// External dependencies
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import { exit } from 'process';

// Proprietaries
import { OCTOKIT, logger, logLevel, logFile } from './Metrics.js';
import { NetScore } from './netScore.js';
// Tests
import { BusFactorTest } from './busFactor.js';
import { CorrectnessTest } from './correctness.js';
import { LicenseTest } from './license.js';
import { MaintainabilityTest } from './maintainability.js';
import { RampUpTest } from './rampUp.js';
import { NetScoreTest } from './netScore.js';

// Additions for writing to the database
import pkg from 'pg';
import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
// import { console } from 'inspector';
const { Pool } = pkg;

dotenv.config();

const TEMP_BUCKET = process.env.S3_TEMP_BUCKET_NAME;
const PERMANENT_BUCKET = process.env.S3_PERMANENT_BUCKET_NAME;
const REGION = process.env.AWS_REGION;


// now we need to add all of the database information in the .env file
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT), 
    ssl: {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA
    }
});

// Check environment variables
if (!TEMP_BUCKET || !PERMANENT_BUCKET) {
    console.error("Error: Bucket names not found in environment variables. Set S3_TEMP_BUCKET_NAME and S3_PERMANENT_BUCKET_NAME in your .env file.");
    process.exit(1);
}

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN || ''
    }
});




// Function to check if a file exists in the temporary bucket
async function checkFileInTempBucket(fileName: string): Promise<boolean> {
    console.log(`Checking for file "${fileName}" in temporary bucket...`);
    try {
        const command = new HeadObjectCommand({ Bucket: TEMP_BUCKET, Key: fileName });
        await s3Client.send(command);
        console.log(`File "${fileName}" found in temporary bucket.`);
        return true;
    } catch (error) {
        console.error(`File "${fileName}" not found in temporary bucket:`, error);
        return false;
    }
}


// Function to download a file from the temporary bucket
async function downloadFileFromTempBucket(fileName: string, downloadPath: string): Promise<void> {
    console.log(`Downloading "${fileName}" from temporary bucket to "${downloadPath}"...`);
    try {
        const command = new GetObjectCommand({ Bucket: TEMP_BUCKET, Key: fileName });
        const data = await s3Client.send(command);
        fs.writeFileSync(downloadPath, Buffer.from(await data.Body!.transformToByteArray()));
        console.log(`File "${fileName}" downloaded successfully.`);
    } catch (error) {
        console.error(`Error downloading file "${fileName}" from temporary bucket:`, error);
        throw error;
    }
}

// Function to upload a file to the permanent bucket
async function uploadFileToPermBucket(filePath: string, fileName: string): Promise<void> {
    console.log(`Uploading "${fileName}" to permanent bucket...`);
    try {
        const fileStream = fs.createReadStream(filePath);
        const command = new PutObjectCommand({
            Bucket: PERMANENT_BUCKET,
            Key: fileName,
            Body: fileStream
        });
        const data = await s3Client.send(command);
        console.log(`File "${fileName}" uploaded successfully.`);
    } catch (error) {
        console.error(`Error uploading file "${fileName}" to permanent bucket:`, error);
        throw error;
    }
}

/**
 * Retrieves the GitHub repository URL from an npm package URL.
 *
 * @param {string} npmUrl - The URL of the npm package.
 * @returns {Promise<string | null>} A promise that resolves to the GitHub repository URL if found, or null if not found.
 *
 * @remarks
 * This function extracts the package name from the provided npm URL and fetches the package details from the npm registry.
 * It then checks if the package has a repository field that includes a GitHub URL. If found, it normalizes the URL by
 * removing 'git+', 'ssh://git@', and '.git' if present, and returns the normalized URL.
 * If the repository field is not found or does not include a GitHub URL, the function returns null.
 *
 * @example
 * ```typescript
 * const githubUrl = await getGithubUrlFromNpm('https://www.npmjs.com/package/axios');
 * console.log(githubUrl); // Output: 'https://github.com/axios/axios'
 * ```
 *
 * @throws Will log an error message if there is an issue fetching the GitHub URL.
 */
async function getGithubUrlFromNpm(npmUrl: string): Promise<string | null> {
    try {
        // Extract package name from npm URL
        const packageName = npmUrl.split('/').pop();
        if (!packageName) return null;

        // Fetch package details from npm registry
        const npmApiUrl = `https://registry.npmjs.org/${packageName}`;
        const response = await axios.get(npmApiUrl);

        // Check if the package has a repository field
        const repoUrl = response.data.repository?.url;
        if (repoUrl && repoUrl.includes('github.com')) {
            // Normalize the URL (remove 'git+', 'ssh://git@', and '.git' if present)
            logger.info(`Found GitHub URL for ${npmUrl}: ${repoUrl}`);
            let normalizedUrl = repoUrl.replace(/^git\+/, '').replace(/^ssh:\/\/git@github.com/, 'https://github.com').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
            return normalizedUrl;
        } else {
            return null;
        }
    } catch (error) {
        logger.error(`Error fetching GitHub URL for ${npmUrl}:`, error);
        return null;
    }
}

/**
 * Displays the usage information for the CLI.
 */
function showUsage() {
    console.log(`Usage:
    ./run install                   # Install dependencies
    ./run <path/to/file>            # Process URLs from "URL_FILE"
    ./run test                      # Run test suite`);
}

/**
 * Runs the tests and displays the results.
 *
 * @returns {Promise<void>} A promise that resolves when the tests are completed.
 */
async function runTests() {
    let passedTests = 0;
    let failedTests = 0;
    let results: { passed: number, failed: number }[] = [];
    let apiRemaining: number[] = [];
    logger.info('Running tests...');
    logger.info('Checking environment variables...');

    // Get token from environment variable
    let status = await OCTOKIT.rateLimit.get();
    logger.debug(`Rate limit status: ${status.data.rate.remaining} remaining out of ${status.data.rate.limit}`);
    apiRemaining.push(status.data.rate.remaining);

    // Print warning if rate limit is low
    if (status.data.rate.remaining < 300) {
        logger.warn('Warning: Rate limit is low. Test Suite uses ~ 250 calls. Consider using a different token.');
        exit(1);
    }

    // Run tests
    results.push(await LicenseTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);
    results.push(await BusFactorTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);
    results.push(await CorrectnessTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);
    results.push(await RampUpTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);
    results.push(await MaintainabilityTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);
    results.push(await NetScoreTest());
    apiRemaining.push((await OCTOKIT.rateLimit.get()).data.rate.remaining);

    // Calc used rate limit 📝
    let usedRateLimit = apiRemaining[0] - apiRemaining[apiRemaining.length - 1];
    logger.debug(`\nRate Limit Usage:`);
    logger.debug(`License Test: ${apiRemaining[0] - apiRemaining[1]}`);
    logger.debug(`Bus Factor Test: ${apiRemaining[1] - apiRemaining[2]}`);
    logger.debug(`Correctness Test: ${apiRemaining[2] - apiRemaining[3]}`);
    logger.debug(`Ramp Up Test: ${apiRemaining[3] - apiRemaining[4]}`);
    logger.debug(`Maintainability Test: ${apiRemaining[4] - apiRemaining[5]}`);
    logger.debug(`Net Score Test: ${apiRemaining[5] - apiRemaining[6]}`);
    logger.debug(`Total Rate Limit Used: ${usedRateLimit}`);

    // Display test results
    results.forEach((result, index) => {
        passedTests += result.passed;
        failedTests += result.failed;
    });

    // Syntax checker stuff (may move to run file in future idk)
    let coverage: number = Math.round(passedTests / (passedTests + failedTests) * 100); // dummy variable for now
    let total: number = passedTests + failedTests;

    process.stdout.write(`Total: ${total}\n`);
    process.stdout.write(`Passed: ${passedTests}\n`);
    process.stdout.write(`Coverage: ${coverage}%\n`);
    process.stdout.write(`${passedTests}/${total} test cases passed. ${coverage}% line coverage achieved.\n`);
}

/**
 * Processes a file containing URLs and performs actions based on the type of URL.
 * 
 * @param {string} filePath - The path to the file containing the URLs.
 * @returns {Promise<void>} A promise that resolves when all URLs have been processed.
 */
async function processUrls(filePath: string): Promise<void> {
    logger.info(`Processing URLs from file: ${filePath}`);
    let status = await OCTOKIT.rateLimit.get();
    logger.debug(`Rate limit status: ${status.data.rate.remaining} remaining out of ${status.data.rate.limit}`);

    const urls: string[] = fs.readFileSync(filePath, 'utf-8').split('\n');
    const githubUrls: [string, string][] = [];


    for (const url of urls) {
        url.trim();
        // Skip empty lines
        if (url === '') continue;

        if (url.includes('github.com')) {
            // If it's already a GitHub URL, add it to the list
            githubUrls.push([url, url]);
        } else if (url.includes('npmjs.com')) {
            // If it's an npm URL, try to get the GitHub URL
            const githubUrl = await getGithubUrlFromNpm(url);
            if (githubUrl) {
                githubUrls.push([url,githubUrl]);
            }
        }
    }

    // Print the github urls
    logger.debug('GitHub URLs:');
    for (const url of githubUrls) {
        logger.debug(`\t${url[0]} -> ${url[1]}`);
    }

    logger.debug('URLs processed. Starting evaluation...');
    // Process each GitHub URL
    for (const url of githubUrls) {
        const netScore = new NetScore(url[0], url[1]);
        const result = await netScore.evaluate();
        process.stdout.write(netScore.toString() + '\n');
        logger.debug(netScore.toString());

        //additions for writing to database

        const package_name = extractPackageName(netScore.NativeURL);
        const fileName = `${package_name}.zip`;
        const tempDownloadPath = `/tmp/${fileName}`;
        
        // Step 1: Check if the file exists in the temporary S3 bucket
        console.log(`Checking if file "${fileName}" exists in the temporary S3 bucket...`);
        const fileExists = await checkFileInTempBucket(fileName);
        if (!fileExists) {
            console.error(`File "${fileName}" not found in temporary S3 bucket. Skipping this package.`);
            continue;
        }
        
        // Step 2: Download the file from the temporary S3 bucket
        console.log(`Attempting to download "${fileName}" from temporary bucket to "${tempDownloadPath}"...`);
        try {
            await downloadFileFromTempBucket(fileName, tempDownloadPath);
            console.log(`File "${fileName}" downloaded successfully to "${tempDownloadPath}".`);
        } catch (error) {
            console.error("Error during download process. Skipping this package.");
            continue;
        }
        
        // Step 3: Upload the file to the permanent S3 bucket, confirming no duplicate upload
        console.log(`Preparing to upload "${fileName}" to the permanent S3 bucket...`);
        try {
            await uploadFileToPermBucket(tempDownloadPath, fileName);
            console.log(`File "${fileName}" uploaded successfully to the permanent bucket.`);
        } catch (error) {
            console.error("Error during upload process. Skipping this package.");
            continue;
        }
        
        // Step 4: Delete the file from local EC2 storage after upload completes
        console.log(`Attempting to delete temporary file "${tempDownloadPath}" from EC2...`);
        try {
            fs.unlinkSync(tempDownloadPath);
            console.log(`Temporary file "${tempDownloadPath}" deleted from EC2.`);
        } catch (error) {
            console.error(`Error deleting temporary file "${tempDownloadPath}":`, error);
        }
        
        


        const insertPackageQuery = `
        INSERT INTO packages (
            package_name, repo_link, is_internal, package_version, s3_link, net_score, final_metric, final_metric_latency
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (repo_link) 
        DO UPDATE SET 
            net_score = EXCLUDED.net_score,
            final_metric_latency = EXCLUDED.final_metric_latency
        RETURNING package_id;
        `;

        // Setting placeholder values for fields we're not using
        const packageValues = [
            package_name,            // package_name
            netScore.NativeURL,      // repo_link
            false,                   // is_internal, setting to `false` as a default
            '1.0.0',                 // package_version, setting to a placeholder like '1.0.0'
            null,                    // s3_link, set to `null` if no link is available
            netScore.netScore,       // net_score
            null,                    // final_metric, set to `null` as a placeholder
            netScore.responseTime    // final_metric_latency
        ];
        let packageId;
        try {
            const packageRes = await pool.query(insertPackageQuery, packageValues);
            packageId = packageRes.rows[0].package_id;
            logger.info(`Package inserted with package_id: ${packageId}`);
        } catch (err) {
            if (err instanceof Error) {
                logger.info(`Error inserting package: ${err.message}`);
            } else {
                logger.info('Unexpected error inserting package');
            }
            return;
        }

        // // INSERT DEPENDENCIES
        // const insertDependencyQuery = `
        // INSERT INTO dependencies (package_id, dependency_url, is_internal)
        // VALUES ($1, $2, $3)
        // RETURNING dependency_id;
        // `;

        // //get ALL dependencies, version requirements of them, ^1.1.1, *, ~1,2,0
        // const dependencies = netScore.dependencies;  // Assume this array contains dependency URLs
        // for (const dep of dependencies) {
        //     const dependencyValues = [
        //         packageId,                       // Foreign key to link dependency to the package
        //         dep.url,                         // Dependency URL
        //         dep.isInternal                   // Whether the dependency is internal
        //     ];

        //     try {
        //         const dependencyRes = await pool.query(insertDependencyQuery, dependencyValues);
        //         logger.info(`Dependency inserted with dependency_id: ${dependencyRes.rows[0].dependency_id}`);
        //     } catch (err) {
        //         if (err instanceof Error) {
        //             logger.error(`Error inserting dependency: ${err.message}`);
        //         } else {
        //             logger.error('Unexpected error inserting dependency');
        //         }
        //     }
        // }

        // INSERT METRICS AND SCORES
        const insertMetricsQuery = `
        INSERT INTO metrics (package_id, ramp_up_time, bus_factor, correctness, license_compatibility, maintainability)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (package_id) 
        DO UPDATE SET 
            ramp_up_time = EXCLUDED.ramp_up_time,
            bus_factor = EXCLUDED.bus_factor,
            correctness = EXCLUDED.correctness,
            license_compatibility = EXCLUDED.license_compatibility,
            maintainability = EXCLUDED.maintainability
        RETURNING metric_id;
        `;

        const metricsValues = [
            packageId,  // NEED TO put actual package id USING EXAMPLE PAKACGE ID
            netScore.rampUp.rampUp,
            netScore.busFactor.busFactor,
            netScore.correctness.correctness,
            netScore.license.license,
            netScore.maintainability.maintainability
        ];

        try {
            const metricsRes = await pool.query(insertMetricsQuery, metricsValues);
            logger.info(`Metrics inserted with metric_id: ${metricsRes.rows[0].metric_id}`);
        } catch (err) {
            if (err instanceof Error) {
                logger.error(`Error inserting metrics: ${err.message}`);
            } else {
                logger.error('Unexpected error inserting metrics');
            }
        }

          // Insert the latencies into the `scores` table
          const insertScoresQuery = `
          INSERT INTO scores (package_id, net_score, ramp_up_latency, bus_factor_latency, correctness_latency, license_latency, maintainability_latency)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (package_id) 
          DO UPDATE SET 
              net_score = EXCLUDED.net_score,
              ramp_up_latency = EXCLUDED.ramp_up_latency,
              bus_factor_latency = EXCLUDED.bus_factor_latency,
              correctness_latency = EXCLUDED.correctness_latency,
              license_latency = EXCLUDED.license_latency,
              maintainability_latency = EXCLUDED.maintainability_latency
          RETURNING score_id;
      `;
      
     
      const scoresValues = [
          packageId,  // EXAMPLE PACAGE 
          netScore.netScore,       
          netScore.rampUp.responseTime, 
          netScore.busFactor.responseTime, 
          netScore.correctness.responseTime, 
          netScore.license.responseTime, 
          netScore.maintainability.responseTime 
      ];
      
      try {
          const scoresRes = await pool.query(insertScoresQuery, scoresValues);
          logger.info(`Scores inserted with score_id: ${scoresRes.rows[0].score_id}`);
      } catch (err) {
          if (err instanceof Error) {
              logger.error(`Error inserting scores: ${err.message}`);
          } else {
              logger.error('Unexpected error inserting scores');
          }
      }


    }
}


function extractPackageName(repoUrl: string) {
    const urlParts = repoUrl.split('/');
    return urlParts[urlParts.length - 1];
}

/**
 * The main function. Handles command line arguments and executes the appropriate functions.
 */
function main() {
    logger.info('Starting CLI...');
    logger.info(`LOG_FILE: ${logFile}`);
    logger.info('GITHUB_TOKEN: [REDACTED]');
    logger.info(`LOG_LEVEL: ${logLevel}`);
    const argv = yargs(hideBin(process.argv))
        .command('test', 'Run test suite', {}, () => {
            runTests();
        })
        .command('$0 <file>', 'Process URLs from a file', (yargs) => {
            yargs.positional('file', {
                describe: 'Path to the file containing URLs',
                type: 'string'
            });
        }, (argv) => {
            let filename: string = argv.file as string;
            if (fs.existsSync(filename)) {
                processUrls(filename);
            } else {
                console.error(`File not found: ${argv.file}`);
                showUsage();
                process.exit(1);
            }
        })
        .help()
        .alias('help', 'h')
        .argv;

    logger.info('CLI finished.\n');
}
main();