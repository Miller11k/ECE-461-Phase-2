import cors from 'cors';
/**
 * Configures Cross-Origin Resource Sharing (CORS) for the application.
 * Allows requests from any origin with the specified HTTP methods and headers.
 *
 * - `origin: '*'`: Permits requests from any origin.
 * - `methods`: Specifies allowed HTTP methods for CORS requests.
 * - `allowedHeaders`: Defines headers allowed in CORS requests.
 */
const corsConfig = cors({
    origin: '*', // Allow requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Authorization'], // Allowed request headers
});
export default corsConfig;
