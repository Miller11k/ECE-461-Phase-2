import { Metrics, logger } from "./Metrics.js";
/**
 * @class CodeReviewFraction
 * @brief A class for calculating the fraction of code introduced through pull requests with a code review.
 */
export class CodeReviewFraction extends Metrics {
    /**
     * @brief The code review fraction score for the repository.
     *
     * Initialized to -1 until evaluated.
     */
    codeReviewFraction = -1;
    /**
     * @brief Constructs a new instance of the CodeReviewFraction class.
     *
     * @param nativeUrl The native URL to connect to.
     * @param url The repository URL.
     */
    constructor(nativeUrl, url) {
        super(nativeUrl, url);
    }
    /**
     * @brief Fetches and calculates the code review fraction for the repository.
     *
     * Retrieves pull requests and their reviews to determine the fraction of reviewed pull requests.
     *
     * @param owner The owner of the repository.
     * @param repo The name of the repository.
     * @return A promise that resolves to the code review fraction, a number between 0 and 1.
     *         Returns -1 if there was an error fetching the data.
     */
    async calculateCodeReviewFraction(owner, repo) {
        try {
            // Fetch the most recent 100 pull requests
            const { data: pullRequests } = await this.octokit.pulls.list({
                owner: owner,
                repo: repo,
                state: "closed", // Include merged pull requests
                per_page: 100, // Limit to 100 pull requests
            });
            let mergedPullRequests = 0;
            let reviewedPullRequests = 0;
            for (const pr of pullRequests) {
                if (pr.merged_at) {
                    mergedPullRequests++;
                    // Fetch reviews for the pull request
                    const { data: reviews } = await this.octokit.pulls.listReviews({
                        owner: owner,
                        repo: repo,
                        pull_number: pr.number,
                    });
                    if (reviews.length > 0) {
                        reviewedPullRequests++;
                    }
                }
            }
            // Return 1.0 if no merged pull requests exist
            if (mergedPullRequests === 0) {
                return 1.0;
            }
            // Calculate the fraction of reviewed pull requests
            return reviewedPullRequests / mergedPullRequests;
        }
        catch (error) {
            logger.error("Error fetching pull requests or reviews:", error);
            return -1;
        }
    }
    /**
     * @brief Evaluates the code review fraction for the repository.
     *
     * If the GitHub API rate limit is exceeded, the evaluation will not proceed.
     *
     * @return A promise that resolves to the code review fraction score.
     */
    async evaluate() {
        const rateLimitStatus = await this.getRateLimitStatus();
        if (rateLimitStatus.remaining === 0) {
            const resetTime = new Date(rateLimitStatus.reset * 1000).toLocaleTimeString();
            console.log(`Rate limit exceeded. Try again after ${resetTime}`);
            return -1;
        }
        logger.debug(`Evaluating Code Review Fraction for ${this.url}`);
        const startTime = performance.now();
        this.codeReviewFraction = await this.calculateCodeReviewFraction(this.owner, this.repo);
        const endTime = performance.now();
        const elapsedTime = Number(endTime - startTime) / 1e6; // Convert to milliseconds
        this.responseTime = elapsedTime;
        logger.debug(`Code Review Fraction: ${this.codeReviewFraction}`);
        return this.codeReviewFraction;
    }
}
