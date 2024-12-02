// Import necessary React hooks and libraries
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Import the Header CSS file for styling
import './Header.css';

// Define the Header component with a handleLogout prop
const Header = ({ handleLogout }) => {
  // State for managing the dropdown menu visibility
  const [menuOpen, setMenuOpen] = useState(false);

  // Reference for the dropdown menu to detect clicks outside
  const menuRef = useRef(null);

  // Toggle the dropdown menu open/close state
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Effect to close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click was outside the dropdown menu
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false); // Close the menu
      }
    };

    // Attach the event listener on mount
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Cleanup the event listener on unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    // Header element with structured sections for left, center, and right content
    <header className="header">
      {/* Left section: Company logo */}
      <div className="header-left">
        <img src="/Logo.png" alt="Logo" className="header-logo" />
      </div>
      {/* Center section: Application title with link to the dashboard */}
      <div className="header-center">
        <h1>
          <Link to="/dashboard" className="header-title-link">
            Acme Co. Package Registry
          </Link>
        </h1>
      </div>
      {/* Right section: Dropdown menu and menu toggle button */}
      <div className="header-right" ref={menuRef}>
        <button className="hamburger-menu" onClick={toggleMenu}>☰</button>

        {/* Dropdown menu with conditional rendering based on menuOpen state */}
        <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          {/* Links to various sections of the application */}
          <Link to="/view-database" className="dropdown-item">View The Database</Link>
          <Link to="/upload-package" className="dropdown-item">Upload Package</Link>
          <Link to="/search-for-package" className="dropdown-item">Search For A Package</Link>
          <Link to="/account" className="dropdown-item">Account Settings</Link>

          {/* Logout option that triggers the handleLogout function */}
          <div onClick={handleLogout} className="dropdown-item logout">Logout</div>
        </div>
      </div>
    </header>
  );
};

// Export the Header component for use in other parts of the application
export default Header;