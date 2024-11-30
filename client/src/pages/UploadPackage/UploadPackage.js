// Upload.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import './UploadPackage.css';

function Upload({ handleLogout }) {
  return (
    <div className="page-container">
      <Header handleLogout={handleLogout} />
      <div className="content">
        <h1>Upload Package</h1>
        <div>
          <Link to="external-package">
            <button className="button-custom">External Package</button>
          </Link>
          <Link to="internal-package" style={{ marginLeft: '10px' }}>
            <button className="button-custom">Internal Package</button>
          </Link>
        </div>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Upload;
