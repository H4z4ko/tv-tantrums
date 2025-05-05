// client/src/components/home/ShowCategoryRow.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ShowCard from '../catalog/ShowCard'; // Assuming ShowCard is used here

// --- Skeleton Card Component ---
const SkeletonShowCard = () => (
    <div className="border border-gray-200 rounded-lg shadow-md bg-white p-4 animate-pulse h-full flex flex-col"> {/* Ensure full height */}
        <div className="h-48 bg-gray-300 rounded mb-3"></div> {/* Image Placeholder */}
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div> {/* Title Placeholder */}
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div> {/* Age Placeholder */}
        <div className="mt-auto pt-2"> {/* Match button spacing */}
            <div className="h-9 bg-gray-300 rounded-md "></div> {/* Button Placeholder */}
        </div>
    </div>
);

// --- Main ShowCategoryRow Component ---
const ShowCategoryRow = ({ title, shows = [], isLoading, error, viewAllLink = null }) => {
    // Determine the number of shows to display (max 4)
    const displayShows = Array.isArray(shows) ? shows.slice(0, 4) : [];
    // Check if there are more shows than displayed to decide whether to show "View All"
    const hasMoreShows = Array.isArray(shows) && shows.length > 4;
    // Decide if the section has any content or potential content (for View All link)
    const hasContentOrIsLoading = isLoading || displayShows.length > 0;

    return (
        <section className="mb-10 md:mb-12"> {/* Added responsive margin */}
            {/* Section Header */}
            <div className="flex justify-between items-baseline mb-4 md:mb-5"> {/* Use baseline alignment */}
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">{title}</h2>
                {/* Show "View All" only if a link is provided AND the section has content/loading */}
                {viewAllLink && hasContentOrIsLoading && (
                    <Link
                        to={viewAllLink}
                        className="text-sm font-medium text-teal-600 hover:text-teal-800 hover:underline transition duration-200 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1" // Added focus style
                    >
                        View All →
                    </Link>
                )}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"> {/* Responsive gaps, adjusted md breakpoint */}

                {/* Display Loading State using Skeletons */}
                {isLoading && (
                    [...Array(4)].map((_, index) => (
                         <SkeletonShowCard key={`skeleton-${index}`} />
                    ))
                )}

                {/* Display Error State */}
                {error && !isLoading && (
                     // Make error span across the grid conceptually
                     <div className="sm:col-span-2 lg:col-span-4">
                        <p className="text-center text-red-600 bg-red-100 p-4 rounded border border-red-300">
                            Could not load shows for "{title}": {typeof error === 'string' ? error : 'Please try again later.'}
                        </p>
                    </div>
                )}

                {/* Display Shows */}
                {!isLoading && !error && displayShows.length > 0 && (
                     displayShows.map((show) => (
                         // Ensure show object and id are valid before rendering ShowCard
                         show && show.id ? <ShowCard key={show.id} show={show} /> : null
                     ))
                 )}

                {/* Display No Shows Message (only if not loading, no error, and array is empty) */}
                {!isLoading && !error && displayShows.length === 0 && (
                     // Make message span across the grid conceptually
                     <div className="sm:col-span-2 lg:col-span-4">
                        <p className="text-center text-gray-500 italic py-4">No shows available in this category yet.</p>
                     </div>
                )}
            </div>
        </section>
    );
};

export default ShowCategoryRow;