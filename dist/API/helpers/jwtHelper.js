import { createHash } from 'crypto';
import { getJWTSecret } from './secretsHelper.js';
/**
 * Generate a JWT with a pseudo-signature.
 *
 * @param firstName - The first name of the user.
 * @param lastName - The last name of the user.
 * @param username - The username of the user.
 * @param isAdmin - Whether the user is an admin.
 * @returns A JWT token with a pseudo-signature as a string.
 */
export async function generateAuthenticationToken(firstName, lastName, username, isAdmin) {
    const payload = {
        firstName,
        lastName,
        username,
        isAdmin,
        iat: Math.floor(Date.now() / 1000), // Current time in seconds
    };
    const header = {
        alg: 'HS256', // Use a proper algorithm
        typ: 'JWT',
    };
    const base64UrlEncode = (data) => Buffer.from(JSON.stringify(data))
        .toString('base64')
        .replace(/=+$/, '') // Remove padding
        .replace(/\+/g, '-') // Replace '+' with '-'
        .replace(/\//g, '_'); // Replace '/' with '_'
    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const secret = await getJWTSecret();
    const pseudoSignature = createHash('sha256')
        .update(`${encodedHeader}.${encodedPayload}.${secret}`) // Include the secret
        .digest('base64')
        .replace(/=+$/, '') // Remove padding
        .replace(/\+/g, '-') // Replace '+' with '-'
        .replace(/\//g, '_'); // Replace '/' with '_'
    return `${encodedHeader}.${encodedPayload}.${pseudoSignature}`;
}
/**
 * Decode a JWT and verify its pseudo-signature.
 *
 * @param token - The JWT token to decode.
 * @returns The decoded payload, or null if invalid.
 */
export async function decodeAuthenticationToken(token) {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) {
            throw new Error('Invalid JWT format');
        }
        const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
        const secret = await getJWTSecret();
        const recomputedSignature = createHash('sha256')
            .update(`${headerB64}.${payloadB64}.${secret}`) // Use the same secret logic
            .digest('base64')
            .replace(/=+$/, '') // Remove padding
            .replace(/\+/g, '-') // Replace '+' with '-'
            .replace(/\//g, '_'); // Replace '/' with '_'
        if (recomputedSignature !== signatureB64) {
            throw new Error('Invalid signature');
        }
        const { firstName, lastName, username, isAdmin } = decodedPayload;
        return { firstName, lastName, username, isAdmin };
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Token verification failed:', error.message);
        }
        else {
            console.error('An unknown error occurred.');
        }
        return null;
    }
}
/**
 * Helper function to display the contents of a decoded JWT payload.
 *
 * @param decodedPayload - The decoded JWT payload, or null if invalid.
 */
export function displayDecodedPayload(decodedPayload) {
    if (!decodedPayload) {
        console.log('Invalid or corrupted JWT token. Decoding failed.');
        return;
    }
    const { firstName, lastName, username, isAdmin } = decodedPayload;
    console.log('Decoded JWT Payload:');
    console.log(`  First Name: ${firstName}`);
    console.log(`  Last Name: ${lastName}`);
    console.log(`  Username: ${username}`);
    console.log(`  Is Admin: ${isAdmin ? 'Yes' : 'No'}`);
}
