/**
 * ResetRegistry Component
 * 
 * This component allows an administrator to reset the registry.
 * It verifies admin privileges before providing functionality to reset the registry.
 * A confirmation input ensures the action is deliberate.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered ResetRegistry component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './resetRegistry.css';
import axios from 'axios';

const ResetRegistry = ({ handleLogout }) => {
	// State variables
	const [isLoading, setIsLoading] = useState(true); // Loading state for admin verification
	const [isAdmin, setIsAdmin] = useState(false); // Tracks if the user is an admin
	const [message, setMessage] = useState(''); // Message for errors or non-admins
	const [inputValue, setInputValue] = useState(''); // Confirmation text input
	const [successMessage, setSuccessMessage] = useState(''); // Success message after registry reset

	const navigate = useNavigate();

	// API configuration
	// const apiPort = process.env.REACT_APP_API_PORT || 4010;
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

	/**
	 * Verifies if the user is an admin when the component mounts.
	 */
	useEffect(() => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			setMessage('No authentication token found. Please log in.');
			navigate('/login'); // Redirect to login if token is missing
			return;
		}

		const verifyAdmin = async () => {
			try {
				// API request to verify admin status
				const response = await axios.post(`${apiLink}/get-user`, { token });

				if (response.data.success && response.data.isAdmin) {
					setIsAdmin(true); // Grant admin access
				} else {
					setMessage('This page is only accessible to administrators.');
				}
			} catch (error) {
				console.error('Error verifying admin status:', error);
				setMessage('Error verifying admin status.');
			} finally {
				setIsLoading(false); // Stop loading
			}
		};

		verifyAdmin();
	}, [apiLink, navigate]);

	/**
	 * Handles the registry reset action.
	 * Requires confirmation input and admin privileges.
	 */
	const handleReset = async () => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			setMessage('No authentication token found. Please log in.');
			navigate('/login'); // Redirect to login if token is missing
			return;
		}

		// Ensure the user enters the confirmation text correctly
		if (inputValue !== 'Reset Registry') {
			alert('Error: Please type "Reset Registry" exactly as shown to confirm the action.');
			return;
		}

		try {
			// API request to reset the registry
			const response = await axios.delete(`${apiLink}/reset`, {
				headers: { 'X-Authorization': token },
			});

			if (response.status === 200) {
				setSuccessMessage('Registry reset successfully!');
				setInputValue(''); // Clear input after success
			} else {
				alert('Failed to reset registry.');
				setMessage('Failed to reset registry. Please try again.');
			}
		} catch (error) {
			console.error('Error resetting registry:', error);
			alert('Error resetting registry. Please try again.');
			setMessage('Error resetting registry. Please try again.');
		}
	};

	// Render a loading state while verifying admin status
	if (isLoading) {
		return (
			<div className="reset-registry-container">
			<h1>Loading...</h1>
			</div>
		);
	}

	// Render the reset registry page
	return (
		<div className="page-container">
		<Header handleLogout={handleLogout} />
		<div className="reset-registry-container">
		<h1 className="reset-registry-header"><u>Reset Registry</u></h1>
		<div className="reset-registry-box">
		{isAdmin ? (
			<>
			{/* Confirmation input and reset button */}
			<p>Type "Reset Registry" to confirm the action.</p>
			<input
			type="text"
			value={inputValue}
			onChange={(e) => setInputValue(e.target.value)}
			placeholder="Enter confirmation text"
			/>
			<button onClick={handleReset}>Reset Registry</button>
			{/* Success message */}
			{successMessage && <p className="success-message">{successMessage}</p>}
			</>
		) : (
			<h1>{message}</h1> // Message for non-admin users
		)}
		</div>
		</div>
		<Footer />
		</div>
	);
};

export default ResetRegistry;