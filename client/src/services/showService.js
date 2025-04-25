// client/src/services/showService.js
import axios from 'axios';

// The base URL for our API. Uses the Vite proxy.
const API_BASE_URL = '/api';

// Helper function to construct consistent error messages
const formatErrorMessage = (error, context) => {
    let message = `An unknown error occurred ${context}.`;
    if (error.response) {
        // Server responded with a status code outside 2xx range
        message = error.response.data?.error || `Server error (${error.response.status}) ${context}.`;
        // Handle specific statuses if needed, e.g., 404
        if (error.response.status === 404 && context.includes("ID")) {
             message = `Resource not found ${context}.`; // More specific 404
        }
    } else if (error.request) {
        // Request was made but no response received
        message = `No response received from server ${context}. Check network or backend.`;
    } else {
        // Something else happened in setting up the request
        message = error.message || message;
    }
    console.error(`Error ${context}:`, message, error); // Log the detailed error
    return message; // Return the formatted message
};

/**
 * Fetches a list of shows from the backend API with filtering, sorting, and pagination.
 * Returns an object like { shows: [], totalShows: 0, ... } or a default object on error.
 */
export const getShows = async (filters = {}, page = 1, limit = 21) => {
    try {
        const params = { ...filters, page, limit };
        Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]);

        console.log('Fetching shows with params:', params);
        const response = await axios.get(`${API_BASE_URL}/shows`, { params });

        // Ensure response data structure is as expected
        if (response && response.data && Array.isArray(response.data.shows) && typeof response.data.totalPages === 'number') {
             return response.data;
        } else {
             console.warn("Received unexpected data structure from GET /shows:", response?.data);
             // Return a default structure to prevent UI errors
             return { shows: [], totalShows: 0, totalPages: 0, currentPage: 1, limit };
        }
    } catch (error) {
       const errorMessage = formatErrorMessage(error, "while fetching shows");
       // Re-throw the formatted error for the UI to handle
       // Consider returning the default structure here too if preferred over throwing
       // throw new Error(errorMessage);
       // Returning default structure instead of throwing for smoother UI:
       return { shows: [], totalShows: 0, totalPages: 0, currentPage: 1, limit };
    }
};

/**
 * Fetches details for a single show by its ID.
 * Returns the show object or null on error.
 */
export const getShowById = async (id) => {
     if (!id) {
         console.error("getShowById called with invalid ID.");
         return null; // Return null for invalid input
     }
     const context = `while fetching show ID ${id}`;
     try {
        console.log(`Workspaceing show by ID: ${id}`);
        const response = await axios.get(`${API_BASE_URL}/shows/${id}`);
        // Return data if response is valid, otherwise null
        return response?.data || null;
    } catch (error) {
         const errorMessage = formatErrorMessage(error, context);
         // Throwing the error might be better here if the detail page MUST have data
         // throw new Error(errorMessage);
         // Returning null for smoother UI, page should handle null state:
         return null;
     }
};

 /**
  * Fetches details for a single show by its exact title.
  * Returns the show object or null on error.
  */
 export const getShowByTitle = async (title) => {
     if (!title || typeof title !== 'string' || title.trim().length === 0) {
          console.error("getShowByTitle called with invalid title:", title);
          return null; // Return null for invalid input
     }
     const encodedTitle = encodeURIComponent(title.trim());
     const context = `while fetching show title "${title}"`;
     console.log(`Workspaceing show by title: ${title}, Encoded: ${encodedTitle}`);
     try {
         const response = await axios.get(`${API_BASE_URL}/shows/title/${encodedTitle}`);
          // Return data if response is valid, otherwise null
         return response?.data || null;
     } catch (error) {
         const errorMessage = formatErrorMessage(error, context);
         // throw new Error(errorMessage); // Option to throw
         return null; // Option to return null
     }
 };

 /**
  * Fetches the list of unique theme names.
  * Returns an array of strings or [] on error.
  */
 export const getThemes = async () => {
     const context = "while fetching themes";
     try {
        console.log("Fetching themes");
         const response = await axios.get(`${API_BASE_URL}/themes`);
         // Ensure data is an array, return [] otherwise
         return Array.isArray(response?.data) ? response.data : [];
     } catch (error) {
         formatErrorMessage(error, context); // Log the error
         return []; // Return empty array on error
     }
 };

 /**
  * Fetches details for multiple shows based on an array of IDs for comparison.
  * Returns an array of show objects or [] on error.
  */
 export const getShowsForComparison = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) { // Simplified check
        console.warn("getShowsForComparison called with invalid IDs:", ids);
        return []; // Return empty array for invalid input
    }
    // Limit comparison - This check might be better placed in the component calling it.
    if (ids.length > 3) {
        console.warn(`Attempted to compare ${ids.length} shows, limiting to 3.`);
        ids = ids.slice(0, 3); // Silently limit or throw error? Limiting for now.
    }

    const validIds = ids.map(id => String(id).trim()).filter(id => id);
    if (validIds.length === 0) {
         return []; // Return empty if no valid IDs remain
    }

    const idString = validIds.join(',');
    const context = `while fetching shows for comparison (IDs: ${idString})`;
    console.log(`Workspaceing shows for comparison with IDs: ${idString}`);
    try {
        const response = await axios.get(`${API_BASE_URL}/shows/compare`, { params: { ids: idString } });
        // Ensure data is an array
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        formatErrorMessage(error, context); // Log the error
        return []; // Return empty array on error
    }
 };

/**
 * Fetches autocomplete suggestions for show titles.
 * Returns an array of strings or [] on error.
 */
export const getAutocompleteSuggestions = async (term) => {
    if (!term || typeof term !== 'string' || term.trim().length < 2) {
        return []; // Return empty array for short/invalid terms
    }
    const searchTerm = term.trim();
    const context = `while fetching suggestions for term "${searchTerm}"`;
    console.log(`Workspaceing suggestions for term: "${searchTerm}"`);
    try {
        const response = await axios.get(`${API_BASE_URL}/suggestions`, { params: { term: searchTerm } });
        // Ensure data is an array
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        formatErrorMessage(error, context); // Log the error
        return []; // Return empty array on error
    }
};

/**
 * Fetches all data needed for the homepage in a single request.
 * Returns the homepage data object or null on error.
 */
export const getHomepageData = async () => {
    const context = "while fetching homepage data";
    console.log(">>> Service: getHomepageData called.");
    try {
        const response = await axios.get(`${API_BASE_URL}/homepage-data`);
        // Basic check if data object exists
        return response?.data || null;
    } catch (error) {
        const errorMessage = formatErrorMessage(error, context);
        // throw new Error(errorMessage); // Option to throw
        return null; // Option to return null
    }
};

/**
 * Fetches the complete list of show IDs and titles for dropdowns.
 * Returns an array of {id, title} objects or [] on error.
 */
export const getShowList = async () => {
    const context = "while fetching show list";
    console.log(">>> Service: getShowList called.");
    try {
        const response = await axios.get(`${API_BASE_URL}/show-list`);
        // Ensure data is an array
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        formatErrorMessage(error, context); // Log the error
        return []; // Return empty array on error
    }
};