// client/src/pages/HomePage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for buttons, useNavigate for search action

const HomePage = () => {
  // We'll add state and functions for the search bar later
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault(); // Prevent default form submission
    // TODO: Get search query and navigate to catalog page with search term
    console.log('Search submitted (functionality to be added)');
    // Example: navigate('/shows?search=...');
  };

  return (
    <div className="text-center">
      {/* 1. Warm Welcome Introduction */}
      <h1 className="text-4xl font-bold text-teal-700 mb-4">
        Find the perfect show for your child—easily and confidently.
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Navigating children's television can be overwhelming. We provide clear, concise sensory ratings to help you choose shows that align with your child's needs and sensitivities.
      </p>

      {/* 2. Prominent Search Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6">
        <div className="relative">
          <input
            type="search"
            placeholder="Search for show title..."
            className="w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            // We'll need to add state management for the input value
          />
          <button
            type="submit"
            className="absolute right-0 top-0 mt-2 mr-2 px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 transition duration-200"
          >
            Search
          </button>
        </div>
        {/* TODO: Link/Button for Advanced Search Filters */}
        <div className="text-right mt-2">
            <Link to="/shows" className="text-sm text-teal-600 hover:underline">
                Advanced Search & Filters
            </Link>
        </div>
      </form>

      {/* 3. Preview of Scrollable Catalog (Placeholder) */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Popular Shows</h2>
        {/* Placeholder for show previews - We will fetch and display actual shows later */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          <div className="bg-white p-2 rounded shadow text-center">Show 1 Placeholder</div>
          <div className="bg-white p-2 rounded shadow text-center">Show 2 Placeholder</div>
          <div className="bg-white p-2 rounded shadow text-center">Show 3 Placeholder</div>
          <div className="bg-white p-2 rounded shadow text-center">Show 4 Placeholder</div>
          <div className="bg-white p-2 rounded shadow text-center">Show 5 Placeholder</div>
          <div className="bg-white p-2 rounded shadow text-center">Show 6 Placeholder</div>
        </div>
      </div>

      {/* 4. Call-to-Action Button */}
      <Link
        to="/shows" // Link directly to the catalog page
        className="inline-block px-8 py-3 bg-orange-500 text-white text-lg font-semibold rounded-full shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200"
      >
        Start Exploring Shows Now
      </Link>

    </div>
  );
};

export default HomePage;