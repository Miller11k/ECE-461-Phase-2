import * as crypto from 'crypto';
import * as os from 'os';
/**
 * Generates a session token based on date/time, device name, and cryptographic randomness.
 * @returns {string} The generated session token.
 */
export function generateSessionToken() {
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
