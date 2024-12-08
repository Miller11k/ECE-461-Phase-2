/**
 * @module CorsConfig
 * Provides configuration for Cross-Origin Resource Sharing (CORS) in the application.
 */

import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * CORS configuration for the application.
 * This setup allows the application to handle cross-origin requests with the following options:
 * 
 * - **`origin`**: `'*'` - Allows requests from any origin.
 * - **`methods`**: Specifies the HTTP methods permitted for CORS requests, including:
 *   - GET
 *   - POST
 *   - PUT
 *   - DELETE
 *   - OPTIONS
 * - **`allowedHeaders`**: Defines the request headers that are allowed for CORS requests:
 *   - `Content-Type`
 *   - `Authorization`
 *   - `X-Authorization`
 * 
 * @constant {Function}
 */
const corsConfig = cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Authorization'], // Allowed request headers
});

const rateLimitValue = parseInt(process.env.RATE_LIMIT || '100', 10);
console.log(`Rate limiting set to ${rateLimitValue.toLocaleString()} requests per 15 minutes.`);


/**
 * Rate limiting middleware.
 * Limits the number of requests per IP to prevent abuse.
 * 
 * - **windowMs**: Time frame for which requests are checked (15 minutes).
 * - **max**: Maximum number of requests allowed per IP within the time frame (100 requests).
 * - **message**: Custom error message returned when the rate limit is exceeded.
 * 
 * @constant {Function}
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: rateLimitValue, // Limit each IP to the defined number of requests per windowMs
  message: 'Too many requests, please try again later.' // Use a string instead of an object
});

export { corsConfig, rateLimiter };
