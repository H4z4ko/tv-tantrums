// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Database Connection ---
const dbPath = path.resolve(__dirname, 'database', 'shows.db');
let db;

function connectDatabase() {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error("Error connecting to the database:", err.message);
            console.error("Retrying connection in 5 seconds...");
            setTimeout(connectDatabase, 5000);
        } else {
            console.log("Successfully connected to the database.");
        }
    });
    db.on('error', (err) => {
        console.error('Database error:', err.message);
    });
}
connectDatabase();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    // CORRECT PLACEMENT FOR THE LOG: Inside the function
    console.log(`>>> Server received request: ${req.method} ${req.originalUrl}`); 
  
    // Existing DB Check Logic
    if (!db || !db.open) { 
       console.error('Database not connected. Attempting to reconnect...');
        connectDatabase();
        setTimeout(() => {
            if (!db || !db.open) {
                console.error('Reconnection failed.');
                return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
            } else {
                console.log('Reconnection successful.');
                next();
            }
        }, 100); 
    } else {
        next(); 
    }
  });
app.use((req, res, next) => {
  if (!db || !db.open) {
     console.error('Database not connected. Attempting to reconnect...');
      connectDatabase();
      setTimeout(() => {
          if (!db || !db.open) {
              console.error('Reconnection failed.');
              return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
          } else {
              console.log('Reconnection successful.');
              next();
          }
      }, 100);
  } else {
      next();
  }
});


// --- Helper Function for DB Queries (returns a Promise) ---
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        // Use db.all for queries that can return multiple rows
        db.all(sql, params, (err, rows) => {
            if (err) {
                 console.error("DB Query Error:", err.message, "SQL:", sql, "Params:", params);
                 reject(err);
            } else {
                 // Parse themes for each row
                 rows.forEach(row => {
                    try {
                        if (row.themes && typeof row.themes === 'string') {
                            row.themes = JSON.parse(row.themes);
                        } else if (!row.themes) {
                             row.themes = [];
                         }
                    } catch (e) {
                         console.error(`Error parsing themes in runQuery for row ID ${row.id || '(unknown)'}:`, e);
                         row.themes = [];
                     }
                 });
                resolve(rows);
            }
        });
    });
}

function getSingleRow(sql, params = []) {
     return new Promise((resolve, reject) => {
         db.get(sql, params, (err, row) => {
            if (err) {
                 console.error("DB Get Error:", err.message, "SQL:", sql, "Params:", params);
                 reject(err);
             } else {
                 // Parse themes if the row exists and has themes
                if (row) {
                    try {
                        if (row.themes && typeof row.themes === 'string') {
                            row.themes = JSON.parse(row.themes);
                        } else if (!row.themes) {
                             row.themes = [];
                         }
                    } catch (e) {
                         console.error(`Error parsing themes in getSingleRow for row ID ${row.id || '(unknown)'}:`, e);
                         row.themes = [];
                     }
                 }
                 resolve(row || null); // Resolve with row or null if not found
             }
         });
     });
 }


// --- API Routes ---

// Basic test route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the Sensory Friendly Shows API!' });
});

// NEW: Bundled Homepage Data Endpoint
app.get('/api/homepage-data', async (req, res) => {
    console.log("Fetching bundled homepage data...");
    const FEATURED_SHOW_TITLE = "Puffin Rock"; // Make sure this title exists
    const ROW_LIMIT = 6;

    try {
        const [
            featuredShow,
            popularShows, // Using title sort as placeholder for actual popularity
            ratedShows,
            lowStimShows,
            highInteractionShows
        ] = await Promise.all([
            // Query for Featured Show by Title
             getSingleRow(`SELECT * FROM shows WHERE LOWER(title) = LOWER(?)`, [FEATURED_SHOW_TITLE]),
            // Query for Popular Shows (Placeholder: alphabetical)
             runQuery(`SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows ORDER BY title ASC LIMIT ?`, [ROW_LIMIT]),
            // Query for Top-Rated Shows
             runQuery(`SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows ORDER BY stimulation_score DESC LIMIT ?`, [ROW_LIMIT]),
            // Query for Low Stimulation Shows
             runQuery(`SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows WHERE stimulation_score <= ? ORDER BY title ASC LIMIT ?`, [1, ROW_LIMIT]),
            // Query for High Interaction Shows
             runQuery(`SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows WHERE LOWER(interactivity_level) = LOWER(?) ORDER BY title ASC LIMIT ?`, ['High', ROW_LIMIT])
        ]);

        res.json({
            featuredShow: featuredShow || null, // Ensure it's null if not found
            popularShows: popularShows || [],
            ratedShows: ratedShows || [],
            lowStimShows: lowStimShows || [],
            highInteractionShows: highInteractionShows || []
        });

    } catch (error) {
        console.error("Error fetching homepage data:", error.message);
        res.status(500).json({ error: "Failed to fetch homepage data" });
    }
});


// Endpoint to get all unique themes (Keep this)
app.get('/api/themes', (req, res) => {
    const sql = `SELECT DISTINCT themes FROM shows`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching themes:", err.message);
            return res.status(500).json({ error: 'Failed to fetch themes' });
        }
        const allThemes = new Set();
        rows.forEach(row => {
             if (!row || !row.themes) return;
            try {
                if (typeof row.themes === 'string' && row.themes.trim().length > 0) {
                    const themesArray = JSON.parse(row.themes);
                     if (Array.isArray(themesArray)) {
                        themesArray.forEach(theme => {
                             if (typeof theme === 'string' && theme.trim()) {
                                 allThemes.add(theme.trim());
                            }
                        });
                     }
                }
            } catch (e) {
                console.error(`Error parsing themes JSON: "${row.themes}". Error: ${e.message}`);
            }
        });
        const sortedThemes = Array.from(allThemes).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
         res.json(sortedThemes);
    });
});

// Endpoint to get shows with filtering, sorting, and pagination (Keep this for Catalog page)
app.get('/api/shows', (req, res) => {
    // ... existing code for this route ...
     const {
        search = '', minAge, maxAge, themes, interactivity, dialogue, sceneFreq,
        stimScoreMin = 1, stimScoreMax = 5,
        sortBy = 'title', sortOrder = 'ASC', limit = 21, page = 1
    } = req.query;

    const allowedSortBy = ['title', 'stimulation_score'];
    const validSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'title';
    const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const validPage = !isNaN(pageInt) && pageInt > 0 ? pageInt : 1;
    const validLimit = !isNaN(limitInt) && limitInt > 0 ? limitInt : 21;
    const offset = (validPage - 1) * validLimit;

    let baseSql = `SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows`; 
    let countSqlBase = `SELECT COUNT(*) as count FROM shows`;
    let whereClauses = ['1=1'];
    const params = [];

     if (search) { whereClauses.push(`LOWER(title) LIKE LOWER(?)`); params.push(`%${search}%`); }
     if (minAge !== undefined && maxAge !== undefined) {
        const userMin = parseInt(minAge, 10); const userMax = parseInt(maxAge, 10);
         if (!isNaN(userMin) && !isNaN(userMax)) { whereClauses.push(`(min_age <= ? AND max_age >= ?)`); params.push(userMax, userMin); }
         else { console.warn(`Invalid age filter values received: minAge=${minAge}, maxAge=${maxAge}`); }
    }
    const stimMin = parseInt(stimScoreMin, 10); const stimMax = parseInt(stimScoreMax, 10);
     if (!isNaN(stimMin) && !isNaN(stimMax) && stimMin >= 1 && stimMax <= 5) { whereClauses.push(`stimulation_score BETWEEN ? AND ?`); params.push(stimMin, stimMax); }
     if (themes) {
         const selectedThemes = themes.split(',').map(t => t.trim()).filter(t => t && typeof t === 'string');
         if (selectedThemes.length > 0) {
             const themeConditions = selectedThemes.map(theme => { params.push(`%"${theme}"%`); return `themes LIKE ?`; }).join(' OR ');
             whereClauses.push(`(${themeConditions})`);
         }
     }
    if (interactivity) { whereClauses.push(`interactivity_level = ?`); params.push(interactivity); }
    if (dialogue) { whereClauses.push(`dialogue_intensity = ?`); params.push(dialogue); }
    if (sceneFreq) { whereClauses.push(`scene_frequency = ?`); params.push(sceneFreq); }

    const whereSql = ` WHERE ${whereClauses.join(' AND ')}`;
    const orderBySql = ` ORDER BY ${validSortBy} ${validSortOrder}`;
    const fullSql = `${baseSql}${whereSql}${orderBySql} LIMIT ? OFFSET ?`;
    const countSql = `${countSqlBase}${whereSql}`;
    const fullParams = [...params, validLimit, offset];

    Promise.all([ runQuery(fullSql, fullParams), getSingleRow(countSql, params) ])
     .then(([shows, countRow]) => {
         const totalShows = countRow ? countRow.count : 0;
         const totalPages = Math.ceil(totalShows / validLimit);
         res.json({ shows, totalShows, currentPage: validPage, totalPages });
     }).catch(errorInfo => {
         // Error handling logic slightly improved in runQuery/getSingleRow
         res.status(500).json({ error: `Failed to fetch shows or count` });
     });
});

// Endpoint to get autocomplete suggestions (Keep this)
app.get('/api/suggestions', (req, res) => {
    // ... existing code ...
     const { term } = req.query;
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
        return res.json([]);
    }
    const searchTerm = term.trim();
    const sql = `SELECT DISTINCT title FROM shows WHERE LOWER(title) LIKE LOWER(?) ORDER BY title ASC LIMIT 10`;
    const params = [`${searchTerm}%`];
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching suggestions:", err.message);
            return res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
        const suggestions = rows.map(row => row.title);
        res.json(suggestions);
    });
});

// Endpoint to get a single show by title (Keep this)
app.get('/api/shows/title/:title', async (req, res) => {
     const title = decodeURIComponent(req.params.title); 
     if (!title) { return res.status(400).json({ error: 'No title provided.' }); }
     console.log(`Fetching show by title: "${title}"`);
     const sql = `SELECT * FROM shows WHERE LOWER(title) = LOWER(?)`;
     try {
         const row = await getSingleRow(sql, [title]);
         if (row) {
             res.json(row);
         } else {
             res.status(404).json({ error: `Show with title "${title}" not found` });
         }
     } catch (err) {
         res.status(500).json({ error: `Failed to fetch show "${title}"` });
     }
});

// Endpoint for Comparison Tool (Keep this)
app.get('/api/shows/compare', (req, res) => {
    // ... existing code ...
      const { ids } = req.query;
    if (!ids || typeof ids !== 'string') { return res.status(400).json({ error: 'No show IDs string provided for comparison.' }); }
    const idArray = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0).slice(0, 3);
    if (idArray.length === 0) { return res.status(400).json({ error: 'Invalid or no valid show IDs provided after parsing.' }); }
    const placeholders = idArray.map(() => '?').join(',');
    const sql = `SELECT id, title, stimulation_score, target_age_group, themes, image_filename, platform, avg_episode_length, interactivity_level, dialogue_intensity, scene_frequency, sound_effects_level, total_music_level, dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num FROM shows WHERE id IN (${placeholders})`;
    runQuery(sql, idArray)
        .then(rows => {
            const sortedRows = idArray.map(id => rows.find(row => row.id === id)).filter(Boolean);
            res.json(sortedRows);
        })
        .catch(err => {
             res.status(500).json({ error: 'Failed to fetch shows for comparison' });
         });
});

// Endpoint to get details for a single show by ID (Keep this)
app.get('/api/shows/:id', async (req, res) => {
    // ... existing code using getSingleRow ...
    const { id } = req.params;
    const showId = parseInt(id, 10);
    if (isNaN(showId)) { return res.status(400).json({ error: 'Invalid show ID provided.' }); }
    const sql = `SELECT * FROM shows WHERE id = ?`;
     try {
         const row = await getSingleRow(sql, [showId]);
         if (row) {
             res.json(row);
         } else {
             res.status(404).json({ error: `Show with ID ${showId} not found` });
         }
     } catch (err) {
         res.status(500).json({ error: `Failed to fetch show ${showId}` });
     }
});


// --- Catch-all & Error Handling ---
app.use('/api', (req, res, next) => {
    if (!res.headersSent) {
       res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    }
});
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Something went wrong on the server!' });
    }
});

// --- Server Start & Shutdown ---
const server = app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
process.on('SIGINT', () => { /* ... existing shutdown code ... */ 
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
         if (db && db.open) {
            db.close((err) => {
                if (err) { console.error('Error closing database:', err.message); }
                else { console.log('Database connection closed.'); }
                process.exit(0);
            });
         } else { process.exit(0); }
    });
});
process.on('SIGTERM', () => { /* ... existing shutdown code ... */ 
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
         if (db && db.open) {
             db.close((err) => {
                 if (err) { console.error('Error closing database:', err.message); }
                 else { console.log('Database connection closed.'); }
                process.exit(0);
            });
        } else { process.exit(0); }
    });
});