/**
 * @module VersionValidator
 * Provides a utility function to validate version strings.
 */

/**
 * Validates the version format to ensure it follows the pattern "<integer>.<integer>.<integer>".
 * 
 * A valid version string:
 * - Consists of three numeric segments separated by dots (e.g., "1.0.0", "2.1.5").
 * - Each segment must be an integer (no leading zeros unless the number is `0`).
 * 
 * @function isValidVersion
 * @param {string} version - The version string to validate.
 * @returns {boolean} `true` if the version string is valid, otherwise `false`.
 * 
 * @example
 * validVersion = isValidVersion("a.b.c"); // false
 */
export function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}


/**
 * Extracts the semantic version (major.minor.patch) from a version string.
 * 
 * If the version string contains additional metadata (e.g., "1.0.0-beta.1"),
 * this function extracts only the semantic version (e.g., "1.0.0").
 * 
 * @function getSemanticVersion
 * @param {string} version - The full version string to process.
 * @returns {string} - The extracted semantic version (e.g., "1.0.0"), or the original version if no match is found.
 * 
 */
export function getSemanticVersion(version: string): string {
  const semanticVersionRegex = /^(\d+\.\d+\.\d+)/;
  const match = version.match(semanticVersionRegex);
  return match ? match[0] : version; // Fallback to original if no match
}