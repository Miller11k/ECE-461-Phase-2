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
var express_1 = require("express");
var dbConfig_js_1 = require("../../config/dbConfig.js");
var semver_1 = require("semver");
var jwtHelper_js_1 = require("../../helpers/jwtHelper.js");
var router = (0, express_1.Router)();
/**
 * POST /packages
 * Fetch packages based on queries and authentication.
 * Supports pagination and version filtering.
 *
 * @param {Request} req - Includes "offset" in query, "X-Authorization" in headers, and package queries in the body.
 * @param {Response} res - Returns package metadata or errors for invalid input/authentication.
 */
router.post('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var offset, max_responses, authHeader, x_authorization, decoded_jwt, packageQueries, allPackages, allPackages, results, _loop_1, _i, packageQueries_1, query, state_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                offset = parseInt(req.query.offset) || 0;
                max_responses = 10;
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
                decoded_jwt = _a.sent();
                // If no user matches the token, respond with 403
                if (!decoded_jwt) {
                    res.status(403).json({ success: false, message: 'Authentication failed.' });
                    return [2 /*return*/];
                }
                // Validate the request body
                if (!req.body) {
                    res.status(400).json({ error: "Request body is required but was not provided." });
                    return [2 /*return*/];
                }
                packageQueries = req.body;
                // Ensure the request body is an array
                if (!Array.isArray(packageQueries)) {
                    res.status(400).json({ error: "Request body must be an array." });
                    return [2 /*return*/];
                }
                if (!(packageQueries.length === 1 && // Ensure there's only one query in the request body
                    packageQueries[0].Name === "*" && // Check if the Name field is a wildcard ("*")
                    !packageQueries[0].Version) // Ensure the Version field is not provided
                ) return [3 /*break*/, 3]; // Ensure the Version field is not provided
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("SELECT \"Version\", \"Name\", \"ID\" FROM ".concat(dbConfig_js_1.packageDB, " LIMIT $1 OFFSET $2"), // SQL query to fetch packages
                    [max_responses, offset] // Apply pagination using LIMIT and OFFSET
                    )];
            case 2:
                allPackages = _a.sent();
                // Respond with the fetched packages in a structured JSON format
                res.status(200).json(allPackages.rows.map(function (row) { return ({
                    Version: row.Version, // Package version
                    Name: row.Name, // Package name
                    ID: row.ID, // Package ID
                }); }));
                return [2 /*return*/]; // Exit early since the special case is handled
            case 3:
                if (!(packageQueries.length === 0)) return [3 /*break*/, 5];
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("SELECT \"Version\", \"Name\", \"ID\" FROM ".concat(dbConfig_js_1.packageDB, " LIMIT $1 OFFSET $2"), [max_responses, offset])];
            case 4:
                allPackages = _a.sent();
                res.status(200).json(allPackages.rows.map(function (row) { return ({
                    Version: row.Version,
                    Name: row.Name,
                    ID: row.ID,
                }); }));
                return [2 /*return*/];
            case 5:
                results = [];
                _loop_1 = function (query) {
                    var versionRanges, uniqueFormats, _b, versionRanges_1, versionRange, queryResult, filteredResults;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                // Validate that the "Name" property exists and is a string
                                if (typeof query.Name !== 'string') {
                                    res.status(400).json({ error: "Invalid input format. Name must be a string." });
                                    return [2 /*return*/, { value: void 0 }];
                                }
                                versionRanges = query.Version
                                    ? query.Version.split('\n').map(function (v) {
                                        var _a, _b, _c, _d;
                                        v = v.trim();
                                        // Check if the version starts with "Exact ("
                                        if (v.startsWith("Exact (")) {
                                            var exactVersion = (_a = v.match(/Exact \(([^)]+)\)/)) === null || _a === void 0 ? void 0 : _a[1];
                                            return exactVersion || ""; // Extract the version inside "Exact (____)"
                                        }
                                        // Check if the version starts with "Bounded range ("
                                        else if (v.startsWith("Bounded range (")) {
                                            var boundedRange = (_b = v.match(/Bounded range \(([^)]+)\)/)) === null || _b === void 0 ? void 0 : _b[1];
                                            return (boundedRange === null || boundedRange === void 0 ? void 0 : boundedRange.replace(/-/g, " - ")) || ""; // Extract the bounded range and format with spaces
                                        }
                                        // Check if the version starts with "Carat ("
                                        else if (v.startsWith("Carat (")) {
                                            var caratVersion = (_c = v.match(/Carat \(([^)]+)\)/)) === null || _c === void 0 ? void 0 : _c[1];
                                            return caratVersion ? "".concat(caratVersion) : ""; // Extract the version inside "Carat (____)"
                                        }
                                        // Check if the version starts with "Tilde ("
                                        else if (v.startsWith("Tilde (")) {
                                            var tildeVersion = (_d = v.match(/Tilde \(([^)]+)\)/)) === null || _d === void 0 ? void 0 : _d[1];
                                            return tildeVersion ? "".concat(tildeVersion) : ""; // Extract the version inside "Tilde (____)"
                                        }
                                        // Handle regular version formats directly
                                        else {
                                            return v; // Handle regular input like 1.2.3-2.1.0
                                        }
                                    }).filter(Boolean) // Remove invalid/empty strings
                                    : [];
                                uniqueFormats = new Set(query.Version.split('\n').map(function (v) {
                                    if (v.startsWith("Exact ("))
                                        return "Exact";
                                    if (v.startsWith("Bounded range ("))
                                        return "Bounded range";
                                    if (v.startsWith("Carat ("))
                                        return "Carat";
                                    if (v.startsWith("Tilde ("))
                                        return "Tilde";
                                    return null;
                                }).filter(Boolean) // Collect format types
                                );
                                // Ensure only one version format type is used
                                if (uniqueFormats.size > 1) {
                                    res.status(400).json({
                                        error: "Invalid Version format. Version cannot be a combination of different types: ".concat(Array.from(uniqueFormats).join(', '), "."),
                                    });
                                    return [2 /*return*/, { value: void 0 }];
                                }
                                // Validate that all version ranges are semver-compliant
                                for (_b = 0, versionRanges_1 = versionRanges; _b < versionRanges_1.length; _b++) {
                                    versionRange = versionRanges_1[_b];
                                    if (!semver_1.default.validRange(versionRange)) {
                                        res.status(400).json({ error: "Invalid Version format: ".concat(versionRange) });
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                }
                                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("SELECT \"Version\", \"Name\", \"ID\" FROM ".concat(dbConfig_js_1.packageDB, " WHERE \"Name\" LIKE $1 LIMIT $2 OFFSET $3"), [query.Name === "*" ? "%" : query.Name, max_responses, offset])];
                            case 1:
                                queryResult = _c.sent();
                                filteredResults = queryResult.rows.filter(function (row) {
                                    return versionRanges.length === 0 || versionRanges.some(function (range) { return semver_1.default.satisfies(row.Version, range); });
                                });
                                results.push.apply(results, filteredResults.map(function (row) { return ({
                                    Version: row.Version,
                                    Name: row.Name,
                                    ID: row.ID,
                                }); }));
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, packageQueries_1 = packageQueries;
                _a.label = 6;
            case 6:
                if (!(_i < packageQueries_1.length)) return [3 /*break*/, 9];
                query = packageQueries_1[_i];
                return [5 /*yield**/, _loop_1(query)];
            case 7:
                state_1 = _a.sent();
                if (typeof state_1 === "object")
                    return [2 /*return*/, state_1.value];
                _a.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 6];
            case 9:
                // Return the aggregated results
                res.status(200).json(results);
                return [3 /*break*/, 11];
            case 10:
                error_1 = _a.sent();
                // Handle unexpected errors
                res.status(500).json({ error: "Internal server error" });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
