/**
 * Header Component
 * 
 * This component serves as the navigation header for the application.
 * It includes a company logo, application title, and a dropdown menu for navigation and logout.
 * The dropdown menu toggles open and closed, and it automatically closes when a click is detected outside of it.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleLogout - Function to handle user logout
 * @returns {JSX.Element} - The rendered Header component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS file for styling

const Header = ({ handleLogout }) => {
  // State for managing the visibility of the dropdown menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Reference for the dropdown menu to detect clicks outside
  const menuRef = useRef(null);

  /**
   * Toggles the dropdown menu's visibility.
   */
  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Toggle the menu state
  };

  /**
   * Effect to handle clicks outside the dropdown menu to close it.
   */
  useEffect(() => {
    /**
     * Handles clicks outside the dropdown menu.
     * 
     * @param {MouseEvent} event - The mouse event object
     */
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false); // Close the menu
      }
    };

    // Attach the event listener for mouse clicks
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render the Header component
  return (
    <header className="header">
      {/* Left section: Company logo */}
      <div className="header-left">
        <img src="/Logo.png" alt="Logo" className="header-logo" />
      </div>

      {/* Center section: Application title */}
      <div className="header-center">
        <h1>
          <Link to="/dashboard" className="header-title-link">
            Acme Co. Package Registry
          </Link>
        </h1>
      </div>

      {/* Right section: Dropdown menu and menu toggle button */}
      <div className="header-right" ref={menuRef}>
        {/* Menu toggle button */}
        <button className="hamburger-menu" onClick={toggleMenu}>☰</button>

        {/* Dropdown menu */}
        <div
          className={`dropdown-menu ${menuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()} // Prevent click propagation to toggle menu state
        >
          {/* Navigation links */}
          <Link to="/view-database" className="dropdown-item">View The Database</Link>
          <Link to="/upload-package" className="dropdown-item">Upload Package</Link>
          <Link to="/search-for-package" className="dropdown-item">Search For A Package</Link>
          <Link to="/account" className="dropdown-item">Account Settings</Link>

          {/* Logout link */}
          <div onClick={handleLogout} className="dropdown-item logout">Logout</div>
        </div>
      </div>
	  </header>
  );
};

export default Header;
