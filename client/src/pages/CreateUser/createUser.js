/**
 * CreateUser Component
 * 
 * This component provides an interface for administrators to create new users.
 * It verifies admin privileges before granting access to the user creation form.
 * The form collects user details such as first name, last name, username, password, and admin status.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered CreateUser component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './createUser.css';
import axios from 'axios';

const CreateUser = ({ handleLogout }) => {
	// State variables for admin verification, form inputs, and feedback
	const [isLoading, setIsLoading] = useState(true); // Indicates loading state
	const [isAdmin, setIsAdmin] = useState(false); // Determines if the user is an admin
	const [message, setMessage] = useState(''); // Feedback or error message
	const [username, setUsername] = useState(''); // Username input
	const [password, setPassword] = useState(''); // Password input
	const [firstName, setFirstName] = useState(''); // First name input
	const [lastName, setLastName] = useState(''); // Last name input
	const [isUserAdmin, setIsUserAdmin] = useState(false); // Checkbox for admin status
	const [successMessage, setSuccessMessage] = useState(''); // Success message for user creation

	const navigate = useNavigate();

	// API configuration
	// const apiPort = process.env.REACT_APP_API_PORT || 4010;
	const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

	/**
	 * Verifies if the user is an admin when the component mounts.
	 * Redirects non-admin users to the login page.
	 */
	useEffect(() => {
		const token = localStorage.getItem('authToken');
		if (!token) {
			setMessage('No authentication token found. Please log in.');
			navigate('/login');
			return;
		}

		const verifyAdmin = async () => {
			try {
				const response = await axios.post(`${apiLink}/get-user`, { token });
				if (response.data.success && response.data.isAdmin) {
					setIsAdmin(true); // Grant access to admin
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
	 * Handles the user creation process by sending form data to the server.
	 * Displays success or error messages based on the response.
	 * 
	 * @param {Event} e - The form submission event
	 */
	const handleCreateUser = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem('authToken');
		if (!token) {
			setMessage('No authentication token found. Please log in.');
			navigate('/login');
			return;
		}

		try {
			const response = await axios.post(
				`${apiLink}/create-user`,
				{
					first_name: firstName,
					last_name: lastName,
					username,
					plaintext_password: password,
					is_admin: isUserAdmin,
				},
				{ headers: { 'X-Authorization': token } }
			);

			if (response.data.success) {
				setSuccessMessage('User created successfully!');
				// Reset the form after successful submission
				setUsername('');
				setPassword('');
				setFirstName('');
				setLastName('');
				setIsUserAdmin(false);
			} else {
				setMessage(response.data.error || 'Failed to create user. Please try again.');
			}
		} catch (error) {
			console.error('Error creating user:', error);
			setMessage('Error creating user. Please try again.');
		}
	};

	// Render a loading message while verifying admin status
	if (isLoading) {
		return (
			<div className="create-user-container">
			<h1>Loading...</h1>
			</div>
		);
	}

	// Render the CreateUser component
	return (
		<div className="page-container">
		<Header handleLogout={handleLogout} />
		<div className="create-user-container">
		<h1 className="create-user-header"><u>Create User</u></h1>
		<div className="create-user-box">
		{isAdmin ? (
			<>
			{/* User creation form */}
			<form onSubmit={handleCreateUser}>
			<input
			type="text"
			value={firstName}
			onChange={(e) => setFirstName(e.target.value)}
			placeholder="First Name"
			required
			/>
			<input
			type="text"
			value={lastName}
			onChange={(e) => setLastName(e.target.value)}
			placeholder="Last Name"
			required
			/>
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
			<label className="admin-checkbox">
			<input
			id="admin-checkbox"
			type="checkbox"
			checked={isUserAdmin}
			onChange={(e) => setIsUserAdmin(e.target.checked)}
			/>
			<span>{isUserAdmin ? "Admin" : "Not Admin"}</span>
			</label>
			<button type="submit">Create User</button>
			</form>
			{/* Feedback messages */}
			{successMessage && <p className="success-message">{successMessage}</p>}
			{message && <p className="error-message">{message}</p>}
			</>
		) : (
			<h1>{message}</h1>
		)}
		</div>
		</div>
		<Footer />
		</div>
	);
};

export default CreateUser;