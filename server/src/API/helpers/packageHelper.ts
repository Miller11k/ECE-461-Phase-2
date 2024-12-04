import { packagesDBClient, packageDB, dependenciesDB } from '../config/dbConfig.js';

/**
 * Calculates the cost of a package and optionally includes the cost of its dependencies.
 *
 * @param {string} packageId - The ID of the package for which to calculate the cost.
 * @param {boolean} includeDependencies - Whether to include the cost of dependencies.
 * @returns {Promise<object>} - An object containing the standalone and total cost of the package.
 */
export async function calculatePackageCost(packageId: string, includeDependencies: boolean): Promise<{ standaloneCost: number; totalCost: number }> {
    try {
        // Retrieve package information from the database
        const packageResult = await packagesDBClient.query(
            `SELECT "size_mb" FROM ${packageDB} WHERE "ID" = $1`,
            [packageId]
        );

        if (packageResult.rows.length === 0) {
            throw new Error('Package not found');
        }

        const packageData = packageResult.rows[0];
        let standaloneCost = packageData.size_mb;
        let totalCost = standaloneCost;

        // If dependencies are to be included, retrieve and add their costs
        if (includeDependencies) {
            const dependenciesResult = await packagesDBClient.query(
                `SELECT "Dependency ID" FROM ${dependenciesDB} WHERE "Package ID" = $1`,
                [packageId]
            );

            if (dependenciesResult.rows.length > 0) {
                for (const dependency of dependenciesResult.rows) {
                    const dependencyId = dependency["Dependency ID"];
                    const dependencyCostResult = await packagesDBClient.query(
                        `SELECT "size_mb" FROM ${packageDB} WHERE "ID" = $1`,
                        [dependencyId]
                    );

                    if (dependencyCostResult.rows.length > 0) {
                        totalCost += dependencyCostResult.rows[0].size_mb;
                    }
                }
            }
        }

        return {
            standaloneCost,
            totalCost
        };
    } catch (error) {
        console.error('Error calculating package cost:', error);
        throw error;
    }
}
