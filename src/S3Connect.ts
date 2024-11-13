<<<<<<< HEAD
require('dotenv').config();  // Load environment variables from .env file
import * as AWS from 'aws-sdk';  // Use named import for aws-sdk
import * as fs from 'fs';        // Use named import for fs
import * as path from 'path';    // Use named import for path
=======
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e

// Load environment variables from the environment
const bucketName = process.env.S3_BUCKET_NAME;

if (!bucketName) {
    console.error("Error: Bucket name not found in environment variables. Please set S3_BUCKET_NAME in your .env file.");
    process.exit(1); // Exit the script if bucket name is missing
}

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
<<<<<<< HEAD
    sessionToken: process.env.AWS_SESSION_TOKEN,
=======
    sessionToken: process.env.AWS_SESSION_TOKEN, // Add this line to include the session token
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e
    region: process.env.AWS_REGION,
});

// Create S3 client
const s3 = new AWS.S3();

// Function to upload a file
<<<<<<< HEAD
export const uploadFile = async (filePath: string): Promise<void> => {
=======
export const uploadFile = async (filePath: string): Promise<void> => {  // specified type of input
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File at path "${filePath}" does not exist.`);
            return;
        }

        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);

        const params = {
            Bucket: bucketName as string, // Cast as string to satisfy types
            Key: fileName,
            Body: fileStream,
        };

        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${data.Location}`);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};

// Function to download a file
<<<<<<< HEAD
const downloadFile = async (fileName: string, downloadPath: string): Promise<void> => {
=======
const downloadFile = async (fileName: string, downloadPath: string): Promise<void> => {  // specified input type
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e
    const params = {
        Bucket: bucketName as string, // Cast as string to satisfy types
        Key: fileName,
    };

    try {
        const data = await s3.getObject(params).promise();
        fs.writeFileSync(downloadPath, data.Body as Buffer);
        console.log(`File downloaded successfully to ${downloadPath}`);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

// Function to delete a file
<<<<<<< HEAD
const deleteFile = async (fileName: string): Promise<void> => {
=======
const deleteFile = async (fileName: string): Promise<void> => {  // Specify 'fileName' type as 'string'
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e
    const params = {
        Bucket: bucketName as string, // Cast as string to satisfy types
        Key: fileName,
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`File "${fileName}" deleted successfully.`);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

// Usage example
(async () => {
<<<<<<< HEAD
    await uploadFile('./tmp/cloudinary_npm.zip'); // Replace with the correct file path
    // Uncomment if needed
    // await downloadFile('README.md', './Success.md');
    // await deleteFile('README.md');
})();



// import AWS from 'aws-sdk';
// import fs from 'fs';
// import path from 'path';
// import dotenv from 'dotenv';

// dotenv.config();

// // Load environment variables
// const TEMP_BUCKET = process.env.S3_TEMP_BUCKET_NAME;
// const PERMANENT_BUCKET = process.env.S3_PERMANENT_BUCKET_NAME;
// const REGION = process.env.AWS_REGION;
// const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
// const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
// const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

// // Check environment variables
// if (!TEMP_BUCKET || !PERMANENT_BUCKET) {
//     console.error("Error: Bucket names not found in environment variables. Set S3_TEMP_BUCKET_NAME and S3_PERMANENT_BUCKET_NAME in your .env file.");
//     process.exit(1);
// }

// // Configure AWS SDK
// AWS.config.update({
//     accessKeyId: ACCESS_KEY,
//     secretAccessKey: SECRET_KEY,
//     sessionToken: SESSION_TOKEN,
//     region: REGION,
// });

// const s3 = new AWS.S3();

// // Function to download a file from S3
// const downloadFile = async (bucketName: string, fileName: string, downloadPath: string): Promise<void> => {
//     try {
//         const params = { Bucket: bucketName, Key: fileName };
//         const data = await s3.getObject(params).promise();
//         fs.writeFileSync(downloadPath, data.Body as Buffer);
//         console.log(`File downloaded successfully to ${downloadPath}`);
//     } catch (error) {
//         console.error(`Error downloading file from ${bucketName}:`, error);
//         throw error; // Propagate error
//     }
// };

// // Function to upload a file to S3
// const uploadFile = async (bucketName: string, filePath: string, fileName: string): Promise<void> => {
//     try {
//         const fileStream = fs.createReadStream(filePath);
//         const params = { Bucket: bucketName, Key: fileName, Body: fileStream };
//         await s3.upload(params).promise();
//         console.log(`File uploaded successfully to ${bucketName}`);
//     } catch (error) {
//         console.error(`Error uploading file to ${bucketName}:`, error);
//         throw error;
//     }
// };

// // Function to delete a file from S3
// const deleteFile = async (bucketName: string, fileName: string): Promise<void> => {
//     try {
//         const params = { Bucket: bucketName, Key: fileName };
//         await s3.deleteObject(params).promise();
//         console.log(`File "${fileName}" deleted successfully from ${bucketName}.`);
//     } catch (error) {
//         console.error(`Error deleting file from ${bucketName}:`, error);
//         throw error;
//     }
// };

// // Main function to move a file from temp to permanent bucket
// const moveFileToPermanentBucket = async (fileName: string) => {
//     const tempFilePath = path.join("/tmp", fileName); // Local temporary file path for EC2

//     try {
//         // Step 1: Download from temporary bucket
//         console.log(`Downloading ${fileName} from ${TEMP_BUCKET}...`);
//         await downloadFile(TEMP_BUCKET, fileName, tempFilePath);

//         // Step 2: Upload to permanent bucket
//         console.log(`Uploading ${fileName} to ${PERMANENT_BUCKET}...`);
//         await uploadFile(PERMANENT_BUCKET, tempFilePath, fileName);

//         // Step 3: Delete from temporary bucket
//         console.log(`Deleting ${fileName} from ${TEMP_BUCKET}...`);
//         await deleteFile(TEMP_BUCKET, fileName);
//     } catch (error) {
//         console.error("Error in moving file:", error);
//     } finally {
//         // Step 4: Clean up local temporary file
//         if (fs.existsSync(tempFilePath)) {
//             fs.unlinkSync(tempFilePath);
//             console.log(`Local temporary file ${tempFilePath} deleted.`);
//         }
//     }
// };

// // Usage example (replace 'your-file-name.ext' with the actual file name)
// moveFileToPermanentBucket("your-file-name.ext").catch(console.error);
=======
    await uploadFile('./README.md'); // Replace with the correct file path
    await downloadFile('README.md', './Success.md'); // Replace with the desired download path
    await deleteFile('README.md'); // Replace with the correct file name to delete
})();
>>>>>>> cd3371910538f8b160c4c2c24e29b08c2715095e
