// sizeCost.ts

import axios from 'axios';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { logger } from './Metrics.js';

/**
 * Get the size of a ZIP file.
 * @param filePath - Path to the ZIP file.
 * @returns Size of the ZIP file in bytes.
 */
function getZipFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

/**
 * Calculate the size cost of a package and its dependencies recursively.
 * @param packageId - The package to calculate cost for.
 * @param visited - Track visited packages to avoid circular dependencies.
 * @returns An object containing standalone and total cost.
 */
export async function calculateSizeCost(packageId: string, visited: Set<string> = new Set()): Promise<any> {
    if (visited.has(packageId)) {
        return {
            standaloneCost: 0,
            totalCost: 0
        };
    }

    visited.add(packageId);

    const dependencies = await getDependencies(packageId);
    const packageZipPath = `/tmp/${packageId}.zip`;
    await downloadPackageAsZip(packageId, packageZipPath);

    const standaloneCost = getZipFileSize(packageZipPath); //Get standalone cost (ZIP file size)
    let totalCost = standaloneCost;

    for (const dep of dependencies) {  // Calculate costs for each dependency recursively
        const depCost = await calculateSizeCost(dep, visited);
        totalCost += depCost.totalCost;
    }

    fs.unlinkSync(packageZipPath); // Delete ZIP file after getting size

    return {
        standaloneCost: standaloneCost / 1024, // Convert to KB
        totalCost: totalCost / 1024 // Convert to KB
    };
}

/**
 * Get the dependencies of a package by making an API call.
 * @param packageId - The package ID.
 * @returns An array of dependency IDs.
 */
async function getDependencies(packageId: string): Promise<string[]> {
    // WE NEED AN actual API call to get dependencies.
    try {
        const response = await axios.get(`https://api.example.com/packages/${packageId}/dependencies`);
        return response.data.dependencies || [];
    } catch (error) {
        logger.error(`Failed to get dependencies for ${packageId}: ${error.message}`);
        return [];
    }
}

/**
 * Download the ZIP file for the package.
 * @param packageId - The package ID.
 * @param downloadPath - Path to save the downloaded ZIP file.
 */
async function downloadPackageAsZip(packageId: string, downloadPath: string): Promise<void> {
    try {
        // Assuming an API URL to download the package
        const response = await axios({
            url: `https://api.example.com/packages/${packageId}/download`,
            method: 'GET',
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(downloadPath);
        response.data.pipe(writer);
        await new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        logger.error(`Failed to download package ${packageId}: ${error.message}`);
    }
}
