// client/src/pages/CatalogPage.jsx (Simplified)
import React, { useState, useEffect } from 'react';
// import FilterPanel from '../components/Catalog/FilterPanel'; // Removed for testing
import ShowCard from '../components/Catalog/ShowCard';
import { getShows } from '../services/showService'; // API service

const CatalogPage = () => {
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [activeFilters, setActiveFilters] = useState({}); // Removed for testing

  console.log("Rendering Simplified CatalogPage. Page:", currentPage, "isLoading:", isLoading); // Log renders

  // --- Fetching Logic (Simplified Effect) ---
  // Removed activeFilters from dependency array for testing
  useEffect(() => {
    console.log("Simplified CatalogPage Effect Running for Page:", currentPage); // Log effect run
    const fetchShows = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch without filters for this test
        const data = await getShows({}, currentPage); // Pass empty object for filters
        console.log("Fetched Catalog Data:", data); // Log fetched data
        setShows(data.shows || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
         console.error("Simplified CatalogPage fetch error:", err);
         setError(err.message || "Failed to load shows.");
         setShows([]);
         setTotalPages(0);
      } finally {
         setIsLoading(false);
      }
    };
    fetchShows();

    return () => {
        console.log("Simplified CatalogPage Effect Cleanup for Page:", currentPage); // Log cleanup
    };
  }, [currentPage]); // Effect now ONLY depends on currentPage

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

   // --- Filter Handlers (Removed) ---
   // const handleFilterChange = (newFilters) => { ... };
   // const handleResetFilters = () => { ... };

  // --- JSX Rendering (Filter Panel Removed) ---
  return (
    // Modified layout slightly as FilterPanel is removed
    <div className="flex flex-col gap-6">

      {/* Removed Filter Panel Column */}
      {/* <aside className="w-full md:w-1/4 lg:w-1/5 ..."> ... </aside> */}

      {/* Show Catalog Grid Section (Takes full width now) */}
      <section className="w-full">
        <h1 className="text-3xl font-bold text-teal-700 mb-6">Browse Shows (Simplified)</h1>
        <p className="text-sm text-orange-600 mb-4 italic">(Filters temporarily disabled for testing)</p>

        {/* Loading State */}
        {isLoading && <p className="text-center text-lg text-gray-600 py-10">Loading shows...</p>}

        {/* Error State */}
        {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded border border-red-300">{error}</p>}

        {/* Show Grid - Render only if not loading, no error, and shows exist */}
        {!isLoading && !error && shows.length > 0 && (
            <>
                {/* Grid layout adjusted slightly */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shows.map(show => (
                        <ShowCard key={show.id} show={show} />
                    ))}
                </div>

                {/* Pagination Controls */}
                <div className="mt-8 flex justify-center items-center space-x-4">
                     <button
                         onClick={handlePrevPage}
                         disabled={currentPage <= 1 || isLoading}
                         className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                     >
                         Previous
                     </button>
                     <span className="text-gray-700">
                        Page {currentPage} of {totalPages}
                     </span>
                     <button
                         onClick={handleNextPage}
                         disabled={currentPage >= totalPages || isLoading}
                          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                     >
                         Next
                     </button>
                 </div>
            </>
        )}

         {/* No Results Message */}
         {!isLoading && !error && shows.length === 0 && (
            <p className="text-center text-gray-500 py-10">No shows found.</p>
         )}

      </section>
    </div>
  );
};

export default CatalogPage;
