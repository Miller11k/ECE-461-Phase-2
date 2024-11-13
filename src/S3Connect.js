"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
require('dotenv').config(); // Load environment variables from .env file
var AWS = require("aws-sdk"); // Use named import for aws-sdk
var fs = require("fs"); // Use named import for fs
var path = require("path"); // Use named import for path
// Load environment variables from the environment
var bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName) {
    console.error("Error: Bucket name not found in environment variables. Please set S3_BUCKET_NAME in your .env file.");
    process.exit(1); // Exit the script if bucket name is missing
}
// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.AWS_REGION,
});
// Create S3 client
var s3 = new AWS.S3();
// Function to upload a file
var uploadFile = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var fileStream, fileName, params, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!fs.existsSync(filePath)) {
                    console.error("Error: File at path \"".concat(filePath, "\" does not exist."));
                    return [2 /*return*/];
                }
                fileStream = fs.createReadStream(filePath);
                fileName = path.basename(filePath);
                params = {
                    Bucket: bucketName, // Cast as string to satisfy types
                    Key: fileName,
                    Body: fileStream,
                };
                return [4 /*yield*/, s3.upload(params).promise()];
            case 1:
                data = _a.sent();
                console.log("File uploaded successfully. ".concat(data.Location));
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error uploading file:', error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.uploadFile = uploadFile;
// Function to download a file
var downloadFile = function (fileName, downloadPath) { return __awaiter(void 0, void 0, void 0, function () {
    var params, data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = {
                    Bucket: bucketName, // Cast as string to satisfy types
                    Key: fileName,
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, s3.getObject(params).promise()];
            case 2:
                data = _a.sent();
                fs.writeFileSync(downloadPath, data.Body);
                console.log("File downloaded successfully to ".concat(downloadPath));
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('Error downloading file:', error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Function to delete a file
var deleteFile = function (fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var params, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                params = {
                    Bucket: bucketName, // Cast as string to satisfy types
                    Key: fileName,
                };
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, s3.deleteObject(params).promise()];
            case 2:
                _a.sent();
                console.log("File \"".concat(fileName, "\" deleted successfully."));
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Error deleting file:', error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Usage example
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.uploadFile)('./tmp/cloudinary_npm.zip')];
            case 1:
                _a.sent(); // Replace with the correct file path
                return [2 /*return*/];
        }
    });
}); })();
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
