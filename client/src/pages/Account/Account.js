import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from 'components/Footer/Footer';
import Header from 'components/Header/Header';
import styles from './Account.module.css';

const Account = ({ handleLogout }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  useEffect(() => {
    const authenticateUser = async () => {
      if (!token) {
        setMessage('No authentication token found. Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        // Call get-user endpoint with token in the body
        const userResponse = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });

        if (userResponse.data.success) {
          const { firstName, lastName, username } = userResponse.data;
          setUserFullName(`${firstName || 'Unknown'} ${lastName || ''}`);
          setCurrentUsername(username || 'Unknown');
          setIsAuthenticated(true);
        } else {
          setMessage('Invalid token. Redirecting to login...');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setMessage('Error during authentication. Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    authenticateUser();
  }, [token, apiLink, apiPort, navigate]);

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
  
    try {
      // Determine the endpoint and payload based on the selected option
      const endpoint = selectedOption === 'username' ? '/change-username' : '/change-password';
      const payload =
        selectedOption === 'username'
          ? { new_username: newUsername }
          : { new_password: newPassword };
  
      // Make the API call
      const response = await axios.post(`${apiLink}:${apiPort}${endpoint}`, payload, {
        headers: { 'X-Authorization': token },
      });
  
      if (response.data.success) {
        alert(`${selectedOption === 'username' ? 'Username' : 'Password'} updated successfully`);
        handleLogout();
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