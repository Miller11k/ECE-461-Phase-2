/**
 * @module CorsConfig
 * Provides configuration for Cross-Origin Resource Sharing (CORS) in the application.
 */

import cors from 'cors';

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

export default corsConfig;
