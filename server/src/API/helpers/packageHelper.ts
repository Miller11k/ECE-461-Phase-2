import { packagesDBClient, packageDB, dependenciesDB } from '../config/dbConfig.js';

/**
 * Calculates the cost of a package and optionally includes the cost of its dependencies.
 *
 * @param {string} packageId - The ID of the package for which to calculate the cost.
 * @param {boolean} includeDependencies - Whether to include the cost of dependencies.
 * @returns {Promise<object>} - An object containing the standalone and total cost of the package.
 */
export async function calculatePackageCost(
    packageId: string,
    includeDependencies: boolean
): Promise<{ standaloneCost: number; totalCost: number }> {
    try {
        // Retrieve package information from the database
        const packageResult = await packagesDBClient.query(
            `SELECT "size_mb" FROM ${packageDB} WHERE "ID" = $1`,
            [packageId]
        );

        if (packageResult.rows.length === 0) {
            throw new Error('Package not found');
        }

        const standaloneCost = packageResult.rows[0].size_mb;
        let totalCost = standaloneCost;

        // If dependencies are to be included, retrieve their total size in a single query
        if (includeDependencies) {
            const dependenciesCostResult = await packagesDBClient.query(
                `SELECT SUM(p."size_mb") AS total_dependency_size
                 FROM ${dependenciesDB} d
                 JOIN ${packageDB} p ON d."Dependency ID" = p."ID"
                 WHERE d."Package ID" = $1`,
                [packageId]
            );

            const dependencyCost = dependenciesCostResult.rows[0]?.total_dependency_size || 0;
            totalCost += dependencyCost;
        }

        return {
            standaloneCost,
            totalCost,
        };
    } catch (error) {
        throw error;
    }
}
