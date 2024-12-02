/**
 * ExternalPackage Component
 * 
 * This component provides a form to upload an external package to the system.
 * It validates user input for package name, GitHub link, and version numbers,
 * and sends the data to the server for processing.
 * 
 * @returns {JSX.Element} - The rendered ExternalPackage component
 */

import React, { useState } from "react";
import axios from "axios";
import './ExternalPackage.css';

function ExternalPackage() {
	// State variables to manage form inputs and status
	const [packageName, setPackageName] = useState(''); // Package name
	const [packageLink, setPackageLink] = useState(''); // GitHub link
	const [version1, setVersion1] = useState(''); // Version major number
	const [version2, setVersion2] = useState(''); // Version minor number
	const [version3, setVersion3] = useState(''); // Version patch number
	const [debloat, setDebloat] = useState(false);  // Debloat option
	const [error, setError] = useState(''); // Error message
	const [success, setSuccess] = useState(''); // Success message
	const [isLoading, setIsLoading] = useState(false);  // Loading state

	// Authentication token and API URL
	const authToken = localStorage.getItem('authToken');
	const apiPort = process.env.REACT_APP_API_PORT || 4010;
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
	const apiUrl = `${apiLink}:${apiPort}/package`;

	/**
	 * Validates if the given URL is a valid GitHub repository link.
	 * @param {string} url - The URL to validate
	 * @returns {boolean} - True if the URL is valid, false otherwise
	 */
	const isValidGithubLink = (url) => /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(url);

	/**
	 * Handles the submission of the form and uploads the package to the server.
	 */
	const uploadPackage = async () => {
		// Validate package name
		if (!packageName.trim()) {
			setError('Please enter a package name.');
			return;
		}

		// Validate GitHub link
		if (!packageLink.trim() || !isValidGithubLink(packageLink.trim())) {
			setError('Please enter a valid GitHub link (e.g., https://github.com/owner/repo).');
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

		// Construct payload for the API request
		const payload = {
			Name: packageName.trim(),
			Version: `${version1}.${version2}.${version3}`,
			URL: packageLink.trim(),
			debloat,
		};

		setIsLoading(true); // Indicate loading state
		setError(''); // Clear previous errors
		setSuccess(''); // Clear previous success message

		try {
			// Send the package data to the server
			const response = await axios.post(apiUrl, payload, {
				headers: {
					'X-Authorization': authToken,
				},
			});

			// Check response status
			if (response.status === 201) {
				setSuccess('Package uploaded successfully.');
				resetForm();  // Reset form after successful submission
			} else {
				setError('Upload failed. Please try again.');
			}
		} catch (err) {
			setError('Failed to upload package. Please check the API and try again.');
			console.error('Error uploading package:', err);
		} finally {
			setIsLoading(false);  // Reset loading state
		}
	};

	/**
	 * Resets the form inputs to their default states.
	 */
	const resetForm = () => {
		setPackageName('');
		setPackageLink('');
		setVersion1('');
		setVersion2('');
		setVersion3('');
		setDebloat(false);
	};

	// Render the component
	return (
		<div className="container">
		<h2>Upload External Package</h2>
		<form onSubmit={(e) => e.preventDefault()} className="form">
		<div className="form-group">
		<label>Package Name:</label>
		<input
		type="text"
		value={packageName}
		onChange={(e) => setPackageName(e.target.value)}
		required
		/>
		</div>
		<div className="form-group">
		<label>Package Link (GitHub):</label>
		<input
		type="text"
		value={packageLink}
		onChange={(e) => setPackageLink(e.target.value)}
		required
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
		onChange={(e) => setDebloat(e.target.checked)}
		/>
		<span className="checkbox-checkmark"></span>
		Debloat
		</label>
		</div>

		{error && <p className="error">{error}</p>}
		{success && <p className="success">{success}</p>}
		<div className="button-group">
		<button onClick={uploadPackage} type="button" disabled={isLoading}>
		{isLoading ? 'Uploading...' : 'Submit'}
		</button>
		</div>
		</form>
		</div>
	);  
}

export default ExternalPackage;
