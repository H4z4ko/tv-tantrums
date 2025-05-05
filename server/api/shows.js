// server/api/shows.js
const express = require('express');
const { runQuery, getSingleRow, getThemesForShows, attachThemesToShowList } = require('../db/queries'); // Import query helpers

const router = express.Router();

// GET /api/shows - List shows with filtering, sorting, pagination
router.get('/', async (req, res) => {
    console.log(`>>> API route /shows called with query:`, req.query);
    const {
        search, themes, minAge, maxAge, stimScoreMin, stimScoreMax,
        interactivity, dialogue, sceneFreq,
        sortBy = 'title', sortOrder = 'asc', page = 1, limit = 12 // Default limit changed
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12; // Use updated default
    const offset = (pageNum - 1) * limitNum;

    const validSortOrders = ['asc', 'desc'];
    const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    // Whitelist valid sort columns more carefully
    const validSortColumns = ['title', 'stimulation_score', 'min_age', 'max_age']; // Add more as needed
    const sortColumn = validSortColumns.includes(sortBy.toLowerCase()) ? sortBy.toLowerCase() : 'title';

    // --- Build SQL Query ---
    let queryBase = `SELECT DISTINCT s.id, s.title, s.stimulation_score, s.target_age_group, s.image_filename, s.interactivity_level FROM shows s`;
    let countBase = `SELECT COUNT(DISTINCT s.id) as total FROM shows s`;
    let joins = '';
    let conditions = [];
    let queryParams = [];
    let countParams = [];

    // Theme Filtering
    if (themes) {
        const themeList = themes.split(',').map(t => t.trim()).filter(t => t);
        if (themeList.length > 0) {
            joins += ` JOIN show_themes st ON s.id = st.show_id JOIN themes t ON st.theme_id = t.id`;
            const themePlaceholders = themeList.map(() => '?').join(',');
            conditions.push(`t.name IN (${themePlaceholders}) COLLATE NOCASE`);
            queryParams.push(...themeList);
        }
    }

    // Text Search (Title)
    if (search) {
        conditions.push(`s.title LIKE ? COLLATE NOCASE`);
        queryParams.push(`%${search}%`);
    }

    // Age Range Filter (Overlap Logic)
    if (minAge !== undefined && maxAge !== undefined) {
         const minAgeNum = parseInt(minAge, 10); const maxAgeNum = parseInt(maxAge, 10);
         if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
             conditions.push(`( (s.max_age >= ? AND s.min_age <= ?) OR (s.min_age IS NULL OR s.max_age IS NULL) )`);
             queryParams.push(minAgeNum, maxAgeNum);
         }
    }

    // Stimulation Score Range
    if (stimScoreMin !== undefined) { const scoreMin = parseInt(stimScoreMin, 10); if (!isNaN(scoreMin)) { conditions.push(`s.stimulation_score >= ?`); queryParams.push(scoreMin); } }
    if (stimScoreMax !== undefined) { const scoreMax = parseInt(stimScoreMax, 10); if (!isNaN(scoreMax)) { conditions.push(`s.stimulation_score <= ?`); queryParams.push(scoreMax); } }

    // Other Text Filters (Exact Match, Case-Insensitive)
    if (interactivity) { conditions.push(`s.interactivity_level = ? COLLATE NOCASE`); queryParams.push(interactivity); }
    if (dialogue) { conditions.push(`s.dialogue_intensity = ? COLLATE NOCASE`); queryParams.push(dialogue); }
    if (sceneFreq) { conditions.push(`s.scene_frequency = ? COLLATE NOCASE`); queryParams.push(sceneFreq); }

    // --- Combine Query Parts ---
    let query = queryBase + joins;
    let countQuery = countBase + joins; // Apply joins to count query base as well

    if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
        countParams = [...queryParams]; // Count params match main query params up to WHERE
    }

    // Add Sorting and Pagination to main query
    query += ` ORDER BY s.${sortColumn} ${order}, s.title ASC LIMIT ? OFFSET ?`;
    queryParams.push(limitNum, offset);

    // --- Execute Queries ---
    try {
        console.log(`Executing Show Query: ${query}`); console.log(`Params:`, queryParams);
        console.log(`Executing Count Query: ${countQuery}`); console.log(`Params:`, countParams);

        const [totalResult, showsResult] = await Promise.all([
            getSingleRow(countQuery, countParams),
            runQuery(query, queryParams)
        ]);

        const totalShows = totalResult?.total || 0;
        const totalPages = Math.ceil(totalShows / limitNum);

        // Fetch and attach themes for the current page's shows
        const showIds = showsResult.map(s => s.id);
        const themesMap = await getThemesForShows(showIds);
        const showsWithThemes = attachThemesToShowList(showsResult, themesMap);

        res.json({ shows: showsWithThemes, totalShows, totalPages, currentPage: pageNum, limit: limitNum });
    } catch (error) {
        console.error(`Error in GET /shows:`, error);
        res.status(500).json({ error: "Failed to retrieve shows. Please try again later." });
    }
});

// GET /api/shows/title/:title - Get show by exact title (Case-Insensitive)
router.get('/title/:title', async (req, res) => {
    const title = decodeURIComponent(req.params.title);
    console.log(`>>> API route /shows/title/:title called with title: ${title}`);
    const sql = `SELECT * FROM shows WHERE title = ? COLLATE NOCASE`;
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
        console.error(`Error in GET /shows/title/${title}:`, error);
        res.status(500).json({ error: "Failed to retrieve show by title." });
    }
});

// GET /api/shows/compare?ids=1,2,3 - Get multiple shows for comparison
router.get('/compare', async (req, res) => {
    const idString = req.query.ids;
    console.log(`>>> API route /shows/compare called with IDs: ${idString}`);
    if (!idString) return res.status(400).json({ error: "Missing 'ids' query parameter." });

    const ids = idString.split(',')
                       .map(id => parseInt(id.trim(), 10))
                       .filter(id => !isNaN(id) && id > 0);

    if (ids.length === 0) return res.status(400).json({ error: "No valid IDs provided." });
    if (ids.length > 3) return res.status(400).json({ error: "Cannot compare more than 3 shows." });

    const placeholders = ids.map(() => '?').join(',');
    // Select all columns needed for comparison display, including numeric scores for charts
    const sql = `SELECT * FROM shows WHERE id IN (${placeholders})`;

    try {
        const shows = await runQuery(sql, ids);
         if (shows.length === 0) return res.json([]); // Return empty array if no shows found

        const themesMap = await getThemesForShows(ids);
        const showsWithThemes = attachThemesToShowList(shows, themesMap);
        // Ensure order matches input IDs
        const sortedShows = ids.map(id => showsWithThemes.find(s => s.id === id)).filter(Boolean);

        res.json(sortedShows);
    } catch (error) {
        console.error(`Error fetching shows for comparison (IDs: ${ids.join(',')}):`, error);
        res.status(500).json({ error: "Failed to retrieve shows for comparison." });
    }
});

// GET /api/shows/:id - Get single show by ID (MUST be last specific route)
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    console.log(`>>> API route /shows/:id called with ID: ${id}`);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: "Invalid show ID provided." });

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
        console.error(`Error fetching show ID ${id}:`, error);
        res.status(500).json({ error: "Failed to retrieve show details." });
    }
});

module.exports = router;