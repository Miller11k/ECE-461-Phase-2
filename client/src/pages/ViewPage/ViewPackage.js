/**
 * ViewPackage Component
 * 
 * This component displays the details of a specific package, fetched using the package ID from the URL.
 * Users can view metrics, download the package, and update it by uploading a new zip file or providing a URL.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered ViewPackage component
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './ViewPackage.css';

const ViewPackage = ({ handleLogout }) => {
	const { id } = useParams(); // Retrieve the package ID from the URL
	const navigate = useNavigate();

	// State variables
	const [packageDetails, setPackageDetails] = useState(null); // Package metrics
	const [metrics, setMetrics] = useState(null); // Package metrics
	const [sizeCost, setSizeCost] = useState(null); // Size and cost data
	const [error, setError] = useState(''); // Error message
	const [success, setSuccess] = useState(''); // Success message
	const [isLoading, setIsLoading] = useState(true); // Loading state
	const [zipFile, setZipFile] = useState(null); // Uploaded zip file
	const [packageUrl, setPackageUrl] = useState(''); // URL for the package
	const [debloat, setDebloat] = useState(false);  // Debloat option


	const authToken = localStorage.getItem('authToken');  // Authentication token
	const apiPort = process.env.REACT_APP_API_PORT || 4010; // API port
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';  // API base URL
	const apiUrl = id ? `${apiLink}:${apiPort}/package/${id}` : null; // Full API URL for the package

	// Fetch package details, metrics, and size cost on mount
	useEffect(() => {
		const fetchPackageDetails = async () => {
			try {
				setIsLoading(true);

				// Fetch package details
				const detailsResponse = await axios.get(apiUrl, {
					headers: { 'X-Authorization': authToken },
				});
				setPackageDetails(detailsResponse.data);

				// Fetch metrics
				const metricsResponse = await axios.get(`${apiUrl}/rate`, {
					headers: { 'X-Authorization': authToken },
				});
				setMetrics(metricsResponse.data);

				// Fetch size cost
				const sizeCostResponse = await axios.get(`${apiUrl}/cost`, {
					headers: { 'X-Authorization': authToken },
				});
				setSizeCost(sizeCostResponse.data);

				setError('');
			} catch (err) {
				console.error('Error fetching package details:', err);
				setError('Failed to fetch package details or additional data. Please try again.');
			} finally {
				setIsLoading(false);
			}
		};

		// Redirect if required conditions are not met
		if (!authToken) {
			console.error('No authToken found. Redirecting to login.');
			navigate('/');
			return;
		}

		if (!id) {
			console.error('No package ID found. Redirecting to view-database.');
			navigate('/view-database');
			return;
		}

		fetchPackageDetails();
	}, [id, authToken, apiUrl, navigate]);

	/**
	 * Handles the download of the package as a zip file.
	 */
	const handleDownload = () => {
		if (!packageDetails?.data?.Content) {
			setError('No content available for download.');
			return;
		}
		try {
			const binaryContent = Uint8Array.from(
				atob(packageDetails.data.Content),
				(char) => char.charCodeAt(0)
			);
			const blob = new Blob([binaryContent], { type: 'application/zip' });
			const url = URL.createObjectURL(blob);
			const downloadLink = document.createElement('a');
			downloadLink.href = url;
			downloadLink.download = `${packageDetails.metadata?.Name || 'package'}.zip`;
			downloadLink.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			setError('Failed to download the package. Please try again.');
		}
	};

	/**
	 * Handles file input changes and validates the uploaded file.
	 * @param {Event} e - The input change event
	 */
	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file && file.type === 'application/zip') {
			setZipFile(file);
			setPackageUrl(''); // Clear URL input if file is uploaded
			setError('');
		} else {
			setError('Please upload a valid zip file.');
			setSuccess('');
		}
	};

	/**
	 * Handles URL input changes.
	 * @param {Event} e - The input change event
	 */
	const handleUrlChange = (e) => {
		setPackageUrl(e.target.value);
		setZipFile(null); // Clear file input if URL is entered
		setError('');
	};

	/**
	 * Converts a file to a Base64 encoded string.
	 * @param {File} file - The file to be encoded
	 * @returns {Promise<string>} - A promise resolving to the Base64 encoded string
	 */
	const toBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result.split(',')[1]); // Remove Base64 prefix
			reader.onerror = (error) => reject(error);
		});

	/**
	 * Updates the package with the provided file or URL.
	 * @param {Event} e - The form submission event
	 */
	const updatePackage = async (e) => {
		e.preventDefault();

		if (zipFile && packageUrl) {
			setError('Please provide only one input: either upload a file or input a URL.');
			return;
		}

		if (!zipFile && !packageUrl) {
			setError('Please upload a zip file or provide a valid URL.');
			return;
		}

		try {
			let base64Content = null;
			if (zipFile) {
				base64Content = await toBase64(zipFile);
			}

			const payload = {
				metadata: {
					Name: packageDetails?.metadata?.Name || 'DefaultName',
					Version: packageDetails?.metadata?.Version || '1.0.0',
					ID: id,
				},
				data: {
					Name: packageDetails?.metadata?.Name || 'DefaultName',
					Content: base64Content || packageDetails?.data?.Content || 'NOCONTENTINDATABASE=',
					URL: packageUrl.trim() || packageDetails?.data?.URL || undefined,
					debloat: debloat, // Ensure correct key and casing
					JSProgram: undefined, // Assuming no program is sent unless explicitly set
				},
			};

			console.log('Payload being sent to server:', payload); // Debugging

			setIsLoading(true);
			setError('');
			setSuccess('');

			// Update the package
			const response = await axios.post(apiUrl, payload, {
				headers: {
					'X-Authorization': `${authToken}`,
					'Content-Type': 'application/json',
				},
			});

			setSuccess('Package updated successfully!');
			console.log('Server Response:', response.data);

			setZipFile(null);
			setPackageUrl('');
			setDebloat(false);

			// Fetch updated package details
			const updatedDetails = await axios.get(apiUrl, {
				headers: { 'X-Authorization': `${authToken}` },
			});
			setPackageDetails(updatedDetails.data);
		} catch (err) {
			setError('Failed to update the package. Please try again.');
			console.error('Error updating package:', err);
		} finally {
			setIsLoading(false);
		}
	};



	// Render the component
	return (
		<div className="page-container">
		<Header handleLogout={handleLogout} />
		<div className="content">
		{error && <p className="error-message">{error}</p>}
		{success && <p className="success-message">{success}</p>}
		{isLoading ? (
			<div className="loader-container">
			<div className="spinner"></div>
			</div>
		) : (
			packageDetails && (
				<div className="package-details">
				<h1>Package Details</h1>
				<p><strong>Name:</strong> {packageDetails.metadata?.Name}</p>
				<p><strong>Version:</strong> {packageDetails.metadata?.Version}</p>
				<button className="download-button" onClick={handleDownload}>
				Download Package
				</button>

				{metrics && (
					<div className="metrics">
					<h2>Metrics</h2>
					<p><strong>Net Score:</strong> {metrics.NetScore}</p>
					<p><strong>Ramp-Up Score:</strong> {metrics.RampUp}</p>
					<p><strong>Bus Factor:</strong> {metrics.BusFactor}</p>
					<p><strong>License Score:</strong> {metrics.LicenseScore}</p>
					</div>
				)}

				{sizeCost && (
					<div className="size-cost">
					<h2>Size Cost</h2>
					<p><strong>Total Cost:</strong> {sizeCost[id]?.totalCost} MB</p>
					{sizeCost[id]?.standaloneCost && (
						<p><strong>Standalone Cost:</strong> {sizeCost[id].standaloneCost} MB</p>
					)}
					</div>
				)}

				{/* Update Package Form */}
				<div className="update-package">
				<h2>Update Package</h2>
				<form className="update-package-form" onSubmit={updatePackage}>
				<label className="file-drop">
				{zipFile ? zipFile.name : 'Drag and drop a zip file here, or click to select'}
				<input
				type="file"
				accept=".zip"
				onChange={handleFileChange}
				style={{ display: 'none' }}
				/>
				</label>
				<label>
				OR Provide a URL:
				<input
				type="url"
				value={packageUrl}
				onChange={handleUrlChange}
				placeholder="Enter package URL"
				/>
				</label>
				<div className="form-group">
				<label className="checkbox-container">
				<input
				type="checkbox"
				checked={debloat}
				onChange={() => setDebloat(!debloat)}
				className="checkbox-input"
				/>
				<span className="checkbox-checkmark"></span>
				Debloat Package
				</label>
				</div>
				<button type="submit" className="update-button" disabled={isLoading}>
				{isLoading ? 'Updating...' : 'Update Package'}
				</button>
				</form>
				</div>
				</div>
			)
		)}
		</div>
		<Footer />
		</div>
	);
};

export default ViewPackage;
