import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Ensure your Tailwind CSS import is here

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // <-- Commented out start tag
    <App />
  // </React.StrictMode>, // <-- Commented out end tag
)
