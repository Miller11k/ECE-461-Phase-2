import AWS from "aws-sdk";
const { S3 } = AWS;
export async function fetchZipFileContent(bucketName, fileKey) {
    // Create an S3 client without a session token
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    try {
        // Fetch the object from S3
        const response = await s3
            .getObject({
            Bucket: bucketName,
            Key: fileKey,
        })
            .promise();
        // Check if Body exists
        if (!response.Body) {
            console.error("No content found in the file.");
            return null;
        }
        // Convert the file content to a Base64 string
        const base64Content = response.Body.toString("base64");
        return base64Content;
    }
    catch (error) {
        console.error("An error occurred while fetching the file:", error);
        return null;
    }
}
export async function fetchPackage(fileKey) {
    // Create an S3 client without a session token
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    try {
        // Fetch the object from S3
        const response = await s3
            .getObject({
            Bucket: process.env.S3_BUCKET_NAME || "",
            Key: fileKey,
        })
            .promise();
        // Check if Body exists
        if (!response.Body) {
            console.error("No content found in the file.");
            return null;
        }
        // Convert the file content to a Base64 string
        const base64Content = response.Body.toString("base64");
        return base64Content;
    }
    catch (error) {
        console.error("An error occurred while fetching the file:", error);
        return null;
    }
}
export function getS3Path(s3Url) {
    if (!s3Url.startsWith("s3://")) {
        return null;
    }
    // Remove the "s3://<bucket-name>/" prefix
    const path = s3Url.split("/").slice(3).join("/");
    if (!path) {
        return null;
    }
    return path;
}
/**
 * Deletes all files and folders in the specified S3 bucket.
 * @param bucketName - The name of the S3 bucket to clear.
 * @returns A promise that resolves to true if successful, or false if an error occurs.
 */
export async function deleteAllS3BucketContents(bucketName) {
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    try {
        let continuationToken;
        do {
            // List objects in the bucket
            const listResponse = await s3
                .listObjectsV2({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            })
                .promise();
            if (listResponse.Contents && listResponse.Contents.length > 0) {
                // Prepare objects for deletion
                const deleteParams = {
                    Bucket: bucketName,
                    Delete: {
                        Objects: listResponse.Contents.map((object) => ({ Key: object.Key })),
                    },
                };
                // Delete the objects
                await s3.deleteObjects(deleteParams).promise();
                console.log(`Deleted ${deleteParams.Delete.Objects.length} objects.`);
            }
            // Update continuation token for paginated results
            continuationToken = listResponse.NextContinuationToken;
        } while (continuationToken); // Continue if there are more objects to delete
        return true;
    }
    catch (error) {
        return false;
    }
}
