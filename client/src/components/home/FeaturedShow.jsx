// client/src/components/home/FeaturedShow.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ScoreVisual from '../shared/ScoreVisual'; // Import ScoreVisual

// Placeholder image path (relative to the public directory)
const placeholderImage = "/images/placeholder-show.png";

const FeaturedShow = ({ show }) => {
    // Loading State: If show data is not yet available (render skeleton)
    if (!show) {
        return (
            <div className="py-12 px-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg shadow-md border border-gray-200 animate-pulse">
                <h2 className="text-2xl font-semibold text-center text-gray-400 mb-6">Featured Show</h2>
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 max-w-4xl mx-auto">
                    {/* Image Placeholder */}
                    <div className="md:w-1/3 flex-shrink-0 w-full max-w-xs md:max-w-none mx-auto">
                        <div className="rounded-lg shadow-lg w-full aspect-[3/4] bg-gray-300"></div> {/* Aspect Ratio Placeholder */}
                    </div>
                    {/* Details Placeholder */}
                    <div className="md:w-2/3 text-center md:text-left w-full space-y-4"> {/* Increased spacing */}
                        <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto md:mx-0"></div> {/* Title */}
                        <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto md:mx-0"></div> {/* Pills */}
                        <div className="h-4 bg-gray-300 rounded w-full"></div> {/* Desc line 1 */}
                        <div className="h-4 bg-gray-300 rounded w-5/6"></div> {/* Desc line 2 */}
                         <div className="h-5 bg-gray-300 rounded w-1/3 mx-auto md:mx-0"></div> {/* Themes heading */}
                         <div className="h-6 bg-gray-300 rounded w-2/3 mx-auto md:mx-0"></div> {/* Themes pills */}
                        <div className="h-11 bg-gray-300 rounded-lg w-52 mx-auto md:mx-0"></div> {/* Button */}
                    </div>
                </div>
            </div>
        );
    }

    // Data Loaded State: If show data is available
    const { id, title, stimulation_score, target_age_group, image_filename, themes = [], animation_style } = show;

    // Attempt to create a WebP URL first
    const webpImageUrl = image_filename ? `/images/${image_filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')}` : placeholderImage;
    const originalImageUrl = image_filename ? `/images/${image_filename}` : placeholderImage;

    // Create a short description or use animation style as fallback
    const descriptionSnippet = animation_style
        ? `Style: ${animation_style.substring(0, 150)}${animation_style.length > 150 ? '...' : ''}`
        : 'Discover more about the sensory details and themes of this show!';

    return (
        <section className="py-10 px-4 md:py-12 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg shadow-md border border-gray-200 overflow-hidden"> {/* Added overflow hidden */}
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-700 mb-6 md:mb-8">Featured Show</h2>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 max-w-4xl mx-auto">

                {/* Image Section */}
                <div className="md:w-1/3 flex-shrink-0 w-full max-w-xs md:max-w-none mx-auto">
                    <img
                        src={webpImageUrl} // Start with WebP attempt
                        alt={`${title} poster`}
                        className="rounded-lg shadow-lg w-full h-auto object-contain max-h-80 border border-gray-200 bg-white aspect-[3/4]" // Added aspect ratio
                        loading="lazy"
                        onError={(e) => {
                            if (e.target.src !== originalImageUrl && originalImageUrl !== placeholderImage) {
                                console.log(`FeaturedShow: WebP failed for ${title}, trying original: ${originalImageUrl}`);
                                e.target.src = originalImageUrl;
                            } else if (e.target.src !== placeholderImage) {
                                console.log(`FeaturedShow: Original/WebP image failed or missing for ${title}, using placeholder.`);
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                            }
                        }}
                    />
                </div>

                {/* Details Section */}
                <div className="md:w-2/3 text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-bold text-teal-800 mb-2">{title}</h3>
                    {/* Key Info Pills */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                            Age: {target_age_group || 'N/A'}
                        </span>
                         <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                             <span className="mr-1.5">Score:</span> <ScoreVisual score={stimulation_score} />
                         </span>
                    </div>

                    {/* Description */}
                    <p className="text-base text-gray-700 mb-4 italic">
                        {descriptionSnippet}
                    </p>

                    {/* Themes */}
                     <div className="mb-5">
                         <strong className="text-sm text-gray-600 block mb-1.5">Key Themes:</strong> {/* Adjusted margin */}
                         <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                             {themes.length > 0 ? themes.slice(0, 4).map((theme, index) => (
                                 <span key={index} className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded-full">
                                     {theme}
                                 </span>
                             )) : <span className="text-xs text-gray-500 italic">None listed</span>}
                             {themes.length > 4 && (
                                  <span className="text-xs text-gray-500 px-2 py-1" title={`${themes.length - 4} more themes`}>...</span>
                             )}
                         </div>
                     </div>

                    {/* Call to Action Button */}
                    <Link
                        to={`/show/${id}`}
                        className="inline-block px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition duration-200 transform hover:scale-105 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        View Sensory Details
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedShow;