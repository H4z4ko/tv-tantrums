// client/src/services/showService.js
import axios from 'axios';

// The base URL for our API. Uses the Vite proxy.
const API_BASE_URL = '/api';

/**
 * Fetches a list of shows from the backend API with filtering, sorting, and pagination.
 * @param {object} filters - An object containing filter parameters like search, minAge, themes, etc. Can also include sortBy and sortOrder.
 * @param {number} page - The current page number.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<object>} API response data (e.g., { shows: [], totalShows: 0, ... })
 * @throws {Error} Throws an error if the fetch fails.
 */
export const getShows = async (filters = {}, page = 1, limit = 21) => {
    try {
        const params = {
            ...filters,
            page,
            limit
        };
        // Remove null/undefined/empty string values from params
        Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]);

        console.log('Fetching shows with params:', params);
        const response = await axios.get(`${API_BASE_URL}/shows`, { params });
        // Add a check to ensure response.data exists
        if (response && response.data) {
             return response.data;
        } else {
             // This case shouldn't happen often with axios, but good practice
             throw new Error("Received empty response from server.");
        }
    } catch (error) {
       console.error("Error fetching shows in showService:", error);
       let errorMessage = "An unknown error occurred while fetching shows.";
       if (error.response) {
            // Error from backend (e.g., 4xx, 5xx)
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
       } else if (error.request) {
            // No response received
            errorMessage = "No response received from server. Check network or backend.";
       } else {
            // Other errors (e.g., setup)
            errorMessage = error.message || errorMessage;
       }
       // Re-throw the error
       throw new Error(errorMessage);
    }
};

/**
 * Fetches details for a single show by its ID.
 * @param {number | string} id - The ID of the show.
 * @returns {Promise<object>} The show detail object.
 * @throws {Error} Throws an error if the fetch fails.
 */
export const getShowById = async (id) => {
     try {
        console.log(`Workspaceing show by ID: ${id}`);
        const response = await axios.get(`${API_BASE_URL}/shows/${id}`);
        if (response && response.data) {
            return response.data;
        } else {
            throw new Error(`Received empty response when fetching show ID ${id}.`);
        }
    } catch (error) {
         console.error(`Error fetching show with ID ${id}:`, error);
         let errorMessage = `An unknown error occurred while fetching show ID ${id}.`;
         if (error.response) {
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
            // Specifically check for 404
            if (error.response.status === 404) {
                errorMessage = `Show with ID ${id} not found.`;
            }
         } else if (error.request) {
            errorMessage = "No response received from server.";
         } else {
            errorMessage = error.message || errorMessage;
         }
         throw new Error(errorMessage);
     }
};

 /**
  * Fetches details for a single show by its exact title.
  * @param {string} title - The exact title of the show.
  * @returns {Promise<object>} The show detail object.
  * @throws {Error} Throws an error if the fetch fails or title is invalid.
  */
 export const getShowByTitle = async (title) => {
     if (!title || typeof title !== 'string' || title.trim().length === 0) {
          console.error("getShowByTitle called with invalid title:", title);
          throw new Error("Invalid title provided to getShowByTitle.");
     }
     const encodedTitle = encodeURIComponent(title.trim());
     console.log(`Workspaceing show by title: ${title}, Encoded: ${encodedTitle}`);
     try {
         const response = await axios.get(`${API_BASE_URL}/shows/title/${encodedTitle}`);
          if (response && response.data) {
            return response.data;
        } else {
            throw new Error(`Received empty response when fetching show title "${title}".`);
        }
     } catch (error) {
         console.error(`Error fetching show with title "${title}":`, error);
          let errorMessage = `An unknown error occurred while fetching show title "${title}".`;
         if (error.response) {
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
            // Specifically handle 404 from the backend
             if (error.response.status === 404) {
                  errorMessage = `Show with title "${title}" not found.`;
             }
         } else if (error.request) {
            errorMessage = "No response received from server.";
         } else {
            errorMessage = error.message || errorMessage;
         }
         throw new Error(errorMessage);
     }
 };


 /**
  * Fetches the list of unique theme names.
  * @returns {Promise<string[]>} An array of theme strings.
  * @throws {Error} Throws an error if the fetch fails.
  */
 export const getThemes = async () => {
     try {
        console.log("Fetching themes");
         const response = await axios.get(`${API_BASE_URL}/themes`);
         // Ensure data is an array, even if backend sends null/undefined
         return Array.isArray(response?.data) ? response.data : [];
     } catch (error) {
         console.error("Error fetching themes:", error);
          let errorMessage = "An unknown error occurred while fetching themes.";
         if (error.response) {
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
         } else if (error.request) {
            errorMessage = "No response received from server.";
         } else {
            errorMessage = error.message || errorMessage;
         }
         throw new Error(errorMessage);
     }
 };

 /**
  * Fetches details for multiple shows based on an array of IDs for comparison.
  * @param {Array<number|string>} ids - An array of show IDs (max 3 recommended).
  * @returns {Promise<Array<object>>} A promise that resolves to an array of show detail objects.
  * @throws {Error} Throws an error if the fetch fails or IDs are invalid.
  */
 export const getShowsForComparison = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 3) { // Added check for > 3
        console.warn("getShowsForComparison called with invalid IDs:", ids);
         // Consider throwing an error instead of returning empty array for clearer feedback
        throw new Error(`Invalid or too many IDs provided for comparison (received ${ids?.length || 0}, max 3).`);
    }

    const validIds = ids.map(id => String(id).trim()).filter(id => id); // Ensure strings, trim, filter empty
    if (validIds.length === 0) {
         throw new Error("No valid IDs provided after cleaning.");
    }

    const idString = validIds.join(',');
    console.log(`Workspaceing shows for comparison with IDs: ${idString}`);
    try {
        const response = await axios.get(`${API_BASE_URL}/shows/compare`, {
            params: { ids: idString }
        });
        // Ensure data is an array
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        console.error(`Error fetching shows for comparison with IDs ${idString}:`, error);
        let errorMessage = `An unknown error occurred while fetching shows for comparison.`;
         if (error.response) {
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
         } else if (error.request) {
            errorMessage = "No response received from server for comparison.";
         } else {
            errorMessage = error.message || errorMessage;
         }
        throw new Error(errorMessage);
    }
 };

/**
 * Fetches autocomplete suggestions for show titles.
 * @param {string} term - The partial search term entered by the user.
 * @returns {Promise<string[]>} A promise that resolves to an array of suggestion strings.
 * (Returns empty array on error or invalid term)
 */
export const getAutocompleteSuggestions = async (term) => {
    if (!term || typeof term !== 'string' || term.trim().length < 2) {
        // console.log("Autocomplete term too short, returning empty array.");
        return []; // Return empty array immediately, no error needed
    }

    const searchTerm = term.trim();
    console.log(`Workspaceing suggestions for term: "${searchTerm}"`);

    try {
        const response = await axios.get(`${API_BASE_URL}/suggestions`, {
            params: { term: searchTerm }
        });
        // Ensure data is an array
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        // Log the error but return empty array for graceful UI handling
        console.error(`Error fetching suggestions for "${searchTerm}":`, error.message);
        return [];
    }
};

/**
 * Fetches all data needed for the homepage in a single request.
 * @returns {Promise<object>} Object containing featuredShow, popularShows, ratedShows, etc.
 * @throws {Error} Throws an error if the fetch fails.
 */
export const getHomepageData = async () => {
    console.log(">>> Service: getHomepageData called."); // Keep log
    try {
        const response = await axios.get(`${API_BASE_URL}/homepage-data`);
        if (response && response.data) {
            return response.data;
        } else {
            throw new Error("Received empty response from server for homepage data.");
        }
    } catch (error) {
        console.error("Error fetching homepage data in showService:", error);
         let errorMessage = "An unknown error occurred while fetching homepage data.";
         if (error.response) {
            errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
         } else if (error.request) {
            errorMessage = "No response received from server for homepage data.";
         } else {
            errorMessage = error.message || errorMessage;
         }
        throw new Error(errorMessage);
    }
};