/**
 * AdminPage Component
 * 
 * This component renders the admin dashboard page, providing options for administrative tasks
 * if the user has administrator privileges. It includes token-based authentication to verify
 * admin status and redirects unauthorized users to the login page.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered AdminPage component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './AdminPage.css';
import axios from 'axios';

const AdminPage = ({ handleLogout }) => {
	// State to manage loading status
	const [isLoading, setIsLoading] = useState(true);

	// State to determine if the user is an admin
	const [isAdmin, setIsAdmin] = useState(false);

	// State to hold messages for the user
	const [message, setMessage] = useState('');

	// React Router hook for navigation
	const navigate = useNavigate();

	// API endpoint configurations, with fallback defaults
	const apiPort = process.env.REACT_APP_API_PORT || 4010;
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

	// Effect hook to verify admin status on component mount
	useEffect(() => {
		// Retrieve the authentication token from localStorage
		const token = localStorage.getItem('authToken'); // Get the token from storage
		if (!token) {
			setMessage('No authentication token found. Please log in.');
			navigate('/login'); // Redirect to login page if token is missing
			return;
		}


		/**
		 * Verifies if the user is an admin by sending a token to the server.
		 * If successful and the user is an admin, updates the isAdmin state.
		 * Otherwise, displays an error message.
		 */
		const verifyAdmin = async () => {
			try {
				// API request to verify user and admin status
				const response = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });

				if (response.data.success && response.data.isAdmin) {
					setIsAdmin(true); // Grant access if user is an admin
				} else {
					setMessage('This page is only accessible to administrators.');
				}
			} catch (error) {
				console.error('Error verifying admin status:', error);  // Error message for API failure
				setMessage('Error verifying admin status.');
			} finally {
				setIsLoading(false);  // Stop loading regardless of the outcome
			}
		};

		verifyAdmin();
	}, [apiLink, apiPort, navigate]);

	// Render a loading screen while verifying admin status
	if (isLoading) {
		return (
			<div className="page-container">
			<Header handleLogout={handleLogout} />
			<div className="content">
			<h1>Loading...</h1>
			</div>
			<Footer />
			</div>
		);
	}

	// Render the admin page or an error message based on admin status
	return (
		<div className="page-container">
		<Header handleLogout={handleLogout} />
		<div className="content">
		{isAdmin ? (
			<>
			<h1>Admin Page</h1>
			<div className="options-container">
			<Link to="/reset-registry" className="option-box">
			<h2>Reset Registry</h2>
			</Link>
			<Link to="/create-new-user" className="option-box">
			<h2>Create User</h2>
			</Link>
			</div>
			</>
		) : (
			<h1>{message}</h1>
		)}
		</div>
		<Footer />
		</div>
	);
};

export default AdminPage;