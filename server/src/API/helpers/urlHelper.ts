/**
 * Extracts the first GitHub URL from a package.json object.
 * Converts `git://` URLs to `https://`.
 * 
 * @param {Object} packageJson - The package.json object to search.
 * @param {string} packageName - The name of the package.
 * @returns {string | null} - The first GitHub URL found, or null if none exists.
 */
export function extractGitHubUrl(packageJson: Record<string, any>, packageName: string): string | null {
    if (!packageJson || typeof packageJson !== 'object') {
      return null;
    }
  
    // Check the repository field for a URL
    if (packageJson.repository && typeof packageJson.repository.url === 'string') {
      let repositoryUrl = packageJson.repository.url;
  
      // Handle git+https:// URLs
      if (repositoryUrl.startsWith('git+https://')) {
        repositoryUrl = repositoryUrl.replace('git+https://', 'https://');
      }
  
      // Handle git:// URLs
      if (repositoryUrl.startsWith('git://')) {
        return convertGitUrlToHttp(repositoryUrl);
      }
  
      return repositoryUrl.replace(/\.git$/, ''); // Remove `.git` suffix
    }
  
    // If repository field isn't present, look in the package.json string
    const packageJsonString = JSON.stringify(packageJson, null, 2);
  
    // Regex to find GitHub URLs (including git+https://)
    const githubUrlRegex = /(git\+)?https:\/\/github\.com\/[^\s",]+/g;
  
    // Match URLs in the package.json string
    const match = packageJsonString.match(githubUrlRegex);
    if (match && match.length > 0) {
      return match[0]
        .replace(/^git\+https:\/\//, 'https://') // Convert git+https:// to https://
        .replace(/\.git$/, ''); // Remove `.git` suffix
    }
  
    return null;
  }  
  
  /**
   * Converts a `git://` GitHub URL to an `https://` link.
   * 
   * @param {string} gitUrl - The `git://` URL to convert.
   * @returns {string | null} - The converted `https://` URL, or `null` if invalid.
   */
  function convertGitUrlToHttp(gitUrl: string): string | null {
    if (!gitUrl || typeof gitUrl !== 'string') {
      return null;
    }
  
    // Replace `git://` with `https://`
    let httpUrl = gitUrl.replace('git://', 'https://');
  
    // Remove the `.git` suffix if present
    if (httpUrl.endsWith('.git')) {
      httpUrl = httpUrl.slice(0, -4);
    }
  
    return httpUrl;
  }