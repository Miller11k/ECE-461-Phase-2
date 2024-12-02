// Import necessary React and React Router libraries
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

// API configuration using environment variables or default values
const apiPort = process.env.REACT_APP_API_PORT || 4010;
const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

const App = () => {
  // State for storing the authentication token
  const [token, setToken] = useState(null);

  // Load token from local storage when the component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Handle login by saving the token and storing it in local storage
  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
  };

  // Handle logout by clearing the token and removing it from local storage
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };
  

  // Validate the token by making an API call
  const validateToken = async () => {
    try {
      const response = await fetch(`${apiLink}:${apiPort}/get-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
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

  // Check if the user has admin privileges
  const isAdmin = async () => {
    try {
      const response = await fetch(`${apiLink}:${apiPort}/get-user`, {
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

  // Protected route component for authenticated users
  const ProtectedRoute = ({ children, validateToken }) => {
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
      const validate = async () => {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
          setIsValid(false);
          return;
        }

        const valid = await validateToken();
        setIsValid(valid);
      };
      validate();
    }, [validateToken]);
    
    // Show a loading indicator while validation is in progress
    if (isValid === null) {
      return <div>Loading...</div>;
    }

    // Render children if valid, otherwise navigate to the login page
    return isValid ? children : <Navigate to="/" />;
  };

  // Admin-protected route component for users with admin privileges
  const AdminProtectedRoute = ({ children, isAdmin }) => {
    const [isValidAdmin, setIsValidAdmin] = useState(null);

    useEffect(() => {
      const validate = async () => {
        const admin = await isAdmin();
        setIsValidAdmin(admin);
      };
      validate();
    }, [isAdmin]);

    // Show a loading indicator while validation is in progress
    if (isValidAdmin === null) {
      return <div>Loading...</div>;
    }

    // Render children if the user is an admin, otherwise redirect to the dashboard
    return isValidAdmin ? children : <Navigate to="/dashboard" />;
  };

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
          {/* Nested routes for external and internal package uploads */}
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
        {/* Redirect /view-package to /view-database */}
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

export default App; // Export the App component as the default export