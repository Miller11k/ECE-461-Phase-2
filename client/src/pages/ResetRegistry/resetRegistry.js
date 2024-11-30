import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './resetRegistry.css';
import axios from 'axios';

const ResetRegistry = ({ handleLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setMessage('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    const verifyAdmin = async () => {
      try {
        const response = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });

        if (response.data.success && response.data.isAdmin) {
          setIsAdmin(true);
        } else {
          setMessage('This page is only accessible to administrators.');
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
        setMessage('Error verifying admin status.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdmin();
  }, [apiLink, apiPort, navigate]);

  const handleReset = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setMessage('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    if (inputValue !== 'Reset Registry') {
      alert('Error: Please type "Reset Registry" exactly as shown to confirm the action.');
      return;
    }


    try {
      const response = await axios.delete(`${apiLink}:${apiPort}/reset`, {
        headers: { 'X-Authorization': token },
      });

      if (response.status === 200) {
        setSuccessMessage('Registry reset successfully!');
        setInputValue('');
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

  if (isLoading) {
    return (
      <div className="reset-registry-container">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="reset-registry-container">
        <h1 className="reset-registry-header"><u>Reset Registry</u></h1>
        <div className="reset-registry-box">
          {isAdmin ? (
            <>
              <p>Type "Reset Registry" to confirm the action.</p>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter confirmation text"
              />
              <button onClick={handleReset}>Reset Registry</button>
              {successMessage && <p className="success-message">{successMessage}</p>}
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

export default ResetRegistry;
