/**
 * @module SessionTokenGenerator
 * Provides a utility function for generating secure session tokens.
 */

import * as crypto from 'crypto';
import * as os from 'os';

/**
 * Generates a session token based on the current date/time, device name, and cryptographic randomness.
 * 
 * The session token is created by combining:
 * - The current timestamp (in milliseconds since epoch).
 * - The device hostname (or "unknown" if unavailable).
 * - A cryptographically secure random 16-byte string.
 * 
 * The combined string is then hashed using the SHA-256 algorithm to produce the session token.
 * 
 * @function generateSessionToken
 * @returns {string} The generated session token as a 64-character hexadecimal string.
 * 
 * @example
 * const sessionToken = generateSessionToken();
 */
export function generateSessionToken(): string {
    // Get the current timestamp
    const timestamp = Date.now().toString();

    // Get the device hostname (fallback to 'unknown' if not available)
    const deviceName = os.hostname() || 'unknown';

    // Generate a random 16-byte string
    const randomBytes = crypto.randomBytes(16).toString('hex');

    // Combine components and hash the result
    const rawToken = `${timestamp}-${deviceName}-${randomBytes}`;
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}