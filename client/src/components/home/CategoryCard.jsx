// client/src/components/home/CategoryCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Accepts title, description, an IconComponent, and a linkUrl
const CategoryCard = ({ title, description, IconComponent, linkUrl }) => {
  // Basic validation: Ensure linkUrl is provided
  if (!linkUrl) {
    console.warn(`CategoryCard "${title}" is missing a linkUrl.`);
    // Optionally return null or a disabled state if no link is provided
    // return null;
  }

  return (
    // Use Link component for navigation
    <Link
      to={linkUrl || '#'} // Use '#' as a fallback if linkUrl is somehow missing
      // Styling for the card: hover effects, transitions
      className="block p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:bg-teal-50 hover:shadow-md hover:border-teal-200 transition-all duration-200 ease-in-out text-center transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
      title={`Explore shows related to: ${title}`} // Add a tooltip
    >
      {/* Icon Area */}
      <div className="flex justify-center items-center mb-3 text-teal-600 h-8"> {/* Fixed height for icon area */}
         {/* Render the passed icon component if it exists */}
         {IconComponent && <IconComponent size={32} aria-hidden="true" />} {/* Use aria-hidden for decorative icons */}
      </div>
      {/* Text Content */}
      <h5 className="mb-1 text-lg font-semibold tracking-tight text-gray-800">{title}</h5>
      <p className="font-normal text-sm text-gray-600">{description}</p>
    </Link>
  );
};

export default CategoryCard;