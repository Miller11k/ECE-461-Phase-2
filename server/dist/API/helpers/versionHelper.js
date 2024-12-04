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
 * console.log(isValidVersion("1.0.0")); // true
 * console.log(isValidVersion("1.0")); // false
 * console.log(isValidVersion("a.b.c")); // false
 */
export function isValidVersion(version) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
}
