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
  console.log(`INPUT: ${zipFileBase64}`);
  const isValidBase64 = (str: string) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str.trim();
    } catch (error) {
        return false;
    }
  };
  console.log("Is valid Base64 string:", isValidBase64(zipFileBase64));


  console.log("Received Base64 string for processing.");
  const zipFileBuffer = Buffer.from(zipFileBase64, "base64");


  console.log("Converted Base64 string to buffer.");

  // Validate if the file has the PK header
  const fileHeader = zipFileBuffer.slice(0, 4).toString();
  console.log(`File header: ${fileHeader}`);
  if (fileHeader !== "PK\x03\x04") {
      console.error("Invalid zip file header detected.");
      throw new Error("The provided Base64 string does not represent a valid zip file.");
  }

  try {
      console.log("Starting to process the zip file...");
      const zipStream = new stream.PassThrough();
      zipStream.end(zipFileBuffer);

      let totalUncompressedSize = 0;

      await new Promise<void>((resolve, reject) => {
          zipStream
              .pipe(unzipper.Parse())
              .on("entry", (entry: unzipper.Entry) => {
                  console.log(`Processing entry: ${entry.path}, Type: ${entry.type}`);
                  if (entry.type === "File") {
                      let fileSize = 0;

                      entry.on("data", (chunk) => {
                          fileSize += chunk.length;
                          console.log(`Read chunk of size: ${chunk.length}, Total so far: ${fileSize}`);
                      });

                      entry.on("end", () => {
                          console.log(`Finished reading file: ${entry.path}, Size: ${fileSize}`);
                          totalUncompressedSize += fileSize;
                      });
                  } else {
                      console.log(`Skipping non-file entry: ${entry.path}`);
                      entry.autodrain(); // Skip directories and other entries
                  }
              })
              .on("close", () => {
                  console.log("Finished processing all entries in the zip file.");
                  resolve();
              })
              .on("error", (error) => {
                  console.error("Error while parsing the zip file:", error);
                  reject(error);
              });
      });

      // Convert bytes to MB and round to 2 decimal places
      const totalSizeInMB = Math.round((totalUncompressedSize / (1024 * 1024)) * 100) / 100;
      console.log(`Total uncompressed size: ${totalUncompressedSize} bytes, which is ${totalSizeInMB} MB.`);
      return totalSizeInMB;
  } catch (error) {
      console.error("Error in get_standalone_cost:", error);
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
        console.log(`File: ${currentPath}, Size: ${stats.size}`);
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
      console.log("Decoding and unzipping file...");
      tempDir = await unzipToTempDir(zipBuffer);
      console.log("Temporary directory created at:", tempDir);
  
      const packageJsonPath = await findPackageJson(tempDir);
      if (!packageJsonPath) {
        throw new Error("No package.json found in the zip file.");
      }
  
      console.log("Found package.json at:", packageJsonPath);
  
      console.log("Running npm install...");
      await execAsync("npm install --ignore-scripts --legacy-peer-deps --force", { cwd: path.dirname(packageJsonPath) });
  
      const totalSize = await calculateDirectorySize(tempDir);
      console.log("Total size in bytes:", totalSize);
  
      return Math.round((totalSize / (1024 * 1024)) * 100) / 100;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in get_total_cost:", error.message);
        throw new Error("Failed to calculate total cost: " + error.message);
      } else {
        console.error("Unexpected error type:", error);
        throw new Error("An unknown error occurred.");
      }
    } finally {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log("Cleaned up temporary directory:", tempDir);
        } catch (cleanupError) {
          if(cleanupError instanceof Error){
            console.warn("Failed to clean up temporary directory:", tempDir, cleanupError.message);
          }
        }
      }
    }
  } 