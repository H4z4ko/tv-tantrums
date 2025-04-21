// client/src/pages/CatalogPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // Hook to read/write URL query parameters
import FilterPanel from '../components/catalog/FilterPanel';
import ShowCard from '../components/catalog/ShowCard';
import { getShows } from '../services/showService';

const CatalogPage = () => {
    const [shows, setShows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [activeFilters, setActiveFilters] = useState({}); // State to hold active filters object
    const [searchParams, setSearchParams] = useSearchParams(); // Hook to manage search params

    // --- Initialize Filters from URL Search Params ---
    // This effect now runs whenever searchParams changes.
    useEffect(() => {
        console.log("Initializing filters from searchParams:", searchParams.toString());
        const initialFilters = {};
        // Read each potential filter parameter from the URL
        const search = searchParams.get('search');
        const minAge = searchParams.get('minAge');
        const maxAge = searchParams.get('maxAge');
        const themes = searchParams.get('themes'); // Comma-separated string
        const interactivity = searchParams.get('interactivity');
        const dialogue = searchParams.get('dialogue');
        const sceneFreq = searchParams.get('sceneFreq');
        const stimScoreMin = searchParams.get('stimScoreMin');
        const stimScoreMax = searchParams.get('stimScoreMax');
        const sortBy = searchParams.get('sortBy');
        const sortOrder = searchParams.get('sortOrder');
        
        // Add them to the initialFilters object if they exist
        if (search) initialFilters.search = search;
        if (minAge) initialFilters.minAge = minAge; // Keep as string, FilterPanel handles it
        if (maxAge) initialFilters.maxAge = maxAge; // Keep as string, FilterPanel handles it
        if (themes) initialFilters.themes = themes;
        if (interactivity) initialFilters.interactivity = interactivity;
        if (dialogue) initialFilters.dialogue = dialogue;
        if (sceneFreq) initialFilters.sceneFreq = sceneFreq;
        if (stimScoreMin) initialFilters.stimScoreMin = stimScoreMin; // Keep as string
        if (stimScoreMax) initialFilters.stimScoreMax = stimScoreMax; // Keep as string
        if (sortBy) initialFilters.sortBy = sortBy;
        if (sortOrder) initialFilters.sortOrder = sortOrder;
        
        // Set the active filters based on URL parameters
        setActiveFilters(initialFilters);
        // Reset to page 1 whenever filters are initialized from URL
        setCurrentPage(1); 
        console.log("Initialized activeFilters:", initialFilters);

        // No dependency array needed here as it's implicitly dependent on searchParams from useSearchParams hook
        // However, explicitly adding it clarifies intent.
    }, [searchParams]); 


    // --- Fetching Logic ---
    // This effect runs when activeFilters or currentPage changes.
    useEffect(() => {
        // Prevent fetching if filters haven't potentially been initialized yet 
        // (e.g., on very first load before the searchParams effect runs)
        // We can check if activeFilters is populated OR if the URL has params
        // A simple check is often sufficient, or just let it run.
        
        console.log("CatalogPage Fetch Effect Running. Filters:", activeFilters, "Page:", currentPage);
        const fetchShows = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Pass the current activeFilters and currentPage to the service
                const data = await getShows(activeFilters, currentPage);
                console.log("Fetched Catalog Data:", data);
                setShows(data.shows || []);
                setTotalPages(data.totalPages || 0);
             } catch (err) {
                console.error("CatalogPage fetch error:", err);
                setError(err.message || "Failed to load shows.");
                setShows([]);
                setTotalPages(0);
            } finally {
                 setIsLoading(false);
            }
        };

        // Only fetch if activeFilters is not empty, or if it's page 1 (initial load/reset)
        // This condition prevents unnecessary fetches if filters are cleared quickly
        if (Object.keys(activeFilters).length > 0 || currentPage === 1) {
             fetchShows();
        } else {
             // If filters are empty and not on page 1, likely means filters were just reset
             // We might want to clear the shows list here or rely on the reset handler
             setShows([]);
             setTotalPages(0);
             setIsLoading(false); // Ensure loading stops
        }

        // Cleanup function (optional)
         return () => {
            console.log("CatalogPage Fetch Effect Cleanup. Filters:", activeFilters, "Page:", currentPage);
         };
    }, [activeFilters, currentPage]); // Depend on filters and page

    // --- Filter Handlers ---
    const handleFilterChange = useCallback((newFilters) => {
        console.log("Applying filters:", newFilters);
        // Update the state
        setActiveFilters(newFilters); 
        // Reset page to 1 when filters change
        setCurrentPage(1); 
        // Update the URL search parameters to reflect the new filters
        setSearchParams(newFilters, { replace: true }); // Use replace to avoid bloating browser history
    }, [setSearchParams]); // Dependency on setSearchParams

    const handleResetFilters = useCallback(() => {
        console.log("Resetting filters");
        setActiveFilters({});
        setCurrentPage(1);
        // Clear URL search params
        setSearchParams({}, { replace: true }); 
    }, [setSearchParams]); // Dependency on setSearchParams

    // --- Pagination Handlers ---
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };

    // --- JSX Rendering ---
    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

            {/* Filter Panel Column */}
            <aside className="w-full md:w-1/4 lg:w-1/5">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
                {/* Pass the activeFilters state to FilterPanel */}
                <FilterPanel
                     filters={activeFilters} 
                    onFilterChange={handleFilterChange}
                    // onReset prop is removed as reset is handled here now
                />
                 {/* Reset Button */}
                 <button
                    onClick={handleResetFilters}
                    className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
                  >
                    Reset All Filters
                </button>
            </aside>

            {/* Show Catalog Grid Section */}
            <section className="w-full md:w-3/4 lg:w-4/5">
                 <h1 className="text-3xl font-bold text-teal-700 mb-6">Browse Shows</h1>
                {/* Optional: Display active filters for debugging/clarity 
                 <p className="text-xs mb-4">Current Filters: {JSON.stringify(activeFilters)}</p> 
                 */}

                {/* Loading State */}
                {isLoading && <p className="text-center text-lg text-gray-600 py-10">Loading shows...</p>}

                {/* Error State */}
                {error && !isLoading && <p className="text-center text-red-600 bg-red-100 p-4 rounded border border-red-300">{error}</p>}

                {/* Show Grid - Render only if not loading, no error, and shows exist */}
                {!isLoading && !error && shows.length > 0 && (
                     <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {shows.map(show => (
                                 <ShowCard key={show.id} show={show} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                         {totalPages > 1 && (
                             <div className="mt-8 flex justify-center items-center space-x-4">
                                <button
                                     onClick={handlePrevPage}
                                    disabled={currentPage <= 1 || isLoading}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                > Previous </button>
                                <span className="text-gray-700"> Page {currentPage} of {totalPages} </span>
                                <button
                                     onClick={handleNextPage}
                                    disabled={currentPage >= totalPages || isLoading}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                > Next </button>
                            </div>
                        )}
                     </>
                )}

                 {/* No Results Message */}
                 {!isLoading && !error && shows.length === 0 && (
                    <p className="text-center text-gray-500 py-10">No shows found matching your criteria.</p>
                )}

            </section>
        </div>
    );
};

export default CatalogPage;