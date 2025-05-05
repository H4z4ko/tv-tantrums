// client/src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Keep axios for AbortController check

// Import API service functions
import { getAutocompleteSuggestions, getHomepageData } from '../services/showService.js';

// Import child components
import FeaturedShow from '../components/home/FeaturedShow.jsx';
import CategoryCard from '../components/home/CategoryCard.jsx';
import ShowCategoryRow from '../components/home/ShowCategoryRow.jsx';

// Import Custom Hook
import useAutocomplete from '../hooks/useAutocomplete.js';

// Import Icons (Make sure react-icons is installed: npm install react-icons)
import { FaSearch, FaStar, FaSmileBeam, FaThumbsUp, FaHandPaper } from 'react-icons/fa'; // Example icons

// --- Category Data with Icons and Links ---
const categories = [
  {
    title: 'Lower Stimulation',
    description: 'Shows with lower sensory load (Scores 1-2)',
    IconComponent: FaSmileBeam, // Added Icon
    linkUrl: '/shows?stimScoreMin=1&stimScoreMax=2' // Added Link
  },
  {
    title: 'Highly Rated',
    description: 'Shows with the highest stimulation score (Score 5)',
    IconComponent: FaStar, // Added Icon
    linkUrl: '/shows?stimScoreMin=5&stimScoreMax=5' // Added Link
  },
  {
    title: 'Higher Interaction',
    description: 'Shows designed for more viewer participation',
    IconComponent: FaHandPaper, // Added Icon
    linkUrl: '/shows?interactivity=High' // Added Link
  },
    {
    title: 'Popular', // Assuming popularity might be based on views or another metric
    description: 'Shows often searched for or highly reviewed',
    IconComponent: FaThumbsUp, // Added Icon
    linkUrl: '/shows?sortBy=title' // Link to browse sorted by title (or a future popularity metric)
  },
];

// --- Main HomePage Component ---
const HomePage = () => {
    const navigate = useNavigate();

    // --- Autocomplete Hook Usage ---
    const {
        inputValue: searchTerm,
        suggestions,
        isLoading: isAutocompleteLoading,
        showSuggestions,
        handleInputChange: handleSearchChange,
        handleSuggestionSelect,
        hideSuggestions,
        containerRef: autocompleteContainerRef
    } = useAutocomplete(getAutocompleteSuggestions, 300);

    // --- State for Page Content Loading ---
    const [homepageData, setHomepageData] = useState({
        featuredShow: null,
        popularShows: [],
        ratedShows: [],
        lowStimShows: [],
        highInteractionShows: []
    });
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // --- Fetching Logic for Homepage Data ---
    useEffect(() => {
        const controller = new AbortController();
        const fetchHomepageContent = async () => {
            setIsPageLoading(true);
            setPageError(null);

            try {
                console.log("HomePage: Fetching homepage data...");
                const data = await getHomepageData({ signal: controller.signal }); // Pass signal
                if (!controller.signal.aborted) {
                     if (data) {
                        console.log("HomePage: Homepage data received:", data);
                         setHomepageData({ // Ensure all keys exist
                            featuredShow: data.featuredShow || null,
                            popularShows: data.popularShows || [],
                            ratedShows: data.ratedShows || [],
                            lowStimShows: data.lowStimShows || [],
                            highInteractionShows: data.highInteractionShows || []
                         });
                     } else {
                         console.warn("HomePage: No data received from getHomepageData.");
                         setPageError("Could not load homepage content.");
                         setHomepageData({ featuredShow: null, popularShows: [], ratedShows: [], lowStimShows: [], highInteractionShows: [] });
                     }
                }
            } catch (err) {
                 if (err.name !== 'AbortError' && !axios.isCancel(err)) { // Check cancellation
                    if (!controller.signal.aborted) {
                       console.error("HomePage: Error fetching homepage data:", err);
                       setPageError(err.message || "Failed to load homepage content.");
                       setHomepageData({ featuredShow: null, popularShows: [], ratedShows: [], lowStimShows: [], highInteractionShows: [] });
                    }
                 } else {
                    console.log('Homepage data fetch aborted or cancelled.');
                 }
            } finally {
                 if (!controller.signal.aborted) {
                    setIsPageLoading(false);
                 }
            }
        };

        fetchHomepageContent();
        return () => { console.log("HomePage: Unmounting, aborting fetch."); controller.abort(); };
    }, []); // Empty dependency array

    // --- Search Submit Handler ---
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (!searchTerm.trim()) return;
        hideSuggestions();
        navigate(`/shows?search=${encodeURIComponent(searchTerm.trim())}`);
    };

    // --- Suggestion Click/Select Handler ---
    const handleSuggestionClickAction = (selectedSuggestion) => {
        setIsNavigating(true);
        try { navigate(`/shows?search=${encodeURIComponent(selectedSuggestion)}`); }
        catch(err) { console.error("Error navigating from suggestion:", err); }
        // Let page transition handle isNavigating state naturally
    };

    // --- JSX Output ---
    return (
        <div className="space-y-12 md:space-y-16"> {/* Increased spacing */}

            {/* Hero/Search Section */}
            <section className="text-center py-12 md:py-16 px-4 bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-xl shadow border border-gray-100">
                 <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-3">Sensory Screen Time Guide</h1>
                 <p className="text-md md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Find TV shows reviewed for sensory stimulation levels, helping you choose content that fits your child's needs.
                 </p>
                {/* Search Form */}
                <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative" ref={autocompleteContainerRef}>
                    <div className="relative flex items-center">
                         <input
                             type="search" placeholder="Search show titles (e.g., Bluey, Puffin Rock)"
                             value={searchTerm} onChange={handleSearchChange}
                             className="w-full pl-4 pr-20 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-base"
                             aria-label="Search for TV show titles"
                         />
                         <button type="submit" aria-label="Submit search"
                            className="absolute right-1 top-1 bottom-1 px-5 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition duration-200 flex items-center justify-center shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                             <FaSearch /> <span className="sr-only">Search</span>
                         </button>
                    </div>
                    {/* Autocomplete Suggestions */}
                    {showSuggestions && (searchTerm.trim().length > 1) && (
                         <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 text-left max-h-60 overflow-y-auto" role="listbox">
                           {isAutocompleteLoading && <li className="px-4 py-2 text-gray-500 italic">Loading...</li>}
                           {!isAutocompleteLoading && suggestions.length > 0 && suggestions.map((suggestion, index) => (
                                   <li key={index} role="option" aria-selected="false"
                                       className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                       onMouseDown={() => { handleSuggestionSelect(suggestion); handleSuggestionClickAction(suggestion); }}>
                                       {suggestion}
                                   </li>
                           ))}
                           {!isAutocompleteLoading && suggestions.length === 0 && searchTerm.trim().length > 1 &&
                                <li className="px-4 py-2 text-gray-500 italic">No suggestions found.</li>}
                         </ul>
                    )}
                     {isNavigating && <p className="text-sm text-gray-500 mt-2 absolute bottom-[-25px] left-0 right-0">Navigating...</p>}
                 </form>
            </section>

             {/* Featured Show Section */}
             <section>
                 {/* Render skeleton via FeaturedShow component when loading and no data */}
                 {isPageLoading && !homepageData?.featuredShow && <FeaturedShow show={null} /> }
                 {!isPageLoading && pageError && (
                      <div className="text-center p-4 bg-red-100 text-red-700 rounded border border-red-300">
                           Error loading featured show section: {pageError}
                      </div>
                 )}
                 {!isPageLoading && !pageError && homepageData?.featuredShow && (
                     <FeaturedShow show={homepageData.featuredShow} />
                 )}
                 {!isPageLoading && !pageError && !homepageData?.featuredShow && (
                      <div className="text-center p-6 bg-gray-100 rounded-lg">
                           No featured show available at the moment.
                      </div>
                 )}
             </section>

            {/* Category Links Section */}
            <section>
                 <h2 className="text-2xl font-semibold text-gray-700 mb-5 text-center md:text-left">Explore Categories</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                     {categories.map((cat) => ( <CategoryCard key={cat.title} {...cat} /> ))}
                 </div>
             </section>

            {/* Show Rows */}
            {!pageError && (
                 <>
                     <ShowCategoryRow title="Popular Shows" shows={homepageData?.popularShows} isLoading={isPageLoading} viewAllLink="/shows?sortBy=title"/>
                     <ShowCategoryRow title="Highly Rated (Stim Score 5)" shows={homepageData?.ratedShows} isLoading={isPageLoading} viewAllLink="/shows?stimScoreMin=5&stimScoreMax=5"/>
                     <ShowCategoryRow title="Lower Stimulation (Scores 1-2)" shows={homepageData?.lowStimShows} isLoading={isPageLoading} viewAllLink="/shows?stimScoreMin=1&stimScoreMax=2"/>
                     <ShowCategoryRow title="Higher Interaction" shows={homepageData?.highInteractionShows} isLoading={isPageLoading} viewAllLink="/shows?interactivity=High"/>
                 </>
            )}
            {pageError && !isPageLoading && (
                 <div className="text-center p-4 bg-red-100 text-red-700 rounded border border-red-300 mt-8">
                    Could not load show categories: {pageError}
                 </div>
            )}
        </div>
    );
};

export default HomePage;