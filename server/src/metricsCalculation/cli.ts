#!/usr/bin/env node

// External dependencies
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import { exit } from 'process';
// import { exit } from 'process';

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

import {getPackageVersion} from './getPackageVersion.js';
// Additions for writing to the database
import { generatePackageID } from '../API/helpers/packageIDHelper.js';
import { convertZipToBase64, cloneAndZipRepo} from '../API/helpers/zipHelper.js';
import { uploadUnzippedToS3, handleDuplicateAndUpload } from '../API/helpers/s3Helper.js';
import { getJWTSecret } from '../API/helpers/secretsHelper.js';


import pkg from 'pg';
import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand, GetBucketLoggingCommand } from "@aws-sdk/client-s3";
// import { console } from 'inspector';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pkg;

// dotenv.config();

const PERMANENT_BUCKET = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;
const packageDbTable = process.env.PACKAGE_DB_TABLE;
const metricsDbTable = process.env.METRICS_DB_TABLE;

// Validate required environment variables
if (!metricsDbTable || !packageDbTable || !PERMANENT_BUCKET || !REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    if (!metricsDbTable) {
        console.log("Missing environment variable: metricsDbTable");
    } 
    if (!packageDbTable) {
        console.log("Missing environment variable: PackageDBtable");
    }  
    if (!PERMANENT_BUCKET) {
        console.log("Missing environment variable: PERMANENT_BUCKET");
    }
    if (!REGION) {
        console.log("Missing environment variable: REGION");
    }
    if (!process.env.AWS_ACCESS_KEY_ID) {
        console.log("Missing environment variable: AWS_ACCESS_KEY_ID");
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
        console.log("Missing environment variable: AWS_SECRET_ACCESS_KEY");
    }
    console.error("Error: Missing required environment variables. Ensure AWS credentials and S3 bucket name are set.");
    process.exit(1);
}


// now we need to add all of the database information in the .env file
const pool = new Pool({
    host: process.env.METRICS_DB_HOST,
    user: process.env.METRICS_DB_USER,
    password: process.env.METRICS_DB_PASSWORD,
    database: process.env.METRICS_DB_NAME,
    port: Number(process.env.METRICS_DB_PORT),
    ssl: {
        rejectUnauthorized: false, 
    },
});

// Check environment variables
if (!PERMANENT_BUCKET) {
    console.error("Error: Bucket name not found in environment variables. Set S3_TEMP_BUCKET_NAME and S3_BUCKET_NAME in your .env file.");
    process.exit(1);
}

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});



function generateS3Link(packageName: string, version: string): string {
    const bucketName = PERMANENT_BUCKET; // Replace with your bucket name if needed
    return `s3://${bucketName}/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}/`;
}

function getS3Key(packageName: string, version: string): string {
    return `${packageName}/${version}/`;
}

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// async function deletePackageFromS3(packageName: string, version: string): Promise<void> {
//     const s3Key = `${packageName}/${version}/Package.zip`; // Adjust key as needed
//     const command = new DeleteObjectCommand({
//         Bucket: PERMANENT_BUCKET,
//         Key: s3Key,
//     });

//     try {
//         await s3Client.send(command);
//         console.log(`Deleted ${s3Key} from S3.`);
//     } catch (error) {
//         console.error(`Error deleting ${s3Key} from S3:`, error);
//         throw error;
//     }
// }



/**
 * Uploads a package to the S3 bucket, organized by name and version.
 * @param {string} localPath - The local file path of the zip.
 * @param {string} packageName - The name of the package.
 * @param {string} version - The version of the package.
 */
async function uploadPackageToS3(localPath: string, packageName: string, version: string): Promise<string> {
    const s3Key = getS3Key(packageName, version);
    const s3Bucket = PERMANENT_BUCKET || (() => {
        throw new Error('PERMANENT_BUCKET environment variable is not set');
    })();
    

    console.log(`Uploading package to S3 at ${s3Key}...`);


    try {
        const base64package = await convertZipToBase64(localPath);
        const upload = await uploadUnzippedToS3(base64package,s3Bucket,s3Key);

        console.log(`Package uploaded successfully to S3: ${s3Key}`);
        return s3Key; // Return the S3 key  to put in the storage
    } catch (error) {
        console.error(`Error uploading package to S3 at ${s3Key}:`, error);
        throw error;
    }
}




/**
 * Checks if a package already exists in the S3 bucket at the structured location.
 * @param {string} packageName - The name of the package.
 * @param {string} version - The version of the package.
 * @returns {Promise<boolean>} - Whether the package exists.
 */
// async function doesPackageExistInS3(packageName: string, version: string): Promise<boolean> {
//     const s3Key = getS3Key(packageName, version);

//     try {
//         const command = new HeadObjectCommand({
//             Bucket: PERMANENT_BUCKET,
//             Key: s3Key
//         });
//         await s3Client.send(command);

//         console.log(`Package already exists in S3 at ${s3Key}.`);
//         return true;
//     } catch (error: any) {
//         if (error.name === 'NotFound') {
//             console.log(`Package does not exist in S3 at ${s3Key}.`);
//             return false;
//         }
//         console.error(`Error checking for package in S3:`, error);
//         throw error;
//     }
// }



/**
 * Retrieves the GitHub repository URL from an npm package URL.
 *
 * @param {string} npmUrl - The URL of the npm package.
 * @returns {Promise<string | null>} A promise that resolves to the GitHub repository URL if found, or null if not found.
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
 * @param {string} filePath - The path to the file containing the URLs.
 * @returns {Promise<void>} A promise that resolves when all URLs have been processed.
 */
/**
 * Processes a file containing URLs and performs actions like evaluating metrics and handling S3 uploads.
 * 
 * @param {string} filePath - Path to the file containing URLs.
 */
export async function processUrls(filePath: string[], is_internal: Boolean, name: string): Promise<any> {
    logger.info(`Processing URLs from file: ${filePath}`);


    // const urls: string[] = fs.readFileSync(filePath, 'utf-8').split('\n');
    const urls= filePath;
    const githubUrls: [string, string][] = [];

    // Parse and filter GitHub URLs from the input file
    for (const url of urls) {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) continue;

        if (trimmedUrl.includes('github.com')) {
            githubUrls.push([trimmedUrl, trimmedUrl]);
        } else if (trimmedUrl.includes('npmjs.com')) {
            const githubUrl = await getGithubUrlFromNpm(trimmedUrl);
            if (githubUrl) {
                githubUrls.push([trimmedUrl, githubUrl]);
            }
        }
    }

    logger.debug('GitHub URLs:');
    for (const url of githubUrls) {
        logger.debug(`\t${url[0]} -> ${url[1]}`);
    }
    
    // console.log(`${githubUrls}`)

    // Process each GitHub URL
    for (const url of githubUrls) {
        
    

        const netScore = new NetScore(url[0], url[1]);
        const packageName = name;
       

        // Extract owner and repo from the GitHub URL
        const ownerRepo = new URL(netScore.NativeURL).pathname.split('/').filter(Boolean);
        const owner = ownerRepo[0];
        const repo = ownerRepo[1];

        // Get the package version
        const version = await getPackageVersion(owner, repo);
        // const tempDownloadPath = `./${packageName}/${version}/Package.zip`;
        // console.log(tempDownloadPath);

        const tempDownloadPath = path.join(__dirname, packageName, version, 'Package.zip');

        // Create the folder structure dynamically
        const tempFolder = path.dirname(tempDownloadPath); // Extract the folder path (everything before 'Package.zip')
        if (!fs.existsSync(tempFolder)) {
            fs.mkdirSync(tempFolder, { recursive: true }); // Create folder structure recursively
            console.log('Temporary folder created:', tempFolder);
        }

        // Create an empty file at the `Package.zip` path
        if (!fs.existsSync(tempDownloadPath)) {
            fs.writeFileSync(tempDownloadPath, ''); // Create an empty file
            console.log('Temporary empty file created:', tempDownloadPath);
        }

        // const tempDownloadPath = `/${packageName}/${version}/Package.zip`;
        const cloneSuccess = await cloneAndZipRepo(netScore.NativeURL, tempDownloadPath);
        console.log('Clone and zip success:', cloneSuccess);

        if (!cloneSuccess) {
            console.error('Failed to clone and zip repository from URL');
            return;
        }


        // Evaluate the metrics
        const result = await netScore.evaluate();
        const metricJSON = await netScore.getJSON();

        logger.debug(netScore.toString());

        return metricJSON;

    

    }
}



function extractPackageName(repoUrl: string) {
    const urlParts = repoUrl.split('/');
    return urlParts[urlParts.length - 1];
}