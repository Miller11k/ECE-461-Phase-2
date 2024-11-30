import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
// Set up AWS Secrets Manager client
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
 * @returns {Promise<string>} The isolated JWT secret value.
 */
export const getJWTSecret = async () => {
    const jwtSecretName = process.env.JWT_SECRET_NAME;
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretName || !jwtSecretKey) {
        throw new Error("Environment variables JWT_SECRET_NAME or JWT_SECRET_KEY are missing.");
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
    }
    catch (error) {
        console.error("Failed to retrieve or parse JWT secret:", error);
        throw error;
    }
};
