import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import * as stream from "stream";
import unzipper from "unzipper";
import { dependenciesDB, packagesDBClient } from "../config/dbConfig.js";
import { validate as isUUID } from "uuid";

const execAsync = promisify(exec);

/**
 * Queries the dependencies database to fetch all dependencies for a given package ID.
 *
 * @param {string} packageId - The UUID of the package to fetch dependencies for.
 * @returns {Promise<Map<string, { name: string, size: number }>>} - A map of Dependency IDs to their corresponding names and sizes.
 * @throws {Error} If there is an issue with the database query or connection.
 */
export const getDependenciesByPackageId = async (packageId: string): Promise<Map<string, { name: string; size: number }>> => {

    if (!packageId) {
        throw new Error("Package ID is required");
    }

    if (!isUUID(packageId)) {
        throw new Error("Invalid Package ID. Must be a valid UUID.");
    }

    const query = `
        SELECT "Dependency ID", "name", "size" 
        FROM ${dependenciesDB}
        WHERE "Package ID" = $1
    `;

    try {
        await packagesDBClient.connect(); // Ensure the database is connected

        const result = await packagesDBClient.query(query, [packageId]);

        if (result.rows.length === 0) {
            return new Map();
        }

        const dependenciesMap = new Map<string, { name: string; size: number }>();
        result.rows.forEach((row) => {
            // Only print UUID and size
            dependenciesMap.set(row["Dependency ID"], {
                name: row.name,
                size: parseFloat(row.size),
            });
        });

        return dependenciesMap;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Failed to fetch dependencies: " + error.message);
        } else {
            throw new Error("Failed to fetch dependencies due to an unknown error.");
        }
    } finally {
        await packagesDBClient.end(); // Always close the connection after execution
    }
};

/**
 * Recursively calculates the sizes of all dependencies and their sub-dependencies,
 * starting from a Base64-encoded zip file containing a `package.json`.
 *
 * @param {string} zipFileBase64 - The Base64-encoded zip file content.
 * @returns {Promise<{ dependencySizes: Record<string, number>, totalCost: number, totalFolderSize: number }>}
 * A promise that resolves to an object with dependency sizes, total cost, and total folder size in MB.
 */
export async function get_all_costs(
    zipFileBase64: string
  ): Promise<{
    dependencyCosts: Record<string, { standaloneCost: number; totalCost: number }>;
    totalFolderSize: number;
  }> {
    const zipBuffer = Buffer.from(zipFileBase64, "base64");
    if (zipBuffer.slice(0, 4).toString() !== "PK\x03\x04") {
      throw new Error("The provided Base64 string does not represent a valid zip file.");
    }
  
    let tempDir: string | null = null;
  
    async function calculateDependencyCost(
      nodeModulesPath: string
    ): Promise<{
      costs: Record<string, { standaloneCost: number; totalCost: number }>;
      total: number;
    }> {
      const dependencies = await fs.readdir(nodeModulesPath, { withFileTypes: true });
      const dependencyCosts: Record<string, { standaloneCost: number; totalCost: number }> = {};
      let totalCost = 0;
  
      for (const dependency of dependencies) {
        if (dependency.isDirectory()) {
          const dependencyPath = path.join(nodeModulesPath, dependency.name);
          const standaloneSize = await calculateDirectorySize(dependencyPath);
          const standaloneCost = Math.round((standaloneSize / (1024 * 1024)) * 100) / 100; // Convert to MB and round
  
          let subDependencyTotalCost = 0;
  
          const subNodeModulesPath = path.join(dependencyPath, "node_modules");
          if (await fs.stat(subNodeModulesPath).then(stat => stat.isDirectory()).catch(() => false)) {
            const subCosts = await calculateDependencyCost(subNodeModulesPath);
            subDependencyTotalCost = subCosts.total;
            Object.entries(subCosts.costs).forEach(([subName, subCost]) => {
              dependencyCosts[`${dependency.name} > ${subName}`] = subCost;
            });
          }
  
          const totalCostForDependency = standaloneCost + subDependencyTotalCost;
  
          dependencyCosts[dependency.name] = {
            standaloneCost,
            totalCost: totalCostForDependency,
          };
  
          totalCost += totalCostForDependency;
        }
      }
  
      return { costs: dependencyCosts, total: totalCost };
    }
  
    try {
      tempDir = await unzipToTempDir(zipBuffer);
  
      const packageJsonPath = await findPackageJson(tempDir);
      if (!packageJsonPath) {
        throw new Error("No package.json found in the zip file.");
      }
  
      await execAsync("npm install --ignore-scripts --legacy-peer-deps --force", {
        cwd: path.dirname(packageJsonPath),
      });
  
      const nodeModulesPath = path.join(path.dirname(packageJsonPath), "node_modules");
      const { costs: dependencyCosts, total: totalCost } = await calculateDependencyCost(nodeModulesPath);
  
      const totalFolderSizeBytes = await calculateDirectorySize(tempDir);
      const totalFolderSizeMB = Math.round((totalFolderSizeBytes / (1024 * 1024)) * 100) / 100;
  
      return { dependencyCosts, totalFolderSize: totalFolderSizeMB };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Failed to calculate costs and total folder size: " + error.message);
      } else {
        throw new Error("An unknown error occurred.");
      }
    } finally {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          if (cleanupError instanceof Error) {
            console.warn("Failed to clean up temporary directory:", tempDir, cleanupError.message);
          }
        }
      }
    }
  }


/**
 * Recursively searches for a `package.json` file in a directory hierarchy.
 */
async function findPackageJson(dir: string): Promise<string | null> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === "package.json") {
      return entryPath;
    } else if (entry.isDirectory()) {
      const nestedResult = await findPackageJson(entryPath);
      if (nestedResult) return nestedResult;
    }
  }

  return null;
}

/**
 * Unzips a zip file buffer into a temporary directory.
 */
async function unzipToTempDir(zipBuffer: Buffer): Promise<string> {
  const tempDir = path.join(tmpdir(), `temp-unzip-${Date.now()}`);
  await fs.mkdir(tempDir);

  const zipStream = new stream.PassThrough();
  zipStream.end(zipBuffer);

  await new Promise<void>((resolve, reject) => {
    zipStream
      .pipe(unzipper.Extract({ path: tempDir }))
      .on("close", resolve)
      .on("error", reject);
  });

  return tempDir;
}

/**
 * Calculates the size of a directory and its contents.
 */
async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function calculateSize(currentPath: string) {
    const stats = await fs.stat(currentPath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const entries = await fs.readdir(currentPath);
      await Promise.all(entries.map(entry => calculateSize(path.join(currentPath, entry))));
    }
  }

  await calculateSize(dirPath);
  return totalSize;
}