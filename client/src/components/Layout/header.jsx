// client/src/components/Layout/Header.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Use NavLink for active styling

const Header = () => {
  // Function to determine NavLink class based on active state
  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? 'text-white bg-teal-700 px-3 py-1 rounded-md text-sm font-medium transition duration-200 shadow-inner' // Active style with subtle shadow
      : 'text-teal-100 hover:text-white hover:bg-teal-500/80 px-3 py-1 rounded-md text-sm font-medium transition duration-200'; // Default style with slight hover opacity
  };

  return (
    <header className="bg-teal-600 text-white shadow-lg sticky top-0 z-50"> {/* Increased shadow */}
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Link */}
        <Link to="/" className="text-xl md:text-2xl font-bold hover:text-teal-100 transition duration-200 focus:outline-none focus:ring-2 focus:ring-white rounded px-1">
          Sensory Screen Time Guide
        </Link>
        {/* Navigation Links */}
        <div className="space-x-1 md:space-x-3"> {/* Adjusted spacing slightly */}
          {/* Use NavLink for automatic active styling */}
          <NavLink to="/" className={getNavLinkClass} end> {/* Added 'end' prop for exact match on home */}
            Home
          </NavLink>
          <NavLink to="/shows" className={getNavLinkClass}>
            Browse Shows
          </NavLink>
          <NavLink to="/compare" className={getNavLinkClass}>
            Compare
          </NavLink>
           {/* Add other links as needed */}
        </div>
      </nav>
    </header>
  );
};

export default Header;