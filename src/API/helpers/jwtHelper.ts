import jwt from 'jsonwebtoken';

// Define a custom payload type
interface CustomJwtPayload {
  firstName: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
}

/**
 * Generate a signed JWT token for X-Authentication.
 * 
 * @param firstName - The first name of the user.
 * @param lastName - The last name of the user.
 * @param username - The username of the user.
 * @param isAdmin - Whether the user is an admin.
 * @param secret - A server-side secret key for signing the token.
 * @returns A signed JWT token as a string.
 */
export function generateAuthenticationToken(
  firstName: string,
  lastName: string,
  username: string,
  isAdmin: boolean,
  secret: string
): string {
  const payload: CustomJwtPayload = {
    firstName,
    lastName,
    username,
    isAdmin,
  };

  // Sign and return the token with noTimestamp option
  return jwt.sign(payload, secret, { algorithm: 'HS256', noTimestamp: true });
}

/**
 * Decode and verify a JWT token.
 * 
 * @param token - The JWT token to decode.
 * @param secret - The server-side secret key used to sign the token.
 * @returns The decoded payload if valid, or null if invalid.
 */
export function decodeAuthenticationToken(
  token: string,
  secret: string
): CustomJwtPayload | null {
  try {
    // Decode and verify the token
    const payload = jwt.verify(token, secret) as CustomJwtPayload;
    return payload;
  } catch (error) {
    // Safely handle unknown errors
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    return null;
  }
}
