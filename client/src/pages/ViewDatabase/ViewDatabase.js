import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './ViewDatabase.css';

const ViewDatabase = ({ handleLogout }) => {
  const [packages, setPackages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState('');
  const authToken = localStorage.getItem('authToken');
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const apiUrl = `${apiLink}:${apiPort}/packages`;

  useEffect(() => {
    fetchPackages();
  }, [offset]);

  const fetchPackages = async () => {
    try {
      setError(''); // Clear any previous error
      const response = await axios.post(
        apiUrl,
        [{ Name: '*' }],
        {
          headers: {
            'X-Authorization': `${authToken}`,
          },
          params: { offset },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setPackages(response.data);

        // Enable the "Next" button only if we get 10 results
        setHasNext(response.data.length === 10);
      } else {
        setPackages([]);
        setHasNext(false);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to fetch packages. Please check your API and try again.');
    }
  };

  const handleNext = () => {
    if (hasNext) setOffset(offset + 10);
  };

  const handlePrevious = () => {
    if (offset > 0) setOffset(offset - 10);
  };

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="content">
        {error && <p className="error-message">{error}</p>}
        <table className="packages-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Version</th>
              <th>View Package</th>
            </tr>
          </thead>
          <tbody>
            {packages.length > 0 ? (
              packages.map((pkg, index) => (
                <tr key={pkg.ID}>
                  <td>{offset + index + 1}</td>
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
        <div className="pagination">
          {offset > 0 && (
            <button className="pagination-button" onClick={handlePrevious}>
              &#8592; Previous
            </button>
          )}
          {hasNext && (
            <button className="pagination-button" onClick={handleNext}>
              Next &#8594;
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ViewDatabase;