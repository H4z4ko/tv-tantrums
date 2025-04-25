// client/src/components/home/FeaturedShow.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const placeholderImage = "/images/placeholder-show.png";

const FeaturedShow = ({ show }) => {
    if (!show) {
        // Can return null or a loading state specific to this component
        return <div className="text-center p-6 bg-gray-100 rounded-lg">Loading featured show...</div>;
    }

    // Optional change: Try loading .webp first by default
const imageUrl = show.image_filename ? `/images/${show.image_filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')}` : placeholderImage;

    // Create a short description snippet (example)
    const descriptionSnippet = show.animation_style
        ? `${show.animation_style.substring(0, 100)}...` // Limit length
        : 'Learn more about this show!';

    return (
        <section className="py-12 px-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Featured Show</h2>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 max-w-4xl mx-auto">
                {/* Image */}
                <div className="md:w-1/3 flex-shrink-0">
                    <img
                        src={imageUrl}
                        alt={`${show.title} poster`}
                        className="rounded-lg shadow-lg w-full h-auto object-contain max-h-80" // Adjusted styles
                        loading="lazy" // Keep lazy loading
                        onError={(e) => {
                            // Attempt to load original filename if the current source (potentially .webp) failed
                            const originalImageUrl = show.image_filename ? `/images/${show.image_filename}` : placeholderImage;
                            if (e.target.src !== originalImageUrl) {
                                // If the current src isn't the original, try loading the original
                                console.log(`FeaturedShow: WebP failed for ${show.title}, trying original: ${originalImageUrl}`);
                                e.target.src = originalImageUrl;
                            } else {
                                // If even the original failed, or if there was no original, use placeholder
                                console.log(`FeaturedShow: Original image failed or missing for ${show.title}, using placeholder.`);
                                e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                                e.target.src = placeholderImage;
                            }
                        }}
                    />
                </div>
                {/* Details */}
                <div className="md:w-2/3 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-teal-800 mb-2">{show.title}</h3>
                    <p className="text-md text-gray-600 mb-3">
                        <strong>Age Range:</strong> {show.target_age_group || 'N/A'}
                    </p>
                    <p className="text-md text-gray-600 mb-4 italic">
                        {descriptionSnippet}
                    </p>
                     <div className="mb-4">
                         <strong className="text-gray-700">Themes:</strong>
                         <div className="flex flex-wrap gap-2 mt-1 justify-center md:justify-start">
                             {show.themes && show.themes.slice(0, 4).map((theme, index) => ( // Show a few themes
                                 <span key={index} className="text-xs bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
                                     {theme}
                                 </span>
                             ))}
                             {show.themes && show.themes.length > 4 && (
                                  <span className="text-xs text-gray-500 px-2 py-1">...</span>
                             )}
                             {!show.themes || show.themes.length === 0 && (
                                 <span className="text-xs text-gray-500 italic">None listed</span>
                             )}
                         </div>
                     </div>
                    <Link
                        to={`/show/${show.id}`}
                        className="inline-block px-6 py-2 bg-orange-500 text-white font-semibold rounded-full shadow hover:bg-orange-600 transition duration-200"
                    >
                        Learn More about {show.title}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedShow;