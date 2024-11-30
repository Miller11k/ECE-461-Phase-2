import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import Footer from 'components/Footer/Footer';
import './Login.css'; // Import the CSS file

const Login = ({ handleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const apiUrl = `${apiLink}:${apiPort}/login`;
    console.log(`Making request to: ${apiUrl}`); // Debug log
    try {
      const response = await axios.post(apiUrl, { username, password });
      console.log('API Response:', response.data); // Debug log
      if (response.data.success) {
        const { token } = response.data;
        localStorage.setItem('authToken', token);
        handleLogin(token);
        navigate('/dashboard'); // Navigate to dashboard on success
      } else {
        setMessage(response.data.message || 'Invalid Credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('Invalid Credentials');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-header"><u>Login</u></h1>
      <div className="login-box">
        <div className="logo-container">
          <img src="logo.png" alt="Company Logo" className="company-logo" />
        </div>
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
        {message && <p>{message}</p>}
      </div>
      <Footer />
    </div>
  );
};

export default Login;