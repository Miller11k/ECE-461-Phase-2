"use strict";
/**
 * Handles the `/package/{id}` endpoint (GET).
 * This route fetches metadata and content of a package by its ID, ensuring user authentication.
 *
 * @module routes/package
 */
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
var dbConfig_js_1 = require("../../config/dbConfig.js");
var s3Helper_js_1 = require("../../helpers/s3Helper.js");
var jwtHelper_js_1 = require("../../helpers/jwtHelper.js");
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
/**
 * GET `/package/:id` - Retrieves package metadata and content by ID.
 *
 * @name GET /package/:id
 * @function
 * @memberof module:routes/package
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void} Sends a JSON response with package details or an error
 */
router.get('/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, x_authorization, decoded_jwt, packageID, packageResult, _a, Name, Version, Content, content_string, responseJson, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                authHeader = req.headers['x-authorization'];
                if (!authHeader || typeof authHeader !== 'string') {
                    // Respond with 403 if the header is missing or invalid
                    res.status(403).json({ error: "Invalid or missing X-Authorization header" });
                    return [2 /*return*/];
                }
                x_authorization = authHeader.toLowerCase().startsWith("bearer ")
                    ? authHeader.slice("bearer ".length).trim()
                    : authHeader.trim();
                return [4 /*yield*/, (0, jwtHelper_js_1.decodeAuthenticationToken)(x_authorization)];
            case 1:
                decoded_jwt = _b.sent();
                // If no user matches the token, respond with 403
                if (!decoded_jwt) {
                    res.status(403).json({ success: false, message: 'Authentication failed.' });
                    return [2 /*return*/];
                }
                packageID = req.params.id;
                if (!packageID) {
                    // Respond with 400 if the package ID is missing
                    res.status(400).json({ error: "Package ID is required but was not provided." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("SELECT \"Name\", \"Version\", \"Content\" \n             FROM ".concat(dbConfig_js_1.packageDB, " \n             WHERE \"ID\" = $1"), [packageID])];
            case 2:
                packageResult = _b.sent();
                // If the package is not found, respond with 404
                if (packageResult.rows.length === 0) {
                    res.status(404).json({ error: "No package found with ID: ".concat(packageID) });
                    return [2 /*return*/];
                }
                _a = packageResult.rows[0], Name = _a.Name, Version = _a.Version, Content = _a.Content;
                return [4 /*yield*/, (0, s3Helper_js_1.fetchPackage)(Content)];
            case 3:
                content_string = _b.sent();
                responseJson = {
                    metadata: {
                        Name: Name,
                        Version: Version,
                        ID: packageID
                    },
                    data: {
                        // Content  // For testing purposes
                        Content: content_string
                    }
                };
                // Send the successful response with package details
                res.status(200).json(responseJson);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                // Log the error and respond with 500 in case of an unexpected error
                console.error(error_1);
                res.status(500).json({ error: "Internal server error" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
