// client/src/components/home/CategoryCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// UPDATED: Accepts an IconComponent prop
const CategoryCard = ({ title, description, IconComponent, linkUrl }) => { 
  return (
    <Link
      to={linkUrl}
      // Slightly softer shadow and border
      className="block p-6 bg-white rounded-lg border border-gray-100 shadow hover:bg-gray-50 hover:shadow-md transition duration-200 text-center transform hover:-translate-y-1" 
    >
      <div className="flex justify-center mb-3 text-teal-600"> 
         {/* Render the passed icon component */}
         {IconComponent && <IconComponent size={32} />} 
      </div>
      <h5 className="mb-2 text-xl font-semibold tracking-tight text-gray-800">{title}</h5>
      <p className="font-normal text-sm text-gray-600">{description}</p>
    </Link>
  );
};

export default CategoryCard;