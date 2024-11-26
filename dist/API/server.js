import express from 'express';
import corsConfig from './config/cors.js';
import { connectDatabases } from './config/dbConfig.js';
import routes from './routes/index.js';
const app = express();
// Middleware setup
app.use(corsConfig); // Enable CORS
app.use(express.json()); // Parse incoming JSON requests
// Register application routes
app.use('/', routes);
// Initialize database connections
await connectDatabases();
// Start the server
const PORT = process.env.API_PORT || 4010;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
