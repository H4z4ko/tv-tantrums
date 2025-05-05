// server/api/homepage.js
const express = require('express');
const { runQuery, getSingleRow, getThemesForShows, attachThemesToShowList } = require('../db/queries');
const router = express.Router();

// GET /api/homepage-data - Fetch data for homepage sections
router.get('/homepage-data', async (req, res) => {
  console.log('>>> API route /homepage-data called');
  try {
    // Define Promises for each section (using specific columns needed by UI)
    const featuredShowPromise = getSingleRow(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level, animation_style
      FROM shows ORDER BY RANDOM() LIMIT 1
    `);
    const popularShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows ORDER BY title LIMIT 4
    `); // Example: Sort by title for "Popular" for now
    const ratedShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE stimulation_score = 5 ORDER BY title LIMIT 4
    `);
    const lowStimShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE stimulation_score <= 2 ORDER BY stimulation_score ASC, title LIMIT 4
    `);
    const highInteractionShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE interactivity_level = 'High' COLLATE NOCASE ORDER BY title LIMIT 4
    `);

    // Execute all promises concurrently
    const [
      featuredShowResult, popularShowsResult, ratedShowsResult, lowStimShowsResult, highInteractionShowsResult
    ] = await Promise.all([
      featuredShowPromise, popularShowsPromise, ratedShowsPromise, lowStimShowsPromise, highInteractionShowsPromise
    ]);

    // Collect all unique show IDs from the results to fetch themes efficiently
    const allShowIds = new Set();
    if (featuredShowResult) allShowIds.add(featuredShowResult.id);
    [...popularShowsResult, ...ratedShowsResult, ...lowStimShowsResult, ...highInteractionShowsResult].forEach(s => s && allShowIds.add(s.id));

    const themesMap = await getThemesForShows(Array.from(allShowIds));

    // Attach themes to each show/list
    const featuredShow = featuredShowResult ? attachThemesToShowList([featuredShowResult], themesMap)[0] : null;
    const popularShows = attachThemesToShowList(popularShowsResult, themesMap);
    const ratedShows = attachThemesToShowList(ratedShowsResult, themesMap);
    const lowStimShows = attachThemesToShowList(lowStimShowsResult, themesMap);
    const highInteractionShows = attachThemesToShowList(highInteractionShowsResult, themesMap);

    const homepageData = { featuredShow, popularShows, ratedShows, lowStimShows, highInteractionShows };

    console.log('>>> Sending homepage data from API');
    res.json(homepageData);
  } catch (error) {
    // Log the specific error on the server
    console.error('Error fetching homepage data:', error); // Log full error
    // Send a generic error response to the client
    res.status(500).json({ error: 'Failed to fetch homepage data. Please try again later.' });
  }
});

// GET /api/show-list - Get only IDs and Titles for dropdowns (e.g., Compare page)
router.get('/show-list', async (req, res) => {
  console.log('>>> API route /show-list called');
  const sql = `SELECT id, title FROM shows ORDER BY title COLLATE NOCASE`;
  try {
    const showList = await runQuery(sql);
    res.json(showList);
  } catch (error) {
    console.error('Error fetching show list:', error); // Log full error
    res.status(500).json({ error: 'Failed to retrieve show list for dropdowns.' });
  }
});

module.exports = router;