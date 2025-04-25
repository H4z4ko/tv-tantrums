// client/src/pages/ComparePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getShowList, getShowsForComparison } from '../services/showService';
import ScoreVisual from '../components/shared/ScoreVisual';

const placeholderImage = "/images/placeholder-show.png";

// --- Comparison Display Component ---
// This component takes the array of fetched shows and displays them side-by-side.
const ComparisonDisplayComponent = ({ shows }) => {
    // If no shows are passed (e.g., initially or after deselecting all), show a message.
    if (!shows || shows.length === 0) {
        return <p className="text-center text-gray-500 mt-6 italic">Select up to 3 shows above to compare them.</p>;
    }

    // Helper to display a list of themes
    const renderThemes = (themes) => {
        if (!themes || themes.length === 0) {
            return <span className="text-xs text-gray-400 italic">None</span>;
        }
        return themes.slice(0, 5).map((theme, index) => ( // Show max 5 themes
            <span key={index} className="inline-block bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                {theme}
            </span>
        )).concat(themes.length > 5 ? [<span key="ellipsis" className="text-xs text-gray-400">...</span>] : []);
    };

    // Helper to render a detail row consistently
    const DetailRow = ({ label, values }) => (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-2 px-3 text-sm font-semibold text-gray-600 text-left sticky left-0 bg-gray-50 md:bg-transparent">{label}</td>
            {values.map((value, index) => (
                <td key={index} className="py-2 px-3 text-sm text-gray-700 text-center">
                    {/* Handle specific rendering like ScoreVisual or themes here if needed */}
                    {label === "Stimulation Score" ? <ScoreVisual score={value ?? 0} /> :
                     label === "Themes" ? renderThemes(value) :
                     (value ?? <span className="text-gray-400 italic">N/A</span>)}
                </td>
            ))}
            {/* Add empty cells if fewer than 3 shows are selected */}
            {Array(3 - values.length).fill(null).map((_, i) => <td key={`empty-${i}`} className="py-2 px-3"></td>)}
        </tr>
    );

    // Prepare data for rows
    const showTitles = shows.map(s => s?.title || 'N/A');
    const showImages = shows.map(s => s?.image_filename ? `/images/${s.image_filename}` : placeholderImage);
    const showScores = shows.map(s => s?.stimulation_score);
    const showAgeGroups = shows.map(s => s?.target_age_group);
    const showThemes = shows.map(s => s?.themes); // Pass the whole array
    const showInteractivity = shows.map(s => s?.interactivity_level);
    const showDialogue = shows.map(s => s?.dialogue_intensity);
    const showSceneFreq = shows.map(s => s?.scene_frequency);
    // Add more rows as needed

    return (
        <div className="mt-8 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 bg-white shadow-md rounded-lg">
                {/* Header Row with Images */}
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-3 px-3 text-sm font-semibold text-gray-700 text-left sticky left-0 bg-gray-100 z-10">Feature</th>
                        {showTitles.map((title, index) => (
                            <th key={index} className="py-3 px-3 text-sm font-semibold text-gray-700 text-center align-top w-1/3">
                                <img
                                    src={showImages[index]}
                                    alt={`${title} poster`}
                                    className="w-24 h-auto object-contain mx-auto mb-2 rounded shadow border border-gray-200"
                                    onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }}
                                    loading="lazy"
                                />
                                {title}
                            </th>
                        ))}
                         {/* Add empty header cells if fewer than 3 shows are selected */}
                        {Array(3 - shows.length).fill(null).map((_, i) => <th key={`empty-h-${i}`} className="py-3 px-3 w-1/3"></th>)}
                    </tr>
                </thead>
                {/* Data Rows */}
                <tbody>
                    <DetailRow label="Stimulation Score" values={showScores} />
                    <DetailRow label="Target Age" values={showAgeGroups} />
                    <DetailRow label="Interactivity" values={showInteractivity} />
                    <DetailRow label="Dialogue Intensity" values={showDialogue} />
                    <DetailRow label="Scene Frequency" values={showSceneFreq} />
                    <DetailRow label="Themes" values={showThemes} />
                     {/* Add more <DetailRow> components for other fields */}
                </tbody>
            </table>
        </div>
    );
};

// Keep the React.memo wrapper
const ComparisonDisplay = React.memo(ComparisonDisplayComponent);

// --- Main ComparePage Component ---
const ComparePage = () => {
    const MAX_COMPARE = 3;
    const [showList, setShowList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedIds, setSelectedIds] = useState(() => {
        console.log("ComparePage: Initializing selectedIds state");
        return Array(MAX_COMPARE).fill('');
    });
    const [comparisonData, setComparisonData] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState(null);

        // --- Fetch the list of all shows for the dropdowns when the component mounts ---
        useEffect(() => {
            console.log("ComparePage: Fetching show list for dropdowns...");
            setListLoading(true);
            setListError(null);
            getShowList()
                .then(data => {
                    console.log("ComparePage: Show list fetched successfully", data);
                    // Ensure data is an array, even if API returns something else unexpectedly
                    setShowList(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error("ComparePage: Error fetching show list:", err);
                    setListError(err.message || "Failed to load show list.");
                    setShowList([]); // Ensure showList is an empty array on error
                })
                .finally(() => {
                    console.log("ComparePage: Finished fetching show list.");
                    setListLoading(false);
                });
            // This effect should only run once when the component mounts
        }, []); // Empty dependency array means run once on mount
    
        // --- Fetch comparison data whenever selectedIds changes ---
        useEffect(() => {
            // Filter out empty IDs ('') before fetching
            const idsToCompare = selectedIds.filter(id => id && String(id).trim() !== '');
    
            if (idsToCompare.length > 0) {
                console.log("ComparePage: Fetching comparison data for IDs:", idsToCompare);
                setCompareLoading(true);
                setCompareError(null);
                getShowsForComparison(idsToCompare)
                    .then(data => {
                        console.log("ComparePage: Comparison data fetched:", data);
                        // Ensure data is an array
                        setComparisonData(Array.isArray(data) ? data : []);
                    })
                    .catch(err => {
                        console.error("ComparePage: Error fetching comparison data:", err);
                        setCompareError(err.message || "Failed to load comparison data.");
                        setComparisonData([]); // Reset data on error
                    })
                    .finally(() => {
                         console.log("ComparePage: Finished fetching comparison data.");
                         setCompareLoading(false);
                    });
            } else {
                // If no valid IDs are selected, clear the comparison data and errors
                console.log("ComparePage: No valid IDs selected, clearing comparison data.");
                setComparisonData([]);
                setCompareError(null); // Clear any previous error
                setCompareLoading(false); // Ensure loading is off
            }
            // This effect depends on the selectedIds state
        }, [selectedIds]);

        // --- Handler for changing a selection ---
    // Ensures state updates immutably, which is crucial for React to detect changes.
    const handleSelectChange = useCallback((index, event) => {
        const newSelectedId = event.target.value;

        // Create a brand new array based on the current selectedIds state
        setSelectedIds(prevSelectedIds => {
            // Make a copy of the previous state array
            const newSelectedIds = [...prevSelectedIds];

            // Update the specific slot (index) with the new ID
            // If "-- Select a Show --" was chosen, its value is '', store that.
            newSelectedIds[index] = newSelectedId;

            // Return the new array to update the state
            return newSelectedIds;
        });

        // No need to manually trigger fetch here;
        // the useEffect hook that depends on selectedIds will automatically run.
        // setCompareLoading(true); // Let the useEffect handle loading state

    }, []); // No dependencies needed here, as we use the functional update form of setSelectedIds

    // --- Component Render ---
    console.log("ComparePage: Rendering component. Current selectedIds:", selectedIds);
    if (selectedIds === undefined) {
         console.error("ComparePage: CRITICAL - selectedIds is undefined right before render!");
    }

    // *** Prepare selection section content BEFORE the return statement ***
    let selectionSectionContent;
    if (listLoading) {
        // Display placeholders while list is loading
        selectionSectionContent = Array.from({ length: MAX_COMPARE }).map((_, index) => (
            <div key={index}>
                <label htmlFor={`select-show-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Select Show #{index + 1}
                </label>
                <select
                    id={`select-show-${index}`}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white disabled:bg-gray-100"
                >
                     <option value="" disabled>Loading shows...</option>
                 </select>
            </div>
        ));
    } else if (listError) {
         // Display error state within the grid structure
         selectionSectionContent = (
            <div className={`md:col-span-${MAX_COMPARE} text-center text-red-600 mb-4 bg-red-100 p-3 rounded border border-red-300`}>
                 Error loading show list: {listError}
            </div>
         );
    } else if (showList.length === 0) {
         // Display no shows found state
         selectionSectionContent = (
            <div className={`md:col-span-${MAX_COMPARE} text-center text-gray-500`}>
                 No shows available to compare.
            </div>
         );
    } else if (selectedIds && Array.isArray(selectedIds)) {
        // If list loaded and selectedIds is valid, render the dropdowns
        selectionSectionContent = selectedIds.map((selectedIdValue, index) => (
            <div key={index}>
                <label htmlFor={`select-show-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Select Show #{index + 1}
                </label>
                <select
                    id={`select-show-${index}`}
                    value={selectedIdValue ?? ''} // Use the mapped value, fallback to empty string
                    onChange={(event) => handleSelectChange(index, event)}
                    // Disable should only depend on listError now, as loading is handled above
                    disabled={!!listError}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white disabled:bg-gray-100"
                >
                     <option value="">-- Select a Show --</option>
                     {showList.map(show => (
                         <option key={show.id} value={show.id}>
                             {show.title}
                         </option>
                     ))}
                 </select>
            </div>
        ));
    } else {
        // Fallback if selectedIds isn't an array for some reason
        selectionSectionContent = <p>Initializing selectors...</p>;
    }
    // *** END preparation of selection section content ***


    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-teal-700 mb-8">Compare Shows</h1>

            {/* Show Selection Section - Render the prepared content */}
            <div className={`grid grid-cols-1 md:grid-cols-${MAX_COMPARE} gap-4 mb-6`}>
                {selectionSectionContent}
            </div>

            {/* Display listError prominently IF it wasn't already handled above */}
            {/* We might remove this duplicate display if the above handling is sufficient */}
            {/* {listError && !listLoading && ( ... error display ... )} */}


            {/* Comparison Display Area */}
            {compareLoading && <p className="text-center text-gray-500 italic mt-6">Loading comparison...</p>}
            {compareError && <p className="text-center text-red-500 mt-6 bg-red-100 p-3 rounded border border-red-300">{compareError}</p>}
            {!compareLoading && !compareError && <ComparisonDisplay shows={comparisonData} />}

        </div>
    );
};

export default ComparePage;