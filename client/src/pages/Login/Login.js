/**
 * Login Component
 * 
 * This component handles user authentication by collecting username and password,
 * sending them to the server, and navigating to the dashboard upon successful login.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogin - Function to handle login actions, such as storing the token
 * @returns {JSX.Element} - The rendered Login component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Navigation hook for redirecting
import axios from 'axios';
import Footer from 'components/Footer/Footer';
import './Login.css'; // Import the CSS file for styling

const Login = ({ handleLogin }) => {
	// State variables for input fields and feedback messages
	const [username, setUsername] = useState(''); // Stores the username input
	const [password, setPassword] = useState(''); // Stores the password input
	const [message, setMessage] = useState(''); // Feedback message for invalid credentials or errors

	const navigate = useNavigate(); // Hook for navigation

	// API configuration
	const apiPort = process.env.REACT_APP_API_PORT || 1112; // Use port 1112
	const apiLink = process.env.REACT_APP_API_URL || `http://localhost:${apiPort}`; // Ensure API URL includes port 1112

	/**
	 * Handles the form submission.
	 * Sends the username and password to the server for authentication.
	 * If successful, stores the token and navigates to the dashboard.
	 * 
	 * @param {Event} e - The form submission event
	 */
	const handleSubmit = async (e) => {
		e.preventDefault(); // Prevent default form submission behavior
		setMessage(''); // Clear previous messages

		const apiUrl = `${apiLink}/login`; // Construct the API URL

		try {
			// Send login request to the server
			const response = await axios.post(apiUrl, { username, password });

			if (response.data.success) {
				const { token } = response.data; // Extract token from response
				localStorage.setItem('authToken', token); // Store token in localStorage
				handleLogin(token); // Pass token to parent component's login handler
				navigate('/dashboard'); // Redirect to the dashboard
			} else {
				setMessage(response.data.message || 'Invalid Credentials'); // Display server-provided error or default message
			}
		} catch (err) {
			console.error('Login error:', err); // Log error for debugging
			setMessage('Invalid Credentials'); // Display error message
		}
	};

	// Render the Login component
	return (
		<div className="login-container">
			<h1 className="login-header"><u>Login</u></h1>
			<div className="login-box">
				{/* Company logo */}
				<div className="logo-container">
					<img src="/Logo.png" alt="Company Logo" className="company-logo" />
				</div>

				{/* Login form */}
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Username"
						required
					/>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						required
					/>
					<button type="submit">Login</button>
				</form>

				{/* Feedback message */}
				{message && <p>{message}</p>}
			</div>

			{/* Footer */}
			<Footer />
		</div>
	);
};

export default Login;