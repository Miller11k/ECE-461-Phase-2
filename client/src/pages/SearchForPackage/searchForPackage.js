/**
 * SearchForPackagePage Component
 * 
 * This component provides functionality to search for packages based on a regex pattern.
 * Users can enter a search term and view the results in a table with package details.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered SearchForPackagePage component
 */

import React, { useState } from 'react';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './searchForPackage.css';

const SearchForPackagePage = ({ handleLogout }) => {
	// State variables for managing search term, results, and error handling
	const [searchTerm, setSearchTerm] = useState(''); // Search term input by the user
	const [packages, setPackages] = useState([]); // Search results (packages)
	const [error, setError] = useState(''); // Error message
	const [hasSearched, setHasSearched] = useState(false); // Flag to indicate if a search has been performed

	// API configuration
	const authToken = localStorage.getItem('authToken'); // Authentication token
	// const apiPort = process.env.REACT_APP_API_PORT || 4010; // API port
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost'; // API base URL
	const apiUrl = `${apiLink}/package/byRegEx`; // API endpoint for searching packages

	/**
	 * Handles the search operation.
	 * Sends the search term to the server and updates the results.
	 */
	const handleSearch = async () => {
		setHasSearched(true); // Indicate that a search has been performed
		try {
			setError(''); // Clear previous error messages

			// Make an API call to search for packages
			const response = await axios.post(
				apiUrl,
				{ RegEx: searchTerm }, // Request body containing the regex search term
				{
					headers: {
						'X-Authorization': `${authToken}`, // Authorization header
					},
				}
			);

			// Update packages state if valid data is returned
			if (response.data && Array.isArray(response.data)) {
				setPackages(response.data);
			} else {
				setPackages([]); // Clear results if data is invalid
			}
		} catch (error) {
			console.error('Error searching for packages:', error);
			setError('Failed to fetch packages. Please check your API and try again.');
		}
	};

	// Render the component
	return (
		<div className="page-container">
		{/* Header with logout functionality */}
		<Header handleLogout={handleLogout} />
		<div className="content">
		<h1>Search For A Package</h1>

		{/* Search bar */}
		<div className="search-bar">
		<input
		type="text"
		placeholder="Enter search term (e.g., .*React.*)"
		value={searchTerm}
		onChange={(e) => setSearchTerm(e.target.value)}
		className="search-input"
		/>
		<button onClick={handleSearch} className="search-button">
		Search
		</button>
		</div>

		{/* Error message */}
		{error && <p className="error-message">{error}</p>}

		{/* Search results table */}
		{hasSearched && (
			<table className="packages-table">
			<thead>
			<tr>
			<th>#</th>
			<th>Name</th>
			<th>Version</th>
			<th>View Package</th>
			</tr>
			</thead>
			<tbody>
			{packages.length > 0 ? (
				packages.map((pkg, index) => (
					<tr key={pkg.ID}>
					<td>{index + 1}</td> {/* Row number */}
					<td>{pkg.Name}</td> {/* Package name */}
					<td>{pkg.Version}</td> {/* Package version */}
					<td>
					<a href={`/view-package/${pkg.ID}`} className="view-package-link">
					View Package
					</a> {/* Link to view package details */}
					</td>
					</tr>
				))
			) : (
				<tr>
				<td colSpan="4">No packages found.</td> {/* Message for no results */}
				</tr>
			)}
			</tbody>
			</table>
		)}
		</div>

		{/* Footer */}
		<Footer />
		</div>
	);
};

export default SearchForPackagePage;