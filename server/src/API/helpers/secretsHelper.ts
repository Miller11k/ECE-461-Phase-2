/**
 * @module SecretsManager
 * Provides utility functions for securely retrieving secrets from AWS Secrets Manager.
 */

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

/**
 * AWS Secrets Manager client instance.
 * Configured using the following environment variables:
 * - `AWS_REGION`: The AWS region where the Secrets Manager is hosted.
 * - `AWS_ACCESS_KEY_ID`: The AWS access key ID for authentication.
 * - `AWS_SECRET_ACCESS_KEY`: The AWS secret access key for authentication.
 */
const secretsManagerClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || "",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
  
/**
 * Retrieves and isolates the JWT secret from AWS Secrets Manager.
 * 
 * This function requires the following environment variables:
 * - `JWT_SECRET_NAME`: The name of the secret in AWS Secrets Manager.
 * - `JWT_SECRET_KEY`: The key within the secret JSON object that stores the JWT secret value.
 * 
 * @async
 * @function getJWTSecret
 * @returns {Promise<string>} The isolated JWT secret value.
 * 
 * @throws Will throw an error if:
 * - Environment variables `JWT_SECRET_NAME` or `JWT_SECRET_KEY` are missing.
 * - The secret cannot be retrieved from AWS Secrets Manager.
 * - The key specified by `JWT_SECRET_KEY` does not exist in the retrieved secret.
 * 
 * @example
 * const jwtSecret = await getJWTSecret();
 */
export const getJWTSecret = async (): Promise<string> => {
  const jwtSecretName = process.env.JWT_SECRET_NAME;
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  if (!jwtSecretName || !jwtSecretKey) {
    throw new Error(
      "Environment variables JWT_SECRET_NAME or JWT_SECRET_KEY are missing."
    );
  }

  try {
    // Retrieve the secret from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: jwtSecretName });
    const response = await secretsManagerClient.send(command);

    if (!response.SecretString) {
      throw new Error("Secret is not a string or could not be retrieved.");
    }

    // Parse the secret string as JSON and extract the key
    const secretObject = JSON.parse(response.SecretString);
    if (!secretObject[jwtSecretKey]) {
      throw new Error(`Key '${jwtSecretKey}' not found in the secret.`);
    }

    return secretObject[jwtSecretKey]; // Return the isolated JWT_SECRET value
  } catch (error) {
    throw error;
  }
};