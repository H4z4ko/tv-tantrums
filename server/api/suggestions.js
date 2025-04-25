// server/api/suggestions.js
const express = require('express');
const { runQuery } = require('../db/queries');
const router = express.Router();

// GET /api/suggestions?term=... - Autocomplete suggestions
router.get('/', async (req, res) => {
    const term = req.query.term;

    if (!term || typeof term !== 'string' || term.trim().length < 1) { // Allow 1 char for suggestions
        return res.json([]); // Return empty if term is too short or invalid
    }

    const searchTerm = term.trim() + '%'; // Add wildcard for prefix search
    // Limit suggestions for performance
    const sql = `SELECT DISTINCT title FROM shows WHERE title LIKE ? COLLATE NOCASE ORDER BY title LIMIT 10`;

    try {
        const rows = await runQuery(sql, [searchTerm]);
        const suggestions = rows.map(row => row.title);
        res.json(suggestions);
    } catch (error) {
        console.error(`Error fetching suggestions for term "${term}":`, error.message);
        // Return empty array on error for graceful frontend handling
        res.json([]);
    }
});

module.exports = router;