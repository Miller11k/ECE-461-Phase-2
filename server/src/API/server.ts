import express from 'express';
import corsConfig from './config/cors.js';
import { connectDatabases } from './config/dbConfig.js';
import routes from './routes/index.js';

const app = express();

// Middleware setup
app.use(corsConfig); // Enable CORS
app.use(express.json({ limit: '100mb' })); // Parse incoming JSON requests added upper limit

// Register application routes
app.use('/', routes);

// Initialize database connections
await connectDatabases();

// Start the server
const PORT = parseInt(process.env.API_PORT || '4010', 10); // Ensure it's a string or default to '4010'
const HOST = '0.0.0.0'; // Listen on all IPv4 addresses

app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
});