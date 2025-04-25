// client/src/components/catalog/ShowCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ScoreVisual from '../shared/ScoreVisual';

const placeholderImage = "/images/placeholder-show.png";

// Define the component function as before
const ShowCardComponent = ({ show }) => {
    // console.log(`Rendering ShowCard for ID: ${show?.id}`);

    // Gracefully handle invalid show prop before destructuring
    if (!show || typeof show !== 'object' || !show.id) {
        console.error("ShowCard received invalid show prop:", show);
        return <div className="border border-red-300 p-2 text-red-600 text-xs">Invalid Show Data</div>;
    }

    // *** ADD THIS DESTRUCTURING ASSIGNMENT ***
    // Extract needed properties from the 'show' object, providing default values
    const {
        id,
        title = "Unknown Title", // Default if title is missing
        target_age_group = "N/A", // Default if target_age_group is missing
        themes = [], // Default to empty array if themes is missing or not an array
        stimulation_score = 0, // Default if stimulation_score is missing
        image_filename = null // Default if image_filename is missing
    } = show;
    // *** END DESTRUCTURING ASSIGNMENT ***

    // Now 'title', 'id', etc., are defined variables we can use

    // Use the extracted image_filename variable
    const imageUrl = image_filename ? `/images/${image_filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')}` : placeholderImage;
    // Ensure themes is an array before slicing (already handled by default in destructuring)
    const displayedThemes = themes.slice(0, 3); // Max 3 themes displayed on card

    return (
        <div className="border border-gray-200 rounded-lg shadow-md bg-white overflow-hidden flex flex-col transition duration-200 hover:shadow-lg">
            {/* Image */}
            <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                <img
                    src={imageUrl}
                    alt={`${title} poster`} // Now 'title' is defined
                    className="w-full h-full object-cover"
                    onError={(e) => {
                         // Use extracted image_filename here too
                         const originalImageUrl = image_filename ? `/images/${image_filename}` : placeholderImage;
                         if (e.target.src !== originalImageUrl) {
                            e.target.src = originalImageUrl;
                         } else {
                            e.target.onerror = null;
                            e.target.src = placeholderImage;
                         }
                    }}
                    loading="lazy"
                />
            </div>
            {/* Details */}
            <div className="p-4 flex flex-col flex-grow">
                 {/* Use extracted variables */}
                 <h3 className="text-lg font-semibold mb-1 text-gray-800 truncate" title={title}>{title}</h3>
                 <p className="text-sm text-gray-500 mb-2">Age: {target_age_group}</p>
                 <div className="mb-3 flex flex-wrap gap-1 min-h-[20px]">
                    {displayedThemes.length > 0 ? displayedThemes.map((theme, index) => (
                        <span key={index} className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            {theme}
                        </span>
                    )) : (
                        <span className="text-xs text-gray-400 italic">No themes listed</span>
                    )}
                    {/* Check original themes length before showing ellipsis */}
                    {Array.isArray(show.themes) && show.themes.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-0.5">...</span>
                    )}
                </div>
                 <div className="mb-4">
                     <ScoreVisual score={stimulation_score} />
                 </div>

                {/* Learn More Button */}
                <div className="mt-auto">
                    {/* Use extracted id */}
                    <Link
                        to={`/show/${id}`}
                        className="block w-full text-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition duration-200 text-sm"
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Wrap the component with React.memo (keep this)
const ShowCard = React.memo(ShowCardComponent);

export default ShowCard; // Export the memoized version