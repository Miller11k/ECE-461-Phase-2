// /* Handles `/package/{id}` (POST) */

import e, { Router } from 'express';
import {ListObjectsV2Command, S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Initialize the router
const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// // Utility to generate S3 keys
function getS3Key(packageName: string, version: string): string {
    return `${packageName}/${version}/`;
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
        console.error(`Error checking if package ${packageName} exists in S3:`, error);
        throw error;
    }
}


async function getAllVersionsFromS3(packageName: string): Promise<string[]> {
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
    } catch (error) {
      console.error(`[ERROR] Failed to fetch versions for package ${packageName}:`, error);
      throw error;
    }
  }

  async function isVersionNewer(packageName: string, currentVersion: string): Promise<boolean> {
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
      if (patch > latestPatch) latestPatch = patch;
    });
  
    console.log(`[DEBUG] Latest patch version found: ${latestPatch}`);
    return currentPatch > latestPatch;
  }
  
// Function to upload a new package version to S3
async function uploadNewVersionToS3(packageName: string, version :string, content:string) {
    const s3Key = getS3Key(packageName, version);
    const command = new PutObjectCommand({
        Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
        Key: s3Key,
        Body: content,
    });

    try {
        await s3Client.send(command);
        console.log(`Uploaded ${s3Key} to S3.`);
    } catch (error) {
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

        const { Name, Version } = metadata;
        const { Content } = data;
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

        const ispatchnewer = await isVersionNewer(Name,Version);

            if(ispatchnewer){

                try {
                    await uploadNewVersionToS3(Name, Version, Content);
                    res.status(200).json({
                        message: `Package ${Name} version ${Version} updated successfully.`,
                        metadata,
                        data,
                    });
                } catch (uploadError) {
                    console.error('Error uploading package to S3:', uploadError);
                    res.status(500).json({ error: 'Failed to upload package to S3.' });
                }
            }
            else{
                res.status(400).json({ error: 'Invalid metadata or data structure' });
                return;
            }

     
    } catch (error) {
        console.error(`[ERROR] Internal server error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
