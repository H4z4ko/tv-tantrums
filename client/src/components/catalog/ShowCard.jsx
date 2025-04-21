// client/src/components/Catalog/ShowCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Placeholder image if actual image is missing or fails to load
const placeholderImage = "/images/sstc.jpg";

// Helper to generate score visualization (example: simple bars)
const ScoreVisual = ({ score }) => {
    score = score || 0; // Default to 0 if score is null/undefined
    const maxScore = 5;
    return (
        <div className="flex items-center space-x-1" title={`Stimulation Score: ${score} out of ${maxScore}`}>
            {[...Array(maxScore)].map((_, i) => (
                <div
                    key={i}
                    className={`h-2 w-3 rounded-sm ${i < score ? 'bg-teal-500' : 'bg-gray-300'}`}
                ></div>
            ))}
            <span className="text-xs font-semibold ml-1">{score}/5</span>
        </div>
    );
};

// The ShowCard component receives 'show' data as a prop
const ShowCard = ({ show }) => {
    // *** ADDED LOGS ***
    console.log(`>>> Rendering ShowCard for ID: ${show?.id}, Title: ${show?.title}`); // Log start of render
    if (!show || !show.id) {
        console.error(">>> ShowCard received invalid or missing show prop:", show);
        return <div className="border border-red-300 p-2 text-red-600 text-xs">Invalid Show Data</div>; // Render placeholder on error
    }

    // Destructure show data with defaults for safety
    const {
        id,
        title = "Unknown Title",
        target_age_group = "N/A",
        themes = [], // Expecting themes to be an array already parsed by server/service
        stimulation_score = 0,
        image_filename = null
    } = show;

    const imageUrl = image_filename ? `/images/${image_filename}` : placeholderImage;
    const displayedThemes = Array.isArray(themes) ? themes.slice(0, 3) : []; // Ensure themes is array

    console.log(`>>> ShowCard (ID: ${id}) is about to return JSX.`); // Log before returning JSX

    return (
        <div className="border border-gray-200 rounded-lg shadow-md bg-white overflow-hidden flex flex-col transition duration-200 hover:shadow-lg">
            {/* Show Image */}
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                <img
                    src={imageUrl}
                    alt={`${title} poster`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }}
                    loading="lazy" // Added lazy loading here too
                />
            </div>

            {/* Show Details */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-1 text-gray-800 truncate" title={title}>
                    {title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                    Age: {target_age_group}
                </p>

                {/* Themes */}
                <div className="mb-3 flex flex-wrap gap-1 min-h-[20px]"> {/* Added min-height */}
                    {displayedThemes.length > 0 ? displayedThemes.map((theme, index) => (
                        <span key={index} className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            {theme}
                        </span>
                    )) : (
                        <span className="text-xs text-gray-400 italic">No themes listed</span>
                    )}
                    {Array.isArray(themes) && themes.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-0.5">...</span>
                    )}
                </div>

                {/* Stimulation Score */}
                <div className="mb-4">
                    <ScoreVisual score={stimulation_score} />
                </div>

                {/* Learn More Button */}
                <div className="mt-auto">
                    <Link
                        to={`/show/${id}`} // Link to the detail page using the show's ID
                        className="block w-full text-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-200 text-sm"
                        // *** ADDED LOG ***
                        onClick={() => console.log(`>>> Clicking Learn More link for Show ID: ${id}`)}
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ShowCard;