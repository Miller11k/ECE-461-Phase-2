"use strict";
/* Handles `/package/{id}` (POST) */
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
var express_1 = require("express");
var client_s3_1 = require("@aws-sdk/client-s3");
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
var s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.IAM_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
function getS3Key(packageName, version) {
    return "".concat(packageName, "/").concat(version, "/Package.zip");
}
function doesPackageExistInS3(packageName) {
    return __awaiter(this, void 0, void 0, function () {
        var command, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    command = new client_s3_1.ListObjectsV2Command({
                        Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
                        Prefix: "".concat(packageName, "/"), // Prefix ensures we check for the package folder
                        MaxKeys: 1, // We only need to check if at least one object exists
                    });
                    return [4 /*yield*/, s3Client.send(command)];
                case 1:
                    response = _a.sent();
                    // Check if there are any objects under the given prefix
                    return [2 /*return*/, !!(response.Contents && response.Contents.length > 0)];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error checking if package ".concat(packageName, " exists in S3:"), error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function uploadNewVersionToS3(packageName, version, content) {
    return __awaiter(this, void 0, void 0, function () {
        var s3Key, command;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3Key = getS3Key(packageName, version);
                    command = new client_s3_1.PutObjectCommand({
                        Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
                        Key: s3Key,
                        Body: content,
                    });
                    return [4 /*yield*/, s3Client.send(command)];
                case 1:
                    _a.sent();
                    console.log("Uploaded ".concat(s3Key, " to S3."));
                    return [2 /*return*/];
            }
        });
    });
}
// ive left this function here in case i actually need to check if its greater or not, but given how an s3 bucket works
//i did not see a need to add that functionality
function getAllVersionsFromS3(packageName) {
    return __awaiter(this, void 0, void 0, function () {
        var command, response, versions, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    command = new client_s3_1.ListObjectsV2Command({
                        Bucket: process.env.S3_PERMANENT_BUCKET_NAME,
                        Prefix: "".concat(packageName, "/"), // Prefix ensures we get all objects under the package
                    });
                    return [4 /*yield*/, s3Client.send(command)];
                case 1:
                    response = _a.sent();
                    if (response.Contents && response.Contents.length > 0) {
                        versions = response.Contents.map(function (item) {
                            var key = item.Key || '';
                            var parts = key.split('/');
                            return parts[1]; // Assuming the key structure is "packageName/version/Package.zip"
                        }).filter(function (version) { return version; });
                        return [2 /*return*/, versions];
                    }
                    return [2 /*return*/, []]; // No versions found
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching versions for package ".concat(packageName, ":"), error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function isVersionNewer(packageName, currentVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var versions, _a, currentMajor, currentMinor, currentPatch, matchingVersions, latestPatch, _i, matchingVersions_1, version, _b, patch;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getAllVersionsFromS3(packageName)];
                case 1:
                    versions = _c.sent();
                    if (versions.length === 0) {
                        // No versions in S3; the current version is newer by default
                        return [2 /*return*/, true];
                    }
                    _a = currentVersion.split('.').map(Number), currentMajor = _a[0], currentMinor = _a[1], currentPatch = _a[2];
                    matchingVersions = versions.filter(function (version) {
                        var _a = version.split('.').map(Number), major = _a[0], minor = _a[1];
                        return major === currentMajor && minor === currentMinor;
                    });
                    if (matchingVersions.length === 0) {
                        // No matching major.minor versions; return false
                        return [2 /*return*/, false];
                    }
                    latestPatch = 0;
                    // Loop through the matching versions to find the latest patch version
                    for (_i = 0, matchingVersions_1 = matchingVersions; _i < matchingVersions_1.length; _i++) {
                        version = matchingVersions_1[_i];
                        _b = version.split('.').map(Number), patch = _b[2];
                        if (patch > latestPatch) {
                            latestPatch = patch;
                        }
                    }
                    return [2 /*return*/, currentPatch > latestPatch];
            }
        });
    });
}
router.post('/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, packageId, _a, metadata, data, Name, Version, URL_1, Content, package_exists, ispatchnewer, uploadError_1, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                authHeader = req.headers['x-authorization'];
                packageId = req.params.id;
                // Validate the X-Authorization header
                if (!authHeader || typeof authHeader !== 'string') {
                    res.status(403).json({ error: "Missing or invalid X-Authorization header" });
                    return [2 /*return*/];
                }
                _a = req.body, metadata = _a.metadata, data = _a.data;
                if (!metadata || !data) {
                    res.status(400).json({ error: "Missing required fields in the request body" });
                    return [2 /*return*/];
                }
                Name = metadata.Name, Version = metadata.Version;
                URL_1 = data.URL, Content = data.Content;
                if (!Name || !Version || !URL_1 || !Content) {
                    res.status(400).json({ error: 'Invalid metadata or data structure' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, doesPackageExistInS3(Name)];
            case 1:
                package_exists = _b.sent();
                if (!package_exists) {
                    res.status(404).json({ error: "This Package does not exist" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, isVersionNewer(Name, Version)];
            case 2:
                ispatchnewer = _b.sent();
                if (!ispatchnewer) return [3 /*break*/, 7];
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, uploadNewVersionToS3(Name, Version, Content)];
            case 4:
                _b.sent();
                res.status(200).json({
                    message: "Package ".concat(Name, " version ").concat(Version, " updated successfully."),
                    metadata: metadata,
                    data: data,
                });
                return [3 /*break*/, 6];
            case 5:
                uploadError_1 = _b.sent();
                console.error('Error uploading package to S3:', uploadError_1);
                res.status(500).json({ error: 'Failed to upload package to S3.' });
                return [3 /*break*/, 6];
            case 6: return [3 /*break*/, 8];
            case 7:
                res.status(400).json({ error: 'Invalid metadata or data structure' });
                return [2 /*return*/];
            case 8: return [3 /*break*/, 10];
            case 9:
                error_3 = _b.sent();
                res.status(500).json({ error: "Internal server error" });
                return [2 /*return*/];
            case 10: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
