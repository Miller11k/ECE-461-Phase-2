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
var jwtHelper_js_1 = require("../../helpers/jwtHelper.js");
var s3Helper_js_1 = require("../../helpers/s3Helper.js");
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
/**
 * DELETE / - Resets the registry by clearing the `packages`, `dependencies`, and `package_metrics` tables.
 *
 * @async
 * @function
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 *
 * @description This endpoint requires an X-Authorization header containing a valid JWT.
 * Only admin users are allowed to perform this operation. The endpoint clears the relevant
 * database tables in a transactional manner to reset the registry state.
 */
router.delete('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, x_authorization, decoded_jwt, isAdmin, s3BucketName, s3DeletionSuccess, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                authHeader = req.headers['x-authorization'];
                // Validate the X-Authorization header
                if (!authHeader || typeof authHeader !== 'string') {
                    res.status(403).json({ error: "Missing or invalid X-Authorization header" });
                    return [2 /*return*/];
                }
                x_authorization = authHeader.toLowerCase().startsWith("bearer ")
                    ? authHeader.slice("bearer ".length).trim()
                    : authHeader.trim();
                return [4 /*yield*/, (0, jwtHelper_js_1.decodeAuthenticationToken)(x_authorization)];
            case 1:
                decoded_jwt = _a.sent();
                if (!decoded_jwt) {
                    res.status(403).json({ success: false, message: 'Authentication failed.' });
                    return [2 /*return*/];
                }
                isAdmin = decoded_jwt.isAdmin;
                // If user is not admin, does not have permission to reset
                if (!isAdmin) {
                    res.status(403).json({ success: false, message: 'You do not have permission to reset the registry.' });
                    return [2 /*return*/];
                }
                // Begin transaction
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query('BEGIN')];
            case 2:
                // Begin transaction
                _a.sent();
                // Clear the `packages` table
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("DELETE FROM ".concat(dbConfig_js_1.packageDB))];
            case 3:
                // Clear the `packages` table
                _a.sent();
                // Clear the `dependencies` table
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("DELETE FROM ".concat(dbConfig_js_1.dependenciesDB))];
            case 4:
                // Clear the `dependencies` table
                _a.sent();
                // Clear the `package_metrics` table
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query("DELETE FROM ".concat(dbConfig_js_1.metricsDB))];
            case 5:
                // Clear the `package_metrics` table
                _a.sent();
                s3BucketName = process.env.S3_BUCKET_NAME;
                return [4 /*yield*/, (0, s3Helper_js_1.deleteAllS3BucketContents)(s3BucketName)];
            case 6:
                s3DeletionSuccess = _a.sent();
                if (!!s3DeletionSuccess) return [3 /*break*/, 8];
                // Rollback transaction if S3 clearing fails
                return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query('ROLLBACK')];
            case 7:
                // Rollback transaction if S3 clearing fails
                _a.sent();
                res.status(500).json({ success: false, message: 'S3 bucket clearing failed. Changes rolled back.' });
                return [2 /*return*/];
            case 8: 
            // Commit transaction if S3 clearing is successful
            return [4 /*yield*/, dbConfig_js_1.packagesDBClient.query('COMMIT')];
            case 9:
                // Commit transaction if S3 clearing is successful
                _a.sent();
                res.status(200).json({ success: true, message: 'Registry is reset.' });
                return [2 /*return*/];
            case 10:
                error_1 = _a.sent();
                res.status(500).json({ error: "Internal server error" });
                return [2 /*return*/];
            case 11: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
