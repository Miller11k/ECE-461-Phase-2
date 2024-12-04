// /* Handles `/package/{id}` (POST) */
import { Router } from 'express';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import pkg from 'pg';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import { uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
const { Pool } = pkg;
// Initialize the router
const router = Router();
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const packageDbTable = process.env.PACKAGE_DB_TABLE;
const metricsDbTable = process.env.METRICS_DB_TABLE;
if (!packageDbTable) {
    console.log("Missing environment variable: PackageDBtable");
}
if (!metricsDbTable) {
    console.log("Missing environment variable: metricsDbTable");
}
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
// // Utility to generate S3 keys
function getS3Key(packageName, version) {
    return `${packageName}/${version}/`;
}
function generateS3Link(packageName, version) {
    const bucketName = process.env.S3_BUCKET_NAME; // Replace with your bucket name if needed
    return `s3://${bucketName}/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}/`;
}
// Function to check if a package exists in S3
async function doesPackageExistInS3(packageName) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
            Prefix: `${packageName}/`, // Ensure we check for the package folder
            MaxKeys: 1, // We only need to check if at least one object exists
        });
        const response = await s3Client.send(command);
        return !!(response.Contents && response.Contents.length > 0);
    }
    catch (error) {
        console.error(`Error checking if package ${packageName} exists in S3:`, error);
        throw error;
    }
}
async function getAllVersionsFromS3(packageName) {
    try {
        console.log(`[DEBUG] Fetching all versions for package: ${packageName}`);
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
            Prefix: `${packageName}/`,
        });
        const response = await s3Client.send(command);
        if (response.Contents && response.Contents.length > 0) {
            const versions = response.Contents.map((item) => {
                const key = item.Key || '';
                const parts = key.split('/');
                return parts[1]; // Assuming structure is "packageName/version/..."
            }).filter((version) => version); // Filter out empty or invalid versions
            console.log(`[DEBUG] Found versions for package ${packageName}:`, versions);
            return versions;
        }
        console.log(`[DEBUG] No versions found for package ${packageName}`);
        return [];
    }
    catch (error) {
        console.error(`[ERROR] Failed to fetch versions for package ${packageName}:`, error);
        throw error;
    }
}
async function isVersionNewer(packageName, currentVersion) {
    console.log(`[DEBUG] Checking if version ${currentVersion} is newer for package ${packageName}`);
    const versions = await getAllVersionsFromS3(packageName);
    if (versions.length === 0) {
        console.log(`[DEBUG] No existing versions found for package ${packageName}. Current version is considered newer.`);
        return true;
    }
    const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);
    // Find matching major.minor versions
    const matchingVersions = versions.filter((version) => {
        const [major, minor] = version.split('.').map(Number);
        return major === currentMajor && minor === currentMinor;
    });
    if (matchingVersions.length === 0) {
        console.log(`[DEBUG] No matching major.minor versions for ${currentVersion}.`);
        return true;
    }
    // Find the latest patch version
    let latestPatch = 0;
    matchingVersions.forEach((version) => {
        const [, , patch] = version.split('.').map(Number);
        if (patch > latestPatch)
            latestPatch = patch;
    });
    console.log(`[DEBUG] Latest patch version found: ${latestPatch}`);
    return currentPatch > latestPatch;
}
// Function to upload a new package version to S3
async function uploadNewVersionToS3(packageName, version, content) {
    const s3Key = getS3Key(packageName, version);
    const s3Bucket = process.env.S3_BUCKET_NAME || (() => {
        throw new Error('PERMANENT_BUCKET environment variable is not set');
    })();
    try {
        const upload = await uploadUnzippedToS3(content, s3Bucket, s3Key);
        console.log(`Uploaded ${s3Key} to S3.`);
    }
    catch (error) {
        console.error(`Error uploading package ${packageName} version ${version} to S3:`, error);
        throw error;
    }
}
// POST route to check if a package exists and optionally upload a new version
router.post('/:id', async (req, res) => {
    try {
        // Extract authorization header and validate
        const authHeader = req.headers['x-authorization'];
        if (!authHeader || typeof authHeader !== 'string') {
            res.status(403).json({ error: 'Missing or invalid X-Authorization header' });
            return;
        }
        // Extract package details from the request body
        const { metadata, data } = req.body;
        if (!metadata || !data) {
            res.status(400).json({ error: 'Missing required fields in the request body' });
            return;
        }
        const { Name, Version, ID } = metadata;
        const { Content } = data;
        const { URL } = data;
        console.log(URL);
        const { debloat } = data;
        if (!Name || !Version || !Content) {
            res.status(400).json({ error: 'Invalid metadata or data structure' });
            return;
        }
        console.log(`[DEBUG] Checking existence of package: ${Name}`);
        // Check if the package exists in S3
        const packageExists = await doesPackageExistInS3(Name);
        if (!packageExists) {
            res.status(404).json({ error: 'Package does not exist in S3' });
            return;
        }
        console.log(`[DEBUG] Package ${Name} exists. Proceeding with upload.`);
        const ispatchnewer = await isVersionNewer(Name, Version);
        if (ispatchnewer) {
            try {
                //updating S3
                await uploadNewVersionToS3(Name, Version, Content);
                res.status(200).json({
                    message: `Package ${Name} version ${Version} updated successfully.`,
                    metadata,
                    data,
                });
                //updating package rds
                const insertPackageQuery = `
                    INSERT INTO ${packageDbTable} (
                    "ID",
                    "Name",
                    "Version",
                    "Content",
                    repo_link,
                    is_internal,
                    debloat
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (repo_link, "Version")
                DO UPDATE SET 
                    "Content" = EXCLUDED."Content",
                    debloat = EXCLUDED.debloat;
        
                `;
                const packageId = generatePackageID(Name, Version);
                const S3link = generateS3Link(Name, Version);
                try {
                    const packageValues = [
                        packageId, // Unique package ID
                        Name, // Name of the package
                        Version, // Version of the package
                        S3link, // S3 bucket location
                        URL || "link", // Repo link
                        false, // is_internal flag  
                        debloat, // debloat
                    ];
                    await pool.query(insertPackageQuery, packageValues);
                    //update rds metrics
                    ;
                    const columnQuery = `
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = $1
                        AND column_name NOT IN ('metric_id', 'package_id');
                    `;
                    const columnRes = await pool.query(columnQuery, [metricsDbTable]);
                    const columns = columnRes.rows.map(row => row.column_name).join(', ');
                    if (!columns) {
                        console.error('No valid columns found in the table.');
                        return;
                    }
                    const query = `SELECT ${columns} FROM ${metricsDbTable} WHERE package_id = $1`;
                    const { rows } = await pool.query(query, [ID]);
                    // in case of error, should never occur
                    if (rows.length === 0) {
                        console.error(`No metrics found for package_id: ${ID}`);
                        return;
                    }
                    const oldMetrics = rows[0]; // Assuming one result
                    const metricsValues = [
                        packageId,
                        oldMetrics.rampup,
                        oldMetrics.busfactor,
                        oldMetrics.correctness,
                        oldMetrics.licensescore,
                        oldMetrics.responsivemaintainer,
                        oldMetrics.netscore,
                        oldMetrics.netscorelatency,
                        oldMetrics.rampuplatency,
                        oldMetrics.busfactorlatency,
                        oldMetrics.correctnesslatency,
                        oldMetrics.licensescorelatency,
                        oldMetrics.responsivemaintainerlatency,
                        oldMetrics.goodpinningpractice,
                        oldMetrics.goodpinningpracticelatency,
                        oldMetrics.pullrequest,
                        oldMetrics.pullrequestlatency,
                    ];
                    const insertMetricsQuery = `
                    INSERT INTO ${metricsDbTable} (
                        package_id, rampup, busfactor, correctness, licensescore, responsivemaintainer, netscore, netscorelatency, 
                        rampuplatency, busfactorlatency, correctnesslatency, licensescorelatency, responsivemaintainerlatency, 
                        goodpinningpractice, goodpinningpracticelatency, pullrequest, pullrequestlatency
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (package_id) 
                    DO UPDATE SET 
                        rampup = EXCLUDED.rampup,
                        busfactor = EXCLUDED.busfactor,
                        correctness = EXCLUDED.correctness,
                        licensescore = EXCLUDED.licensescore,
                        responsivemaintainer = EXCLUDED.responsivemaintainer,
                        netscore = EXCLUDED.netscore,
                        netscorelatency=EXCLUDED.netscorelatency,
                        rampuplatency = EXCLUDED.rampuplatency,
                        busfactorlatency = EXCLUDED.busfactorlatency,
                        correctnesslatency = EXCLUDED.correctnesslatency,
                        licensescorelatency = EXCLUDED.licensescorelatency,
                        responsivemaintainerlatency = EXCLUDED.responsivemaintainerlatency,
                        goodpinningpractice = EXCLUDED.goodpinningpractice,
                        goodpinningpracticelatency = EXCLUDED.goodpinningpracticelatency,
                        pullrequest = EXCLUDED.pullrequest,
                        pullrequestlatency = EXCLUDED.pullrequestlatency
                    RETURNING metric_id;
                    `;
                    try {
                        const metricsRes = await pool.query(insertMetricsQuery, metricsValues);
                        console.log(`Metrics inserted with metric_id: ${metricsRes.rows[0].metric_id}`);
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            console.log(`Error inserting metrics: ${err.message}`);
                        }
                        else {
                            console.log('Unexpected error inserting metrics');
                        }
                    }
                }
                catch (err) {
                    if (err instanceof Error) {
                        console.log(`Error inserting or updating package: ${err.message}`);
                    }
                    else {
                        console.log('Unexpected error inserting or updating package');
                    }
                }
            }
            catch (uploadError) {
                console.error('Error uploading package to S3:', uploadError);
                res.status(500).json({ error: 'Failed to upload package to S3.' });
            }
        }
        else {
            res.status(400).json({ error: 'Invalid metadata or data structure' });
            return;
        }
    }
    catch (error) {
        console.error(`[ERROR] Internal server error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;
