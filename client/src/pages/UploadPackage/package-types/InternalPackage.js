import React, { useState } from "react";
import axios from "axios";
import './InternalPackage.css';

function InternalPackage() {
  const [zipFile, setZipFile] = useState(null);
  const [packageName, setPackageName] = useState('');
  const [version1, setVersion1] = useState('');
  const [version2, setVersion2] = useState('');
  const [version3, setVersion3] = useState('');
  const [debloat, setDebloat] = useState(false); // New state for debloat option
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authToken = localStorage.getItem('authToken');
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const apiUrl = `${apiLink}:${apiPort}/package`;

  // Convert file to Base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove Base64 prefix
      reader.onerror = (error) => reject(error);
    });

  const uploadPackage = async () => {
    if (!zipFile) {
      setError('Please upload a zip file.');
      return;
    }

    if (!packageName.trim()) {
      setError('Please enter a package name.');
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

    const base64Content = await toBase64(zipFile);

    const payload = {
      Name: packageName.trim(),
      Version: `${version1}.${version2}.${version3}`,
      Content: base64Content,
      debloat, // Top-level field for debloat
    };

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
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
      setError(err.response?.data?.error || 'Failed to upload package. Please check the API and try again.');
      console.error('Error uploading package:', err.response?.data || err);
    }
  };

  // Reset form
  const resetForm = () => {
    setZipFile(null);
    setPackageName('');
    setVersion1('');
    setVersion2('');
    setVersion3('');
    setDebloat(false);
  };

  return (
    <div className="container">
      <h2>Upload Internal Package</h2>
      <div className="form">
        <div className="file-drop">
          <input type="file" onChange={(e) => setZipFile(e.target.files[0])} />
          {zipFile ? <p>{zipFile.name}</p> : <p>Drag and drop your zip file here</p>}
        </div>

        <div className="form-group">
          <label>Package Name</label>
          <input
            type="text"
            placeholder="Enter package name"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
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
              onChange={() => setDebloat(!debloat)}
            />
            <span className="checkbox-checkmark"></span>
            Debloat
          </label>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="button-group">
          <button onClick={uploadPackage} disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload Package"}
          </button>
          <button
            className="delete-button"
            onClick={resetForm}
            disabled={isLoading || !zipFile}
          >
            Reset Form
          </button>
        </div>
      </div>
    </div>
  );
}

export default InternalPackage;
