import fs from "fs/promises";
import * as stream from "stream";
import path from "path";
import unzipper from "unzipper";
import { exec } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";

const execAsync = promisify(exec);


/**
 * Calculates the total size of the uncompressed contents within a Base64-encoded zip file in MB.
 *
 * @param {string} zipFileBase64 - The Base64-encoded zip file content.
 * @returns {Promise<number>} A promise that resolves to the total size of the uncompressed contents in MB.
 */
export async function get_standalone_cost(zipFileBase64: string): Promise<number> {
  const isValidBase64 = (str: string) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str.trim();
    } catch (error) {
        return false;
    }
  };


  const zipFileBuffer = Buffer.from(zipFileBase64, "base64");



  // Validate if the file has the PK header
  const fileHeader = zipFileBuffer.slice(0, 4).toString();
  if (fileHeader !== "PK\x03\x04") {
      throw new Error("The provided Base64 string does not represent a valid zip file.");
  }

  try {
      const zipStream = new stream.PassThrough();
      zipStream.end(zipFileBuffer);

      let totalUncompressedSize = 0;

      await new Promise<void>((resolve, reject) => {
          zipStream
              .pipe(unzipper.Parse())
              .on("entry", (entry: unzipper.Entry) => {
                  if (entry.type === "File") {
                      let fileSize = 0;

                      entry.on("data", (chunk) => {
                          fileSize += chunk.length;
                      });

                      entry.on("end", () => {
                          totalUncompressedSize += fileSize;
                      });
                  } else {
                      entry.autodrain(); // Skip directories and other entries
                  }
              })
              .on("close", () => {
                  resolve();
              })
              .on("error", (error) => {
                  reject(error);
              });
      });

      // Convert bytes to MB and round to 2 decimal places
      const totalSizeInMB = Math.round((totalUncompressedSize / (1024 * 1024)) * 100) / 100;
      return totalSizeInMB;
  } catch (error) {
      throw new Error("Failed to calculate standalone cost due to invalid zip content.");
  }
}


/* ************************************** */

/**
 * Recursively searches for a `package.json` file in a directory hierarchy.
 *
 * @param {string} dir - The starting directory.
 * @returns {Promise<string | null>} The path to `package.json` if found, or `null` if not found.
 */
export async function findPackageJson(dir: string): Promise<string | null> {
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
   *
   * @param {Buffer} zipBuffer - The zip file buffer.
   * @returns {Promise<string>} The path to the extracted folder.
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
 *
 * @param {string} dirPath - The path to the directory.
 * @returns {Promise<number>} The size of the directory in bytes.
 */
async function calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
  
    async function calculateSize(currentPath: string) {
      const stats = await fs.stat(currentPath);
  
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        const entries = await fs.readdir(currentPath);
        await Promise.all(entries.map((entry) => calculateSize(path.join(currentPath, entry))));
      }
    }
  
    await calculateSize(dirPath);
    return totalSize;
  }
  
  export async function get_total_cost(zipFileBase64: string): Promise<number> {
    const zipBuffer = Buffer.from(zipFileBase64, "base64");
    if (zipBuffer.slice(0, 4).toString() !== "PK\x03\x04") {
      throw new Error("The provided Base64 string does not represent a valid zip file.");
    }
  
    let tempDir: string | null = null;
  
    try {
      tempDir = await unzipToTempDir(zipBuffer);
  
      const packageJsonPath = await findPackageJson(tempDir);
      if (!packageJsonPath) {
        throw new Error("No package.json found in the zip file.");
      }
  
      await execAsync("npm install --ignore-scripts --legacy-peer-deps --force", { cwd: path.dirname(packageJsonPath) });
  
      const totalSize = await calculateDirectorySize(tempDir);
  
      return Math.round((totalSize / (1024 * 1024)) * 100) / 100;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Failed to calculate total cost: " + error.message);
      } else {
        throw new Error("An unknown error occurred.");
      }
    } finally {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          if(cleanupError instanceof Error){
            console.warn("Failed to clean up temporary directory:", tempDir, cleanupError.message);
          }
        }
      }
    }
  }  