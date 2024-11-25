import { NetScore } from './netScore.js'; // Import the relevant metrics module
import { logger } from './Metrics.js'; // Logger for debug/info purposes

/**
 * Evaluates metrics for a given repository URL and returns the result as a JSON object.
 * 
 * @param repoUrl - The URL of the repository to evaluate.
 * @returns A promise resolving to an object containing the metrics and latencies.
 */
export async function getRepositoryMetrics(repoUrl: string): Promise<object> {
    if (!repoUrl) {
        throw new Error('Error: Repository URL cannot be empty.');
    }

    try {
        // Initialize the NetScore metric
        const netScore = new NetScore(repoUrl, repoUrl);

        // Evaluate the metrics
        const score = await netScore.evaluate();

        // Prepare the JSON output
        const result = {
            repository: repoUrl,
            metrics: {
                netScore: netScore.netScore,
                rampUp: netScore.rampUp.rampUp,
                correctness: netScore.correctness.correctness,
                busFactor: netScore.busFactor.busFactor,
                responsiveMaintainer: netScore.maintainability.maintainability,
                license: netScore.license.license,
                dependencyPinning: netScore.DependencyPinning.dependencyPinning,
                codeReviewFraction: netScore.CodeReviewFraction.codeReviewFraction,
            },
            latencies: {
                netScore: netScore.responseTime,
                rampUp: netScore.rampUp.responseTime,
                correctness: netScore.correctness.responseTime,
                busFactor: netScore.busFactor.responseTime,
                responsiveMaintainer: netScore.maintainability.responseTime,
                license: netScore.license.responseTime,
            },
        };

        return result;
    } catch (error) {
        logger.error('Error calculating metrics:', error);
        throw error;
    }
}


// import { getRepositoryMetrics } from './cli.js';

async function main() {
    const repoUrl = 'https://github.com/cloudinary/cloudinary_npm';

    try {
        const metrics = await getRepositoryMetrics(repoUrl);
        console.log(JSON.stringify(metrics, null, 2));
    } catch (error) {
        console.error('Failed to retrieve metrics:', error);
    }
}

main();
