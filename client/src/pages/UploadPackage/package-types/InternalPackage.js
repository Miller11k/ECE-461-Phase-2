/**
 * InternalPackage Component
 * 
 * This component allows users to upload an internal package in zip format.
 * It validates inputs such as the file, package name, version, and debloat option.
 * The package data is converted to Base64 format before being sent to the server.
 * 
 * @returns {JSX.Element} - The rendered InternalPackage component
 */

import React, { useState } from "react";
import axios from "axios";
import './InternalPackage.css';

function InternalPackage() {
	// State variables for form inputs and statuses
	const [zipFile, setZipFile] = useState(null); // Uploaded zip file
	const [packageName, setPackageName] = useState(''); // Package name
	const [version1, setVersion1] = useState(''); // Major version number
	const [version2, setVersion2] = useState(''); // Minor version number
	const [version3, setVersion3] = useState(''); // Patch version number
	const [debloat, setDebloat] = useState(false); // Debloat option
	const [error, setError] = useState(''); // Error message
	const [success, setSuccess] = useState(''); // Success message
	const [isLoading, setIsLoading] = useState(false);  // Loading state

	// API configuration
	const authToken = localStorage.getItem('authToken');  // Authentication token
	// const apiPort = process.env.REACT_APP_API_PORT || 4010; // API port
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';  // API base URL
	const apiUrl = `${apiLink}/package`; // Full API endpoint

	/**
	 * Converts a file to a Base64-encoded string.
	 * @param {File} file - The file to be converted
	 * @returns {Promise<string>} - A promise resolving to the Base64 string
	 */
	const toBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result.split(',')[1]); // Remove Base64 prefix
			reader.onerror = (error) => reject(error);
		});

	/**
	 * Handles the submission of the form and uploads the package to the server.
	 */
	const uploadPackage = async () => {
		// Validate file input
		if (!zipFile) {
			setError('Please upload a zip file.');
			return;
		}

		// Validate package name
		if (!packageName.trim()) {
			setError('Please enter a package name.');
			return;
		}

		// Validate version numbers
		if (!version1 || !version2 || !version3) {
			setError('Please enter a complete version number (e.g., 1.0.0).');
			return;
		}

		// Ensure version numbers are integers
		if (
			!Number.isInteger(Number(version1)) ||
			!Number.isInteger(Number(version2)) ||
			!Number.isInteger(Number(version3))
		) {
			setError('Version numbers must be integers.');
			return;
		}

		try {
			// Convert file to Base64
			const base64Content = await toBase64(zipFile);

			// Construct payload
			const payload = {
				Name: packageName.trim(),
				Version: `${version1}.${version2}.${version3}`,
				Content: base64Content,
				debloat,
			};

			setIsLoading(true); // Set loading state
			setError(''); // Clear previous error
			setSuccess(''); // Clear previous success

			// Send package data to the server
			const response = await axios.post(apiUrl, payload, {
				headers: {
					'Content-Type': 'application/json',
					'X-Authorization': authToken,
				},
			});

			// Handle response
			if (response.status === 201) {
				setSuccess('Package uploaded successfully.');
				resetForm(); // Reset form after successful submission
			} else {
				setError('Upload failed. Please try again.');
			}
		} catch (err) {
			// Handle errors
			setError(err.response?.data?.error || 'Failed to upload package. Please check the API and try again.');
			console.error('Error uploading package:', err.response?.data || err);
		} finally {
			setIsLoading(false); // Reset loading state
		}
	};

	/**
	 * Resets the form inputs to their default states.
	 */
	const resetForm = () => {
		setZipFile(null);
		setPackageName('');
		setVersion1('');
		setVersion2('');
		setVersion3('');
		setDebloat(false);
	};

	// Render the component
	return (
		<div className="container">
		<h2>Upload Internal Package</h2>
		<div className="form">
		<div className="file-drop">
		<input type="file" onChange={(e) => setZipFile(e.target.files[0])} />
		{zipFile ? <p>{zipFile.name}</p> : <p>Drag and drop your zip file here</p>}
		</div>

		<div className="form-group">
		<label>Package Name</label>
		<input
		type="text"
		placeholder="Enter package name"
		value={packageName}
		onChange={(e) => setPackageName(e.target.value)}
		/>
		</div>

		{/* Version Input Box */}
		<div className="form-group version-input">
		<label>Version</label>
		<div className="version-inputs">
		<input
		type="number"
		value={version1}
		onChange={(e) => setVersion1(e.target.value)}
		maxLength={2}
		placeholder="1"
		/>
		<span>.</span>
		<input
		type="number"
		value={version2}
		onChange={(e) => setVersion2(e.target.value)}
		maxLength={2}
		placeholder="0"
		/>
		<span>.</span>
		<input
		type="number"
		value={version3}
		onChange={(e) => setVersion3(e.target.value)}
		maxLength={2}
		placeholder="0"
		/>
		</div>
		</div>

		<div className="form-group">
		<label className="checkbox-container">
		<input
		type="checkbox"
		checked={debloat}
		onChange={() => setDebloat(!debloat)}
		/>
		<span className="checkbox-checkmark"></span>
		Debloat
		</label>
		</div>

		{error && <div className="error">{error}</div>}
		{success && <div className="success">{success}</div>}

		<div className="button-group">
		<button onClick={uploadPackage} disabled={isLoading}>
		{isLoading ? "Uploading..." : "Upload Package"}
		</button>
		<button
		className="delete-button"
		onClick={resetForm}
		disabled={isLoading || !zipFile}
		>
		Reset Form
		</button>
		</div>
		</div>
		</div>
	);
}

export default InternalPackage;