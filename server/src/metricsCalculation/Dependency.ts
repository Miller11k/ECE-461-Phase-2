import { Metrics, logger } from "./Metrics.js";
import * as fs from 'fs/promises';


/**
 * @class DependencyPinning
 * @brief A class for calculating and evaluating the dependency pinning score of a repository.
 *
 * This metric measures the fraction of dependencies pinned to at least a specific major+minor version.
 */
export class DependencyPinning extends Metrics {
    /**
     * @brief The dependency pinning score of the repository.
     *
     * Initialized to -1 until evaluated.
     */
    public dependencyPinning: number = -1;

    /**
     * @brief Constructs a new instance of the DependencyPinning class.
     *
     * Initializes the class with the native URL and the repository URL.
     *
     * @param nativeUrl The native URL to connect to.
     * @param url The repository URL.
     */
    constructor(nativeUrl: string, url: string) {
        super(nativeUrl, url);
    }

    /**
     * @brief Fetches the dependencies from the `package.json` file in the repository.
     *
     * Uses Octokit to retrieve and parse the `package.json` file.
     *
     * @param owner The owner of the repository.
     * @param repo The name of the repository.
     * @return A promise that resolves to a dictionary of dependencies with their version constraints.
     *         Returns an empty object if the repository does not contain a `package.json`.
     */
    private async getDependenciesFromGitHub(owner: string, repo: string): Promise<{ [key: string]: string }> {
        try {
            const { data: fileContent } = await this.octokit.repos.getContent({
                owner,
                repo,
                path: "package.json"
            });

            if (!fileContent || !("content" in fileContent)) {
                logger.error(`Failed to fetch package.json for ${owner}/${repo}. File content is empty or invalid.`);
                return {};
            }

            // Decode base64 content
            const packageJsonContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
            // const packageJson = JSON.parse(packageJsonContent);

            // Save the package.json to a local file for verification
            // just for testing

             const packageJson = JSON.parse(packageJsonContent);

            // Return dependencies or an empty object if none exist
            return packageJson.dependencies || {};
      } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error fetching dependencies from GitHub for ${owner}/${repo}: ${error.message}`);
            } else {
                logger.error(`Unexpected error: ${JSON.stringify(error)}`);
            }
            return {};
        }
    }

    /**
     * @brief Calculates the dependency pinning score for a given repository.
     *
     * If the repository has no dependencies, the score is 1.0.
     * Otherwise, it calculates the fraction of dependencies pinned to a specific major+minor version.
     *
     * @param owner The owner of the repository.
     * @param repo The name of the repository.
     * @return A promise that resolves to the dependency pinning score (a number between 0 and 1).
     *         Returns -1 if there was an error fetching dependencies.
     */
    private async calculateDependencyPinning(owner: string, repo: string): Promise<number> {
        try {
            const dependencies = await this.getDependenciesFromGitHub(owner, repo);

            // Return a score of 1.0 if there are no dependencies
            if (Object.keys(dependencies).length === 0) {

                return 1.0;
            }


            let pinnedCount = 0;

            for (const version of Object.values(dependencies)) {
                if (!/^[~^]/.test(version)) {
                    // if it does not have a carat or tilde then its pinned
                    pinnedCount++;
                }                
            }

            // Fraction of pinned dependencies
            return pinnedCount / Object.keys(dependencies).length;
     } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error calculatin dependency ${owner}/${repo}: ${error.message}`);
            } else {
                logger.error(`Unexpected error`);
            }
            return -1;
    }}

    /**
     * @brief Evaluates the dependency pinning metric for the repository.
     *
     * This method calculates the dependency pinning score and sets the response time.
     *
     * @return A promise that resolves to the dependency pinning score.
     */
    public async evaluate(): Promise<number> {
        const rateLimitStatus = await this.getRateLimitStatus();

        if (rateLimitStatus.remaining === 0) {
            const resetTime = new Date(rateLimitStatus.reset * 1000).toLocaleTimeString();
            console.log(`Rate limit exceeded. Try again after ${resetTime}`);

            return -1;
        }


        logger.debug(`Evaluating Dependency Pinning for ${this.url}`);
        const startTime = performance.now();

        this.dependencyPinning = await this.calculateDependencyPinning(this.owner, this.repo);

        const endTime = performance.now();
        this.responseTime = (endTime - startTime) / 1000; // Convert to seconds

        logger.debug(`Dependency Pinning: ${this.dependencyPinning}`);
        return this.dependencyPinning;
    }
}

/**
 * Perform a series of dependency pinning tests on a set of repositories.
 *
 * This function evaluates the dependency pinning score for various repositories by comparing
 * the calculated score against an expected value within a specified threshold.
 *
 * @returns {Promise<{ passed: number, failed: number }>} An object containing the number of passed and failed tests.
 *
 * @example
 * const result = await DependencyPinningTest();
 * console.log(`Tests Passed: ${result.passed}, Tests Failed: ${result.failed}`);
 */
export async function DependencyPinningTest(): Promise<{ passed: number, failed: number }> {
    logger.info("\nRunning Dependency Pinning Tests");
    let testsPassed = 0;
    let testsFailed = 0;

    const url_to_expected_score = [
        { url: "https://github.com/nullivex/nodist", expectedDependencyPinning: 1.0 },
        { url: "https://github.com/cloudinary/cloudinary_npm", expectedDependencyPinning: 0.5 },
        { url: "https://github.com/lodash/lodash", expectedDependencyPinning: 0.33 }
    ];

    for (const test of url_to_expected_score) {
        const dependencyPinning = new DependencyPinning(test.url, test.url);
        const result = await dependencyPinning.evaluate();
        const threshold: number = 0.1;

        if (
            Math.abs(result - test.expectedDependencyPinning) <= threshold &&
            dependencyPinning.responseTime < 4.0
        ) {
            testsPassed++;
        } else {
            testsFailed++;
        }

        logger.debug(
            `Dependency Pinning Response Time: ${dependencyPinning.responseTime.toFixed(6)}s`
        );
    }

    return { passed: testsPassed, failed: testsFailed };
}
