import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // Reference for the dropdown menu

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <img src="/Logo.png" alt="Logo" className="header-logo" />
      </div>
      <div className="header-center">
        <h1>
          <Link to="/dashboard" className="header-title-link">
            Acme Co. Package Registry
          </Link>
        </h1>
      </div>
      <div className="header-right" ref={menuRef}>
        <button className="hamburger-menu" onClick={toggleMenu}>☰</button>
        <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <Link to="/view-database" className="dropdown-item">View The Database</Link>
          <Link to="/upload-package" className="dropdown-item">Upload Package</Link>
          <Link to="/search-for-package" className="dropdown-item">Search For A Package</Link>
          <Link to="/account" className="dropdown-item">Account Settings</Link>
          <div onClick={handleLogout} className="dropdown-item logout">Logout</div>
        </div>
      </div>
    </header>
  );
};

export default Header;