import React, { useState } from "react";
import axios from "axios";
import './ExternalPackage.css';

function ExternalPackage() {
    const [packageName, setPackageName] = useState(''); // Package name
    const [packageLink, setPackageLink] = useState(''); // GitHub link
    const [version1, setVersion1] = useState(''); // Version major number
    const [version2, setVersion2] = useState(''); // Version minor number
    const [version3, setVersion3] = useState(''); // Version patch number
    const [debloat, setDebloat] = useState(false); // Debloat option
    const [error, setError] = useState(''); // Error message
    const [success, setSuccess] = useState(''); // Success message
    const [isLoading, setIsLoading] = useState(false); // Loading state

    // Correct API URL for the /package endpoint
    const apiUrl = `${process.env.REACT_APP_API_URL || 'http://44.220.142.54:4010'}/package`;

    const isValidGithubLink = (url) => /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(url);

    const handleAxiosError = (err) => {
        if (err.response?.status === 400) {
            setError('Bad Request: ' + (err.response?.data?.error || 'Invalid input data.'));
        } else if (err.response?.status === 403) {
            setError('Authorization Error: Invalid or expired token.');
        } else if (err.response?.status === 500) {
            setError('Server Error: Please try again later.');
        } else {
            setError('An unexpected error occurred.');
        }
        console.error('Error uploading package:', err);
    };

    const sanitizeGitHubUrl = (url) => url.replace(/\.git$/, ''); // Helper function

const uploadPackage = async () => {
    const rawToken = localStorage.getItem('authToken'); // Get the token
    if (!rawToken) {
        setError('Authentication token not found. Please log in again.');
        return;
    }

    // Ensure the token has the correct 'Bearer' prefix
    const authToken = rawToken.toLowerCase().startsWith('bearer ')
        ? rawToken
        : `Bearer ${rawToken}`;

    // Sanitize the GitHub URL
    const sanitizedPackageLink = sanitizeGitHubUrl(packageLink.trim());

    // Validate the sanitized URL
    if (!isValidGithubLink(sanitizedPackageLink)) {
        setError('Please enter a valid GitHub link (e.g., https://github.com/owner/repo).');
        return;
    }

    const payload = {
        Name: packageName.trim(),
        Version: `${version1}.${version2}.${version3}`,
        URL: sanitizedPackageLink,
        debloat,
    };

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'X-Authorization': authToken, // Pass the token as is
            },
        });

        if (response.status === 201) {
            setSuccess('Package uploaded successfully.');
            resetForm();
        } else {
            setError('Upload failed. Please try again.');
        }
		} catch (err) {
			handleAxiosError(err);
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
                <div className="form-group version-input">
                    <label>Version:</label>
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