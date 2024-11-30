import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './Dashboard.css';
import axios from 'axios';

const Dashboard = ({ handleLogout, token }) => {
  const [userFullName, setUserFullName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.post(`${apiLink}:${apiPort}/get-user`, { token });
        if (response.data.success) {
          const { firstName, lastName, isAdmin } = response.data;
          setUserFullName(`${firstName} ${lastName}`);
          setIsAdmin(isAdmin);
        } else {
          setMessage(response.data.message || 'Invalid token. Redirecting...');
          setTimeout(() => navigate('/'), 3000); // Redirect after showing a message
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setMessage('Error fetching user details.');
      }
    };

    if (token) {
      fetchUserDetails();
    } else {
      setMessage('No token found. Redirecting...');
      setTimeout(() => navigate('/'), 3000); // Redirect after showing a message
    }
  }, [token, apiLink, apiPort, navigate]);

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="content">
        {userFullName ? (
          <h1>Welcome to the Application, {userFullName}!</h1>
        ) : (
          <h1>{message || 'Loading user details...'}</h1>
        )}
        <div className="options-container">
          <Link to="/view-database" className="option-box">
            <h2>View the Database</h2>
          </Link>
          <Link to="/upload-package" className="option-box">
            <h2>Upload a Package</h2>
          </Link>
          <Link to="/search-for-package" className="option-box">
            <h2>Search For a Package</h2>
          </Link>
          {isAdmin && (
            <Link to="/admin-page" className="option-box">
              <h2>Admin Page</h2>
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;