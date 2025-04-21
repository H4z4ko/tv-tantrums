// client/src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAutocompleteSuggestions, getHomepageData, getShowByTitle } from '../services/showService.js';
import ShowCard from '../components/catalog/ShowCard.jsx';
import FeaturedShow from '../components/home/FeaturedShow.jsx';
import CategoryCard from '../components/home/CategoryCard.jsx';
import { FaChartBar, FaHeartbeat, FaCheckCircle, FaBabyCarriage, FaPalette, FaMoon, FaUserFriends, FaFlask, FaHandsHelping } from 'react-icons/fa';

// --- Helper Component (ShowCategoryRow) ---
// (Assuming this exists and works from previous steps)
const ShowCategoryRow = ({ title, shows, isLoading, error, viewAllLink = null }) => {
    if (isLoading) return <div className="text-center p-4 text-gray-500">Loading {title}...</div>;
    if (error) return <div className="text-center p-4 text-red-600">Error loading {title}: {error}</div>;
    if (!Array.isArray(shows) || shows.length === 0) {
         return <div className="text-center p-4 text-gray-500">No shows found for {title}.</div>;
    }
    console.log(`>>> Rendering ShowCategoryRow for "${title}" with ${shows.length} shows.`);
    return (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
                {viewAllLink && (
                    <Link to={viewAllLink} className="text-sm text-teal-600 hover:text-teal-800 hover:underline">
                        View All »
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {shows.map(show => (
                    show && show.id ? <ShowCard key={show.id} show={show} /> : null
                ))}
            </div>
        </div>
    );
};


// --- Category Data ---
// (Assuming this exists and works from previous steps)
const categories = [
    { title: "Toddler Time (0-2)", description: "Gentle shows for the littlest viewers.", IconComponent: FaBabyCarriage, linkUrl: "/shows?minAge=0&maxAge=2" },
    { title: "Preschool Picks (3-5)", description: "Engaging content for early learners.", IconComponent: FaPalette, linkUrl: "/shows?minAge=3&maxAge=5" },
    { title: "Calm & Quiet", description: "Low stimulation options.", IconComponent: FaMoon, linkUrl: "/shows?stimScoreMin=1&stimScoreMax=1" },
    { title: "Social Skills", description: "Shows focusing on friendship & emotions.", IconComponent: FaUserFriends, linkUrl: "/shows?themes=Social-Emotional" }, // Assuming themes can be filtered like this
    { title: "STEM Stars", description: "Explore science, tech, & math.", IconComponent: FaFlask, linkUrl: "/shows?themes=STEM" }, // Assuming themes can be filtered like this
    { title: "Interactive Fun", description: "Shows that encourage participation.", IconComponent: FaHandsHelping, linkUrl: "/shows?interactivity=High" }
];

// --- Main HomePage Component ---
const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimeoutRef = useRef(null);
    const [homepageData, setHomepageData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const searchContainerRef = useRef(null); // Ref for the search container


    // --- Fetching Logic for Homepage Data ---
    useEffect(() => {
        // ... (fetch logic remains the same) ...
        console.log(">>> HomePage Fetch Effect Running");
        setIsLoading(true);
        setError(null);
        getHomepageData()
            .then(data => {
                console.log(">>> API call SUCCESS, homepageData received:", data);
                setHomepageData(data);
            })
            .catch(err => {
                console.error(">>> getHomepageData CATCH block:", err);
                setError(err.message || "Failed to load homepage content.");
                setHomepageData(null);
            })
            .finally(() => {
                console.log(">>> Setting isLoading to false");
                setIsLoading(false);
            });

        // Add event listener to close suggestions when clicking outside
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup function
        return () => {
            console.log(">>> HomePage Fetch Effect Cleanup");
            clearTimeout(debounceTimeoutRef.current);
            document.removeEventListener('mousedown', handleClickOutside); // Remove listener on unmount
        };
    }, []); // Empty dependency array

    // --- Autocomplete Fetching Logic ---
    const fetchSuggestions = useCallback(async (term) => {
       // ... (fetch suggestions logic remains the same) ...
        console.log(`>>> fetchSuggestions called with term: "${term}"`);
        if (term.length > 1) {
            try {
                console.log(`>>> Attempting API call getAutocompleteSuggestions("${term}")`);
                const results = await getAutocompleteSuggestions(term);
                console.log(`>>> API call SUCCESS, results received:`, results);
                setSuggestions(results || []);
                // Only show suggestions if results are found AND the term is still relevant
                 if (results && results.length > 0) {
                     setShowSuggestions(true);
                 } else {
                     setShowSuggestions(false);
                 }
            } catch (error) {
                console.error(">>> fetchSuggestions CATCH block:", error);
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            console.log(`>>> Term "${term}" too short, clearing suggestions.`);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, []);

    // --- Handlers ---
    const handleSearchChange = (event) => {
        console.log(">>> handleSearchChange triggered!"); // Keep log
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm);
        // Don't necessarily show suggestions here, let fetchSuggestions decide
        // setShowSuggestions(true);
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(newSearchTerm);
        }, 300);
    };

    const handleSearchSubmit = (event) => {
        console.log(">>> handleSearchSubmit triggered!"); // Keep log
        event.preventDefault();
         setShowSuggestions(false); // Hide suggestions on submit
        if (searchTerm.trim()) {
            navigate(`/shows?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const handleSuggestionClick = async (suggestionTitle) => {
        console.log(`>>> handleSuggestionClick triggered for: "${suggestionTitle}"`); // Keep log
        if (isNavigating) return;

        setShowSuggestions(false);
        setSearchTerm(suggestionTitle); // Set search term to the clicked suggestion
        setIsNavigating(true);

        try {
            console.log(`>>> Attempting getShowByTitle for: "${suggestionTitle}"`);
            const show = await getShowByTitle(suggestionTitle);
            if (show && show.id) {
                console.log(`>>> Found Show ID: ${show.id}, navigating to detail page.`);
                navigate(`/show/${show.id}`);
            } else {
                console.warn(`>>> Show "${suggestionTitle}" not found by title, navigating to catalog search.`);
                navigate(`/shows?search=${encodeURIComponent(suggestionTitle)}`);
            }
        } catch (err) {
            console.error(`>>> Error finding show by title "${suggestionTitle}":`, err.message);
             navigate(`/shows?search=${encodeURIComponent(suggestionTitle)}`);
        } finally {
            setIsNavigating(false);
        }
    };

    // Removed handleBlur - using handleClickOutside instead for more reliability

    // --- JSX Output ---
    console.log(">>> Rendering HomePage JSX - isLoading:", isLoading, "error:", error, "homepageData exists:", !!homepageData);
    return (
        <div>
            {/* --- Top Sections --- */}
            {/* 1. Hero Section */}
            <section className="text-center pt-16 pb-12 px-4 bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-lg shadow-xl relative overflow-hidden mb-12">
                 {/* ... decorative divs ... */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-1/2 translate-y-1/2"></div>
                <div className="relative z-10">
                    {/* ... h1 and p tags ... */}
                     <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-md">Take the Guesswork Out of Screen Time.</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto drop-shadow-sm">Find sensory-smart shows your child will love. Explore ratings for stimulation, interaction, and more to make confident choices.</p>
                    {/* Form and Search Input Area */}
                    <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-4">
                         {/* Assign ref to the container */}
                        <div className="relative" ref={searchContainerRef}>
                            <input
                                type="search"
                                placeholder="Find a show like Bluey, Puffin Rock..."
                                className="w-full px-5 py-3 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800 text-lg"
                                value={searchTerm}
                                onChange={handleSearchChange} // Assign onChange
                                // Show suggestions on focus only if term is valid
                                onFocus={() => {
                                    console.log(">>> Search Input Focused");
                                    if(searchTerm.length > 1) {
                                        setShowSuggestions(true);
                                        // Optional: re-fetch if suggestions might be stale
                                        // fetchSuggestions(searchTerm);
                                    }
                                }}
                                autoComplete="off"
                             />
                            <button type="submit" className="absolute right-0 top-0 bottom-0 mt-1.5 mb-1.5 mr-1.5 px-6 bg-orange-500 text-white rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition duration-200 font-semibold text-lg">
                                Search
                            </button>
                            {/* Suggestion List */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg text-left">
                                    {suggestions.map((suggestion, index) => (
                                        <li key={index} >
                                             <button
                                                 type="button"
                                                 className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-teal-100 cursor-pointer"
                                                 onClick={() => handleSuggestionClick(suggestion)} // Assign onClick
                                            >
                                                {suggestion}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </form>
                     {/* ... Quick Filter Links ... */}
                      <div className="flex flex-wrap justify-center gap-2 mt-4 mb-2">
                         <Link to="/shows?stimScoreMin=1&stimScoreMax=1" className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition">Low Stimulation</Link>
                         <Link to="/shows?interactivity=High" className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition">High Interaction</Link>
                         <Link to="/shows?minAge=3&maxAge=5" className="px-4 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition">Preschool (3-5)</Link>
                    </div>
                    <div className="text-center mt-3">
                        <Link to="/shows" className="text-sm text-teal-100 hover:text-white hover:underline">
                            Or Browse All & Use Advanced Filters
                        </Link>
                    </div>
                </div>
            </section>

            {/* ... Rest of the component (Why Use Guide, Explain Score, Conditionally Rendered Content) remains the same ... */}
             {/* 2. Why Use This Guide Section */}
             <section className="py-16 px-6 md:px-8 bg-white mb-12">
                  <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-700 mb-10">Making Screen Time Meaningful</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 text-center max-w-5xl mx-auto mb-10">
                     <div> <div className="flex justify-center text-4xl text-teal-500 mb-3"><FaChartBar /></div> <h3 className="text-lg font-semibold mb-1">Understand Sensory Load</h3> <p className="text-sm text-gray-600">Clear 1-5 ratings help you gauge intensity across factors like sound, visuals, and pacing.</p> </div>
                     <div> <div className="flex justify-center text-4xl text-blue-500 mb-3"><FaHeartbeat /></div> <h3 className="text-lg font-semibold mb-1">Reduce Overwhelm</h3> <p className="text-sm text-gray-600">Easily find shows that are calming, engaging, or interactive based on your child's needs.</p> </div>
                     <div> <div className="flex justify-center text-4xl text-orange-500 mb-3"><FaCheckCircle /></div> <h3 className="text-lg font-semibold mb-1">Choose Confidently</h3> <p className="text-sm text-gray-600">Access detailed information and filter by age, themes, and specific sensory criteria.</p> </div>
                 </div>
                 <div className="text-center mt-6">
                    <Link to="/shows" className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
                        Guide Me: Find Shows Now!
                    </Link>
                 </div>
             </section>
             {/* 3. Explain the Score Section */}
             <section className="py-12 px-6 md:px-8 bg-teal-50 rounded-lg mb-12">
                   <h2 className="text-2xl md:text-3xl font-semibold text-center text-teal-800 mb-4">What Do the Scores Mean?</h2>
                 <p className="text-center text-gray-700 max-w-2xl mx-auto mb-4">Each show receives an overall <strong className="font-semibold">Stimulation Score from 1 (Very Low) to 5 (Very High)</strong>. This considers factors like scene change frequency, sound effects, music intensity, and dialogue pace.</p>
                 <p className="text-center text-gray-600 text-sm max-w-2xl mx-auto">While a higher score isn't 'bad', it indicates a more intense sensory experience. Use the detailed breakdown on each show's page for specifics.</p>
            </section>
             {/* --- HR Separator --- */}
            <hr className="border-gray-200 my-12 max-w-4xl mx-auto"/>
            {/* --- Conditionally Rendered Content Area --- */}
            {isLoading && <div className="text-center p-10 text-gray-500 text-lg mb-12">Loading homepage content...</div>}
            {error && !isLoading && <div className="text-center p-6 bg-red-100 text-red-700 rounded-lg border border-red-300 font-medium mb-12">{error}</div>}
            {homepageData && !isLoading && !error && (
                 <div className="px-4 md:px-6 lg:px-8">
                     {/* 4. Featured Show Section */}
                     {homepageData.featuredShow ? ( <div className="mb-16"><FeaturedShow show={homepageData.featuredShow} /></div>) : (<div className="text-center p-6 bg-gray-100 rounded-lg mb-16">Featured show could not be loaded.</div> )}
                     {/* 5. Browse by Category Section */}
                     <section className="py-16 px-6 md:px-8 bg-slate-50 rounded-lg mb-16">
                         <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-700 mb-10">Explore Categories</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {categories.map((category) => ( <CategoryCard key={category.title} {...category} /> ))}
                         </div>
                    </section>
                    {/* 6. Content Rows Wrapper */}
                    <div className="space-y-12">
                         <div className="mb-12"><ShowCategoryRow title="Popular Shows" shows={homepageData.popularShows} viewAllLink="/shows?sort=title" /></div>
                         <div className="py-8 px-6 md:px-8 bg-slate-50 rounded-lg mb-12"><ShowCategoryRow title="Top-Rated for Sensory Balance" shows={homepageData.ratedShows} viewAllLink="/shows?sortBy=stimulation_score&sortOrder=DESC"/></div>
                         <div className="mb-12"><ShowCategoryRow title="Gentle & Calming Choices" shows={homepageData.lowStimShows} viewAllLink="/shows?stimScoreMin=1&stimScoreMax=1"/></div>
                         <div className="py-8 px-6 md:px-8 bg-slate-50 rounded-lg mb-12"><ShowCategoryRow title="Highly Interactive Shows" shows={homepageData.highInteractionShows} viewAllLink="/shows?interactivity=High"/></div>
                    </div>
                 </div>
             )}
        </div>
    );
};

export default HomePage;