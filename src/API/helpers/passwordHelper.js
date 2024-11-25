"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashWithSalt = hashWithSalt;
exports.createSalt = createSalt;
exports.generatePassword = generatePassword;
exports.validatePassword = validatePassword;
var crypto = require("crypto");
// Hashes an input combined with a salt using SHA-256 (synchronous)
function hashWithSalt(input, salt) {
    if (salt === void 0) { salt = ""; }
    var saltedInput = "".concat(input, "-").concat(salt); // Combine input and salt
    return crypto.createHash('sha256').update(saltedInput).digest('hex');
}
// Generates a cryptographically secure random salt
function createSalt(length) {
    if (length === void 0) { length = 16; }
    var array = crypto.randomBytes(length); // Use crypto for secure random values
    return Array.from(array).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
}
// Combines a password with a generated salt and hashes it through multiple rounds (synchronous)
function generatePassword(plaintext, salt, rounds) {
    if (rounds === void 0) { rounds = 12; }
    var hashValue = plaintext; // Start with the password
    // Perform hashing rounds
    for (var i = 0; i <= rounds; i++) {
        hashValue = hashWithSalt(hashValue, salt); // Hash the result of the previous round
    }
    return hashValue; // Return the final hash
}
// Validates a plaintext password against a hashed password using the salt
function validatePassword(plaintext, ciphertext, salt) {
    var password = plaintext;
    for (var i = 0; i <= 12; i++) {
        password = hashWithSalt(password, salt);
    }
    return password === ciphertext;
}
