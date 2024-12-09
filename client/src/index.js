/**
 * Entry Point for the React Application
 * 
 * This file initializes and renders the React application by mounting the App component
 * onto the root DOM element in the HTML file. It uses React.StrictMode to help identify potential
 * issues in the application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import the main App component

// Get the root DOM element where the React app will be rendered
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the App component into the root element.
 * 
 * React.StrictMode is used as a wrapper to highlight potential problems in the application,
 * such as deprecated features or side-effects in lifecycle methods.
 */
root.render(
	<React.StrictMode>
	<App />
	</React.StrictMode>
);