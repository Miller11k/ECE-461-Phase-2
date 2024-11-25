import pkg from 'pg';
const { Client } = pkg;

// Create a PostgreSQL client for the user database
const userDBClient = new Client({
  host: process.env.USERS_DB_HOST, // User database host
  user: process.env.USERS_DB_USER, // User database username
  password: process.env.USERS_DB_PASSWORD, // User database password
  database: process.env.USERS_DB_NAME, // User database name
  port: parseInt(process.env.USERS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});

// Define the schema and table location for the user database
export const employeeDB = `${process.env.USERS_DB_SCHEMA}.${process.env.USERS_DB_TABLE}`;

// Create a PostgreSQL client for the metrics database
const packagesDBClient = new Client({
  host: process.env.METRICS_DB_HOST, // Metrics database host
  user: process.env.METRICS_DB_USER, // Metrics database username
  password: process.env.METRICS_DB_PASSWORD, // Metrics database password
  database: process.env.METRICS_DB_NAME, // Metrics database name
  port: parseInt(process.env.METRICS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});

// Define the schema and table location for the package database
export const packageDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.PACKAGE_DB_TABLE}`;

// Define the schema and table location for the package metrics database
export const metricsDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.METRICS_DB_TABLE}`;

// Define the schema and table location for the package database
export const dependenciesDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.DEPENDENCIES_DB_TABLE}`;

// Function to connect to both databases
export const connectDatabases = async () => {
  try {
    await userDBClient.connect(); // Connect to user database
    await packagesDBClient.connect(); // Connect to metrics database
  } catch (error) {
    process.exit(1); // Exit the process if connection fails
  }
};

// Export the database clients
export { userDBClient, packagesDBClient };