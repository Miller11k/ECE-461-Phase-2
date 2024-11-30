import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './createUser.css';
import axios from 'axios';

const CreateUser = ({ handleLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('Auth token:', token);

    if (!token) {
      console.log('No authentication token found.');
      setMessage('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    const verifyAdmin = async () => {
      console.log('Verifying admin status...');
      try {
        const response = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });
        console.log('Admin verification response:', response.data);

        if (response.data.success && response.data.isAdmin) {
          console.log('User is an admin.');
          setIsAdmin(true);
        } else {
          console.log('User is not an admin.');
          setMessage('This page is only accessible to administrators.');
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
        setMessage('Error verifying admin status.');
      } finally {
        setIsLoading(false);
        console.log('Admin verification completed.');
      }
    };

    verifyAdmin();
  }, [apiLink, apiPort, navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    console.log('Token for creating user:', token);

    if (!token) {
      console.log('No authentication token found.');
      setMessage('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    console.log('Preparing API call to create user...');
    console.log('User details:', {
      first_name: firstName,
      last_name: lastName,
      username,
      plaintext_password: password,
      is_admin: isUserAdmin,
    });

    try {
      const response = await axios.post(
        `${apiLink}:${apiPort}/create-user`,
        {
          first_name: firstName,
          last_name: lastName,
          username,
          plaintext_password: password,
          is_admin: isUserAdmin,
        },
        { headers: { 'X-Authorization': token } }
      );

      console.log('API response:', response.data);

      if (response.data.success) {
        console.log('User created successfully.');
        setSuccessMessage('User created successfully!');
        setUsername('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setIsUserAdmin(false);
      } else {
        console.log('Failed to create user:', response.data.error || 'Unknown error');
        setMessage(response.data.error || 'Failed to create user. Please try again.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Error creating user. Please try again.');
    }
  };

  if (isLoading) {
    console.log('Page is loading...');
    return (
      <div className="create-user-container">
        <h1>Loading...</h1>
      </div>
    );
  }

  console.log('Render complete. Admin status:', isAdmin);

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="create-user-container">
        <h1 className="create-user-header"><u>Create User</u></h1>
        <div className="create-user-box">
          {isAdmin ? (
            <>
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