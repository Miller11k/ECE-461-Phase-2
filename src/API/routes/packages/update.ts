/* Handles `/package/{id}` (POST) */

import e, { Router } from 'express';
import {ListObjectsV2Command, S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// Create a new router instance to define and group related routes
const router = Router();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.IAM_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

function getS3Key(packageName: string, version: string): string {
    return `${packageName}/${version}/Package.zip`;
}

async function doesPackageExistInS3(packageName: string): Promise<boolean> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
            Prefix: `${packageName}/`, // Prefix ensures we check for the package folder
            MaxKeys: 1, // We only need to check if at least one object exists
        });

        const response = await s3Client.send(command);

        // Check if there are any objects under the given prefix
        return !!(response.Contents && response.Contents.length > 0);
    } catch (error) {
        console.error(`Error checking if package ${packageName} exists in S3:`, error);
        throw error;
    }
}

async function uploadNewVersionToS3(packageName: string, version: string, content: string): Promise<void> {
    const s3Key = getS3Key(packageName, version);
    const command = new PutObjectCommand({
        Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
        Key: s3Key,
        Body: content,
    });

    await s3Client.send(command);
    console.log(`Uploaded ${s3Key} to S3.`);
}



// ive left this function here in case i actually need to check if its greater or not, but given how an s3 bucket works
//i did not see a need to add that functionality
async function getAllVersionsFromS3(packageName: string): Promise<string[]> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
            Prefix: `${packageName}/`, // Prefix ensures we get all objects under the package
        });

        const response = await s3Client.send(command);

        if (response.Contents && response.Contents.length > 0) {
            // Extract and return the versions from the keys
            const versions = response.Contents.map((item) => {
                const key = item.Key || '';
                const parts = key.split('/');
                return parts[1]; // Assuming the key structure is "packageName/version/Package.zip"
            }).filter((version) => version); // Filter out empty versions

            return versions;
        }

        return []; // No versions found
    } catch (error) {
        console.error(`Error fetching versions for package ${packageName}:`, error);
        throw error;
    }
}

async function isVersionNewer(packageName: string, currentVersion: string): Promise<boolean> {
    const versions = await getAllVersionsFromS3(packageName);

    if (versions.length === 0) {
        // No versions in S3; the current version is newer by default
        return true;
    }

    const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);

    // Loop through the versions to find the latest one
    const matchingVersions = versions.filter((version) => {
        const [major, minor] = version.split('.').map(Number);
        return major === currentMajor && minor === currentMinor;
    });

    if (matchingVersions.length === 0) {
        // No matching major.minor versions; return false
        return false;
    }

    let latestPatch = 0; // Default to a very old patch version for comparison

    // Loop through the matching versions to find the latest patch version
    for (const version of matchingVersions) {
        const [, , patch] = version.split('.').map(Number);
        if (patch > latestPatch) {
            latestPatch = patch;
        }
    }


    
    return currentPatch > latestPatch;
}


router.post('/:id', async (req, res) => { //made async
    try {
        // Extract the X-Authorization header
        const authHeader = req.headers['x-authorization'];
        const packageId = req.params.id;


        // Validate the X-Authorization header
        if (!authHeader || typeof authHeader !== 'string') {
           res.status(403).json({ error: "Missing or invalid X-Authorization header" });
           return;
        }

        const { metadata, data } = req.body;
        if (!metadata || !data) {
            res.status(400).json({ error: "Missing required fields in the request body" });
            return;
        }

        //getting data
        const {Name,Version} = metadata;
        const {URL,Content} = data;

        if (!Name || !Version || !URL || !Content) {
            res.status(400).json({ error: 'Invalid metadata or data structure' });
            return;
        }

        const package_exists = await doesPackageExistInS3(Name);

        if(!package_exists){
            res.status(404).json({ error: "This Package does not exist" });
            return;
        }

    

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
        res.status(500).json({ error: "Internal server error" });
        return;
    }
});

export default router;