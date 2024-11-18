import { Octokit } from '@octokit/rest';
import { createLogger, format, Logger, transports } from 'winston';
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
    throw new Error('LOG_LEVEL is not defined in the .env file')
}
else{
       switch(logLevel){
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
export let OCTOKIT: Octokit = new Octokit({ auth: githubToken });

// Create a logger
export let logger: Logger = createLogger({
    level: logLevel,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
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
export abstract class Metrics {
    public responseTime: number = 0;
    public octokit: Octokit = OCTOKIT;

    protected url: string;
    protected owner: string;
    protected repo: string;
    public NativeURL: string;

    /**
     * Constructs an instance of the Metrics class.
     * 
     * @param NativeURL - The native URL of the repository.
     * @param url - The URL of the repository.
     * 
     * Initializes the `url` and `NativeURL` properties, and extracts the `owner` and `repo` 
     * from the provided URL using the `getRepoData` method.
     */
    constructor(NativeURL: string, url: string) {
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
    private getRepoData(url: string): { owner: string; repo: string } {
        const regex = /github\.com\/([^/]+)\/([^/]+)/;
        const match = url.match(regex);
        if (!match) {
            logger.error(`${url} is an invalid GitHub URL`);
            throw new Error(`Invalid GitHub URL: ${url}`);
        }
        return { owner: match[1], repo: match[2] };
    }

    /**
     * Abstract method to evaluate the repository. Must be implemented in subclasses.
     * 
     * @abstract
     * @returns {Promise<number>} A promise that resolves to a number representing the evaluation result.
     */
    abstract evaluate(): Promise<number>;

    /**
     * Retrieves the current rate limit status from the GitHub API.
     *
     * @returns {Promise<Object>} A promise that resolves to an object containing the rate limit data.
     */
    public async getRateLimitStatus() {
        const rateLimit = await OCTOKIT.rateLimit.get();
        return rateLimit.data.rate;
    }
}
