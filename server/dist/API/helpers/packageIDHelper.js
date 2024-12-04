/**
 * @module PackageUUIDGenerator
 * Provides a utility function to generate unique identifiers for packages.
 */
import { v5 as uuidv5 } from 'uuid';
/**
 * Generates a UUID for a package based on its name, version, and the current timestamp.
 *
 * @function generatePackageID
 * @param {string} packageName - The name of the package (e.g., "lodash").
 * @param {string} version - The version of the package (e.g., "1.3.4").
 * @returns {string} A UUID string uniquely identifying the package, version, and timestamp.
 *
 * @example
 * // Generate a unique ID for lodash version 4.17.21
 * const packageID = generatePackageID('lodash', '4.17.21');
 * console.log(packageID);
 */
export function generatePackageID(packageName, version) {
    const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // Namespace UUID (constant)
    const timestamp = new Date().toISOString(); // Current time in ISO format
    const packageIdentifier = `${packageName}@${version}-${timestamp}`;
    return uuidv5(packageIdentifier, NAMESPACE);
}
