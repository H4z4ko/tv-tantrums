// client/src/pages/ComparePage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { getShowList, getShowsForComparison } from '../services/showService';
import ScoreVisual from '../components/shared/ScoreVisual';

const placeholderImage = "/images/placeholder-show.png";

// Define the component function for display
const ComparisonDisplayComponent = ({ shows }) => { // Renamed internally
    // console.log("Rendering ComparisonDisplay"); // Keep log if debugging renders
    if (!shows || !Array.isArray(shows) || shows.length === 0) {
        return <p className="text-center text-gray-500 italic mt-6">Select 2 or 3 shows above to compare.</p>;
    }

    const fieldsToCompare = [ /* ... */ ];

    return (
        <div className={`mt-8 grid grid-cols-1 md:grid-cols-${shows.length} gap-4 md:gap-6`}>
            {shows.map((show) => {
                 if (!show || !show.id) { return null; }
                 // *** UPDATED TO PREFER .webp ***
                 const imageUrl = show.image_filename ? `/images/${show.image_filename.replace(/\.(jpg|jpeg|png)$/i, '.webp')}` : placeholderImage;
                 const themes = Array.isArray(show.themes) ? show.themes : [];

                return (
                    <div key={show.id} className="border rounded-lg shadow flex flex-col bg-white">
                        {/* Image */}
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-t-lg overflow-hidden">
                            <img
                                src={imageUrl}
                                alt={`${show.title} poster`}
                                className="w-full h-full object-cover"
                                // *** ADD FALLBACK TO ORIGINAL FILENAME IF WEBP NOT FOUND ***
                                onError={(e) => {
                                    const originalImageUrl = show.image_filename ? `/images/${show.image_filename}` : placeholderImage;
                                    if (e.target.src !== originalImageUrl) {
                                        e.target.src = originalImageUrl;
                                    } else {
                                        e.target.onerror = null;
                                        e.target.src = placeholderImage;
                                    }
                                }}
                                loading="lazy" // Good to have here too
                            />
                        </div>
                        {/* Details */}
                        <div className="p-4 flex flex-col flex-grow space-y-2">
                             {/* ... (rest of comparison card details) ... */}
                        </div>
                    </div>
                );
             })}
        </div>
    );
};

// *** Wrap the component with React.memo ***
const ComparisonDisplay = React.memo(ComparisonDisplayComponent);


// --- Main ComparePage Component ---
const ComparePage = () => {
    const MAX_COMPARE = 3;
    const [showList, setShowList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedIds, setSelectedIds] = useState(Array(MAX_COMPARE).fill(''));
    const [comparisonData, setComparisonData] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState(null);

    // ... (useEffect for fetching showList remains the same) ...

    // ... (useEffect for fetching comparisonData remains the same) ...

    // Wrap handler in useCallback
    const handleSelectChange = useCallback((index, event) => {
        const newId = event.target.value;
        // Prevent selecting the same show twice
        if (newId !== '' && selectedIds.some((id, i) => id === newId && i !== index)) {
             alert('This show is already selected in another slot.');
             // Reset dropdown to previous value - find better way if possible?
             // For now, just return without updating state might be okay
             event.target.value = selectedIds[index] || ''; // Try resetting visually
             return;
        }
        // Update state using functional update for safety if needed, but direct is fine here
        setSelectedIds(prevIds => {
            const newSelectedIds = [...prevIds];
            newSelectedIds[index] = newId;
            return newSelectedIds;
        });
    }, [selectedIds]); // Depend on selectedIds to prevent stale closures

    // --- Component Render ---
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-teal-700 mb-8">Compare Shows</h1>

            {/* Show Selection Section */}
            <div className={`grid grid-cols-1 md:grid-cols-${MAX_COMPARE} gap-4 mb-6`}>
                {Array.from({ length: MAX_COMPARE }).map((_, index) => (
                    <div key={index}>
                        {/* ... (label and select element) ... */}
                         <select
                            id={`select-show-${index}`}
                            value={selectedIds[index]}
                            onChange={(e) => handleSelectChange(index, e)} // Use useCallback version
                            disabled={listLoading || !!listError}
                            className="..."
                        >
                             {/* ... options ... */}
                         </select>
                    </div>
                ))}
            </div>
            {/* ... (listError message) ... */}

            {/* Comparison Display Area */}
            {/* ... (compareLoading and compareError messages) ... */}
            {!compareLoading && !compareError && <ComparisonDisplay shows={comparisonData} />}
        </div>
    );
};

export default ComparePage;