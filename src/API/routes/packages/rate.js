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
exports.pool = void 0;
/* Handles `/package/{id}/rate` (GET) */
var express_1 = require("express");
var pg_1 = require("pg");
var dotenv_1 = require("dotenv");
// Load environment variables from `.env` file
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false, // Adjust based on your SSL configuration
        ca: process.env.DB_SSL_CA // Use if you have a CA certificate
    },
});
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
router.get('/:id/rate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, packageId, query, rows, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authHeader = req.headers['x-authorization'];
                // Validate the X-Authorization header
                if (!authHeader || typeof authHeader !== 'string') {
                    res.status(403).json({ error: "Missing or invalid X-Authorization header" });
                    return [2 /*return*/];
                }
                packageId = req.params.id;
                if (!packageId) {
                    res.status(400).json({ error: "Package ID is missing or invalid" });
                    return [2 /*return*/];
                }
                query = "SELECT * FROM package_metrics WHERE package_id = $1";
                return [4 /*yield*/, exports.pool.query(query, [packageId])];
            case 1:
                rows = (_a.sent()).rows;
                if (rows.length === 0) {
                    res.status(404).json({ error: "Package metrics not found" });
                    return [2 /*return*/];
                }
                // Return the metrics
                res.status(200).json(rows[0]);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: "Internal server error" });
                return [2 /*return*/];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
