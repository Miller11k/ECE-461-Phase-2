import { Octokit } from "@octokit/rest";
// Initialize Octokit for GitHub API
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // Use your GitHub token for authentication
});
/**
 * Fetches the version of a package from its `package.json` file on GitHub.
 *
 * @param owner The owner of the repository.
 * @param repo The name of the repository.
 * @returns A promise that resolves to the version string of the package, or `null` if not found.
 */
export async function getPackageVersion(owner, repo) {
    try {
        // Fetch the package.json file content from GitHub
        const { data: fileContent } = await octokit.repos.getContent({
            owner,
            repo,
            path: "package.json",
        });
        if (!fileContent || !("content" in fileContent)) {
            console.error(`Failed to fetch package.json for ${owner}/${repo}. File content is empty or invalid.`);
            return 'bad';
        }
        // Decode base64 content
        const packageJsonContent = Buffer.from(fileContent.content, "base64").toString("utf-8");
        const packageJson = JSON.parse(packageJsonContent);
        // Return the version from package.json
        return packageJson.version;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error fetching package version for ${owner}/${repo}: ${error.message}`);
        }
        else {
            console.error(`Unexpected error: ${JSON.stringify(error)}`);
        }
        return 'bad';
    }
}
