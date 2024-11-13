import { Metrics, logger } from "./Metrics.js";
import { ASSERT_LT, ASSERT_NEAR } from './testUtils.js';

/**
 * @function getDependenciesFromGitHub
 * @description Fetches the list of dependencies from the `package.json` file of a GitHub repository.
 * 
 * @param owner The owner of the repository.
 * @param repo The name of the repository.
 * @returns A promise that resolves to an object containing the dependencies and their versions.
 */
async function getDependenciesFromGitHub(owner: string, repo: string): Promise<{ [key: string]: string }> {
    try {
        // Fetch `package.json` from GitHub
        const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
        if (!response.ok) {
            logger.error(`Failed to fetch package.json for ${owner}/${repo}`);
            return {};
        }

        const packageJson = await response.json();
        return packageJson.dependencies || {};
    } catch (error) {
        logger.error(`Error fetching dependencies from GitHub: ${error}`);
        return {};
    }
}

/**
 * @class DependencyPinning
 * @extends Metrics
 * @description Calculates the fraction of dependencies with specific version pinning for a repository.
 */
export class DependencyPinning extends Metrics {
    public dependencyPinningScore: number = -1;
    public responseTime: number = -1;

    constructor(nativeUrl: string, url: string) {
        super(nativeUrl, url);
    }

    /**
     * Calculates the dependency pinning score by fetching the dependencies from GitHub
     * and checking if each dependency is pinned to a specific version.
     */
    private async calculateDependencyPinning(owner: string, repo: string): Promise<number> {
        const dependencies = await getDependenciesFromGitHub(owner, repo);

        // Return a score of 1.0 if there are no dependencies
        if (Object.keys(dependencies).length === 0) {
            return 1.0;
        }

        // Count dependencies with specific version pinning
        let pinnedCount = 0;
        for (const version of Object.values(dependencies)) {
            if (/^\d+\.\d+(\.\d+)?$/.test(version)) { // Check for "X.Y" or "X.Y.Z" format
                pinnedCount++;
            }
        }

        // Calculate fraction of pinned dependencies
        return pinnedCount / Object.keys(dependencies).length;
    }

    /**
     * Evaluates the Dependency Pinning score by calculating the fraction of dependencies that are pinned.
     * 
     * @returns {Promise<number>} - The Dependency Pinning score.
     */
    public async evaluate(): Promise<number> {
        logger.debug(`Evaluating Dependency Pinning for ${this.url}`);
        const startTime = performance.now();

        const ownerRepo = this.url.replace("https://github.com/", "").split("/");
        const [owner, repo] = ownerRepo;
        this.dependencyPinningScore = await this.calculateDependencyPinning(owner, repo);

        const endTime = performance.now();
        this.responseTime = (endTime - startTime) / 1000; // Convert to seconds

        logger.debug(`Dependency Pinning Score: ${this.dependencyPinningScore}`);
        return this.dependencyPinningScore;
    }
}

// Example test function to validate Dependency Pinning functionality
export async function DependencyPinningTest(): Promise<{ passed: number, failed: number }> {
    logger.info('\nRunning Dependency Pinning Tests');
    let testsPassed = 0;
    let testsFailed = 0;
    const testCases = [
        { owner: "cloudinary", repo: "cloudinary_npm", expectedScore: 0.5 },
        { owner: "lodash", repo: "lodash", expectedScore: 1.0 }
    ];

    for (const test of testCases) {
        const dependencyPinning = new DependencyPinning(`https://github.com/${test.owner}/${test.repo}`, `https://github.com/${test.owner}/${test.repo}`);
        const result = await dependencyPinning.evaluate();
        const threshold = 0.1;
        
        if (ASSERT_NEAR(result, test.expectedScore, threshold, `Dependency Pinning Test for ${test.repo}`)) {
            testsPassed++;
        } else {
            testsFailed++;
        }
    }

    return { passed: testsPassed, failed: testsFailed };
}
