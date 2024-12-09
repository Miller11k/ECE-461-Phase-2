/**
 * Upload Component
 * 
 * This component serves as a parent container for uploading packages.
 * It provides navigation links to upload either an external or internal package
 * and renders nested routes for the corresponding forms.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered Upload component
 */

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './UploadPackage.css';

function Upload({ handleLogout }) {
	return (
		<div className="page-container">
		{/* Header with logout functionality */}
		<Header handleLogout={handleLogout} />
		<div className="content">
		<h1>Upload Package</h1>

		{/* Navigation buttons for selecting package type */}
		<div>
		<Link to="external-package">
		<button className="button-custom">External Package</button>
		</Link>
		<Link to="internal-package" style={{ marginLeft: '10px' }}>
		<button className="button-custom">Internal Package</button>
		</Link>
		</div>

		{/* Render nested routes */}
		<Outlet />
		</div>

		{/* Footer */}
		<Footer />
		</div>
	);
}

export default Upload;