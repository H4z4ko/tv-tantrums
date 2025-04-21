// client/src/pages/ComparePage.jsx
import React, { useState, useEffect } from 'react';
import { getShows, getShowsForComparison } from '../services/showService';

// Re-use placeholder image logic
const placeholderImage = "/images/placeholder-show.png";

// Re-use ScoreVisual component (or import from ShowCard if preferred/possible)
const ScoreVisual = ({ score }) => {
    score = score || 0;
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


// Enhanced Comparison Display Component
const ComparisonDisplay = ({ shows }) => {
    if (!shows || shows.length === 0) {
        return <p className="text-center text-gray-500 italic mt-6">Select 2 or 3 shows above to compare.</p>;
    }

    // Define which fields to display in order
    const fieldsToCompare = [
        { key: 'platform', label: 'Platform' },
        { key: 'target_age_group', label: 'Age Group' },
        { key: 'avg_episode_length', label: 'Avg. Length' },
        { key: 'interactivity_level', label: 'Interaction' },
        { key: 'dialogue_intensity', label: 'Dialogue Pace' },
        { key: 'scene_frequency', label: 'Scene Frequency' },
        { key: 'sound_effects_level', label: 'Sound FX Level' },
        { key: 'total_music_level', label: 'Music Level' },
        // Add more text fields if needed from the database schema
    ];

    return (
        <div className={`mt-8 grid grid-cols-1 md:grid-cols-${shows.length} gap-4 md:gap-6`}>
            {shows.map((show) => {
                 // Determine image URL for each show
                const imageUrl = show.image_filename ? `/images/${show.image_filename}` : placeholderImage;
                return (
                    <div key={show.id} className="border rounded-lg shadow flex flex-col">
                        {/* Image */}
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-t-lg overflow-hidden">
                             <img
                                src={imageUrl}
                                alt={`${show.title} poster`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }}
                            />
                        </div>
                        {/* Details */}
                        <div className="p-4 flex flex-col flex-grow space-y-2">
                            <h3 className="text-lg font-semibold mb-1 text-center truncate" title={show.title}>{show.title}</h3>

                            {/* Stimulation Score */}
                            <div className="flex justify-center">
                                 <ScoreVisual score={show.stimulation_score} />
                            </div>

                            {/* Text Fields Comparison */}
                            <div className="space-y-1 text-sm border-t pt-2">
                                {fieldsToCompare.map(field => (
                                    <div key={field.key}>
                                        <strong className="text-gray-600">{field.label}:</strong>
                                        <span className="ml-1 text-gray-800">{show[field.key] || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Themes */}
                            <div className="border-t pt-2">
                                <strong className="text-sm text-gray-600">Themes:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                     {show.themes && show.themes.length > 0 ? show.themes.slice(0, 5).map((theme, index) => ( // Show first 5 themes
                                        <span key={index} className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                                            {theme}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-400 italic">None listed</span>
                                    )}
                                    {show.themes && show.themes.length > 5 && (
                                        <span className="text-xs text-gray-400 px-2 py-0.5">...</span>
                                    )}
                                </div>
                            </div>
                            {/* Potential area for adding charts later */}
                            {/* <div className="mt-auto pt-2 border-t"> Chart Placeholder </div> */}
                        </div>
                    </div>
                );
             })}
        </div>
    );
};


const ComparePage = () => {
    const MAX_COMPARE = 3;

    const [showList, setShowList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedIds, setSelectedIds] = useState(Array(MAX_COMPARE).fill(''));
    const [comparisonData, setComparisonData] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState(null);

    // Fetch Show List Effect (remains the same)
    useEffect(() => {
        const fetchShowList = async () => {
            setListLoading(true);
            setListError(null);
            try {
                const data = await getShows({}, 1, 500);
                setShowList(data.shows.map(s => ({ id: s.id, title: s.title })) || []);
            } catch (err) {
                console.error("Error fetching show list for compare:", err);
                setListError("Failed to load list of shows.");
                setShowList([]);
            } finally {
                setListLoading(false);
            }
        };
        fetchShowList();
    }, []);

    // Fetch Comparison Data Effect (remains the same)
    useEffect(() => {
        const validIds = selectedIds.filter(id => id && id !== '');
        if (validIds.length >= 2) {
            const fetchComparison = async () => {
                setCompareLoading(true);
                setCompareError(null);
                setComparisonData([]);
                try {
                    const data = await getShowsForComparison(validIds);
                    setComparisonData(data || []);
                } catch (err) {
                    console.error("Error fetching comparison data:", err);
                    setCompareError("Failed to load comparison data.");
                    setComparisonData([]);
                } finally {
                    setCompareLoading(false);
                }
            };
            fetchComparison();
        } else {
            setComparisonData([]);
            setCompareError(null);
        }
    }, [selectedIds]);

    // Handler for dropdown selection change (remains the same)
    const handleSelectChange = (index, event) => {
        const newId = event.target.value;
        if (newId !== '' && selectedIds.includes(newId)) {
             alert('This show is already selected in another slot.');
             event.target.value = selectedIds[index] || '';
             return;
        }
        const newSelectedIds = [...selectedIds];
        newSelectedIds[index] = newId;
        setSelectedIds(newSelectedIds);
    };

    // Main component render (remains largely the same, relies on ComparisonDisplay)
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
                Compare Shows
            </h1>

            {/* Show Selection Section */}
            <div className={`grid grid-cols-1 md:grid-cols-${MAX_COMPARE} gap-4 mb-6`}>
                {Array.from({ length: MAX_COMPARE }).map((_, index) => (
                    <div key={index}>
                        <label htmlFor={`select-show-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Select Show #{index + 1}
                        </label>
                        <select
                            id={`select-show-${index}`}
                            value={selectedIds[index]}
                            onChange={(e) => handleSelectChange(index, e)}
                            disabled={listLoading || !!listError}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white disabled:bg-gray-100"
                        >
                            <option value="">-- Select a Show --</option>
                            {listLoading && <option disabled>Loading list...</option>}
                            {showList.map(show => (
                                <option key={show.id} value={show.id}>
                                    {show.title}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
            {listError && <p className="text-center text-red-500 mb-4">{listError}</p>}


            {/* Comparison Display Area */}
            {compareLoading && <p className="text-center text-gray-500 italic mt-6">Loading comparison...</p>}
            {compareError && <p className="text-center text-red-500 mt-6">{compareError}</p>}
            {/* Render the enhanced display component */}
            {!compareLoading && <ComparisonDisplay shows={comparisonData} />}

        </div>
    );
};

export default ComparePage;