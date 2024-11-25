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
var passwordHelper_js_1 = require("../../helpers/passwordHelper.js");
var dbConfig_js_1 = require("../../config/dbConfig.js");
// Create a new router instance to define and group related routes
var router = (0, express_1.Router)();
/**
 * Endpoint to change a user's password.
 * @route POST /change-password
 * @param req.body.username {string} The username of the user.
 * @param req.body.token {string} Session token for authentication.
 * @param req.body.newPassword {string} The new password to be set.
 * @returns {object} Success status if the password is updated, or an error message.
 */
router.post('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, token, newPassword, result, _b, first_name, last_name, is_admin, salt, currentPassword, tokens, cipher_password, newSalt, newHashedPassword, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, username = _a.username, token = _a.token, newPassword = _a.newPassword;
                // Check for full response
                if (!username || !token || !newPassword) {
                    res.status(400).json({ success: false, message: 'All fields are required' }); // Return client error
                    return [2 /*return*/];
                }
                // Check if password is empty
                if (newPassword.trim() === '') {
                    res.status(400).json({ success: false, message: 'New password cannot be blank' }); // Return client error
                    return [2 /*return*/];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                return [4 /*yield*/, dbConfig_js_1.userDBClient.query("SELECT first_name, last_name, is_admin, salt, password, tokens FROM ".concat(dbConfig_js_1.employeeDB, " WHERE username = $1"), [username])];
            case 2:
                result = _c.sent();
                // If user not found (by username)
                if (result.rows.length === 0) {
                    res.status(404).json({ success: false, message: 'User not found' }); // Return resource not found error
                    return [2 /*return*/];
                }
                _b = result.rows[0], first_name = _b.first_name, last_name = _b.last_name, is_admin = _b.is_admin, salt = _b.salt, currentPassword = _b.password, tokens = _b.tokens;
                // Validate the token
                if (!tokens || !tokens.includes(token)) {
                    res.status(401).json({ success: false, message: 'Invalid token provided' }); // Return authentication error
                    return [2 /*return*/];
                }
                cipher_password = (0, passwordHelper_js_1.generatePassword)(newPassword, salt);
                // Check if password already in use
                if (currentPassword === cipher_password) {
                    res.status(400).json({ success: false, message: 'New password cannot be the same as the current password' }); // Return client error
                    return [2 /*return*/];
                }
                newSalt = (0, passwordHelper_js_1.createSalt)();
                newHashedPassword = (0, passwordHelper_js_1.generatePassword)(newPassword, newSalt);
                // Update the password in the database
                return [4 /*yield*/, dbConfig_js_1.userDBClient.query("UPDATE ".concat(dbConfig_js_1.employeeDB, " SET password = $1, \"X-Authorization\" = $2, salt = $3 WHERE username = $4"), [newHashedPassword, newSalt, username]
                    // [newHashedPassword, new_x_authentication, newSalt, username]
                    )];
            case 3:
                // Update the password in the database
                _c.sent();
                res.json({ success: true, message: 'Password changed successfully' }); // Respond with success message
                return [3 /*break*/, 5];
            case 4:
                error_1 = _c.sent();
                res.status(500).json({ success: false, error: error_1.message }); // Return internal server error
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = router;