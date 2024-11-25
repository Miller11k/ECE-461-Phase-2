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
exports.generateAuthenticationToken = generateAuthenticationToken;
exports.decodeAuthenticationToken = decodeAuthenticationToken;
exports.displayDecodedPayload = displayDecodedPayload;
var crypto_1 = require("crypto");
var secretsHelper_js_1 = require("./secretsHelper.js");
/**
 * Generates a JWT with a signature.
 *
 * @param {string} firstName - The first name of the user.
 * @param {string} lastName - The last name of the user.
 * @param {string} username - The username of the user.
 * @param {boolean} isAdmin - Indicates if the user is an admin.
 * @returns {Promise<string>} A JWT token with a signature.
 */
function generateAuthenticationToken(firstName, lastName, username, isAdmin) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, header, base64UrlEncode, encodedHeader, encodedPayload, secret, pseudoSignature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = {
                        firstName: firstName,
                        lastName: lastName,
                        username: username,
                        isAdmin: isAdmin,
                        iat: Math.floor(Date.now() / 1000), // Current time in seconds
                    };
                    header = {
                        alg: 'HS256', // Use a proper algorithm
                        typ: 'JWT',
                    };
                    base64UrlEncode = function (data) {
                        return Buffer.from(JSON.stringify(data))
                            .toString('base64')
                            .replace(/=+$/, '') // Remove padding
                            .replace(/\+/g, '-') // Replace '+' with '-'
                            .replace(/\//g, '_');
                    };
                    encodedHeader = base64UrlEncode(header);
                    encodedPayload = base64UrlEncode(payload);
                    return [4 /*yield*/, (0, secretsHelper_js_1.getJWTSecret)()];
                case 1:
                    secret = _a.sent();
                    pseudoSignature = (0, crypto_1.createHash)('sha256')
                        .update("".concat(encodedHeader, ".").concat(encodedPayload, ".").concat(secret)) // Include the secret
                        .digest('base64')
                        .replace(/=+$/, '') // Remove padding
                        .replace(/\+/g, '-') // Replace '+' with '-'
                        .replace(/\//g, '_');
                    return [2 /*return*/, "".concat(encodedHeader, ".").concat(encodedPayload, ".").concat(pseudoSignature)];
            }
        });
    });
}
/**
 * Decodes a JWT and verifies its signature.
 *
 * @param {string} token - The JWT token to decode.
 * @returns {Promise<Omit<CustomJwtPayload, 'iat'> | null>} The decoded payload (excluding `iat`) if valid, otherwise `null`.
 */
function decodeAuthenticationToken(token) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, headerB64, payloadB64, signatureB64, decodedPayload, secret, recomputedSignature, firstName, lastName, username, isAdmin, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = token.split('.'), headerB64 = _a[0], payloadB64 = _a[1], signatureB64 = _a[2];
                    if (!headerB64 || !payloadB64 || !signatureB64) {
                        throw new Error('Invalid JWT format');
                    }
                    decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
                    return [4 /*yield*/, (0, secretsHelper_js_1.getJWTSecret)()];
                case 1:
                    secret = _b.sent();
                    recomputedSignature = (0, crypto_1.createHash)('sha256')
                        .update("".concat(headerB64, ".").concat(payloadB64, ".").concat(secret)) // Use the same secret logic
                        .digest('base64')
                        .replace(/=+$/, '') // Remove padding
                        .replace(/\+/g, '-') // Replace '+' with '-'
                        .replace(/\//g, '_');
                    if (recomputedSignature !== signatureB64) {
                        throw new Error('Invalid signature');
                    }
                    firstName = decodedPayload.firstName, lastName = decodedPayload.lastName, username = decodedPayload.username, isAdmin = decodedPayload.isAdmin;
                    return [2 /*return*/, { firstName: firstName, lastName: lastName, username: username, isAdmin: isAdmin }];
                case 2:
                    error_1 = _b.sent();
                    if (error_1 instanceof Error) {
                        console.error('Token verification failed:', error_1.message);
                    }
                    else {
                        console.error('An unknown error occurred.');
                    }
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Displays the contents of a decoded JWT payload.
 *
 * @param {Omit<CustomJwtPayload, 'iat'> | null} decodedPayload - The decoded JWT payload, or `null` if the token is invalid.
 * @returns {void} Nothing is returned; the payload details are printed to the console.
 */
function displayDecodedPayload(decodedPayload) {
    if (!decodedPayload) {
        console.log('Invalid or corrupted JWT token. Decoding failed.');
        return;
    }
    var firstName = decodedPayload.firstName, lastName = decodedPayload.lastName, username = decodedPayload.username, isAdmin = decodedPayload.isAdmin;
    console.log('Decoded JWT Payload:');
    console.log("  First Name: ".concat(firstName));
    console.log("  Last Name: ".concat(lastName));
    console.log("  Username: ".concat(username));
    console.log("  Is Admin: ".concat(isAdmin ? 'Yes' : 'No'));
}
