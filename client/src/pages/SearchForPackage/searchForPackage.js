import React, { useState } from 'react';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './searchForPackage.css';

const SearchForPackagePage = ({ handleLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const authToken = localStorage.getItem('authToken');
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const apiUrl = `${apiLink}:${apiPort}/package/byRegEx`;

  const handleSearch = async () => {
    setHasSearched(true);
    try {
      setError(''); // Clear any previous error
      const response = await axios.post(
        apiUrl,
        { RegEx: searchTerm },
        {
          headers: {
            'X-Authorization': `${authToken}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setPackages(response.data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error searching for packages:', error);
      setError('Failed to fetch packages. Please check your API and try again.');
    }
  };

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="content">
        <h1>Search For A Package</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter search term (e.g., .*React.*)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {hasSearched && (
          <table className="packages-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Version</th>
                <th>View Package</th>
              </tr>
            </thead>
            <tbody>
              {packages.length > 0 ? (
                packages.map((pkg, index) => (
                  <tr key={pkg.ID}>
                    <td>{index + 1}</td>
                    <td>{pkg.Name}</td>
                    <td>{pkg.Version}</td>
                    <td>
                      <a href={`/view-package/${pkg.ID}`} className="view-package-link">
                        View Package
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No packages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchForPackagePage;