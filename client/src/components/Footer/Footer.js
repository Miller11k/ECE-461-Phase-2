// Footer.js
import React from 'react';
import './Footer.css';

// Define the Footer component
const Footer = () => {
  return (
    // Footer element with a class name for styling
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} ECE 461 (Group 1) All rights reserved.</p>
    </footer>
  );
};

// Export the Footer component for use in other parts of the application
export default Footer;
