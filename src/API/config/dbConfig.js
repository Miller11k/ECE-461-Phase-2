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
exports.packagesDBClient = exports.userDBClient = exports.connectDatabases = exports.dependenciesDB = exports.metricsDB = exports.packageDB = exports.employeeDB = void 0;
var pg_1 = require("pg");
var Client = pg_1.default.Client;
// Create a PostgreSQL client for the user database
var userDBClient = new Client({
    host: process.env.USERS_DB_HOST, // User database host
    user: process.env.USERS_DB_USER, // User database username
    password: process.env.USERS_DB_PASSWORD, // User database password
    database: process.env.USERS_DB_NAME, // User database name
    port: parseInt(process.env.USERS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
    ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});
exports.userDBClient = userDBClient;
// Define the schema and table location for the user database
exports.employeeDB = "".concat(process.env.USERS_DB_SCHEMA, ".").concat(process.env.USERS_DB_TABLE);
// Create a PostgreSQL client for the metrics database
var packagesDBClient = new Client({
    host: process.env.METRICS_DB_HOST, // Metrics database host
    user: process.env.METRICS_DB_USER, // Metrics database username
    password: process.env.METRICS_DB_PASSWORD, // Metrics database password
    database: process.env.METRICS_DB_NAME, // Metrics database name
    port: parseInt(process.env.METRICS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
    ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});
exports.packagesDBClient = packagesDBClient;
// Define the schema and table location for the package database
exports.packageDB = "".concat(process.env.METRICS_DB_SCHEMA, ".").concat(process.env.PACKAGE_DB_TABLE);
// Define the schema and table location for the package metrics database
exports.metricsDB = "".concat(process.env.METRICS_DB_SCHEMA, ".").concat(process.env.METRICS_DB_TABLE);
// Define the schema and table location for the package database
exports.dependenciesDB = "".concat(process.env.METRICS_DB_SCHEMA, ".").concat(process.env.DEPENDENCIES_DB_TABLE);
// Function to connect to both databases
var connectDatabases = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, userDBClient.connect()];
            case 1:
                _a.sent(); // Connect to user database
                return [4 /*yield*/, packagesDBClient.connect()];
            case 2:
                _a.sent(); // Connect to metrics database
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                process.exit(1); // Exit the process if connection fails
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.connectDatabases = connectDatabases;
