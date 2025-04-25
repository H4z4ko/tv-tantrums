// client/src/pages/CatalogPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/catalog/FilterPanel';
import ShowCard from '../components/catalog/ShowCard';
import { getShows } from '../services/showService';
import useDebounce from '../hooks/useDebounce';

const DEBOUNCE_DELAY = 500; // Delay in milliseconds (e.g., 500ms = half a second)

const CatalogPage = () => {
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State for the IMMEDIATE search input value ---
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('search') || '');

  // --- Debounce the local search term ---
  const debouncedSearchTerm = useDebounce(localSearchTerm, DEBOUNCE_DELAY);

  // --- Derive Filters and Page from URL ---
  const activeFilters = useMemo(() => {
    const filters = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'limit') {
        filters[key] = value;
      }
    });
    return filters;
  }, [searchParams]);

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
      if (debouncedSearchTerm) {
        currentParams.set('search', debouncedSearchTerm);
      } else {
        currentParams.delete('search');
      }
      currentParams.set('page', '1');
      setIsLoading(true);
      setSearchParams(currentParams, { replace: true });
    }
  }, [debouncedSearchTerm, searchParams, setSearchParams]);

  // --- Fetching Logic (Depends on URL params including debounced search) ---
  useEffect(() => {
    let isMounted = true;

    const fetchFilters = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'limit') {
        fetchFilters[key] = value;
      }
    });

    const fetchShows = async () => {
      if (isMounted) setError(null);
      try {
        const data = await getShows(fetchFilters, currentPage);
        if (isMounted) {
          if (data && Array.isArray(data.shows) && typeof data.totalPages === 'number') {
            setShows(data.shows);
            setTotalPages(data.totalPages);
            // Validation logic for page number can go here if needed
          } else {
            setError('Invalid data received from server.');
          }
        }
      } catch (err) {
        if (isMounted) setError('Failed to fetch shows.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchShows();

    return () => {
      isMounted = false;
    };
  }, [searchParams, currentPage]);

  // --- Filter Handlers ---
  const handleFilterChange = useCallback(
    (newFilters) => {
      const cleanFilters = { ...newFilters };
      Object.keys(cleanFilters).forEach((key) => {
        if (key === 'search') {
          if (localSearchTerm) cleanFilters[key] = localSearchTerm;
          else delete cleanFilters[key];
        } else if (
          cleanFilters[key] === null ||
          cleanFilters[key] === undefined ||
          cleanFilters[key] === ''
        ) {
          delete cleanFilters[key];
        }
      });

      cleanFilters.page = '1';
      setIsLoading(true);
      setSearchParams(cleanFilters, { replace: true });
    },
    [setSearchParams, localSearchTerm]
  );

  // --- Handler specifically for the Search Input change ---
  const handleSearchInputChange = useCallback((event) => {
    setLocalSearchTerm(event.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocalSearchTerm('');
    setIsLoading(true);
    setSearchParams({ page: '1' }, { replace: true });
  }, [setSearchParams]);

  // --- Pagination Handlers ---
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages || isLoading || newPage === currentPage) return;
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      setIsLoading(true);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, totalPages, isLoading, currentPage]
  );

  const handleNextPage = useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);
  const handlePrevPage = useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);

  // --- JSX Rendering ---
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
        <FilterPanel
          filters={activeFilters}
          onFilterChange={handleFilterChange}
          searchInputValue={localSearchTerm}
          onSearchInputChange={handleSearchInputChange}
        />
        <button onClick={handleResetFilters} className="mt-4 px-4 py-2 bg-gray-100 rounded">
          Reset All Filters
        </button>
      </aside>
      <section className="w-full md:w-3/4 lg:w-4/5">
        <h1 className="text-3xl font-bold text-teal-700 mb-6">Browse Shows</h1>
        <div className="min-h-[60vh]">
          {isLoading && <p>Loading shows...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!isLoading && !error && shows.length === 0 && <p>No shows found.</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CatalogPage;
