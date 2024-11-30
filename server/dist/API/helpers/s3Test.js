import AWS from "aws-sdk";
import archiver from "archiver";
import stream from "stream";
const { S3 } = AWS;
/**
 * Parses an S3 URL and extracts the bucket name and folder key.
 * @param s3Url - The S3 URL to parse, e.g., s3://bucket-name/folder/key/
 * @returns An object containing the bucketName and folderKey, or null if invalid.
 */
function parseS3Url(s3Url) {
    if (!s3Url.startsWith("s3://")) {
        console.error("Invalid S3 URL format.");
        return null;
    }
    const parts = s3Url.slice(5).split("/");
    const bucketName = parts.shift(); // Extract the bucket name
    const folderKey = parts.join("/"); // Extract the folder key
    if (!bucketName || !folderKey) {
        console.error("Invalid S3 URL structure.");
        return null;
    }
    return { bucketName, folderKey: folderKey.endsWith("/") ? folderKey : folderKey + "/" };
}
/**
 * Fetches a folder from S3, zips its contents, and names the folder/zip file based on a convention or custom name.
 * @param s3Url - The S3 URL of the folder, e.g., s3://bucket-name/folder/key/
 * @param zipName - Optional name for the zip file and folder inside it, without the ".zip" extension.
 * @returns A promise that resolves to the Base64 string of the zipped content, or null if an error occurs.
 */
export async function fetchPackage(s3Url, zipName) {
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    // Parse the S3 URL
    const parsed = parseS3Url(s3Url);
    if (!parsed) {
        return null;
    }
    const { bucketName, folderKey } = parsed;
    try {
        // Derive the default zip name if not provided
        if (!zipName) {
            const segments = folderKey.split("/").filter((segment) => segment); // Remove empty parts
            zipName = segments.join("-"); // Combine with "-" as separator
        }
        // List objects in the specified folder
        const listResponse = await s3
            .listObjectsV2({
            Bucket: bucketName,
            Prefix: folderKey,
        })
            .promise();
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            console.error("No files found in the specified folder.");
            return null;
        }
        // Create a zip archive
        const archive = archiver("zip", { zlib: { level: 9 } });
        const bufferStream = new stream.PassThrough();
        const buffers = [];
        bufferStream.on("data", (chunk) => buffers.push(chunk));
        archive.pipe(bufferStream);
        // Add each file to the archive inside a folder named after zipName
        for (const file of listResponse.Contents) {
            if (!file.Key || file.Key.endsWith("/")) {
                continue; // Skip folders or invalid keys
            }
            const fileStream = await s3
                .getObject({ Bucket: bucketName, Key: file.Key })
                .createReadStream();
            // Add to the archive with a prefix folder named zipName
            archive.append(fileStream, {
                name: `${zipName}/${file.Key.replace(folderKey, "")}`,
            });
        }
        // Finalize the archive
        await archive.finalize();
        // Convert the zipped data to Base64
        const zippedBuffer = Buffer.concat(buffers);
        console.log(`Created zip file: ${zipName}.zip`);
        return zippedBuffer.toString("base64");
    }
    catch (error) {
        console.error("An error occurred while zipping the folder contents:", error);
        return null;
    }
}
(async () => {
    const s3Url = "s3://ece461g1packages/Lodash/4.17.21/";
    // const customZipName = "Custom-Lodash-Zip"; // Optional
    const zippedContent = await fetchPackage(s3Url);
    if (zippedContent) {
        console.log("Zipped content (Base64):", zippedContent);
    }
    else {
        console.error("Failed to fetch zipped content.");
    }
})();
