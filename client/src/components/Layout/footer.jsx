// client/src/components/Layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link if needed for footer links

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-700 text-gray-300 text-center p-4 mt-8">
      <p>© {currentYear} Sensory Screen Time Guide. All rights reserved.</p>
      {/* Example of potential future links using React Router's Link */}
      {/* <p className="text-sm mt-2 space-x-3">
        <Link to="/about" className="hover:text-white">About Us</Link> |
        <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
      </p> */}
    </footer>
  );
};

export default Footer;