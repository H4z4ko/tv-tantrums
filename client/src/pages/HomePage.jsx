// client/src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Import API service function
import { getAutocompleteSuggestions, getHomepageData } from '../services/showService.js';
// Import child components
import FeaturedShow from '../components/home/FeaturedShow.jsx';
import CategoryCard from '../components/home/CategoryCard.jsx';
import ShowCategoryRow from '../components/home/ShowCategoryRow.jsx';
// Import Custom Hook
import useAutocomplete from '../hooks/useAutocomplete.js'; // *** IMPORT HOOK ***
// Other imports
import { FaChartBar, /* ... other icons ... */ FaHandsHelping } from 'react-icons/fa';
import axios from 'axios';

// --- Category Data ---
const categories = [ /* ... as before ... */ ];

// --- Main HomePage Component ---
const HomePage = () => {
    const navigate = useNavigate();

    // *** Use the Autocomplete Hook ***
    const {
        inputValue: searchTerm, // Rename inputValue to searchTerm for clarity here
        suggestions,
        isLoading: isAutocompleteLoading, // Rename to avoid conflict with page loading
        showSuggestions,
        handleInputChange: handleSearchChange, // Rename handler
        handleSuggestionSelect,
        hideSuggestions,
        resetAutocomplete,
        containerRef: autocompleteContainerRef // Rename ref
    } = useAutocomplete(getAutocompleteSuggestions, 300); // Pass the fetch function

    // --- State for Page Content Loading ---
    const [homepageData, setHomepageData] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true); // Renamed loading state
    const [pageError, setPageError] = useState(null); // Renamed error state
    const [isNavigating, setIsNavigating] = useState(false); // For suggestion click loading

    // --- Fetching Logic for Homepage Data ---
    useEffect(() => {
        // ... (Homepage data fetching logic remains exactly the same as before, using AbortController) ...
        // ... Make sure to use setIsPageLoading and setPageError here ...
        const controller = new AbortController(); /* ... */
        const fetchHomepageContent = async () => {
            setIsPageLoading(true); setPageError(null); setHomepageData(null);
            try {
                const data = await getHomepageData(); /* pass signal if service adapted */
                setHomepageData(data);
            } catch (err) {
                 if (axios.isCancel(err) || err.name === 'AbortError') { /* ... */ }
                 else { setPageError(err.message || "Failed to load content."); }
            } finally {
                 if (!controller.signal.aborted) setIsPageLoading(false);
            }
        };
        fetchHomepageContent();
        return () => controller.abort();
    }, []);

    // --- Handlers specific to HomePage ---
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (!searchTerm.trim()) return;
        hideSuggestions(); // Hide suggestions using hook's handler
        navigate(`/shows?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    // Handle click action AFTER suggestion is selected by the hook
    const handleSuggestionClickAction = (selectedSuggestion) => {
        // The hook already updated the searchTerm state via handleSuggestionSelect
        setIsNavigating(true);
        try {
            // Navigate to search results page after selecting a suggestion
             navigate(`/shows?search=${encodeURIComponent(selectedSuggestion)}`);
        } catch(err) {
             console.error("Error navigating from suggestion:", err);
             navigate(`/shows?search=${encodeURIComponent(selectedSuggestion)}`); // Fallback
        } finally {
            setIsNavigating(false);
        }
    };


    // --- JSX Output ---
    return (
        <div className="space-y-12">
            {/* Hero/Search Section */}
            <section className="text-center py-12 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg shadow-sm border border-gray-100">
                {/* ... (h1, p tags) ... */}
                {/* Search Form - Assign the ref from the hook */}
                <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto relative" ref={autocompleteContainerRef}>
                    <input
                        type="search"
                        placeholder="Search for show titles..."
                        value={searchTerm} // Use value from hook
                        onChange={handleSearchChange} // Use handler from hook
                        className="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-0 top-0 mt-1 mr-1 px-4 py-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700">
                        Search
                    </button>
                    {/* Autocomplete Suggestions - Use state from hook */}
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 text-left max-h-60 overflow-y-auto">
                            {(isAutocompleteLoading ? // Show loading within list if needed
                                <li className="px-4 py-2 text-gray-500 italic">Loading...</li>
                                : suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        // Use onMouseDown to trigger before blur potentially hides list
                                        onMouseDown={() => {
                                            handleSuggestionSelect(suggestion); // Let hook update state
                                            handleSuggestionClickAction(suggestion); // Perform navigation
                                        }}
                                    >
                                        {suggestion}
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                     {isNavigating && <p className="text-sm text-gray-500 mt-2">Loading...</p>}
                </form>
            </section>

            {/* Page Loading/Error State */}
            {isPageLoading && <div className="text-center p-6 bg-gray-100 rounded-lg">Loading homepage content...</div>}
            {pageError && <div className="text-center p-4 bg-red-100 text-red-700 rounded border border-red-300">Error: {pageError}</div>}


             {/* Featured Show Section - use page loading state */}
             {!isPageLoading && !pageError && homepageData?.featuredShow && (
                 <FeaturedShow show={homepageData.featuredShow} />
             )}
             {!isPageLoading && !pageError && !homepageData?.featuredShow && (
                  <div className="text-center p-6 bg-gray-100 rounded-lg">No featured show available.</div>
             )}

            {/* Category Links Section */}
            <section>
                {/* ... (CategoryCards map) ... */}
            </section>

            {/* Show Rows using ShowCategoryRow - use page loading state */}
             {!isPageLoading && !pageError && homepageData && (
                 <>
                     <ShowCategoryRow title="Popular Shows" shows={homepageData.popularShows} /* ... */ />
                     <ShowCategoryRow title="Highly Rated (Stim Score)" shows={homepageData.ratedShows} /* ... */ />
                     <ShowCategoryRow title="Lower Stimulation" shows={homepageData.lowStimShows} /* ... */ />
                     <ShowCategoryRow title="Higher Interaction" shows={homepageData.highInteractionShows} /* ... */ />
                 </>
             )}

        </div>
    );
};

export default HomePage;