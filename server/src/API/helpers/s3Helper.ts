/**
 * @module S3Utils
 * Provides utility functions for interacting with AWS S3, including fetching, zipping, unzipping, and managing files and folders.
 */

import AWS from "aws-sdk";
import archiver from "archiver";
import unzipper from "unzipper";
import stream from "stream";
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
			console.error("No content found in the file.");
			return null;
		}

		// Convert the file content to a Base64 string
		const base64Content = response.Body.toString("base64");

		return base64Content;
	} catch (error) {
		console.error("An error occurred while fetching the file:", error);
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
			console.error("No content found in the file.");
			return null;
		}

		// Convert the file content to a Base64 string
		const base64Content = response.Body.toString("base64");

		return base64Content;
	} catch (error) {
		console.error("An error occurred while fetching the file:", error);
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

	// Parse the S3 URL
	const parsed = parseS3Url(folder_path);
	if (!parsed) {
		return null;
	}
	const { bucketName, folderKey } = parsed;

	try {
		// Derive the default zip name if not provided
		if (!zipName) {
			const segments = folderKey.split("/").filter((segment) => segment); // Remove empty parts
			zipName = segments.join("-"); // Combine with "-" as separator
		}

		// List objects in the specified folder
		const listResponse = await s3
		.listObjectsV2({
			Bucket: bucketName,
			Prefix: folderKey,
		})
		.promise();

		if (!listResponse.Contents || listResponse.Contents.length === 0) {
			console.error("No files found in the specified folder.");
			return null;
		}

		// Create a zip archive
		const archive = archiver("zip", { zlib: { level: 9 } });
		const bufferStream = new stream.PassThrough();
		const buffers: Buffer[] = [];
		bufferStream.on("data", (chunk) => buffers.push(chunk));
		archive.pipe(bufferStream);

		// Add each file to the archive inside a folder named after zipName
		for (const file of listResponse.Contents) {
			if (!file.Key || file.Key.endsWith("/")) {
				continue; // Skip folders or invalid keys
			}

			const fileStream = await s3
			.getObject({ Bucket: bucketName, Key: file.Key })
			.createReadStream();

			// Add to the archive with a prefix folder named zipName
			archive.append(fileStream, {
				name: `${zipName}/${file.Key.replace(folderKey, "")}`,
			});
		}

		// Finalize the archive
		await archive.finalize();

		// Convert the zipped data to Base64
		const zippedBuffer = Buffer.concat(buffers);

		return zippedBuffer.toString("base64");
	} catch (error) {
		console.error("An error occurred while zipping the folder contents:", error);
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
		console.error("Invalid S3 URL format.");
	return null;
	}

	const parts = s3Url.slice(5).split("/");
	const bucketName = parts.shift(); // Extract the bucket name
	const folderKey = parts.join("/"); // Extract the folder key

	if (!bucketName || !folderKey) {
		console.error("Invalid S3 URL structure.");
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
	regex: RegExp
): Promise<string[] | null> {
	const s3 = new S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
	});

	// Parse the S3 URL
	const parsed = parseS3Url(folderPath);
	if (!parsed) {
		console.error("Invalid S3 folder path.");
		return null;
	}
	const { bucketName, folderKey } = parsed;

	try {
		// List objects in the specified folder
		const listResponse = await s3
		.listObjectsV2({
			Bucket: bucketName,
			Prefix: folderKey,
		})
		.promise();

		if (!listResponse.Contents || listResponse.Contents.length === 0) {
			console.error("No files found in the specified folder.");
			return null;
		}

		// Look for a README file in the folder
		const readmeFile = listResponse.Contents.find((file) =>
							      file.Key?.toLowerCase().includes("readme")
							     );

							     if (!readmeFile || !readmeFile.Key) {
								     console.error("README file not found in the folder.");
								     return null;
							     }

							     // Fetch the README file content
							     const response = await s3
							     .getObject({
								     Bucket: bucketName,
								     Key: readmeFile.Key,
							     })
							     .promise();

							     if (!response.Body) {
								     console.error("README file is empty or could not be read.");
								     return null;
							     }

							     const content = response.Body.toString("utf-8");

							     // Apply the regex to the content
							     const matches = [...content.matchAll(regex)];

							     if (matches.length === 0) {
								     console.error("No matches found in the README file.");
								     return null;
							     }

							     // Return an array of matches
							     return matches.map((match) => match[0]);
	} catch (error) {
		console.error("An error occurred while processing the README file:", error);
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
async function clearS3Folder(bucketName: string, folderKey: string, s3: AWS.S3): Promise<void> {
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
		console.error(`Failed to clear folder: s3://${bucketName}/${folderKey}`, error);
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
		console.error("An error occurred while uploading unzipped contents to S3:", error);
		return false;
	}
}

