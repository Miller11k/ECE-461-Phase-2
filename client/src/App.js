import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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

const apiPort = process.env.REACT_APP_API_PORT || 4010;
const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';

const App = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };
  

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

    if (isValid === null) {
      return <div>Loading...</div>;
    }

    return isValid ? children : <Navigate to="/" />;
  };

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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login handleLogin={handleLogin} />} />
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