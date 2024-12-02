import { v5 as uuidv5 } from 'uuid';

/**
 * Generates a UUID for a package based on its name, version, and current time.
 * 
 * @param packageName - The name of the package (e.g., "lodash").
 * @param version - The version of the package (e.g., "1.3.4").
 * @returns A UUID string uniquely identifying the package, version, and timestamp.
 */
export function generatePackageID(packageName: string, version: string): string {
    const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Namespace UUID (constant)
    const timestamp = new Date().toISOString(); // Current time in ISO format
    const packageIdentifier = `${packageName}@${version}-${timestamp}`;
    return uuidv5(packageIdentifier, NAMESPACE);
}