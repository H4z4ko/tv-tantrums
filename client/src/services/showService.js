// client/src/services/showService.js
import axios from 'axios';

// The base URL for our API. Uses the Vite proxy during development.
const API_BASE_URL = '/api';

// Create an axios instance (optional, but good practice for setting defaults)
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // Increased timeout slightly (e.g., 15 seconds)
});

// --- Helper to Format Error Messages ---
const formatErrorMessage = (error, context) => {
    let message = `An unknown error occurred ${context}.`;
    // Check if the error is an Axios cancellation
    if (axios.isCancel(error)) {
        message = `Request cancelled ${context}.`;
        console.log(message); // Log cancellations differently if needed
        // Return a specific error type or message for cancellations
        return "Request cancelled.";
    } else if (error.response) {
        // Server responded with a status code outside 2xx range
        const status = error.response.status;
        const serverError = error.response.data?.error || `Server responded with status ${status}`;
        message = `${serverError} ${context}.`;
        if (status === 404 && (context.includes("ID") || context.includes("title"))) {
             message = `Resource not found ${context}.`;
        } else if (status >= 500) {
            message = `Server error (${status}) ${context}. Please try again later.`;
        } else if (status === 400) {
             message = `Invalid request ${context}. Check parameters. (${serverError})`;
        }
    } else if (error.request) {
        // Request was made but no response received (network error, server down)
        message = `Network error: Could not connect to the server ${context}.`;
    } else {
        // Something else happened in setting up the request
        message = error.message ? `${error.message} ${context}.` : message;
    }
    console.error(`Error ${context}:`, message, error);
    return message; // Return the formatted message
};

/**
 * Fetches a list of shows with filtering, sorting, and pagination.
 * Returns an object like { shows: [], totalShows: 0, ... } or throws a formatted error.
 */
export const getShows = async (filters = {}, page = 1, limit = 21, options = {}) => {
    const context = "while fetching shows";
    try {
        const cleanedFilters = { ...filters };
        Object.keys(cleanedFilters).forEach(key => (cleanedFilters[key] == null || cleanedFilters[key] === '') && delete cleanedFilters[key]);
        const params = { ...cleanedFilters, page, limit };
        console.log('Fetching shows with params:', params);

        const response = await apiClient.get('/shows', { params, signal: options.signal });

        if (response?.data && Array.isArray(response.data.shows) && typeof response.data.totalPages === 'number') {
             return response.data;
        } else {
             throw new Error("Received invalid data structure from server");
        }
    } catch (error) {
       // Don't throw cancellation errors, let the component handle it
       if (axios.isCancel(error)) {
           console.log("Show fetch cancelled.");
           // Re-throw a specific cancellation error or return a specific state if needed by UI
           throw error; // Let the caller handle cancellation if needed
       }
       const errorMessage = formatErrorMessage(error, context);
       throw new Error(errorMessage);
    }
};

/**
 * Fetches details for a single show by its ID.
 * Returns the show object or throws a formatted error.
 */
export const getShowById = async (id, options = {}) => {
     if (!id || isNaN(parseInt(id))) {
         const invalidIdError = "Invalid ID provided when fetching show.";
         console.error(invalidIdError);
         throw new Error(invalidIdError);
     }
     const context = `while fetching show ID ${id}`;
     try {
        console.log(`Fetching show by ID: ${id}`);
        const response = await apiClient.get(`/shows/${id}`, { signal: options.signal });
        if (response?.data) { return response.data; }
        else { throw new Error(`No data received for show ID ${id}.`); }
    } catch (error) {
         if (axios.isCancel(error)) { console.log(`Show ID ${id} fetch cancelled.`); throw error; }
         const errorMessage = formatErrorMessage(error, context);
         throw new Error(errorMessage);
     }
};

 /**
  * Fetches details for a single show by its exact title.
  * Returns the show object or throws a formatted error.
  */
 export const getShowByTitle = async (title, options = {}) => {
     if (!title || typeof title !== 'string' || title.trim().length === 0) {
          const invalidTitleError = "Invalid title provided when fetching show.";
          console.error(invalidTitleError, title);
          throw new Error(invalidTitleError);
     }
     const encodedTitle = encodeURIComponent(title.trim());
     const context = `while fetching show title "${title}"`;
     console.log(`Fetching show by title: ${title}, Encoded: ${encodedTitle}`);
     try {
         const response = await apiClient.get(`/shows/title/${encodedTitle}`, { signal: options.signal });
          if (response?.data) { return response.data; }
          else { throw new Error(`No data received for show title "${title}".`); }
     } catch (error) {
          if (axios.isCancel(error)) { console.log(`Show title ${title} fetch cancelled.`); throw error; }
         const errorMessage = formatErrorMessage(error, context);
         throw new Error(errorMessage);
     }
 };

 /**
  * Fetches the list of unique theme names.
  * Returns an array of strings or throws a formatted error.
  */
 export const getThemes = async (options = {}) => {
     const context = "while fetching themes";
     try {
        console.log("Fetching themes");
         const response = await apiClient.get('/themes', { signal: options.signal });
         if (Array.isArray(response?.data)) { return response.data; }
         else { throw new Error("Received invalid theme data from server."); }
     } catch (error) {
         if (axios.isCancel(error)) { console.log("Theme fetch cancelled."); throw error; }
         const errorMessage = formatErrorMessage(error, context);
         throw new Error(errorMessage);
     }
 };

 /**
  * Fetches details for multiple shows based on an array of IDs for comparison.
  * Returns an array of show objects or throws a formatted error.
  */
 export const getShowsForComparison = async (ids, options = {}) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        console.warn("getShowsForComparison called with invalid IDs:", ids);
        return []; // Return empty for invalid input
    }
    const limitedIds = ids.slice(0, 3);
    if (limitedIds.length !== ids.length) console.warn(`Attempted to compare ${ids.length} shows, limiting to ${limitedIds.length}.`);
    const validIds = limitedIds.map(id => String(id).trim()).filter(id => id && !isNaN(parseInt(id)));
    if (validIds.length === 0) { console.warn("No valid numeric IDs found for comparison."); return []; }

    const idString = validIds.join(',');
    const context = `while fetching shows for comparison (IDs: ${idString})`;
    console.log(`Fetching shows for comparison with IDs: ${idString}`);
    try {
        const response = await apiClient.get('/shows/compare', { params: { ids: idString }, signal: options.signal });
         if (Array.isArray(response?.data)) { return response.data; }
         else { throw new Error("Received invalid comparison data from server."); }
    } catch (error) {
        if (axios.isCancel(error)) { console.log("Comparison fetch cancelled."); throw error; }
        const errorMessage = formatErrorMessage(error, context);
        throw new Error(errorMessage);
    }
 };

/**
 * Fetches autocomplete suggestions for show titles.
 * Returns an array of strings. Returns empty array on error, does not throw.
 */
export const getAutocompleteSuggestions = async (term, options = {}) => {
    if (!term || typeof term !== 'string' || term.trim().length < 1) return []; // Allow 1 char?
    const searchTerm = term.trim();
    const context = `while fetching suggestions for term "${searchTerm}"`;
    console.log(`Fetching suggestions for term: "${searchTerm}"`);
    try {
        const response = await apiClient.get('/suggestions', { params: { term: searchTerm }, signal: options.signal });
        if (Array.isArray(response?.data)) { return response.data; }
        else { console.warn("Received non-array data structure for suggestions:", response?.data); return []; }
    } catch (error) {
        if (axios.isCancel(error)) { console.log("Autocomplete fetch cancelled."); return []; }
        // Format and log error, but return empty array for graceful UI
        formatErrorMessage(error, context);
        return [];
    }
};

/**
 * Fetches all data needed for the homepage in a single request.
 * Returns the homepage data object or throws a formatted error.
 */
export const getHomepageData = async (options = {}) => {
    const context = "while fetching homepage data";
    console.log(">>> Service: getHomepageData called.");
    try {
        const response = await apiClient.get('/homepage-data', { signal: options.signal });
        if (response?.data && typeof response.data === 'object') { return response.data; }
        else { throw new Error("Received invalid homepage data from server."); }
    } catch (error) {
        if (axios.isCancel(error)) { console.log("Homepage data fetch cancelled."); throw error; }
        const errorMessage = formatErrorMessage(error, context);
        throw new Error(errorMessage);
    }
};

/**
 * Fetches the complete list of show IDs and titles for dropdowns.
 * Returns an array of {id, title} objects or throws a formatted error.
 */
export const getShowList = async (options = {}) => {
    const context = "while fetching show list for dropdowns";
    console.log(">>> Service: getShowList called.");
    try {
        const response = await apiClient.get('/show-list', { signal: options.signal });
        if (Array.isArray(response?.data)) { return response.data; }
        else { throw new Error("Received invalid show list data from server."); }
    } catch (error) {
        if (axios.isCancel(error)) { console.log("Show list fetch cancelled."); throw error; }
        const errorMessage = formatErrorMessage(error, context);
        throw new Error(errorMessage);
    }
};