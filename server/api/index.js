// server/api/index.js
const express = require('express');
const showsRouter = require('./shows');
const themesRouter = require('./themes');
const suggestionsRouter = require('./suggestions');
const homepageRouter = require('./homepage'); // Contains /homepage-data and /show-list now

console.log("--- Debugging API Index ---");
console.log("Type of showsRouter:", typeof showsRouter);
console.log("Type of themesRouter:", typeof themesRouter);
console.log("Type of suggestionsRouter:", typeof suggestionsRouter);
console.log("Type of homepageRouter:", typeof homepageRouter); // Check the type
console.log("Is homepageRouter a function?", homepageRouter instanceof Function); // Explicit check
console.log("--- End Debugging ---");

const router = express.Router();

// Mount the individual routers
router.use('/shows', showsRouter);         // Handles /api/shows/*
router.use('/themes', themesRouter);       // Handles /api/themes
router.use('/suggestions', suggestionsRouter); // Handles /api/suggestions
// Mount homepageRouter directly as it handles multiple specific endpoints
router.use('/', homepageRouter);           // Handles /api/homepage-data and /api/show-list

// Simple check for the base /api route
router.get('/', (req, res) => {
    res.json({ message: 'Sensory Screen Time Guide API is running!' });
});


module.exports = router; // Export the combined API router