/**
 * ViewDatabase Component
 * 
 * This component displays a paginated list of packages fetched from the database.
 * Users can navigate through the list using "Next" and "Previous" buttons and view details of individual packages.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered ViewDatabase component
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './ViewDatabase.css';

const ViewDatabase = ({ handleLogout }) => {
	// State variables
	const [packages, setPackages] = useState([]); // Stores the list of packages
	const [offset, setOffset] = useState(0);  // Tracks the current pagination offset
	const [hasNext, setHasNext] = useState(false);  // Indicates if there are more results to fetch
	const [error, setError] = useState(''); // Stores error messages for display

	// Authentication token from localStorage
	const authToken = localStorage.getItem('authToken');

	// API endpoint configurations
	// const apiPort = process.env.REACT_APP_API_PORT || 4010; // API port
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';  // API base URL
	const apiUrl = `${apiLink}/packages`;  // Full API URL for fetching packages

	// Fetch packages whenever the offset changes
	useEffect(() => {
		fetchPackages();
	}, [offset]);

	/**
	 * Fetches the list of packages from the API.
	 */
	const fetchPackages = async () => {
		try {
			setError(''); // Clear any previous error

			// Send API request with authorization and offset parameters
			const response = await axios.post(
				apiUrl,
				[{ Name: '*' }],  // Request body (fetch all packages)
				{
					headers: {
						'X-Authorization': `${authToken}`,
					},
					params: { offset }, // Pagination offset
				}
			);

			// Process the response and update state
			if (response.data && Array.isArray(response.data)) {
				setPackages(response.data); // Update packages state
				setHasNext(response.data.length === 10);  // Enable "Next" button if exactly 10 results are returned
			} else {
				setPackages([]);  // Clear packages if response data is invalid
				setHasNext(false);  // Disable "Next" button
			}
		} catch (error) {
			console.error('Error fetching packages:', error);
			setError('Failed to fetch packages. Please check your API and try again.'); // Display error message
		}
	};

	/**
	 * Advances to the next page of packages.
	 */
	const handleNext = () => {
		if (hasNext) setOffset(offset + 10);  // Increase offset by 10 if more results are available
	};

	/**
	 * Returns to the previous page of packages.
	 */
	const handlePrevious = () => {
		if (offset > 0) setOffset(offset - 10); // Decrease offset by 10 if not on the first page
	};

	// Render the component
	return (
		<div className="page-container">
		<Header handleLogout={handleLogout} />
		<div className="content">
		{error && <p className="error-message">{error}</p>}
		<table className="packages-table">
		<thead>
		<tr>
		<th></th>
		<th>Name</th>
		<th>Version</th>
		<th>View Package</th>
		</tr>
		</thead>
		<tbody>
		{packages.length > 0 ? (
			packages.map((pkg, index) => (
				<tr key={pkg.ID}>
				<td>{offset + index + 1}</td>
				<td>{pkg.Name}</td>
				<td>{pkg.Version}</td>
				<td>
				<a href={`/view-package/${pkg.ID}`} className="view-package-link">
				View Package
				</a>
				</td>
				</tr>
			))
		) : (
			<tr>
			<td colSpan="4">No packages found.</td>
			</tr>
		)}
		</tbody>
		</table>
		<div className="pagination">
		{offset > 0 && (
			<button className="pagination-button" onClick={handlePrevious}>
			&#8592; Previous
			</button>
		)}
		{hasNext && (
			<button className="pagination-button" onClick={handleNext}>
			Next &#8594;
			</button>
		)}
		</div>
		</div>
		<Footer />
		</div>
	);
};

export default ViewDatabase;