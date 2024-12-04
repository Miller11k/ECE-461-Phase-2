import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './ViewPackage.css';

const ViewPackage = ({ handleLogout }) => {
  const { id } = useParams(); // Retrieve the package ID from the URL
  const navigate = useNavigate();
  const [packageDetails, setPackageDetails] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [sizeCost, setSizeCost] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const [zipFile, setZipFile] = useState(null);
  const [packageUrl, setPackageUrl] = useState('');
  const [debloat, setDebloat] = useState(false);
  const [newVersion, setNewVersion] = useState('');//needed for new version update

  const authToken = localStorage.getItem('authToken');
  const apiPort = process.env.REACT_APP_API_PORT || 4010;
  const apiLink = process.env.REACT_APP_API_URL || 'http://localhost';
  const apiUrl = id ? `${apiLink}:${apiPort}/package/${id}` : null;

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch package details
        const detailsResponse = await axios.get(apiUrl, {
          headers: { 'X-Authorization': authToken },
        });
        setPackageDetails(detailsResponse.data);

        // Fetch metrics
        const metricsResponse = await axios.get(`${apiUrl}/rate`, {
          headers: { 'X-Authorization': authToken },
        });
        setMetrics(metricsResponse.data);

        // Fetch size cost
        const sizeCostResponse = await axios.get(`${apiUrl}/cost`, {
          headers: { 'X-Authorization': authToken },
        });
        setSizeCost(sizeCostResponse.data);

        setError('');
      } catch (err) {
        console.error('Error fetching package details:', err);
        setError('Failed to fetch package details or additional data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authToken) {
      console.error('No authToken found. Redirecting to login.');
      navigate('/');
      return;
    }

    if (!id) {
      console.error('No package ID found. Redirecting to view-database.');
      navigate('/view-database');
      return;
    }

    fetchPackageDetails();
  }, [id, authToken, apiUrl, navigate]);

  const handleDownload = () => {
    if (!packageDetails?.data?.Content) {
      setError('No content available for download.');
      return;
    }
    try {
      const binaryContent = Uint8Array.from(
        atob(packageDetails.data.Content),
        (char) => char.charCodeAt(0)
      );
      const blob = new Blob([binaryContent], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${packageDetails.metadata?.Name || 'package'}.zip`;
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download the package. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file /*&& file.type === 'application/zip'*/) {
      setZipFile(file);
      setPackageUrl(''); // Clear URL input if file is uploaded
      setError('');
    } else {
      setError('Please upload a valid zip file.');
      setSuccess('');
    }
  };

  const handleUrlChange = (e) => {
    setPackageUrl(e.target.value);
    setZipFile(null); // Clear file input if URL is entered
    setError('');
  };

  const handleVersionChange = (e) => {
    setNewVersion(e.target.value);
  }; 

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove Base64 prefix
      reader.onerror = (error) => reject(error);
    });

    const updatePackage = async (e) => {
      e.preventDefault();
    
      if (zipFile && packageUrl) {
        setError('Please provide only one input: either upload a file or input a URL.');
        return;
      }
    
      if (!zipFile && !packageUrl) {
        setError('Please upload a zip file or provide a valid URL.');
        return;
      }

      //we need a new version 
      if (!newVersion) {
        setError('Please provide a new version number.');
        return;
      }
    
      try {
        let base64Content = null;
        if (zipFile) {
          base64Content = await toBase64(zipFile);
        }
    
        const payload = {
          metadata: {
            Name: packageDetails?.metadata?.Name || 'DefaultName',
            Version: newVersion.trim() || '1.0.0',
            ID: id,
          },
          data: {
            Name: packageDetails?.metadata?.Name || 'DefaultName',
            Content: base64Content || packageDetails?.data?.Content || 'NOCONTENTINDATABASE=',
            URL: packageUrl.trim() || packageDetails?.data?.URL || undefined,
            debloat: debloat, // Ensure correct key and casing
            JSProgram: undefined, // Assuming no program is sent unless explicitly set
          },
        };
    
        console.log('Payload being sent to server:', payload); // Debugging
    
        setIsLoading(true);
        setError('');
        setSuccess('');
    
        const response = await axios.post(apiUrl, payload, {
          headers: {
            'X-Authorization': `${authToken}`,
            'Content-Type': 'application/json',
          },
        });
    
        setSuccess('Package updated successfully!');
        console.log('Server Response:', response.data);
    
        setZipFile(null);
        setPackageUrl('');
        setDebloat(false);
    
        const updatedDetails = await axios.get(apiUrl, {
          headers: { 'X-Authorization': `${authToken}` },
        });
        setPackageDetails(updatedDetails.data);
      } catch (err) {
        setError('Failed to update the package. Please try again.');
        console.error('Error updating package:', err);
      } finally {
        setIsLoading(false);
      }
    };
        
    

  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="content">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        {isLoading ? (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        ) : (
          packageDetails && (
            <div className="package-details">
              <h1>Package Details</h1>
              <p><strong>Name:</strong> {packageDetails.metadata?.Name}</p>
              <p><strong>Version:</strong> {packageDetails.metadata?.Version}</p>
              <button className="download-button" onClick={handleDownload}>
                Download Package
              </button>

              {metrics && (
                <div className="metrics">
                  <h2>Metrics</h2>
                  <p><strong>Net Score:</strong> {metrics.NetScore}</p>
                  <p><strong>Net Score Latency:</strong> {metrics.NetScoreLatency}</p>
                  <p><strong>Ramp-Up Score:</strong> {metrics.RampUp}</p>
                  <p><strong>Ramp-Up Latency:</strong> {metrics.RampUpLatency}</p>
                  <p><strong>Bus Factor:</strong> {metrics.BusFactor}</p>
                  <p><strong>Bus Factor Latency:</strong> {metrics.BusFactorLatency}</p>
                  <p><strong>Correctness:</strong> {metrics.Correctness}</p>
                  <p><strong>Correctness Latency:</strong> {metrics.CorrectnessLatency}</p>
                  <p><strong>Responsive Maintainer:</strong> {metrics.ResponsiveMaintainer}</p>
                  <p><strong>Responsive Maintainer Latency:</strong> {metrics.ResponsiveMaintainerLatency}</p>
                  <p><strong>License Score:</strong> {metrics.LicenseScore}</p>
                  <p><strong>License Score Latency:</strong> {metrics.LicenseScoreLatency}</p>
                  <p><strong>Good Pinning Practice:</strong> {metrics.GoodPinningPractice}</p>
                  <p><strong>Good Pinning Practice Latency:</strong> {metrics.GoodPinningPracticeLatency}</p>
                  <p><strong>Pull Request:</strong> {metrics.PullRequest}</p>
                  <p><strong>Pull Request Latency:</strong> {metrics.PullRequestLatency}</p>
                </div>
              )}

              {sizeCost && (
                <div className="size-cost">
                  <h2>Size Cost</h2>
                  <p><strong>Total Cost:</strong> {sizeCost[id]?.totalCost} MB</p>
                  {sizeCost[id]?.standaloneCost && (
                    <p><strong>Standalone Cost:</strong> {sizeCost[id].standaloneCost} MB</p>
                  )}
                </div>
              )}

              {/* Update Package Form */}
              <div className="update-package">
                <h2>Update Package</h2>
                <form className="update-package-form" onSubmit={updatePackage}>
                  <label className="file-drop">
                    {zipFile ? zipFile.name : 'Drag and drop a zip file here, or click to select'}
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <label>
                    OR Provide a URL:
                    <input
                      type="url"
                      value={packageUrl}
                      onChange={handleUrlChange}
                      placeholder="Enter package URL"
                    />
                  </label>
                  <label>
                    New Version:
                    <input
                      type="text"
                      value={newVersion}
                      onChange={handleVersionChange}
                      placeholder="Enter new version"
                    />
                  </label>
                  <div className="form-group">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={debloat}
                        onChange={() => setDebloat(!debloat)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-checkmark"></span>
                      Debloat Package
                    </label>
                  </div>
                  <button type="submit" className="update-button" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Package'}
                  </button>
                </form>
              </div>
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ViewPackage;