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
var passwordHelper_js_1 = require("../../helpers/passwordHelper.js");
var jwtHelper_js_1 = require("../../helpers/jwtHelper.js");
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
/**
 * Endpoint to authenticate a user based on a session token.
 * @route POST /authenticate
 * @param req.body.username {string} Username of the user.
 * @param req.body.token {string} Session token for authentication.
 * @returns {object} Success status with username and token if valid, or an error message.
 */
router.put('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, username, input_is_admin, password, result, _c, first_name, last_name, salt, storedPassword, tokens, is_admin, isValid, x_authentication, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req.body, _b = _a.User, username = _b.name, input_is_admin = _b.isAdmin, password = _a.Secret.password;
                _d.label = 1;
            case 1:
                _d.trys.push([1, 4, , 5]);
                return [4 /*yield*/, dbConfig_js_1.userDBClient.query("SELECT first_name, last_name, salt, password, tokens, is_admin FROM ".concat(dbConfig_js_1.employeeDB, " WHERE username = $1"), [username])];
            case 2:
                result = _d.sent();
                // If no user found (based on username)
                if (result.rows.length === 0) {
                    res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
                    return [2 /*return*/];
                }
                _c = result.rows[0], first_name = _c.first_name, last_name = _c.last_name, salt = _c.salt, storedPassword = _c.password, tokens = _c.tokens, is_admin = _c.is_admin;
                if (is_admin != input_is_admin) {
                    res.status(401).json({ success: false, message: 'Admin status mismatch' });
                    return [2 /*return*/];
                }
                isValid = (0, passwordHelper_js_1.validatePassword)(password, storedPassword, salt);
                if (!isValid) {
                    res.status(401).json({ success: false, message: 'Invalid Credentials' }); // Return authentication error
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, jwtHelper_js_1.generateAuthenticationToken)(first_name, last_name, username, is_admin)];
            case 3:
                x_authentication = _d.sent();
                // const x_authentication = await generateAuthenticationToken(first_name, last_name, username, is_admin, salt);
                // Return the new token as the response
                res.json({ success: true, token: "bearer ".concat(x_authentication) });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _d.sent();
                res.status(500).json({ success: false, error: error_1.message }); // Return internal server error
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
