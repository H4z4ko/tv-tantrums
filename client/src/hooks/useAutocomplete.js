// client/src/hooks/useAutocomplete.js
import { useState, useEffect, useCallback, useRef } from 'react';
import useDebounce from './useDebounce'; // Assuming useDebounce hook exists

/**
 * Custom Hook for Autocomplete functionality.
 *
 * @param {function} fetchSuggestionsFn - An async function that takes a search term and returns an array of suggestions.
 * @param {number} debounceDelay - Delay in ms for debouncing input.
 * @returns {object} - Contains state and handlers for autocomplete.
 */
function useAutocomplete(fetchSuggestionsFn, debounceDelay = 300) {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null); // Ref for the container to handle clicks outside

    const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

    // Effect to fetch suggestions when debounced term changes
    useEffect(() => {
        let isMounted = true;
        const fetch = async () => {
            if (debouncedSearchTerm && debouncedSearchTerm.length > 1) {
                setIsLoading(true);
                try {
                    const results = await fetchSuggestionsFn(debouncedSearchTerm);
                    if (isMounted) {
                        setSuggestions(results || []);
                        setShowSuggestions(true); // Show suggestions when results are fetched
                    }
                } catch (error) {
                    console.error("Autocomplete fetch error:", error);
                    if (isMounted) {
                        setSuggestions([]);
                        setShowSuggestions(false); // Hide on error
                    }
                } finally {
                    if (isMounted) {
                        setIsLoading(false);
                    }
                }
            } else {
                // Clear suggestions if term is too short or empty
                if (isMounted) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        };

        fetch();

        return () => { isMounted = false; }; // Cleanup on unmount or dependency change
    }, [debouncedSearchTerm, fetchSuggestionsFn]); // Re-run if term or fetch function changes

    // Effect to handle clicks outside the autocomplete container
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false); // Hide suggestions on outside click
            }
        };
        // Add event listener only when suggestions are shown
        if (showSuggestions) {
             document.addEventListener('mousedown', handleClickOutside);
        } else {
             document.removeEventListener('mousedown', handleClickOutside); // Clean up listener
        }
        // Cleanup listener on unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]); // Re-run when showSuggestions changes

    // Handler for input changes
    const handleInputChange = useCallback((event) => {
        setSearchTerm(event.target.value);
        // Optionally show suggestions immediately while typing, or wait for debounce effect
        // setShowSuggestions(true); // Uncomment to show list while typing (might be visually noisy)
    }, []);

    // Handler when a suggestion is clicked (or selected)
    const handleSuggestionSelect = useCallback((suggestion) => {
        setSearchTerm(suggestion); // Update input field
        setSuggestions([]); // Clear suggestions
        setShowSuggestions(false); // Hide suggestions list
        // Note: Navigation or further action should be handled by the component using the hook
    }, []);

    // Function to manually hide suggestions (e.g., on form submit)
    const hideSuggestions = useCallback(() => {
        setShowSuggestions(false);
    }, []);

     // Function to reset the autocomplete state
     const resetAutocomplete = useCallback(() => {
        setSearchTerm('');
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
    }, []);

    return {
        // State
        inputValue: searchTerm,
        suggestions,
        isLoading,
        showSuggestions,
        // Handlers & Ref
        handleInputChange,
        handleSuggestionSelect,
        hideSuggestions,
        resetAutocomplete,
        containerRef, // Pass the ref down so the component can assign it
    };
}

export default useAutocomplete;