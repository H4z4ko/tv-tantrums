// client/src/pages/CatalogPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/catalog/FilterPanel';
import ShowCard from '../components/catalog/ShowCard';
import { getShows } from '../services/showService';
import useDebounce from '../hooks/useDebounce';

const DEBOUNCE_DELAY = 400; // Delay in milliseconds for search input debounce
const ITEMS_PER_PAGE = 12; // Number of shows per page

// --- Skeleton Card for Loading State ---
const SkeletonShowCard = () => (
    <div className="border border-gray-200 rounded-lg shadow-md bg-white p-4 animate-pulse h-full flex flex-col">
        <div className="h-48 bg-gray-300 rounded mb-3"></div>
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="mt-auto pt-2"><div className="h-9 bg-gray-300 rounded-md"></div></div>
    </div>
);

const CatalogPage = () => {
  // State for shows, loading, error, and pagination
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalShows, setTotalShows] = useState(0); // Store total results count

  // Manage URL search parameters
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State for the IMMEDIATE search input value ---
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('search') || '');

  // --- Debounce the local search term ---
  const debouncedSearchTerm = useDebounce(localSearchTerm, DEBOUNCE_DELAY);

  // --- Derive Filters and Page from URL Search Parameters ---
  const activeFilters = useMemo(() => {
    const filters = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'limit' && key !== 'search') {
        filters[key] = value;
      }
    });
    // Reflect the immediate search term in the FilterPanel input,
    // but the 'search' key here uses the debounced term for consistency checks if needed.
    // If `localSearchTerm` is used for display, `filters.search` is less critical here.
    if (debouncedSearchTerm) {
       filters.search = debouncedSearchTerm;
     }
    return filters;
  }, [searchParams, debouncedSearchTerm]); // Depend on URL and debounced term

  const currentPage = useMemo(() => {
    const pageParam = searchParams.get('page');
    const page = parseInt(pageParam, 10);
    return !isNaN(page) && page > 0 ? page : 1;
  }, [searchParams]);

  // --- Effect to update URL when DEBOUNCED search term changes ---
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    const currentSearchInUrl = currentParams.get('search') || '';

    if (debouncedSearchTerm !== currentSearchInUrl) {
      console.log(`CatalogPage: Debounced search changed to "${debouncedSearchTerm}". Updating URL.`);
      if (debouncedSearchTerm) {
        currentParams.set('search', debouncedSearchTerm);
      } else {
        currentParams.delete('search');
      }
      currentParams.set('page', '1');
      setSearchParams(currentParams, { replace: true });
    }
  }, [debouncedSearchTerm, searchParams, setSearchParams]);

  // --- Fetching Logic ---
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController(); // For fetch cancellation

    const fetchFilters = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'limit') {
        fetchFilters[key] = value;
      }
    });

    console.log(`CatalogPage: Fetching shows with filters:`, fetchFilters, `Page: ${currentPage}`);
    setIsLoading(true);
    setError(null);

    getShows(fetchFilters, currentPage, ITEMS_PER_PAGE, { signal: controller.signal })
      .then(data => {
        if (isMounted) {
          console.log(`CatalogPage: Received ${data.shows.length} shows, Total Shows: ${data.totalShows}, Total Pages: ${data.totalPages}`);
          setShows(data.shows);
          setTotalPages(data.totalPages);
          setTotalShows(data.totalShows);
          // Redirect to last page if current page becomes invalid after filtering/fetching
          if (currentPage > data.totalPages && data.totalPages > 0) {
             handlePageChange(data.totalPages);
          }
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError' && err.message !== 'Request cancelled while fetching shows.') { // Check for cancellation
          if (isMounted) {
            console.error('CatalogPage: Failed to fetch shows:', err);
            setError(err.message || 'Failed to fetch shows. Please try again.');
            setShows([]); setTotalPages(0); setTotalShows(0);
          }
        } else {
             console.log("CatalogPage: Fetch aborted or cancelled.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort(); // Cancel fetch on unmount or dependency change
      console.log("CatalogPage: Unmounting or dependencies changed, fetch cleanup.");
    };
  }, [searchParams, currentPage]); // Rerun fetch when URL params or current page changes

  // --- Filter Handlers ---
  const handleFilterChange = useCallback((newFilters) => {
    console.log("CatalogPage: handleFilterChange called with:", newFilters);
    const currentParams = new URLSearchParams(searchParams);
    const currentSearch = currentParams.get('search'); // Preserve existing search term

    // Remove all old filters except search and pagination
     const keysToRemove = [];
     currentParams.forEach((_, key) => {
          if (key !== 'page' && key !== 'limit' && key !== 'search') {
              keysToRemove.push(key);
          }
      });
      keysToRemove.forEach(key => currentParams.delete(key));

    // Add new filters
    Object.entries(newFilters).forEach(([key, value]) => {
         // Ensure value is treated correctly (e.g., themes string)
         if (value !== null && value !== undefined && String(value).trim() !== '') {
             currentParams.set(key, String(value));
         } else {
              currentParams.delete(key); // Explicitly remove if empty/null
         }
     });

    // Restore search term if it existed
    if (currentSearch) {
        currentParams.set('search', currentSearch);
    } else {
         currentParams.delete('search');
     }

    currentParams.set('page', '1'); // Reset page
    setSearchParams(currentParams, { replace: true });
  }, [searchParams, setSearchParams]);


  const handleSearchInputChange = useCallback((event) => {
    setLocalSearchTerm(event.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    console.log("CatalogPage: Resetting filters.");
    setLocalSearchTerm('');
    setSearchParams({ page: '1' }, { replace: true }); // Reset URL to just page 1
  }, [setSearchParams]);

  // --- Pagination Handlers ---
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages || isLoading || newPage === currentPage) return;
    console.log(`CatalogPage: Changing page to ${newPage}`);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params, { replace: true }); // Update URL, triggers fetch effect

     // Scroll to top of results list smoothly
     const resultsSection = document.getElementById('show-results-section');
     if (resultsSection) {
         // Use setTimeout to allow state update before scrolling
         setTimeout(() => {
             resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }, 0);
     }
  }, [searchParams, setSearchParams, totalPages, isLoading, currentPage]);

  const handleNextPage = useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);
  const handlePrevPage = useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);

  // --- Result Summary Text ---
  const resultSummary = useMemo(() => {
      if (isLoading && totalShows === 0) return <p className="text-sm text-gray-500 mb-4 h-5 animate-pulse bg-gray-200 rounded w-48"></p>; // Placeholder
      if (error) return null;

      const startItem = totalShows === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalShows);

      if (totalShows === 0 && !isLoading) return <p className="text-sm text-gray-600 mb-4 font-medium">No shows found matching your criteria.</p>;
       if (totalShows > 0) return (
           <p className="text-sm text-gray-600 mb-4">
               Showing <span className='font-medium'>{startItem} - {endItem}</span> of <span className='font-medium'>{totalShows}</span> results
           </p>
       );
       return null; // Should not happen if loading/error/no results are handled
  }, [isLoading, error, totalShows, currentPage]);

    // --- Pagination Component ---
    const PaginationControls = () => {
        // Hide pagination if loading results, or if there's only one page or fewer.
        if (isLoading || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxPagesToShow = 5; // Max number of page buttons (e.g., 1 ... 4 5 6 ... 10)
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1; endPage = totalPages;
        } else {
             // Calculate start/end pages for the sliding window
             let maxPagesBeforeCurrent = Math.floor((maxPagesToShow - 1) / 2);
             let maxPagesAfterCurrent = Math.ceil((maxPagesToShow - 1) / 2);

             if (currentPage <= maxPagesBeforeCurrent) {
                 startPage = 1;
                 endPage = maxPagesToShow -1; // Leave space for ellipsis and last page
             } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                 startPage = totalPages - (maxPagesToShow - 2); // Leave space for first page and ellipsis
                 endPage = totalPages;
             } else {
                 startPage = currentPage - maxPagesBeforeCurrent + 1;
                 endPage = currentPage + maxPagesAfterCurrent -1;
             }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

         // Button styling classes
        const buttonClass = "px-3 py-1 mx-0.5 border border-gray-300 rounded text-sm transition duration-150 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:z-10 relative";
        const activeClass = "bg-teal-600 text-white border-teal-600 z-20";
        const defaultClass = "bg-white text-gray-700 hover:bg-gray-100";
        const disabledClass = "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200";
        const ellipsisClass = "text-gray-500 mx-1 px-1 py-1 text-sm";

        return (
            <nav aria-label="Pagination" className="flex justify-center items-center mt-8 space-x-1">
                <button onClick={handlePrevPage} disabled={currentPage === 1} aria-label="Previous page"
                    className={`${buttonClass} ${currentPage === 1 ? disabledClass : defaultClass}`}>
                    Previous
                </button>
                {/* Show first page and ellipsis if needed */}
                {startPage > 1 && (
                    <>
                        <button onClick={() => handlePageChange(1)} aria-label="Go to page 1" className={`${buttonClass} ${defaultClass}`}>1</button>
                        {startPage > 2 && <span className={ellipsisClass} aria-hidden="true">...</span>}
                    </>
                )}
                {/* Page number buttons */}
                {pageNumbers.map(num => (
                    <button key={num} onClick={() => handlePageChange(num)} disabled={num === currentPage} aria-current={num === currentPage ? 'page' : undefined}
                        className={`${buttonClass} ${num === currentPage ? activeClass : defaultClass}`}>
                        {num}
                    </button>
                ))}
                 {/* Show last page and ellipsis if needed */}
                 {endPage < totalPages && (
                    <>
                         {endPage < totalPages - 1 && <span className={ellipsisClass} aria-hidden="true">...</span>}
                        <button onClick={() => handlePageChange(totalPages)} aria-label={`Go to page ${totalPages}`} className={`${buttonClass} ${defaultClass}`}>{totalPages}</button>
                    </>
                )}
                <button onClick={handleNextPage} disabled={currentPage === totalPages} aria-label="Next page"
                     className={`${buttonClass} ${currentPage === totalPages ? disabledClass : defaultClass}`}>
                    Next
                </button>
            </nav>
        );
    };

  // --- JSX Rendering ---
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Filter Panel Sidebar */}
       <aside className="w-full md:w-1/4 lg:w-1/5 md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto"> {/* Adjust top offset based on header height, enable scroll */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
        {/* Pass only relevant props derived from URL state */}
        <FilterPanel
          filters={activeFilters}
          onFilterChange={handleFilterChange}
          searchInputValue={localSearchTerm} // Display the immediate value
          onSearchInputChange={handleSearchInputChange}
        />
        <button
          onClick={handleResetFilters}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Reset All Filters
        </button>
      </aside>

      {/* Main Content Area: Results Grid and Pagination */}
      <section id="show-results-section" className="w-full md:w-3/4 lg:w-4/5">
        <h1 className="text-2xl md:text-3xl font-bold text-teal-700 mb-1">Browse Shows</h1>
        {resultSummary}

        {/* Results Grid Area */}
        <div className="min-h-[60vh]">
          {error && !isLoading && ( // Show error prominently if it occurs
            <p className="text-center text-red-600 bg-red-100 p-4 rounded border border-red-300 mb-6">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(ITEMS_PER_PAGE)].map((_, index) => <SkeletonShowCard key={`skel-${index}`} />)
            ) : !error && shows.length > 0 ? (
              shows.map((show) => (
                show && show.id ? <ShowCard key={show.id} show={show} /> : null
              ))
            ) : null /* No shows message handled by resultSummary */}
          </div>
          <PaginationControls />
        </div>
      </section>
    </div>
  );
};

export default CatalogPage;