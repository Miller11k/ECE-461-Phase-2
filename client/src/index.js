import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Get the root DOM element where the React app will be rendered
const root = ReactDOM.createRoot(document.getElementById('root'));


// Render the App component into the root element
// React.StrictMode is a wrapper to help identify potential issues in an application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);