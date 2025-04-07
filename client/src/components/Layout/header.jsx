// client/src/components/Layout/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-teal-600 text-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-teal-200 transition duration-200">
          Sensory Screen Time Guide
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-teal-200 transition duration-200">Home</Link>
          <Link to="/shows" className="hover:text-teal-200 transition duration-200">Browse Shows</Link>
          <Link to="/compare" className="hover:text-teal-200 transition duration-200">Compare</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;