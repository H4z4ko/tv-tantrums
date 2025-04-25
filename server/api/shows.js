// server/api/shows.js
const express = require('express');
const { runQuery, getSingleRow, getThemesForShows, attachThemesToShowList } = require('../db/queries'); // Import query helpers

const router = express.Router();

// GET /api/shows - List shows with filtering, sorting, pagination
router.get('/', async (req, res) => {
    // --- Extract and Validate Query Parameters ---
    const {
        search, themes, minAge, maxAge, stimScoreMin, stimScoreMax,
        interactivity, dialogue, sceneFreq,
        sortBy = 'title', // Default sort column
        sortOrder = 'asc', // Default sort order
        page = 1, limit = 21
    } = req.query;

    // Ensure page and limit are integers and calculate offset
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 21;
    const offset = (pageNum - 1) * limitNum;

    const validSortOrders = ['asc', 'desc'];
    const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    // Whitelist valid sort columns to prevent SQL injection via sortBy parameter
    const validSortColumns = ['title', 'stimulation_score', 'min_age', 'max_age']; // Add more as needed (e.g., numeric scores)
    const sortColumn = validSortColumns.includes(sortBy.toLowerCase()) ? sortBy.toLowerCase() : 'title';

    // --- Build SQL Query Dynamically ---
    // Base query selects distinct shows to avoid duplicates when joining themes
    // Select specific columns needed for the catalog card display + ID
    let query = `SELECT DISTINCT s.id, s.title, s.stimulation_score, s.target_age_group, s.image_filename, s.interactivity_level FROM shows s`;
    // Base query for counting total matching shows for pagination
    let countQuery = `SELECT COUNT(DISTINCT s.id) as total FROM shows s`;
    let joins = ''; // To store necessary JOIN clauses
    let conditions = []; // To store WHERE conditions
    let queryParams = []; // To store parameters for the main query (prevents SQL injection)
    let countParams = []; // To store parameters for the count query

    // -- Handle Theme Filtering --
    if (themes) {
        const themeList = themes.split(',').map(t => t.trim()).filter(t => t);
        if (themeList.length > 0) {
            // Join necessary tables if filtering by theme
            joins += ` JOIN show_themes st ON s.id = st.show_id JOIN themes t ON st.theme_id = t.id`;
            // Create placeholders (?,?,?) for theme names
            const themePlaceholders = themeList.map(() => '?').join(',');
            // Add condition to check theme names (case-insensitive)
            conditions.push(`t.name IN (${themePlaceholders}) COLLATE NOCASE`);
            queryParams.push(...themeList); // Add themes to params
            // Adjust count query base to include joins when filtering by themes
            countQuery = `
                SELECT COUNT(DISTINCT s.id) as total FROM shows s
                JOIN show_themes st ON s.id = st.show_id
                JOIN themes t ON st.theme_id = t.id`; // Rebuild count query base with joins
        }
    }

    // -- Handle Text Search --
    if (search) {
        // LIKE %search% is less efficient but flexible. Consider FTS for large datasets.
        conditions.push(`s.title LIKE ? COLLATE NOCASE`); // Case-insensitive search
        queryParams.push(`%${search}%`);
    }

    // -- Handle Age Range Filter --
    // This checks for overlaps: filter range overlaps show range
    if (minAge !== undefined && maxAge !== undefined) {
         const minAgeNum = parseInt(minAge, 10);
         const maxAgeNum = parseInt(maxAge, 10);
         // Only apply if both are valid numbers
         if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
             conditions.push(`(
                (s.max_age >= ? AND s.min_age <= ?) OR -- Show range overlaps filter range
                (s.min_age IS NULL OR s.max_age IS NULL)  -- Always include shows with undefined age
             )`);
             // Params: minAgeFilter, maxAgeFilter
             queryParams.push(minAgeNum, maxAgeNum);
         }
    }

    // -- Handle Stimulation Score Range --
    if (stimScoreMin !== undefined) {
        const scoreMin = parseInt(stimScoreMin, 10);
        if (!isNaN(scoreMin)) {
             conditions.push(`s.stimulation_score >= ?`);
             queryParams.push(scoreMin);
        }
    }
    if (stimScoreMax !== undefined) {
         const scoreMax = parseInt(stimScoreMax, 10);
         if (!isNaN(scoreMax)) {
             conditions.push(`s.stimulation_score <= ?`);
             queryParams.push(scoreMax);
         }
    }

    // -- Handle Other Text Filters (Exact Match, Case-Insensitive) --
    if (interactivity) { conditions.push(`s.interactivity_level = ? COLLATE NOCASE`); queryParams.push(interactivity); }
    if (dialogue) { conditions.push(`s.dialogue_intensity = ? COLLATE NOCASE`); queryParams.push(dialogue); }
    if (sceneFreq) { conditions.push(`s.scene_frequency = ? COLLATE NOCASE`); queryParams.push(sceneFreq); }

    // --- Combine Query Parts ---
    // Add joins (important to add before WHERE)
    query += joins;
    countQuery += (countQuery.includes('JOIN') ? '' : joins); // Add joins to count if not already present

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
        // Parameters for count query are the same as the main query up to this point
        countParams = [...queryParams];
    }

    // --- Add Sorting and Pagination to main query ---
    query += ` ORDER BY s.${sortColumn} ${order}, s.title ASC LIMIT ? OFFSET ?`;
    queryParams.push(limitNum, offset); // Add limit and offset to main query params

    try {
        // --- Execute Queries Concurrently ---
        if (queryParams.length > 2 || countParams.length > 0) { // Log if more than just limit/offset or if count has params
            console.log(`Executing Show Query: ${query}`);
            console.log(`Show Query Params:`, queryParams);
            console.log(`Executing Count Query: ${countQuery}`);
            console.log(`Count Query Params:`, countParams);
       }
       
        const [totalResult, showsResult] = await Promise.all([
            getSingleRow(countQuery, countParams), // Fetch total count
            runQuery(query, queryParams) // Fetch shows for the current page
        ]);

        // --- Process Results ---
        const totalShows = totalResult?.total || 0;
        const totalPages = Math.ceil(totalShows / limitNum);

        // Fetch and attach themes for the retrieved shows
        const showIds = showsResult.map(s => s.id);
        const themesMap = await getThemesForShows(showIds);
        const showsWithThemes = attachThemesToShowList(showsResult, themesMap);

        // --- Send Response ---
        res.json({
            shows: showsWithThemes,
            totalShows,
            totalPages,
            currentPage: pageNum,
            limit: limitNum
        });
    } catch (error) {
        console.error("Error in GET /api/shows:", error.message); // Keep essential error logs
        res.status(500).json({ error: "Failed to retrieve shows from database." });
    }
});

// GET /api/shows/title/:title - Get show by exact title
router.get('/title/:title', async (req, res) => {
    const title = decodeURIComponent(req.params.title); // Decode title from URL
    const sql = `SELECT * FROM shows WHERE title = ? COLLATE NOCASE`; // Case-insensitive search
    try {
        const show = await getSingleRow(sql, [title]);
        if (show) {
             const themesMap = await getThemesForShows([show.id]);
             const showWithThemes = attachThemesToShowList([show], themesMap)[0];
             res.json(showWithThemes);
        } else {
            res.status(404).json({ error: `Show with title "${title}" not found.` });
        }
    } catch (error) {
        console.error(`Error fetching show by title "${title}":`, error.message);
        res.status(500).json({ error: "Failed to retrieve show from database." });
    }
});

// GET /api/shows/compare?ids=1,2,3 - Get multiple shows for comparison
router.get('/compare', async (req, res) => {
    const idString = req.query.ids;
    if (!idString) {
        return res.status(400).json({ error: "Missing 'ids' query parameter." });
    }
    // Validate IDs are numbers and sanitize
    const ids = idString.split(',')
                       .map(id => parseInt(id.trim(), 10))
                       .filter(id => !isNaN(id) && id > 0);

    if (ids.length === 0) {
        return res.status(400).json({ error: "No valid IDs provided." });
    }
    if (ids.length > 3) {
         return res.status(400).json({ error: "Cannot compare more than 3 shows." });
    }

    const placeholders = ids.map(() => '?').join(',');
    // Select all columns needed for comparison display
    const sql = `SELECT * FROM shows WHERE id IN (${placeholders})`;

    try {
        const shows = await runQuery(sql, ids);
         if (shows.length === 0) {
            // Return empty array if no shows found matching IDs, not necessarily an error
            return res.json([]);
         }

        // Fetch and attach themes
        const themesMap = await getThemesForShows(ids);
        const showsWithThemes = attachThemesToShowList(shows, themesMap);

        // Ensure order matches input IDs
        const sortedShows = ids.map(id => showsWithThemes.find(s => s.id === id)).filter(Boolean); // Filter out potential undefined if an ID wasn't found

        res.json(sortedShows); // Send back the shows found
    } catch (error) {
        console.error(`Error fetching shows for comparison (IDs: ${ids.join(',')}):`, error.message);
        res.status(500).json({ error: "Failed to retrieve shows for comparison." });
    }
});

// GET /api/shows/:id - Get single show by ID (MUST be last specific route in this file)
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { // Added check for positive ID
        return res.status(400).json({ error: "Invalid show ID provided." });
    }
    // Select all columns needed for the detail page
    const sql = `SELECT * FROM shows WHERE id = ?`;
    try {
        const show = await getSingleRow(sql, [id]);
        if (show) {
             const themesMap = await getThemesForShows([show.id]);
             const showWithThemes = attachThemesToShowList([show], themesMap)[0];
             res.json(showWithThemes);
        } else {
            res.status(404).json({ error: `Show with ID ${id} not found.` });
        }
    } catch (error) {
        console.error(`Error fetching show ID ${id}:`, error.message);
        res.status(500).json({ error: "Failed to retrieve show from database." });
    }
});

module.exports = router; // Export the router