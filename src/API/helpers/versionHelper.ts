
/**
 * Validates the version format to ensure it follows "<integer>.<integer>.<integer>".
 * @param version - The version string to validate.
 * @returns True if valid, otherwise false.
 */
export function isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
  }