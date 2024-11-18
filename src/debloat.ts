import AdmZip from 'adm-zip'; // Ensure adm-zip is installed via npm
import fs from 'fs';

/**
 * Debloats a package by unzipping, removing unnecessary files, and rezipping.
 * @param {string} filePath - Path to the original zip file.
 * @param {string} outputPath - Path to save the debloated zip file.
 */
export function debloatPackage(filePath: string, outputPath: string): void {
    console.log(`Debloating package: ${filePath}`);

    const zip = new AdmZip(filePath);
    const tempDir = `/tmp/debloat_${Date.now()}`;
    zip.extractAllTo(tempDir, true); // open the package
    console.log(`Extracted package to temporary directory: ${tempDir}`);

    const filesToRemove = ['.git', '.DS_Store', 'node_modules', '*.log']; // Research said these are the types of files to remove without changing semantics
    const allFiles = fs.readdirSync(tempDir);

    for (const file of allFiles) {
        if (filesToRemove.includes(file) || file.endsWith('.log')) {
            const filePathToRemove = `${tempDir}/${file}`;
            console.log(`Removing: ${filePathToRemove}`);
            fs.rmSync(filePathToRemove, { recursive: true, force: true });
        }
    }

    const newZip = new AdmZip();
    newZip.addLocalFolder(tempDir);
    newZip.writeZip(outputPath); // rezip the package so that the original content needed is not modified
    console.log(`Debloated package saved to: ${outputPath}`);

    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Temporary directory cleaned up: ${tempDir}`); // since we used a temp dir, we need to clean it up
}
