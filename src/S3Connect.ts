import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';


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
    sessionToken: process.env.AWS_SESSION_TOKEN, // Add this line to include the session token
    region: process.env.AWS_REGION,
});

// Create S3 client
const s3 = new AWS.S3();

// Function to upload a file
<<<<<<< HEAD
const uploadFile = async (filePath) => {
=======
export const uploadFile = async (filePath: string): Promise<void> => {  // specified type of input
>>>>>>> 4d36e7f (cli_to_RDS)
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File at path "${filePath}" does not exist.`);
            return;
        }

        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);

        const params = {
<<<<<<< HEAD
            Bucket: bucketName,
=======
            Bucket: bucketName as string, // Cast as string to satisfy types
>>>>>>> 4d36e7f (cli_to_RDS)
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
const downloadFile = async (fileName, downloadPath) => {
    const params = {
        Bucket: bucketName,
=======
const downloadFile = async (fileName: string, downloadPath: string): Promise<void> => {  // specified input type
    const params = {
        Bucket: bucketName as string, // Cast as string to satisfy types
>>>>>>> 4d36e7f (cli_to_RDS)
        Key: fileName,
    };

    try {
        const data = await s3.getObject(params).promise();
<<<<<<< HEAD
        fs.writeFileSync(downloadPath, data.Body);
=======
        fs.writeFileSync(downloadPath, data.Body as Buffer);
>>>>>>> 4d36e7f (cli_to_RDS)
        console.log(`File downloaded successfully to ${downloadPath}`);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

// Function to delete a file
<<<<<<< HEAD
const deleteFile = async (fileName) => {
    const params = {
        Bucket: bucketName,
=======
const deleteFile = async (fileName: string): Promise<void> => {  // Specify 'fileName' type as 'string'
    const params = {
        Bucket: bucketName as string, // Cast as string to satisfy types
>>>>>>> 4d36e7f (cli_to_RDS)
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
    await uploadFile('./README.md'); // Replace with the correct file path
    await downloadFile('README.md', './Success.md'); // Replace with the desired download path
    await deleteFile('README.md'); // Replace with the correct file name to delete
<<<<<<< HEAD
})();
=======
})();
>>>>>>> 4d36e7f (cli_to_RDS)
