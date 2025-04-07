// client/src/services/showService.js
import axios from 'axios';

// The base URL for our API. Uses the Vite proxy.
const API_BASE_URL = '/api';

/**
 * Fetches a list of shows from the backend API with filtering and pagination.
 * @param {object} filters - An object containing filter parameters.
 * @param {number} page - The current page number.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<object>} API response data (e.g., { shows: [], totalShows: 0, ... })
 */
export const getShows = async (filters = {}, page = 1, limit = 21) => {
    try {
        const params = { ...filters, page, limit };
        const response = await axios.get(`${API_BASE_URL}/shows`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching shows:", error);
        if (error.response) {
            throw new Error(error.response.data.error || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error("No response received from server.");
        } else {
            throw new Error(error.message || "An unknown error occurred while fetching shows.");
        }
    }
};

/**
 * Fetches details for a single show by its ID.
 * @param {number | string} id - The ID of the show.
 * @returns {Promise<object>} The show detail object.
 */
export const getShowById = async (id) => {
     try {
        const response = await axios.get(`${API_BASE_URL}/shows/${id}`);
        return response.data;
    } catch (error) {
         console.error(`Error fetching show with ID ${id}:`, error);
         if (error.response) {
             throw new Error(error.response.data.error || `Server error: ${error.response.status}`);
         } else if (error.request) {
             throw new Error("No response received from server.");
         } else {
             throw new Error(error.message || "An unknown error occurred while fetching show details.");
         }
     }
};

 /**
  * Fetches the list of unique theme names.
  * @returns {Promise<string[]>} An array of theme strings.
  */
 export const getThemes = async () => {
     try {
         const response = await axios.get(`${API_BASE_URL}/themes`);
         return response.data; // Expecting an array of strings
     } catch (error) {
         console.error("Error fetching themes:", error);
         if (error.response) {
             throw new Error(error.response.data.error || `Server error: ${error.response.status}`);
         } else if (error.request) {
             throw new Error("No response received from server.");
         } else {
             throw new Error(error.message || "An unknown error occurred while fetching themes.");
         }
     }
 };

 /**
  * Fetches details for multiple shows based on an array of IDs for comparison.
  * @param {Array<number|string>} ids - An array of show IDs (max 3 recommended).
  * @returns {Promise<Array<object>>} A promise that resolves to an array of show detail objects.
  */
 export const getShowsForComparison = async (ids) => {
    // Ensure IDs is an array and not empty
    if (!Array.isArray(ids) || ids.length === 0) {
        console.warn("getShowsForComparison called with invalid IDs:", ids);
        return []; // Return empty array if no valid IDs
    }
    // Convert IDs to comma-separated string for the query parameter
    const idString = ids.join(',');
    try {
        // Make GET request to /api/shows/compare?ids=1,5,10 (example)
        const response = await axios.get(`${API_BASE_URL}/shows/compare`, {
            params: { ids: idString }
        });
        // The backend should return an array of show objects
        return response.data;
    } catch (error) {
        console.error(`Error fetching shows for comparison with IDs ${idString}:`, error);
        if (error.response) {
            throw new Error(error.response.data.error || `Server error: ${error.response.status}`);
        } else if (error.request) {
            throw new Error("No response received from server for comparison.");
        } else {
            throw new Error(error.message || "An unknown error occurred while fetching shows for comparison.");
        }
    }
 };
