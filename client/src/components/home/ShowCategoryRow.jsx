// client/src/components/home/ShowCategoryRow.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ShowCard from '../catalog/ShowCard'; // Assuming ShowCard is used here

// Helper component to display a row of shows for a specific category
const ShowCategoryRow = ({ title, shows = [], isLoading, error, viewAllLink = null }) => {
    return (
        <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="text-sm text-teal-600 hover:text-teal-800 hover:underline"
                    >
                        View All →
                    </Link>
                )}
            </div>

            {/* Display Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Simple Skeleton Loaders */}
                    {[...Array(4)].map((_, index) => (
                         <div key={index} className="border border-gray-200 rounded-lg shadow-md bg-white p-4 animate-pulse">
                            <div className="h-40 bg-gray-300 rounded mb-3"></div>
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                            <div className="h-8 bg-gray-300 rounded mt-auto"></div>
                         </div>
                    ))}
                 </div>
            )}

            {/* Display Error State */}
            {error && !isLoading && (
                <p className="text-center text-red-500 bg-red-100 p-3 rounded border border-red-300">
                    Could not load shows for this category: {error}
                </p>
            )}

            {/* Display Shows */}
            {!isLoading && !error && shows && shows.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {/* Limit the number of shows displayed directly on homepage */}
                     {shows.slice(0, 4).map((show) => (
                         <ShowCard key={show.id} show={show} />
                     ))}
                 </div>
             )}

            {/* Display No Shows Message */}
            {!isLoading && !error && (!shows || shows.length === 0) && (
                <p className="text-center text-gray-500 italic">No shows available in this category yet.</p>
            )}
        </section>
    );
};

export default ShowCategoryRow;