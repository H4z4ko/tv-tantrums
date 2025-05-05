// client/src/components/catalog/ShowCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ScoreVisual from '../shared/ScoreVisual';

// Placeholder image path (relative to public directory)
const placeholderImage = "/images/placeholder-show.png"; // Ensure this placeholder exists

const ShowCardComponent = ({ show }) => {
    // Gracefully handle invalid show prop before destructuring
    if (!show || typeof show !== 'object' || !show.id) {
        console.error("ShowCard received invalid show prop:", show);
        return (
            <div className="border border-red-300 p-3 text-red-600 text-xs rounded-lg shadow-md bg-white overflow-hidden flex flex-col">
                Invalid Show Data Provided. Cannot render card.
            </div>
        );
    }

    // Destructure needed properties, providing default values for safety
    const {
        id,
        title = "Unknown Title",
        target_age_group = "N/A",
        themes = [], // Default to empty array
        stimulation_score = 0,
        image_filename = null
    } = show;

    // Image URL Logic (WebP first, then original, then placeholder)
    const webpImageUrl = image_filename ? `/images/${image_filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')}` : placeholderImage;
    const originalImageUrl = image_filename ? `/images/${image_filename}` : placeholderImage;

    // Limit themes displayed on the card
    const MAX_THEMES_DISPLAYED = 3;
    const displayedThemes = Array.isArray(themes) ? themes.slice(0, MAX_THEMES_DISPLAYED) : [];
    const hasMoreThemes = Array.isArray(themes) && themes.length > MAX_THEMES_DISPLAYED;

    return (
        <div className="border border-gray-200 rounded-lg shadow-md bg-white overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-lg h-full group"> {/* Added h-full & group */}

            {/* Image Container */}
            <div className="w-full h-48 bg-gray-100 relative overflow-hidden"> {/* Fixed height, relative positioning */}
                <Link to={`/show/${id}`} className="absolute inset-0" aria-label={`View details for ${title}`}> {/* Link covers image */}
                    <img
                        src={webpImageUrl}
                        alt={`${title} poster`}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" // Smooth transition on hover
                        onError={(e) => {
                            // Fallback logic
                            if (e.target.src !== originalImageUrl && originalImageUrl !== placeholderImage) {
                                e.target.src = originalImageUrl;
                            } else if (e.target.src !== placeholderImage) {
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                            }
                        }}
                        loading="lazy"
                    />
                </Link>
            </div>

            {/* Details Section */}
            <div className="p-4 flex flex-col flex-grow"> {/* Padding, flex-grow pushes button down */}
                 {/* Title (Truncated) */}
                 <h3 className="text-lg font-semibold mb-1 text-gray-800 truncate" title={title}>
                     <Link to={`/show/${id}`} className="hover:text-teal-700 transition duration-150 focus:outline-none focus:underline">
                        {title}
                     </Link>
                 </h3>

                 {/* Age Group */}
                 <p className="text-sm text-gray-600 mb-2">Age: {target_age_group}</p>

                 {/* Themes */}
                 <div className="mb-3 flex flex-wrap gap-1 min-h-[24px]"> {/* Min height to prevent jump */}
                    {displayedThemes.length > 0 ? displayedThemes.map((theme, index) => (
                        <span key={index} className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {theme}
                        </span>
                    )) : (
                        <span className="text-xs text-gray-400 italic">No themes listed</span>
                    )}
                    {hasMoreThemes && (
                        <span className="text-xs text-gray-400 px-1 py-0.5" title={`${themes.length - MAX_THEMES_DISPLAYED} more themes`}>...</span>
                    )}
                </div>

                 {/* Score */}
                 <div className="mb-4">
                     <ScoreVisual score={stimulation_score} />
                 </div>

                {/* Learn More Button (Pushed to bottom) */}
                <div className="mt-auto pt-2"> {/* Margin-top auto pushes this down, padding-top for space */}
                    <Link
                        to={`/show/${id}`}
                        className="block w-full text-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" // Added focus styles
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Wrap the component with React.memo for performance optimization
const ShowCard = React.memo(ShowCardComponent);

export default ShowCard;