import * as fs from 'fs';
import * as path from 'path';

type InputType = string | File;


/**
 * Converts a zip file to a Base64 string.
 * @param {InputType} input - The input can either be a file path or a File object.
 * @returns {Promise<string>} A promise that resolves to the Base64 string representation of the zip file.
 * @throws Will reject if the input is invalid or the file cannot be read.
 */
export function convertZipToBase64(input: InputType): Promise<string> {
    return new Promise((resolve, reject) => {
        if (typeof input === 'string') {
            // Input is a file path
            if (!fs.existsSync(input) || path.extname(input) !== '.zip') {
                return reject(new Error('Provided path is not a valid .zip file'));
            }

            // Read the file and convert it to Base64
            fs.readFile(input, (err, data) => {
                if (err) return reject(err); // Handle file read errors
                resolve(data.toString('base64')); // Convert file buffer to Base64
            });
        } else if (input instanceof File) {
            // Input is a File object
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    // Extract the Base64 content from the Data URL
                    resolve(result.split(',')[1]);
                } else {
                    reject(new Error('Error reading file'));
                }
            };
            reader.onerror = () => reject(reader.error); // Handle file read errors
            reader.readAsDataURL(input); // Read the file as a Data URL
        } else {
            reject(new Error('Invalid input type. Must be a file path or a File object'));
        }
    });
}


/**
 * Saves a Base64-encoded string as a zip file.
 * @param {string} base64 - The Base64 string representing the zip file.
 * @param {string} outputFileName - The desired name of the output zip file.
 * @throws Will throw an error if the file cannot be written.
 */
export function saveBase64AsZip(base64: string, outputFileName: string): void {
    const binaryBuffer = Buffer.from(base64, 'base64'); // Decode Base64 to binary buffer
    fs.writeFileSync(outputFileName, binaryBuffer); // Write the buffer to a file
    return;
}


/**
 * Triggers a download of a Base64-encoded zip file in the browser.
 * @param {string} base64 - The Base64 string representing the zip file.
 * @param {string} fileName - The desired name of the downloaded file.
 */
export function downloadBase64AsZip(base64: string, fileName: string): void {
    // Ensure the file name ends with '.zip'
    if (!fileName.endsWith('.zip')) {
        fileName += '.zip';
    }

    // Convert the Base64 string to a binary Blob
    const binaryString = atob(base64); // Decode Base64 to binary string
    const byteArray = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i); // Convert binary string to byte array
    }

    const blob = new Blob([byteArray], { type: 'application/zip' });

    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    // Append the link, trigger the download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Example usage: Convert a zip file to Base64 and log the result
// convertZipToBase64('/home/miller/mknotes/ECE/461/Project/Phase 2/lodash/4.17.21/Package.zip')
//     .then((base64String) => console.log(base64String))
//     .catch((err) => console.error(err));


// Read a Base64 string from a file and save it as a zip file
// const inputFilePath = '/home/miller/mknotes/ECE/461/Project/Phase 2/output.txt';
// const outputFilePath = './output.zip';

// try {
//     // Read the Base64 string from the input file
//     const base64String = fs.readFileSync(inputFilePath, 'utf-8').trim();

//     // Save the Base64 string as a zip file
//     saveBase64AsZip(base64String, outputFilePath);
// } catch (error) {
//     if (error instanceof Error) {
//         console.error('Error:', error.message); // Safely log the error message
//     } else {
//         console.error('Unknown error occurred.');
//     }
// }