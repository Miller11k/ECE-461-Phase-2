import { Octokit } from '@octokit/rest';
import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';
dotenv.config();
// Access the token value
export const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
    throw new Error('GITHUB_TOKEN is not defined in the .env file');
}
// Determine log level from environment variable
export let logLevel = process.env.LOG_LEVEL?.toLowerCase();
if (!logLevel) {
    // logLevel = 'info';
    throw new Error('LOG_LEVEL is not defined in the .env file');
}
else {
    switch (logLevel) {
        case "0":
            logLevel = 'error';
            break;
        case "1":
            logLevel = 'info';
            break;
        case "2":
            logLevel = 'debug';
            break;
    }
}
export let logFile = process.env.LOG_FILE;
if (!logFile) {
    throw new Error('LOG_FILE is not defined in the .env file');
}
// Create an Octokit instance
export let OCTOKIT = new Octokit({ auth: githubToken });
// Create a logger
export let logger = createLogger({
    level: logLevel,
    format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)),
    transports: [
        new transports.File({ filename: logFile, options: { flags: 'a' } }) // Append logs to a file
    ],
});
/**
 * The `Metrics` abstract class provides a foundation for evaluating metrics related to a GitHub repository.
 * It includes properties for response time, GitHub API client, repository URL, owner, and repository name.
 *
 * @abstract
 * @property {number} responseTime - The response time for the metrics evaluation.
 * @property {Octokit} octokit - The GitHub API client instance.
 * @property {string} url - The URL of the repository.
 * @property {string} owner - The owner of the repository.
 * @property {string} repo - The name of the repository.
 * @property {string} NativeURL - The native URL of the repository.
 *
 * @constructor
 * @param {string} NativeURL - The native URL of the repository.
 * @param {string} url - The URL of the repository.
 *
 * @method getRepoData
 * @private
 * @param {string} url - The GitHub repository URL.
 * @returns {Object} An object containing the owner and repository name.
 * @throws {Error} Will throw an error if the URL is invalid.
 *
 * @method evaluate
 * @abstract
 * @returns {Promise<number>} A promise that resolves to a number representing the evaluation result.
 *
 * @method getRateLimitStatus
 * @public
 * @returns {Promise<Object>} A promise that resolves to an object containing the rate limit data.
 */
export class Metrics {
    responseTime = 0;
    octokit = OCTOKIT;
    url;
    owner;
    repo;
    NativeURL;
    /**
     * Constructs an instance of the Metrics class.
     *
     * @param NativeURL - The native URL of the repository.
     * @param url - The URL of the repository.
     *
     * Initializes the `url` and `NativeURL` properties, and extracts the `owner` and `repo`
     * from the provided URL using the `getRepoData` method.
     */
    constructor(NativeURL, url) {
        this.url = url;
        this.NativeURL = NativeURL;
        const { owner, repo } = this.getRepoData(this.url);
        this.owner = owner;
        this.repo = repo;
    }
    /**
     * Extracts the owner and repository name from a given GitHub URL.
     *
     * @param url - The GitHub repository URL.
     * @returns An object containing the owner and repository name.
     * @throws Will throw an error if the URL is invalid.
     */
    getRepoData(url) {
        const regex = /github\.com\/([^/]+)\/([^/]+)/;
        const match = url.match(regex);
        if (!match) {
            logger.error(`${url} is an invalid GitHub URL`);
            throw new Error(`Invalid GitHub URL: ${url}`);
        }
        return { owner: match[1], repo: match[2] };
    }
    /**
     * Retrieves the current rate limit status from the GitHub API.
     *
     * @returns {Promise<Object>} A promise that resolves to an object containing the rate limit data.
     */
    async getRateLimitStatus() {
        const rateLimit = await OCTOKIT.rateLimit.get();
        return rateLimit.data.rate;
    }
}
