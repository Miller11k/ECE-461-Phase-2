/**
 * Account component for managing user account details.
 * Allows authenticated users to change their username or password.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {Function} props.handleLogout - Function to handle user logout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import styles from './Account.module.css';

const Account = ({ handleLogout }) => {
  // State variables for handling user input and UI state
  const [newUsername, setNewUsername] = useState(''); // New username entered by the user
  const [newPassword, setNewPassword] = useState(''); // New password entered by the user
  const [confirmPassword, setConfirmPassword] = useState(''); // Confirmation of the new password
  const [selectedOption, setSelectedOption] = useState(''); // Selected option: 'username' or 'password'
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Whether the user is authenticated
  const [message, setMessage] = useState(''); // Message to display during authentication or errors
  const [userFullName, setUserFullName] = useState(''); // Full name of the authenticated user
  const [currentUsername, setCurrentUsername] = useState(''); // Current username of the user

  // Environment variables for API configuration
  // const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const token = localStorage.getItem('authToken');  // Authentication token from local storage
  const navigate = useNavigate(); // React Router hook for navigation

  /**
   * Effect hook for authenticating the user when the component mounts.
   * Redirects to the login page if authentication fails.
   */
  useEffect(() => {
    const authenticateUser = async () => {
      if (!token) {
        // Notify the user that no token is found and redirect to login after a delay
        setMessage('No authentication token found. Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        // Send a POST request to the 'get-user' endpoint with the token in the body
        const userResponse = await axios.post(`${apiLink}/get-user`, { token });

        if (userResponse.data.success) {
          // Extract user details from the response and update state
          const { firstName, lastName, username } = userResponse.data;
          setUserFullName(`${firstName || 'Unknown'} ${lastName || ''}`);
          setCurrentUsername(username || 'Unknown');
          setIsAuthenticated(true); // Mark the user as authenticated
        } else {
          setMessage('Invalid token. Redirecting to login...');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err) {
        // Handle invalid token scenario and redirect to login
        console.error('Authentication error:', err);
        setMessage('Error during authentication. Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    // Call the authenticateUser function when the effect is triggered
    authenticateUser();
  }, [token, apiLink, navigate]);  // Dependencies for the useEffect hook

  /**
   * Handles saving changes to the user's account details.
   * Validates input and makes API calls to update username or password.
   */
  const handleSaveChanges = async () => {
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      navigate('/');
      return;
    }
  
    // Check if no option is selected
    if (!selectedOption) {
      alert('Please select an option to change your username or password.');
      return;
    }
  
    // Validate passwords if the user is changing the password
    if (selectedOption === 'password') {
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match. Please confirm your password correctly.');
        return;
      }
  
      if (!newPassword || !confirmPassword) {
        alert('Password fields cannot be empty.');
        return;
      }
    }
  
    try {
      // Determine the endpoint and payload based on the selected option
      const endpoint = selectedOption === 'username' ? '/change-username' : '/change-password';
      const payload =
        selectedOption === 'username'
          ? { new_username: newUsername }
          : { new_password: newPassword };
  
      // Make the API call
      const response = await axios.post(`${apiLink}${endpoint}`, payload, {
        headers: { 'X-Authorization': token },
      });
  
      if (response.data.success) {
        alert(`${selectedOption === 'username' ? 'Username' : 'Password'} updated successfully`);
        handleLogout(); // Log out the user after updating account details
        navigate('/');
      } else {
        alert(response.data.message || `Failed to update ${selectedOption}`);
      }
    } catch (error) {
      console.error(`Error updating ${selectedOption}:`, error);
      alert(error?.response?.data?.message || 'An error occurred while processing your request.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header handleLogout={handleLogout} />
      <main className={styles.mainContent}>
        <div className={styles.accountContainer}>
          {isAuthenticated ? (
            <>
              <h1 className={styles.title}>Account Details for {userFullName}</h1>
              <div className={styles.options}>
                <button
                  className={`${styles.optionButton} ${selectedOption === 'username' ? styles.selected : ''}`}
                  onClick={() => setSelectedOption('username')}
                >
                  Change Username
                </button>
                <button
                  className={`${styles.optionButton} ${selectedOption === 'password' ? styles.selected : ''}`}
                  onClick={() => setSelectedOption('password')}
                >
                  Change Password
                </button>
              </div>

              {selectedOption === 'username' && (
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="newUsername">New Username</label>
                  <input
                    type="text"
                    id="newUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className={styles.input}
                    placeholder="Enter new username"
                  />
                </div>
              )}

              {selectedOption === 'password' && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.input}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={styles.input}
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              )}
              <button onClick={handleSaveChanges} type="button" className={styles.saveButton}>Save Changes</button>
            </>
          ) : (
            <p className={styles.errorMessage}>{message || 'Authenticating...'}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;