// client/src/components/Layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link if needed for footer links

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-gray-400 text-center p-5 mt-12 border-t border-gray-700"> {/* Adjusted colors and padding */}
      <p className="text-sm">&copy; {currentYear} Sensory Screen Time Guide. All rights reserved.</p>
      {/* Example of potential future links using React Router's Link */}
       <nav className="text-xs mt-2 space-x-3">
         {/* Example Links - replace with real routes if needed, or remove */}
         {/* <Link to="/about" className="hover:text-gray-200 hover:underline">About Us</Link> |
         <Link to="/privacy" className="hover:text-gray-200 hover:underline">Privacy Policy</Link> |
         <Link to="/contact" className="hover:text-gray-200 hover:underline">Contact</Link> */}
       </nav>
    </footer>
  );
};

export default Footer;