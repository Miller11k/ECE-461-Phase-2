import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './AdminPage.css';
import axios from 'axios';

const AdminPage = ({ handleLogout }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Get the token from storage
    if (!token) {
      setMessage('No authentication token found. Please log in.');
      navigate('/login'); // Redirect to login page if token is missing
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