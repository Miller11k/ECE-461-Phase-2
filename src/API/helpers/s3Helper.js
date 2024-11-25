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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchZipFileContent = fetchZipFileContent;
exports.fetchZip = fetchZip;
exports.fetchPackage = fetchPackage;
exports.getS3Path = getS3Path;
exports.fetchReadmeMatches = fetchReadmeMatches;
exports.deleteAllS3BucketContents = deleteAllS3BucketContents;
exports.uploadUnzippedToS3 = uploadUnzippedToS3;
var aws_sdk_1 = require("aws-sdk");
var archiver_1 = require("archiver");
var unzipper_1 = require("unzipper");
var stream_1 = require("stream");
var S3 = aws_sdk_1.default.S3;
/**
 * Fetches the content of a zip file from an S3 bucket and returns it as a Base64 string.
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} fileKey - The key of the file in the S3 bucket.
 * @returns {Promise<string | null>} A promise that resolves to the Base64-encoded content of the file, or null if an error occurs.
 */
function fetchZipFileContent(bucketName, fileKey) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, response, base64Content, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws_sdk_1.default.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, s3
                            .getObject({
                            Bucket: bucketName,
                            Key: fileKey,
                        })
                            .promise()];
                case 2:
                    response = _a.sent();
                    // Check if Body exists
                    if (!response.Body) {
                        console.error("No content found in the file.");
                        return [2 /*return*/, null];
                    }
                    base64Content = response.Body.toString("base64");
                    return [2 /*return*/, base64Content];
                case 3:
                    error_1 = _a.sent();
                    console.error("An error occurred while fetching the file:", error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches the content of a zip file from a default S3 bucket (specified in the environment variables) and returns it as a Base64 string.
 * @param {string} fileKey - The key of the file in the S3 bucket.
 * @returns {Promise<string | null>} A promise that resolves to the Base64-encoded content of the file, or null if an error occurs.
 */
function fetchZip(fileKey) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, response, base64Content, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws_sdk_1.default.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, s3
                            .getObject({
                            Bucket: process.env.S3_BUCKET_NAME || "",
                            Key: fileKey,
                        })
                            .promise()];
                case 2:
                    response = _a.sent();
                    // Check if Body exists
                    if (!response.Body) {
                        console.error("No content found in the file.");
                        return [2 /*return*/, null];
                    }
                    base64Content = response.Body.toString("base64");
                    return [2 /*return*/, base64Content];
                case 3:
                    error_2 = _a.sent();
                    console.error("An error occurred while fetching the file:", error_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetches a folder from S3, zips its contents, and names the folder/zip file based on a convention or custom name.
 * @param s3Url - The S3 URL of the folder, e.g., s3://bucket-name/folder/key/
 * @param zipName - Optional name for the zip file and folder inside it, without the ".zip" extension.
 * @returns A promise that resolves to the Base64 string of the zipped content, or null if an error occurs.
 */
function fetchPackage(folder_path, zipName) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, parsed, bucketName, folderKey, segments, listResponse, archive, bufferStream, buffers_1, _i, _a, file, fileStream, zippedBuffer, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    s3 = new S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    parsed = parseS3Url(folder_path);
                    if (!parsed) {
                        return [2 /*return*/, null];
                    }
                    bucketName = parsed.bucketName, folderKey = parsed.folderKey;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    // Derive the default zip name if not provided
                    if (!zipName) {
                        segments = folderKey.split("/").filter(function (segment) { return segment; });
                        zipName = segments.join("-"); // Combine with "-" as separator
                    }
                    return [4 /*yield*/, s3
                            .listObjectsV2({
                            Bucket: bucketName,
                            Prefix: folderKey,
                        })
                            .promise()];
                case 2:
                    listResponse = _b.sent();
                    if (!listResponse.Contents || listResponse.Contents.length === 0) {
                        console.error("No files found in the specified folder.");
                        return [2 /*return*/, null];
                    }
                    archive = (0, archiver_1.default)("zip", { zlib: { level: 9 } });
                    bufferStream = new stream_1.default.PassThrough();
                    buffers_1 = [];
                    bufferStream.on("data", function (chunk) { return buffers_1.push(chunk); });
                    archive.pipe(bufferStream);
                    _i = 0, _a = listResponse.Contents;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    file = _a[_i];
                    if (!file.Key || file.Key.endsWith("/")) {
                        return [3 /*break*/, 5]; // Skip folders or invalid keys
                    }
                    return [4 /*yield*/, s3
                            .getObject({ Bucket: bucketName, Key: file.Key })
                            .createReadStream()];
                case 4:
                    fileStream = _b.sent();
                    // Add to the archive with a prefix folder named zipName
                    archive.append(fileStream, {
                        name: "".concat(zipName, "/").concat(file.Key.replace(folderKey, "")),
                    });
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: 
                // Finalize the archive
                return [4 /*yield*/, archive.finalize()];
                case 7:
                    // Finalize the archive
                    _b.sent();
                    zippedBuffer = Buffer.concat(buffers_1);
                    return [2 /*return*/, zippedBuffer.toString("base64")];
                case 8:
                    error_3 = _b.sent();
                    console.error("An error occurred while zipping the folder contents:", error_3);
                    return [2 /*return*/, null];
                case 9: return [2 /*return*/];
            }
        });
    });
}
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
    var parts = s3Url.slice(5).split("/");
    var bucketName = parts.shift(); // Extract the bucket name
    var folderKey = parts.join("/"); // Extract the folder key
    if (!bucketName || !folderKey) {
        console.error("Invalid S3 URL structure.");
        return null;
    }
    return { bucketName: bucketName, folderKey: folderKey.endsWith("/") ? folderKey : folderKey + "/" };
}
/**
 * Extracts the path from an S3 URL.
 * @param {string} s3Url - The S3 URL to process.
 * @returns {string | null} The extracted path from the S3 URL, or null if invalid.
 */
function getS3Path(s3Url) {
    if (!s3Url.startsWith("s3://")) {
        return null;
    }
    // Remove the "s3://<bucket-name>/" prefix
    var path = s3Url.split("/").slice(3).join("/");
    if (!path) {
        return null;
    }
    return path;
}
/**
 * Fetches a folder from S3, looks for a README file, applies a regex, and returns matches.
 * @param folderPath - The S3 folder path (e.g., s3://bucket-name/folder/key/).
 * @param regex - The regular expression to apply to the README content.
 * @returns A promise that resolves to an array of matches or null if there are errors or no matches.
 */
function fetchReadmeMatches(folderPath, regex) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, parsed, bucketName, folderKey, listResponse, readmeFile, response, content, matches, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    parsed = parseS3Url(folderPath);
                    if (!parsed) {
                        console.error("Invalid S3 folder path.");
                        return [2 /*return*/, null];
                    }
                    bucketName = parsed.bucketName, folderKey = parsed.folderKey;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, s3
                            .listObjectsV2({
                            Bucket: bucketName,
                            Prefix: folderKey,
                        })
                            .promise()];
                case 2:
                    listResponse = _a.sent();
                    if (!listResponse.Contents || listResponse.Contents.length === 0) {
                        console.error("No files found in the specified folder.");
                        return [2 /*return*/, null];
                    }
                    readmeFile = listResponse.Contents.find(function (file) { var _a; return (_a = file.Key) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("readme"); });
                    if (!readmeFile || !readmeFile.Key) {
                        console.error("README file not found in the folder.");
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, s3
                            .getObject({
                            Bucket: bucketName,
                            Key: readmeFile.Key,
                        })
                            .promise()];
                case 3:
                    response = _a.sent();
                    if (!response.Body) {
                        console.error("README file is empty or could not be read.");
                        return [2 /*return*/, null];
                    }
                    content = response.Body.toString("utf-8");
                    matches = __spreadArray([], content.matchAll(regex), true);
                    if (matches.length === 0) {
                        console.error("No matches found in the README file.");
                        return [2 /*return*/, null];
                    }
                    // Return an array of matches
                    return [2 /*return*/, matches.map(function (match) { return match[0]; })];
                case 4:
                    error_4 = _a.sent();
                    console.error("An error occurred while processing the README file:", error_4);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Deletes all files and folders in the specified S3 bucket.
 * @param bucketName - The name of the S3 bucket to clear.
 * @returns A promise that resolves to true if successful, or false if an error occurs.
 */
function deleteAllS3BucketContents(bucketName) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, continuationToken, listResponse, deleteParams, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws_sdk_1.default.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    continuationToken = void 0;
                    _a.label = 2;
                case 2: return [4 /*yield*/, s3
                        .listObjectsV2({
                        Bucket: bucketName,
                        ContinuationToken: continuationToken,
                    })
                        .promise()];
                case 3:
                    listResponse = _a.sent();
                    if (!(listResponse.Contents && listResponse.Contents.length > 0)) return [3 /*break*/, 5];
                    deleteParams = {
                        Bucket: bucketName,
                        Delete: {
                            Objects: listResponse.Contents.map(function (object) { return ({ Key: object.Key }); }),
                        },
                    };
                    // Delete the objects
                    return [4 /*yield*/, s3.deleteObjects(deleteParams).promise()];
                case 4:
                    // Delete the objects
                    _a.sent();
                    _a.label = 5;
                case 5:
                    // Update continuation token for paginated results
                    continuationToken = listResponse.NextContinuationToken;
                    _a.label = 6;
                case 6:
                    if (continuationToken) return [3 /*break*/, 2];
                    _a.label = 7;
                case 7: // Continue if there are more objects to delete
                return [2 /*return*/, true];
                case 8:
                    error_5 = _a.sent();
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Deletes all files in the specified folder in S3.
 * @param bucketName - The S3 bucket name.
 * @param folderKey - The folder path in the bucket.
 * @param s3 - The S3 client instance.
 */
function clearS3Folder(bucketName, folderKey, s3) {
    return __awaiter(this, void 0, void 0, function () {
        var listResponse, objectsToDelete, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, s3
                            .listObjectsV2({
                            Bucket: bucketName,
                            Prefix: folderKey,
                        })
                            .promise()];
                case 1:
                    listResponse = _a.sent();
                    if (!(listResponse.Contents && listResponse.Contents.length > 0)) return [3 /*break*/, 3];
                    objectsToDelete = listResponse.Contents.map(function (obj) { return ({ Key: obj.Key }); });
                    return [4 /*yield*/, s3
                            .deleteObjects({
                            Bucket: bucketName,
                            Delete: { Objects: objectsToDelete },
                        })
                            .promise()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_6 = _a.sent();
                    console.error("Failed to clear folder: s3://".concat(bucketName, "/").concat(folderKey), error_6);
                    throw error_6;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Unzips the contents of a Base64-encoded zip file and uploads them to a specified folder in S3.
 * If the folder already exists, its contents will be deleted first.
 * @param zipFileBase64 - The Base64-encoded string containing the zip file data.
 * @param bucketName - The S3 bucket name.
 * @param folderKey - The S3 folder path where the extracted files will be uploaded.
 * @returns A promise that resolves to true if successful, or false if an error occurs.
 */
function uploadUnzippedToS3(zipFileBase64, bucketName, folderKey) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, zipFileBuffer, zipStream_1, extractedFiles_1, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    // Clear the folder in S3 before uploading new files
                    return [4 /*yield*/, clearS3Folder(bucketName, folderKey, s3)];
                case 2:
                    // Clear the folder in S3 before uploading new files
                    _a.sent();
                    zipFileBuffer = Buffer.from(zipFileBase64, "base64");
                    zipStream_1 = new stream_1.default.PassThrough();
                    zipStream_1.end(zipFileBuffer);
                    extractedFiles_1 = [];
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            zipStream_1
                                .pipe(unzipper_1.default.Parse())
                                .on("entry", function (entry) {
                                var fileName = entry.path;
                                var fullKey = "".concat(folderKey).concat(fileName); // S3 key for the uploaded file
                                if (entry.type === "File") {
                                    // Upload each file to S3
                                    var uploadPromise = s3
                                        .upload({
                                        Bucket: bucketName,
                                        Key: fullKey,
                                        Body: entry,
                                    })
                                        .promise();
                                    extractedFiles_1.push(uploadPromise);
                                }
                                else {
                                    entry.autodrain(); // Skip directories
                                }
                            })
                                .on("close", function () { return resolve(); })
                                .on("error", function (err) { return reject(err); });
                        })];
                case 3:
                    _a.sent();
                    // Wait for all uploads to complete
                    return [4 /*yield*/, Promise.all(extractedFiles_1)];
                case 4:
                    // Wait for all uploads to complete
                    _a.sent();
                    return [2 /*return*/, true];
                case 5:
                    error_7 = _a.sent();
                    console.error("An error occurred while uploading unzipped contents to S3:", error_7);
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
