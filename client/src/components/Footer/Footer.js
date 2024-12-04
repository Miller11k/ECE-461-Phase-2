/**
 * Footer Component
 * 
 * This component renders the footer of the application.
 * It displays a copyright message with the current year.
 * 
 * @returns {JSX.Element} - The rendered Footer component
 */

import React from 'react';
import './Footer.css'; // Import the CSS file for styling

const Footer = () => {
	// Render the Footer component
	return (
		<footer className="footer">
		{/* Display the copyright message with the current year */}
		<p>&copy; {new Date().getFullYear()} ECE 461 (Group 1) All rights reserved.</p>
		</footer>
	);
};

export default Footer;
