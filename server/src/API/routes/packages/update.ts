import e, { Router } from 'express';
import {ListObjectsV2Command, S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { get_standalone_cost, get_total_cost } from '../../helpers/fileHelper.js';
import pkg from 'pg';
import { validate as isValidUUID } from 'uuid';
import { generatePackageID } from '../../helpers/packageIDHelper.js';
import { clearS3Folder, uploadUnzippedToS3 } from '../../helpers/s3Helper.js';
import { shouldLog } from '../../helpers/logHelper.js';
import { url } from 'inspector';
import {extractPackageJsonFromZip,cloneAndZipRepo, encodeFileToBase64} from '../../helpers/zipHelper.js';
import { getSemanticVersion } from '../../helpers/versionHelper.js';
import { extractGitHubUrl } from '../../helpers/urlHelper.js'
import { randomUUID } from 'crypto';
import fs from 'fs';
import { dependenciesDB, packageDB, packagesDBClient } from '../../config/dbConfig.js';
import { decodeAuthenticationToken } from '../../helpers/jwtHelper.js';
import AWS from 'aws-sdk';
import { get_all_costs } from '../../helpers/costHelper.js';


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

// Utility to generate S3 keys
function getS3Key(packageName: string, version: string): string {
    return `${packageName}/${version}/`;
}

function generateS3Link(packageName: string, version: string): string {
    const bucketName = process.env.S3_BUCKET_NAME; // Replace with your bucket name if needed
    return `s3://${bucketName}/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}/`;
}

// Function to check if a package exists in S3
async function doesPackageExistInS3(packageName: string) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
            Prefix: `${packageName}/`, // Ensure we check for the package folder
            MaxKeys: 1, // We only need to check if at least one object exists
        });

        const response = await s3Client.send(command);
        return !!(response.Contents && response.Contents.length > 0);
    } catch (error) {
        throw error;
    }
}

async function getAllVersionsFromS3(packageName: string): Promise<string[]> {
    try {
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
  
        return versions;
      }
  
      return [];
    } catch (error) {
      throw error;
    }
  }

async function isVersionNewer(packageName: string, currentVersion: string): Promise<boolean> {
  
    const versions = await getAllVersionsFromS3(packageName);
  
    if (versions.length === 0) {
      return true;
    }
  
    const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);
  
    // Find matching major.minor versions
    const matchingVersions = versions.filter((version) => {
      const [major, minor] = version.split('.').map(Number);
      return major === currentMajor && minor === currentMinor;
    });
  
    if (matchingVersions.length === 0) {
      return true;
    }
  
    // Find the latest patch version
    let latestPatch = 0;
    matchingVersions.forEach((version) => {
      const [, , patch] = version.split('.').map(Number);
      if (patch > latestPatch) latestPatch = patch;
    });
  
    return currentPatch > latestPatch;
  }
  
// Function to upload a new package version to S3
async function uploadNewVersionToS3(packageName: string, version :string, content:string) {
    const s3Key = getS3Key(packageName, version);
    const s3Bucket = process.env.S3_BUCKET_NAME|| (() => {
        throw new Error('PERMANENT_BUCKET environment variable is not set');
    })(); 

    try {
        const upload = await uploadUnzippedToS3(content, s3Bucket, s3Key);
    } catch (error) {
        throw error;
    }
}

router.put('/:id', async (req, res) => {
    let log_put_package_id = parseInt(process.env.LOG_PUT_PACKAGE_ID || '0', 10);
    let log_all = parseInt(process.env.LOG_ALL || '0', 10);
    let should_log = shouldLog(log_put_package_id, log_all);

    const { id } = req.params;

    if (should_log) console.log("[DEBUG] Received PUT request for package ID:", id);

    const { metadata, data } = req.body;

    // Validate Package ID format
    const packageIdPattern = /^[a-zA-Z0-9\-]+$/;
    if (!packageIdPattern.test(id)) {
        if (should_log) console.error("[ERROR] Invalid PackageID format:", id);
        res.status(400).json({
            error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.'
        });
        return;
    }

    if (!metadata || !metadata.ID) {
        if (should_log) console.error("[ERROR] Missing or invalid metadata field: ID");
        res.status(400).json({
            error: 'There is missing field(s) in the metadata.'
        });
        return;
    }

    // Check if the ID in the request body matches the ID in the route
    if (metadata.ID !== id) {
        if (should_log) console.error("[ERROR] Mismatch between package ID in URL and metadata body:", { urlId: id, bodyId: metadata.ID });
        res.status(400).json({
            error: 'Package ID in URL does not match the Package ID in the metadata body.'
        });
        return;
    }

    // Query the database to check if the ID exists
    try {
        const result = await packagesDBClient.query(
            `SELECT * FROM ${packageDB} WHERE "ID" = $1;`,
            [id]
        );

        if (result.rowCount === 0) {
            if (should_log) console.error("[ERROR] Package ID does not exist in the database:", id);
            res.status(404).json({
                error: 'Package does not exist.'
            });
            return;
        }
    } catch (error) {
        if (should_log) console.error("[ERROR] Error querying the database for package ID:", error);
        res.status(500).json({ error: 'Failed to validate PackageID.' });
        return;
    }

    // Authorization Validation
    const authHeader = req.headers['x-authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
        if (should_log) console.error("[ERROR] Missing or invalid X-Authorization header.");
        res.status(403).json({
            error: 'Authentication failed due to invalid or missing AuthenticationToken.'
        });
        return;
    }

    const token = authHeader.startsWith('bearer ')
        ? authHeader.slice('bearer '.length).trim()
        : authHeader.trim();

    try {
        const decodedJwt = await decodeAuthenticationToken(token);
        if (!decodedJwt) {
            if (should_log) console.error("[ERROR] JWT authentication failed for token:", token);
            res.status(403).json({
                error: 'Authentication failed due to invalid or missing AuthenticationToken.'
            });
            return;
        }
    } catch (error) {
        if (should_log) console.error("[ERROR] Authentication token verification failed:", error);
        res.status(403).json({
            error: 'Authentication failed due to invalid or missing AuthenticationToken.'
        });
        return;
    }

    if (!metadata.Name || !metadata.Version) {
        if (should_log) console.error("[ERROR] Missing or invalid metadata fields:", metadata);
        res.status(400).json({
            error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.'
        });
        return;
    }

    if (!data || (!data.Content && !data.URL)) {
        if (should_log) console.error("[ERROR] Either 'Content' or 'URL' must be provided in data.");
        res.status(400).json({
            error: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."
        });
        return;
    }

    if (data.Content && data.URL) {
        if (should_log) console.error("[ERROR] Both 'Content' and 'URL' cannot be provided together.");
        res.status(400).json({
            error: "There is missing field(s) in the PackageID or it is formed improperly, or is invalid."
        });
        return;
    }

    try {
        const packageName = metadata.Name;
        const packageVersion = metadata.Version;
        const bucketName = process.env.S3_BUCKET_NAME;

        if (!bucketName) {
            if (should_log) console.error("[ERROR] S3_BUCKET_NAME environment variable is not set.");
            res.status(500).json({
                error: 'Failed to update package.'
            });
            return;
        }

        const s3Key = `${packageName}/${packageVersion}/`;
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        if (should_log) console.log("[DEBUG] Clearing S3 folder for key:", s3Key);
        await clearS3Folder(bucketName, s3Key, s3);

        let content = '';
        if (data.Content) {
            content = data.Content;
        } else if (data.URL) {
            const tempZipPath = `/tmp/${id}-${Date.now()}.zip`;
            await cloneAndZipRepo(data.URL, tempZipPath);
            content = await encodeFileToBase64(tempZipPath);
            await fs.promises.unlink(tempZipPath);
        }

        if (should_log) console.log("[DEBUG] Uploading unzipped content to S3.");
        const uploadSuccess = await uploadUnzippedToS3(content, bucketName, s3Key);

        if (!uploadSuccess) {
            if (should_log) console.error("[ERROR] Failed to upload package content to S3.");
            res.status(500).json({ error: 'Failed to update package.' });
            return;
        }

        const s3Link = `s3://${bucketName}/${s3Key}`;
        const standaloneCost = parseFloat((await get_standalone_cost(content)).toFixed(2));
        const totalCost = parseFloat((await get_total_cost(content)).toFixed(2));

        // Update database with the new version
        if (should_log) console.log("[DEBUG] Updating database for package ID:", id);
        await packagesDBClient.query(
            `
            UPDATE ${packageDB}
            SET "Version" = $2, "Content" = $3, "standalone_cost" = $4, "total_cost" = $5
            WHERE "ID" = $1;
            `,
            [id, packageVersion, s3Link, standaloneCost, totalCost]
        );

        if (should_log) console.log("[DEBUG] Database updated successfully.");

        // Clear existing dependencies and insert new ones
        await packagesDBClient.query(
            `DELETE FROM ${dependenciesDB} WHERE "Package ID" = $1;`,
            [id]
        );

        const dependencyCosts = (await get_all_costs(content)).dependencyCosts;

        if (dependencyCosts && Object.keys(dependencyCosts).length > 0) {
            const insertDependenciesQuery = `
                INSERT INTO ${dependenciesDB} ("Package ID", "Dependency ID", "name", "standalone_cost", "total_cost")
                VALUES ($1, $2, $3, $4, $5);
            `;
            for (const [dependencyName, costs] of Object.entries(dependencyCosts)) {
                await packagesDBClient.query(insertDependenciesQuery, [
                    id,
                    randomUUID(),
                    dependencyName,
                    costs.standaloneCost,
                    costs.totalCost,
                ]);
            }
        }

        if (should_log) console.log("[DEBUG] Dependencies updated successfully.");

        res.status(200).json({
            metadata: {
                Name: packageName,
                Version: packageVersion,
                ID: id
            },
            data: {
                Content: content,
                URL: data.URL || null,
                debloat: data.debloat || false
            }
        });
    } catch (error) {
        if (should_log) console.error("[ERROR] Error updating package:", error);
        res.status(500).json({ error: 'Failed to update package.' });
    }
});

export default router;