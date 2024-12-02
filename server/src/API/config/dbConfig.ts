/**
 * @module DatabaseClients
 * This module sets up and manages connections to PostgreSQL databases for user and metrics data.
 */

import pkg from 'pg';
const { Client } = pkg;

/**
 * PostgreSQL client for the user database.
 * Configured using environment variables:
 * - USERS_DB_HOST: User database host
 * - USERS_DB_USER: User database username
 * - USERS_DB_PASSWORD: User database password
 * - USERS_DB_NAME: User database name
 * - USERS_DB_PORT: User database port (default 5432)
 * @constant {Client}
 */
const userDBClient = new Client({
  host: process.env.USERS_DB_HOST, // User database host
  user: process.env.USERS_DB_USER, // User database username
  password: process.env.USERS_DB_PASSWORD, // User database password
  database: process.env.USERS_DB_NAME, // User database name
  port: parseInt(process.env.USERS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});

/**
 * Fully qualified schema and table name for the employee database.
 * Derived from the following environment variables:
 * - USERS_DB_SCHEMA: Database schema for user-related tables
 * - USERS_DB_TABLE: Table name for user-related data
 * @constant {string}
 */
export const employeeDB = `${process.env.USERS_DB_SCHEMA}.${process.env.USERS_DB_TABLE}`;

/**
 * PostgreSQL client for the metrics database.
 * Configured using environment variables:
 * - METRICS_DB_HOST: Metrics database host
 * - METRICS_DB_USER: Metrics database username
 * - METRICS_DB_PASSWORD: Metrics database password
 * - METRICS_DB_NAME: Metrics database name
 * - METRICS_DB_PORT: Metrics database port (default 5432)
 * @constant {Client}
 */
const packagesDBClient = new Client({
  host: process.env.METRICS_DB_HOST, // Metrics database host
  user: process.env.METRICS_DB_USER, // Metrics database username
  password: process.env.METRICS_DB_PASSWORD, // Metrics database password
  database: process.env.METRICS_DB_NAME, // Metrics database name
  port: parseInt(process.env.METRICS_DB_PORT || '5432', 10), // Default to port 5432 if not provided
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});

/**
 * Fully qualified schema and table name for the package database.
 * Derived from the following environment variables:
 * - METRICS_DB_SCHEMA: Database schema for metrics-related tables
 * - PACKAGE_DB_TABLE: Table name for package data
 * @constant {string}
 */
export const packageDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.PACKAGE_DB_TABLE}`;

/**
 * Fully qualified schema and table name for the metrics database.
 * Derived from the following environment variables:
 * - METRICS_DB_SCHEMA: Database schema for metrics-related tables
 * - METRICS_DB_TABLE: Table name for metrics data
 * @constant {string}
 */
export const metricsDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.METRICS_DB_TABLE}`;

/**
 * Fully qualified schema and table name for the dependencies database.
 * Derived from the following environment variables:
 * - METRICS_DB_SCHEMA: Database schema for metrics-related tables
 * - DEPENDENCIES_DB_TABLE: Table name for dependencies data
 * @constant {string}
 */
export const dependenciesDB = `${process.env.METRICS_DB_SCHEMA}.${process.env.DEPENDENCIES_DB_TABLE}`;

/**
 * Connects both user and metrics PostgreSQL database clients.
 * Terminates the process if any connection fails.
 * @async
 * @function connectDatabases
 * @throws {Error} If any database connection fails.
 */
export const connectDatabases = async () => {
  try {
    await userDBClient.connect(); // Connect to user database
    await packagesDBClient.connect(); // Connect to metrics database
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message); // Safely access error.message
    } else {
      console.error("An unknown error occurred.");
    }
  }
};

// Export the database clients
export { userDBClient, packagesDBClient };
