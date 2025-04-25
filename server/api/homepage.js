// server/api/homepage.js
const express = require('express');
const { runQuery, getSingleRow, getThemesForShows, attachThemesToShowList } = require('../db/queries');
const router = express.Router();

// GET /api/homepage-data - Fetch data for homepage sections
router.get('/homepage-data', async (req, res) => {
  console.log('>>> API route /homepage-data called');
  try {
    // Define Promises for each section
    const featuredShowPromise = getSingleRow(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level, animation_style
      FROM shows ORDER BY RANDOM() LIMIT 1
    `);
    const popularShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows ORDER BY stimulation_score DESC, title LIMIT 5
    `);
    const ratedShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE stimulation_score = 5 ORDER BY title LIMIT 5
    `);
    const lowStimShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE stimulation_score <= 2 ORDER BY stimulation_score ASC, title LIMIT 5
    `);
    const highInteractionShowsPromise = runQuery(`
      SELECT id, title, stimulation_score, target_age_group, image_filename, interactivity_level
      FROM shows WHERE interactivity_level = 'High' COLLATE NOCASE ORDER BY title LIMIT 5
    `);

    // Execute all promises concurrently
    const [
      featuredShowResult,
      popularShowsResult,
      ratedShowsResult,
      lowStimShowsResult,
      highInteractionShowsResult
    ] = await Promise.all([
      featuredShowPromise,
      popularShowsPromise,
      ratedShowsPromise,
      lowStimShowsPromise,
      highInteractionShowsPromise
    ]);

    // Combine all fetched show IDs to fetch themes
    const allShowIds = new Set();
    if (featuredShowResult) allShowIds.add(featuredShowResult.id);
    popularShowsResult.forEach((s) => allShowIds.add(s.id));
    ratedShowsResult.forEach((s) => allShowIds.add(s.id));
    lowStimShowsResult.forEach((s) => allShowIds.add(s.id));
    highInteractionShowsResult.forEach((s) => allShowIds.add(s.id));

    const themesMap = await getThemesForShows(Array.from(allShowIds));

    // Attach themes
    const featuredShow = featuredShowResult
      ? attachThemesToShowList([featuredShowResult], themesMap)[0]
      : null;
    const popularShows = attachThemesToShowList(popularShowsResult, themesMap);
    const ratedShows = attachThemesToShowList(ratedShowsResult, themesMap);
    const lowStimShows = attachThemesToShowList(lowStimShowsResult, themesMap);
    const highInteractionShows = attachThemesToShowList(highInteractionShowsResult, themesMap);

    const homepageData = {
      featuredShow,
      popularShows,
      ratedShows,
      lowStimShows,
      highInteractionShows
    };

    console.log('>>> Sending homepage data from API');
    res.json(homepageData);
  } catch (error) {
    console.error('Error fetching homepage data:', error.message);
    res.status(500).json({ error: 'Failed to fetch homepage data from database' });
  }
});

// GET /api/show-list - Get only IDs and Titles for dropdowns
router.get('/show-list', async (req, res) => {
  console.log('>>> API route /show-list called');
  const sql = `SELECT id, title FROM shows ORDER BY title COLLATE NOCASE`;
  try {
    const showList = await runQuery(sql);
    res.json(showList);
  } catch (error) {
    console.error('Error fetching show list:', error.message);
    res.status(500).json({ error: 'Failed to retrieve show list.' });
  }
});

console.log(">>> homepage.js: Exporting router object:", typeof router, router instanceof Function);

module.exports = router; // Export the router instance
