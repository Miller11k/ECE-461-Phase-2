import React, { useState } from "react";
import axios from "axios";
import './ExternalPackage.css';

function ExternalPackage() {
  const [packageName, setPackageName] = useState('');
  const [packageLink, setPackageLink] = useState('');
  const [version1, setVersion1] = useState('');
  const [version2, setVersion2] = useState('');
  const [version3, setVersion3] = useState('');
  const [debloat, setDebloat] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authToken = localStorage.getItem('authToken');
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const apiUrl = `${apiLink}:${apiPort}/package`;

  const isValidGithubLink = (url) => /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(url);

  const uploadPackage = async () => {
    if (!packageName.trim()) {
      setError('Please enter a package name.');
      return;
    }

    if (!packageLink.trim() || !isValidGithubLink(packageLink.trim())) {
      setError('Please enter a valid GitHub link (e.g., https://github.com/owner/repo).');
      return;
    }

    if (!version1 || !version2 || !version3) {
      setError('Please enter a complete version number (e.g., 1.0.0).');
      return;
    }

    if (
      !Number.isInteger(Number(version1)) ||
      !Number.isInteger(Number(version2)) ||
      !Number.isInteger(Number(version3))
    ) {
      setError('Version numbers must be integers.');
      return;
    }

    const payload = {
      Name: packageName.trim(),
      Version: `${version1}.${version2}.${version3}`,
      URL: packageLink.trim(),
      debloat,
    };

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'X-Authorization': authToken,
        },
      });

      if (response.status === 201) {
        setSuccess('Package uploaded successfully.');
        resetForm();
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to upload package. Please check the API and try again.');
      console.error('Error uploading package:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPackageName('');
    setPackageLink('');
    setVersion1('');
    setVersion2('');
    setVersion3('');
    setDebloat(false);
  };

  return (
    <div className="container">
      <h2>Upload External Package</h2>
      <form onSubmit={(e) => e.preventDefault()} className="form">
        <div className="form-group">
          <label>Package Name:</label>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Package Link (GitHub):</label>
          <input
            type="text"
            value={packageLink}
            onChange={(e) => setPackageLink(e.target.value)}
            required
          />
        </div>

        {/* Version Input Box */}
        <div className="form-group version-input">
          <label>Version</label>
          <div className="version-inputs">
            <input
              type="number"
              value={version1}
              onChange={(e) => setVersion1(e.target.value)}
              maxLength={2}
              placeholder="1"
            />
            <span>.</span>
            <input
              type="number"
              value={version2}
              onChange={(e) => setVersion2(e.target.value)}
              maxLength={2}
              placeholder="0"
            />
            <span>.</span>
            <input
              type="number"
              value={version3}
              onChange={(e) => setVersion3(e.target.value)}
              maxLength={2}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={debloat}
              onChange={(e) => setDebloat(e.target.checked)}
            />
            <span className="checkbox-checkmark"></span>
            Debloat
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <div className="button-group">
          <button onClick={uploadPackage} type="button" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );  
}

export default ExternalPackage;