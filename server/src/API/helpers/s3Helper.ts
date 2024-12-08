/**
 * @module S3Utils
 * Provides utility functions for interacting with AWS S3, including fetching, zipping, unzipping, and managing files and folders.
 */

import AWS from "aws-sdk";
import archiver from "archiver";
import unzipper from "unzipper";
import stream from "stream";
import fs from "fs";
import RE2 from "re2";
const { S3 } = AWS;



/**
 * Fetches the content of a zip file from an S3 bucket and returns it as a Base64 string.
 * 
 * @async
 * @function fetchZipFileContent
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} fileKey - The key of the file in the S3 bucket.
 * @returns {Promise<string | null>} A promise that resolves to the Base64-encoded content of the file, or `null` if an error occurs.
 */
export async function fetchZipFileContent(bucketName: string, fileKey: string): Promise<string | null> {
	// Create an S3 client without a session token
	const s3 = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
	});

	try {
		// Fetch the object from S3
		const response = await s3
		.getObject({
			Bucket: bucketName,
			Key: fileKey,
		})
		.promise();

		// Check if Body exists
		if (!response.Body) {
			return null;
		}

		// Convert the file content to a Base64 string
		const base64Content = response.Body.toString("base64");

		return base64Content;
	} catch (error) {
		return null;
	}
}


/**
 * Fetches the content of a zip file from the default S3 bucket and returns it as a Base64 string.
 * 
 * @async
 * @function fetchZip
 * @param {string} fileKey - The key of the file in the S3 bucket.
 * @returns {Promise<string | null>} A promise that resolves to the Base64-encoded content of the file, or `null` if an error occurs.
 */
export async function fetchZip(fileKey: string): Promise<string | null> {
	// Create an S3 client without a session token
	const s3 = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
	});

	try {
		// Fetch the object from S3
		const response = await s3
		.getObject({
			Bucket: process.env.S3_BUCKET_NAME! || "",
			Key: fileKey,
		})
		.promise();

		// Check if Body exists
		if (!response.Body) {
			return null;
		}

		// Convert the file content to a Base64 string
		const base64Content = response.Body.toString("base64");

		return base64Content;
	} catch (error) {
		return null;
	}
}


/**
 * Fetches a folder from S3, zips its contents, and names the folder/zip file based on a convention or custom name.
 * @param s3Url - The S3 URL of the folder, e.g., s3://bucket-name/folder/key/
 * @param zipName - Optional name for the zip file and folder inside it, without the ".zip" extension.
 * @returns A promise that resolves to the Base64 string of the zipped content, or null if an error occurs.
 */
export async function fetchPackage(folder_path: string, zipName?: string): Promise<string | null> {
	const s3 = new S3({
	  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	  region: process.env.AWS_REGION,
	});
  
	const parsed = parseS3Url(folder_path);
	if (!parsed) return null;
  
	const { bucketName, folderKey } = parsed;
  
	try {
	  if (!zipName) {
		const segments = folderKey.split("/").filter((segment) => segment);
		zipName = segments.join("-");
	  }
  
	  const listResponse = await s3.listObjectsV2({ Bucket: bucketName, Prefix: folderKey }).promise();
  
	  if (!listResponse.Contents || listResponse.Contents.length === 0) {
		return null;
	  }
  
	  const archive = archiver("zip", { zlib: { level: 9 } });
	  const buffers: Buffer[] = [];
  
	  // Collect data into buffers
	  archive.on("data", (data) => buffers.push(data));
	  archive.on("error", (err) => {
		throw err;
	  });
  
	  for (const file of listResponse.Contents) {
		if (!file.Key || file.Key.endsWith("/")) continue;
  
		const fileStream = s3.getObject({ Bucket: bucketName, Key: file.Key }).createReadStream();
		archive.append(fileStream, {
		  name: `${zipName}/${file.Key.replace(folderKey, "")}`,
		});
	  }
  
	  await archive.finalize();
  
	  // Ensure all data has been written to buffers
	  const zippedBuffer = Buffer.concat(buffers);
  
	  // Return Base64-encoded data
	  return zippedBuffer.toString("base64");
	} catch (error) {
	  return null;
	}
  }
  

/**
 * Parses an S3 URL and extracts the bucket name and folder key.
 * @param s3Url - The S3 URL to parse, e.g., s3://bucket-name/folder/key/
 * @returns An object containing the bucketName and folderKey, or null if invalid.
 */
function parseS3Url(s3Url: string): { bucketName: string; folderKey: string } | null {
	if (!s3Url.startsWith("s3://")) {
	return null;
	}

	const parts = s3Url.slice(5).split("/");
	const bucketName = parts.shift(); // Extract the bucket name
	const folderKey = parts.join("/"); // Extract the folder key

	if (!bucketName || !folderKey) {
		return null;
	}

	return { bucketName, folderKey: folderKey.endsWith("/") ? folderKey : folderKey + "/" };
}


/**
 * Extracts the path from an S3 URL.
 * @param {string} s3Url - The S3 URL to process.
 * @returns {string | null} The extracted path from the S3 URL, or null if invalid.
 */
export function getS3Path(s3Url: string): string | null {
	if (!s3Url.startsWith("s3://")) {
		return null;
	}

	// Remove the "s3://<bucket-name>/" prefix
	const path = s3Url.split("/").slice(3).join("/");
	if (!path) {
		return null;
	}

	return path;
}


/**
 * Fetches a folder from S3, looks for a README file, applies a regex, and returns matches.
 * @param folderPath - The S3 folder path (e.g., s3://bucket-name/folder/key/).
 * @param regex - The regular expression to apply to the README content.
 * @returns A promise that resolves to an array of matches or null if there are errors or no matches.
 */
export async function fetchReadmeMatches(
	folderPath: string,
	regex: string
  ): Promise<string[] | null> {
  
	const s3 = new S3({
	  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	  region: process.env.AWS_REGION,
	});
  
	const parsed = parseS3Url(folderPath);
	if (!parsed) {
	  return null;
	}
  
	const { bucketName, folderKey } = parsed;
  
	try {
	  const listResponse = await s3
		.listObjectsV2({
		  Bucket: bucketName,
		  Prefix: folderKey,
		})
		.promise();
  
  
	  if (!listResponse.Contents || listResponse.Contents.length === 0) {
		return null;
	  }
  
	  const readmeFile = listResponse.Contents.find((file) =>
		file.Key?.toLowerCase().includes("readme")
	  );
  
	  if (!readmeFile || !readmeFile.Key) {
		return null;
	  }
	  const response = await s3
		.getObject({
		  Bucket: bucketName,
		  Key: readmeFile.Key,
		})
		.promise();
  
  
	  if (!response.Body) {
		return null;
	  }
  
	  const content = response.Body.toString("utf-8");
  
	  const re2 = new RE2(regex, "g"); // Ensure global flag is set
  
	  const matches: string[] = [];
	  let match: RegExpExecArray | null;
  
	  // Use re2.exec() to iteratively find matches
	  while ((match = re2.exec(content)) !== null) {
		matches.push(match[0]);
	  }
  
	  if (matches.length === 0) {
		return null;
	  }
  
	  return matches;
	} catch (error) {
	  return null;
	}
  }  


/**
 * Deletes all files and folders in the specified S3 bucket.
 * @param bucketName - The name of the S3 bucket to clear.
 * @returns A promise that resolves to true if successful, or false if an error occurs.
 */
export async function deleteAllS3BucketContents(bucketName: string): Promise<boolean> {
	const s3 = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
	});

	try {
		let continuationToken: string | undefined;
		do {
			// List objects in the bucket
			const listResponse = await s3
			.listObjectsV2({
				Bucket: bucketName,
				ContinuationToken: continuationToken,
			})
			.promise();
			if (listResponse.Contents && listResponse.Contents.length > 0) {
				// Prepare objects for deletion
				const deleteParams = {
					Bucket: bucketName,
					Delete: {
						Objects: listResponse.Contents.map((object) => ({ Key: object.Key! })),
					},
				};
				// Delete the objects
				await s3.deleteObjects(deleteParams).promise();

			}
			// Update continuation token for paginated results
			continuationToken = listResponse.NextContinuationToken;
		} while (continuationToken); // Continue if there are more objects to delete
		return true;
	} catch (error) {
		return false;
	}
}


/**
 * Deletes all files in the specified folder in S3.
 * @param bucketName - The S3 bucket name.
 * @param folderKey - The folder path in the bucket.
 * @param s3 - The S3 client instance.
 */
export async function clearS3Folder(bucketName: string, folderKey: string, s3: AWS.S3): Promise<void> {
	try {
		const listResponse = await s3
		.listObjectsV2({
			Bucket: bucketName,
			Prefix: folderKey,
		})
		.promise();

		if (listResponse.Contents && listResponse.Contents.length > 0) {
			const objectsToDelete = listResponse.Contents.map((obj) => ({ Key: obj.Key! }));
			await s3
			.deleteObjects({
				Bucket: bucketName,
				Delete: { Objects: objectsToDelete },
			})
			.promise();
		} else {

		}
	} catch (error) {
		throw error;
	}
}


/**
 * Unzips the contents of a Base64-encoded zip file and uploads them to a specified folder in S3.
 * If the folder already exists, its contents will be deleted first.
 * @param zipFileBase64 - The Base64-encoded string containing the zip file data.
 * @param bucketName - The S3 bucket name.
 * @param folderKey - The S3 folder path where the extracted files will be uploaded.
 * @returns A promise that resolves to true if successful, or false if an error occurs.
 */
export async function uploadUnzippedToS3(
  zipFileBase64: string,
  bucketName: string,
  folderKey: string
): Promise<boolean> {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  try {
    // Clear the folder in S3 before uploading new files
    await clearS3Folder(bucketName, folderKey, s3);

    // Decode Base64 string into a Buffer
    const zipFileBuffer = Buffer.from(zipFileBase64, "base64");

    // Create a readable stream from the Buffer
    const zipStream = new stream.PassThrough();
    zipStream.end(zipFileBuffer);

    // Parse and extract the zip file
    const extractedFiles: Promise<any>[] = [];
    await new Promise<void>((resolve, reject) => {
      zipStream
        .pipe(unzipper.Parse())
        .on("entry", (entry: unzipper.Entry) => {
          const fileName = entry.path;
          const fullKey = `${folderKey}${fileName}`; // S3 key for the uploaded file

          if (entry.type === "File") {
            // Upload each file to S3
            const uploadPromise = s3
              .upload({
                Bucket: bucketName,
                Key: fullKey,
                Body: entry,
              })
              .promise();

            extractedFiles.push(uploadPromise);
          } else {
            entry.autodrain(); // Skip directories
          }
        })
        .on("close", () => resolve())
        .on("error", (err: Error) => reject(err));
    });

    // Wait for all uploads to complete
    await Promise.all(extractedFiles);

    
    return true;
  } catch (error) {
    return false;
  }
}



export async function handleDuplicateAndUpload(
  packageName: string,
  version: string,
  zipFileBase64: string,
  bucketName: string,
): Promise<boolean> {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const s3Key = `${packageName}/${version}/`;

  try {
    // Check if the package exists in S3
    const headResponse = await s3
      .headObject({
        Bucket: bucketName,
        Key: s3Key,
      })
      .promise()
      .catch((err) => {
        if (err.code !== "NotFound") throw err; // Ignore 'NotFound' errors, as it's expected if the key doesn't exist
      });

    if (headResponse) {
      await clearS3Folder(bucketName, s3Key, s3);
    } else {
      return false;
    }

    // Decode Base64 string into a Buffer
    const zipFileBuffer = Buffer.from(zipFileBase64, "base64");

    // Create a readable stream from the Buffer
    const zipStream = new stream.PassThrough();
    zipStream.end(zipFileBuffer);

    // Parse and extract the zip file
    const extractedFiles: Promise<any>[] = [];
    await new Promise<void>((resolve, reject) => {
      zipStream
        .pipe(unzipper.Parse())
        .on("entry", (entry: unzipper.Entry) => {
          const fileName = entry.path;
          const fullKey = `${s3Key}${fileName}`; // S3 key for the uploaded file

          if (entry.type === "File") {
            // Upload each file to S3
            const uploadPromise = s3
              .upload({
                Bucket: bucketName,
                Key: fullKey,
                Body: entry,
              })
              .promise();

            extractedFiles.push(uploadPromise);
          } else {
            entry.autodrain(); // Skip directories
          }
        })
        .on("close", () => resolve())
        .on("error", (err: Error) => reject(err));
    });

    // Wait for all uploads to complete
    await Promise.all(extractedFiles);

    return true;
  } catch (error) {
    return false;
  }
}


/**
 * Calculates the total size of a folder in an S3 bucket, including all its contents.
 *
 * @async
 * @function calculateFolderSize
 * @param {string} folderPath - The S3 URL of the folder, e.g., s3://bucket-name/folder/key/.
 * @returns {Promise<number>} A promise that resolves to the total size of the folder in bytes.
 */
export async function calculateFolderSize(folderPath: string): Promise<number> {
	const s3 = new S3({
	  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	  region: process.env.AWS_REGION,
	});
  
	const parsed = parseS3Url(folderPath);
	if (!parsed) {
	  throw new Error("Invalid S3 folder path.");
	}
  
	const { bucketName, folderKey } = parsed;
  
	try {
	  let totalSize = 0;
	  let continuationToken: string | undefined;
  
	  do {
		// List objects in the folder
		const listResponse = await s3
		  .listObjectsV2({
			Bucket: bucketName,
			Prefix: folderKey,
			ContinuationToken: continuationToken,
		  })
		  .promise();
  
		if (listResponse.Contents && listResponse.Contents.length > 0) {
		  // Sum the sizes of all objects in the folder
		  totalSize += listResponse.Contents.reduce((acc, obj) => acc + (obj.Size || 0), 0);
		}
  
		// Handle paginated results
		continuationToken = listResponse.NextContinuationToken;
	  } while (continuationToken);
  
	  return totalSize;
	} catch (error) {
	  throw error;
	}
  }