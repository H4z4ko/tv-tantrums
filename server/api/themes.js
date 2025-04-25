// server/api/themes.js
const express = require('express');
const { runQuery } = require('../db/queries'); // Import the database query function
const router = express.Router(); // Create an Express router instance

// Define the handler for GET requests to the root of this router (which will be /api/themes)
router.get('/', async (req, res) => {
    // SQL query to get all theme names, ordered alphabetically (case-insensitive)
    const sql = `SELECT name FROM themes ORDER BY name COLLATE NOCASE`;
    try {
        // Execute the query using our helper function
        const rows = await runQuery(sql);
        // The query returns objects like [{ name: 'Adventure' }, { name: 'Animals' }, ...],
        // so we extract just the 'name' property from each object into a simple array.
        const themeNames = rows.map(row => row.name);
        // Send the array of theme names back as the JSON response
        res.json(themeNames);
    } catch (error) {
        // Log any error that occurs during the database query
        console.error("Error fetching themes:", error.message);
        // Send a generic server error response back to the client
        res.status(500).json({ error: "Failed to retrieve themes." });
    }
});

// Export the router instance so it can be imported and used in server/api/index.js
module.exports = router;