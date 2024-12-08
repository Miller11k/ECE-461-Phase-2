/**
 * @module PasswordUtils
 * Provides utility functions for securely hashing and validating passwords with salts.
 */

import * as crypto from 'crypto';

/**
 * Hashes an input string combined with a salt using the SHA-256 algorithm.
 * 
 * @function hashWithSalt
 * @param {string} input - The input string to hash.
 * @param {string} [salt=""] - The salt to combine with the input (default is an empty string).
 * @returns {string} A hexadecimal SHA-256 hash of the salted input.
 * 
 * @example
 * const hash = hashWithSalt('password', 'random_salt');
 */
export function hashWithSalt(input: string, salt: string = ""): string {
    const saltedInput = `${input}-${salt}`; // Combine input and salt
    return crypto.createHash('sha256').update(saltedInput).digest('hex');
}


/**
 * Generates a cryptographically secure random salt.
 * 
 * @function createSalt
 * @param {number} [length=16] - The desired length of the salt (default is 16 bytes).
 * @returns {string} A securely generated hexadecimal salt.
 * 
 * @example
 * const salt = createSalt(16);
 */
export function createSalt(length: number = 16): string {
    const array = crypto.randomBytes(length); // Use crypto for secure random values
    return Array.from(array).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Combines a password with a generated salt and hashes it through multiple rounds.
 * 
 * @function generatePassword
 * @param {string} plaintext - The plaintext password to hash.
 * @param {string} salt - The salt to combine with the password.
 * @param {number} [rounds=12] - The number of hashing rounds (default is 12).
 * @returns {string} The final hashed password after the specified number of rounds.
 * 
 * @example
 * const hashedPassword = generatePassword('mypassword', 'random_salt', 12);
 */
export function generatePassword(plaintext: string, salt: string, rounds: number = 12): string {
    let hashValue = plaintext; // Start with the password

    // Perform hashing rounds
    for (let i = 0; i <= rounds; i++) {
        hashValue = hashWithSalt(hashValue, salt); // Hash the result of the previous round
    }

    return hashValue; // Return the final hash
}

/**
 * Validates a plaintext password against a hashed password using the salt.
 * 
 * @function validatePassword
 * @param {string} plaintext - The plaintext password to validate.
 * @param {string} ciphertext - The hashed password to compare against.
 * @param {string} salt - The salt used to hash the password.
 * @returns {boolean} `true` if the password is valid, `false` otherwise.
 * 
 * @example
 * const isValid = validatePassword('mypassword', 'hashed_password', 'random_salt');
 */
export function validatePassword(plaintext: string, ciphertext: string, salt: string): boolean {
    let password = plaintext;
    for (let i = 0; i <= 12; i++) {
        password = hashWithSalt(password, salt);
    }
    return password === ciphertext;
}