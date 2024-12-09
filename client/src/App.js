/**
 * App Component
 * 
 * This component serves as the main entry point of the application.
 * It handles routing, authentication, and admin protection for various pages.
 * Users are authenticated via token validation, and certain routes are restricted to admin users.
 * 
 * @returns {JSX.Element} - The rendered App component
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import various page components
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Upload from './pages/UploadPackage/UploadPackage';
import ViewDatabase from './pages/ViewDatabase/ViewDatabase';
import SearchForPackage from './pages/SearchForPackage/searchForPackage';
import ExternalPackage from './pages/UploadPackage/package-types/ExternalPackage';
import InternalPackage from './pages/UploadPackage/package-types/InternalPackage';
import ViewPackage from './pages/ViewPage/ViewPackage';
import AdminPage from './pages/AdminPage/AdminPage';
import Account from './pages/Account/Account';
import ResetRegistry from './pages/ResetRegistry/resetRegistry';
import CreateUser from './pages/CreateUser/createUser';

// API configuration
// const apiPort = process.env.REACT_APP_API_PORT || 4010;
const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

const App = () => {
	// State to manage the authentication token
	const [token, setToken] = useState(null);

	// Load token from local storage when the component mounts
	useEffect(() => {
		const storedToken = localStorage.getItem('authToken');
		if (storedToken) {
		  setToken(storedToken);
		}
	  }, []);	  

	/**
	 * Handles user login by saving the token.
	 * @param {string} newToken - The token received after successful login
	 */
	const handleLogin = (newToken) => {
		setToken(newToken);
		localStorage.setItem('authToken', newToken);
	};

	/**
	 * Handles user logout by clearing the token.
	 */
	const handleLogout = () => {
		setToken(null);
		localStorage.removeItem('authToken');
	};

	/**
	 * Validates the authentication token by making an API call.
	 * @returns {Promise<boolean>} - True if the token is valid, otherwise false
	 */
	const validateToken = async () => {
		if (!token) {
		  console.error('Token is null or undefined');
		  return false;
		}
	  
		try {
		  const response = await fetch(`${apiLink}/get-user`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: token.startsWith('bearer ') ? token.slice(7) : token }),
		  });
	  
		  if (!response.ok) {
			console.error(`API error: ${response.status} - ${response.statusText}`);
			return false;
		  }
	  
		  const result = await response.json();
		  return result.success;
		} catch (error) {
		  console.error('Token validation error:', error);
		  return false;
		}
	  };			
	  

	/**
	 * Checks if the user has admin privileges by making an API call.
	 * @returns {Promise<boolean>} - True if the user is an admin, otherwise false
	 */
	const isAdmin = async () => {
		try {
			const response = await fetch(`${apiLink}/get-user`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (!response.ok) {
				console.error(`API error: ${response.status} - ${response.statusText}`);
				return false;
			}

			const result = await response.json();
			return result.success && result.isAdmin;
		} catch (error) {
			console.error('Admin validation error:', error);
			return false;
		}
	};

	/**
	 * ProtectedRoute Component
	 * 
	 * Restricts access to routes for authenticated users only.
	 * Displays a loading indicator during validation.
	 * 
	 * @param {Object} props - Component props
	 * @param {JSX.Element} props.children - The child components to render if validation is successful
	 * @param {Function} props.validateToken - Function to validate the authentication token
	 * @returns {JSX.Element} - The protected route or a redirect to the login page
	 */
	const ProtectedRoute = ({ children, validateToken }) => {
		const [isValid, setIsValid] = useState(null);
	  
		useEffect(() => {
		  if (!token) {
			setIsValid(false); // Token is not available, user is not valid
			return;
		  }
	  
		  const validate = async () => {
			const valid = await validateToken();
			setIsValid(valid);
		  };
		  validate();
		}, [validateToken, token]);
	  
		if (isValid === null) {
		  return <div>Loading...</div>;
		}
	  
		return isValid ? children : <Navigate to="/" />;
	  };	  

	/**
	 * AdminProtectedRoute Component
	 * 
	 * Restricts access to routes for admin users only.
	 * Displays a loading indicator during validation.
	 * 
	 * @param {Object} props - Component props
	 * @param {JSX.Element} props.children - The child components to render if validation is successful
	 * @param {Function} props.isAdmin - Function to check if the user is an admin
	 * @returns {JSX.Element} - The protected route or a redirect to the dashboard
	 */
	const AdminProtectedRoute = ({ children, isAdmin }) => {
		const [isValidAdmin, setIsValidAdmin] = useState(null);

		useEffect(() => {
			const validate = async () => {
				const admin = await isAdmin();
				setIsValidAdmin(admin);
			};
			validate();
		}, [isAdmin]);

		if (isValidAdmin === null) {
			return <div>Loading...</div>;
		}

		return isValidAdmin ? children : <Navigate to="/dashboard" />;
	};

	// Render the application with routes
	return (
		<Router>
		<Routes>
		{/* Public route for login */}
		<Route path="/" element={<Login handleLogin={handleLogin} />} />
		{/* Protected routes for authenticated users */}
		<Route
		path="/dashboard"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<Dashboard handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		/>
		<Route
		path="/view-database"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<ViewDatabase handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		/>
		<Route
		path="/search-for-package"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<SearchForPackage handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		/>
		<Route
		path="/upload-package/*"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<Upload handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		>
		<Route path="external-package" element={<ExternalPackage />} />
		<Route path="internal-package" element={<InternalPackage />} />
		</Route>
		<Route
		path="/account"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<Account handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		/>
		<Route
		path="/view-package"
		element={<Navigate to="/view-database" />}
		/>
		<Route
		path="/view-package/:id"
		element={
			<ProtectedRoute validateToken={validateToken}>
			<ViewPackage handleLogout={handleLogout} token={token} />
			</ProtectedRoute>
		}
		/>
		{/* Admin-protected routes */}
		<Route
		path="/admin-page"
		element={
			<AdminProtectedRoute isAdmin={isAdmin}>
			<AdminPage handleLogout={handleLogout} token={token} />
			</AdminProtectedRoute>
		}
		/>
		<Route
		path="/create-new-user"
		element={
			<AdminProtectedRoute isAdmin={isAdmin}>
			<CreateUser handleLogout={handleLogout} token={token} />
			</AdminProtectedRoute>
		}
		/>
		<Route
		path="/reset-registry"
		element={
			<AdminProtectedRoute isAdmin={isAdmin}>
			<ResetRegistry handleLogout={handleLogout} />
			</AdminProtectedRoute>
		}
		/>
		</Routes>
		</Router>
	);
};

export default App;