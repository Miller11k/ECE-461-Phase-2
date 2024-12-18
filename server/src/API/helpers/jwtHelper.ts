/**
 * @module JWTUtils
 * This module provides utility functions to generate, decode, and display JSON Web Tokens (JWTs).
 */

import { createHash } from 'crypto';
import { getJWTSecret } from './secretsHelper.js';

/**
 * Represents the payload of a JWT token.
 * @typedef {Object} CustomJwtPayload
 * @property {string} firstName - The first name of the user.
 * @property {string} lastName - The last name of the user.
 * @property {string} username - The username of the user.
 * @property {boolean} isAdmin - Indicates whether the user has admin privileges.
 * @property {number} iat - The issued-at timestamp of the token in seconds since epoch.
 */
interface CustomJwtPayload {
  firstName: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
  iat: number;
}

/**
 * Generates a JWT with a signature.
 * 
 * @async
 * @function generateAuthenticationToken
 * @param {string} firstName - The first name of the user.
 * @param {string} lastName - The last name of the user.
 * @param {string} username - The username of the user.
 * @param {boolean} isAdmin - Indicates if the user is an admin.
 * @returns {Promise<string>} A JWT token with a signature.
 */
export async function generateAuthenticationToken(
  firstName: string,
  lastName: string,
  username: string,
  isAdmin: boolean
): Promise<string> {
  const payload: CustomJwtPayload = {
    firstName,
    lastName,
    username,
    isAdmin,
    iat: Math.floor(Date.now() / 1000), // Current time in seconds
  };

  const header = {
    alg: 'HS256', // Algorithm for signing
    typ: 'JWT',
  };

  const base64UrlEncode = (data: object): string =>
    Buffer.from(JSON.stringify(data))
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
 * Decodes a JWT and verifies its signature.
 * 
 * @async
 * @function decodeAuthenticationToken
 * @param {string} token - The JWT token to decode.
 * @returns {Promise<Omit<CustomJwtPayload, 'iat'> | null>} The decoded payload (excluding `iat`) if valid, otherwise `null`.
 */
export async function decodeAuthenticationToken(token: string): Promise<Omit<CustomJwtPayload, 'iat'> | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid JWT format');
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf8')
    ) as CustomJwtPayload;

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
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
    return null;
  }
}


/**
 * Displays the contents of a decoded JWT payload.
 * 
 * @function displayDecodedPayload
 * @param {Omit<CustomJwtPayload, 'iat'> | null} decodedPayload - The decoded JWT payload, or `null` if the token is invalid.
 * @returns {void} Nothing is returned; the payload details are printed to the console.
 */
export function displayDecodedPayload(
  decodedPayload: Omit<CustomJwtPayload, 'iat'> | null
): void {
  if (!decodedPayload) {
    return;
  }

  const { firstName, lastName, username, isAdmin } = decodedPayload;

}