/**
 * Dashboard Component
 * 
 * This component serves as the main dashboard for logged-in users.
 * It fetches and displays user details, including their full name and admin status,
 * and provides navigation links to other sections of the application.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @param {string} props.token - Authentication token for the current user
 * @returns {JSX.Element} - The rendered Dashboard component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './Dashboard.css';
import axios from 'axios';

const Dashboard = ({ handleLogout, token }) => {
	// State variables
	const [userFullName, setUserFullName] = useState(''); // Stores the user's full name
	const [isAdmin, setIsAdmin] = useState(false); // Indicates whether the user is an admin
	const [message, setMessage] = useState(''); // Stores feedback or error messages

	const navigate = useNavigate();

	// API configuration
	const apiPort = process.env.REACT_APP_API_PORT || 4010;
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

	/**
	 * Fetches user details on component mount or when the token changes.
	 * Sets the user's full name and admin status if the token is valid.
	 * Redirects to the login page if the token is invalid or missing.
	 */
	useEffect(() => {
		const fetchUserDetails = async () => {
			try {
				// API request to fetch user details
				const response = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });
				if (response.data.success) {
					const { firstName, lastName, isAdmin } = response.data;
					setUserFullName(`${firstName} ${lastName}`); // Set full name
					setIsAdmin(isAdmin); // Set admin status
				} else {
					// Handle invalid token
					setMessage(response.data.message || 'Invalid token. Redirecting...');
					setTimeout(() => navigate('/'), 3000); // Redirect after showing message
				}
			} catch (error) {
				console.error('Error fetching user details:', error);
				setMessage('Error fetching user details.');
			}
		};

		if (token) {
			fetchUserDetails();
		} else {
			// Handle missing token
			setMessage('No token found. Redirecting...');
			setTimeout(() => navigate('/'), 3000); // Redirect after showing message
		}
	}, [token, apiLink, apiPort, navigate]);

	// Render the Dashboard component
	return (
		<div className="page-container">
		{/* Header with logout functionality */}
		<Header handleLogout={handleLogout} />
		<div className="content">
		{/* Welcome message or feedback message */}
		{userFullName ? (
			<h1>Welcome to the Application, {userFullName}!</h1>
		) : (
			<h1>{message || 'Loading user details...'}</h1>
		)}

		{/* Navigation options */}
		<div className="options-container">
		<Link to="/view-database" className="option-box">
		<h2>View the Database</h2>
		</Link>
		<Link to="/upload-package" className="option-box">
		<h2>Upload a Package</h2>
		</Link>
		<Link to="/search-for-package" className="option-box">
		<h2>Search For a Package</h2>
		</Link>
		{/* Admin-specific link */}
		{isAdmin && (
			<Link to="/admin-page" className="option-box">
			<h2>Admin Page</h2>
			</Link>
		)}
		</div>
		</div>
		{/* Footer */}
		<Footer />
		</div>
	);
};

export default Dashboard;
