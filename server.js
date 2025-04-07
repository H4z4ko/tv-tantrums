// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001; // Use environment variable or default

// --- Database Connection ---
const dbPath = path.resolve(__dirname, 'database', 'shows.db');
let db; // Declare db variable

// Function to connect to the database
function connectDatabase() {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { // Open in read-only mode for API
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

// Initial connection attempt
connectDatabase();


// --- Middleware ---
app.use(cors());
app.use(express.json());

// Middleware to check DB connection before handling requests
app.use((req, res, next) => {
  if (!db || !db.open) { // Use !db.open which is more reliable
     console.error('Database not connected. Attempting to reconnect...');
      connectDatabase();
      // Give it a moment, then check again or return error immediately
      setTimeout(() => {
          if (!db || !db.open) {
              console.error('Reconnection failed.');
              return res.status(503).json({ error: 'Database service unavailable. Please try again shortly.' });
          } else {
              console.log('Reconnection successful.');
              next();
          }
      }, 100); // Wait 100ms for reconnect attempt
  } else {
      next(); // Proceed to the route handler if connected
  }
});


// --- API Routes ---

// Basic test route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the Sensory Friendly Shows API!' });
});

// Endpoint to get all unique themes
app.get('/api/themes', (req, res) => {
    const sql = `SELECT DISTINCT themes FROM shows`; // Query distinct JSON strings
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching themes:", err.message);
            res.status(500).json({ error: 'Failed to fetch themes' });
            return;
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


// Endpoint to get shows with filtering and pagination
app.get('/api/shows', (req, res) => {
    // Destructure query parameters with defaults
    const {
        search = '', minAge, maxAge, themes, interactivity, dialogue, sceneFreq,
        stimScoreMin = 1, stimScoreMax = 5, limit = 21, page = 1
    } = req.query;

    const offset = (page - 1) * limit;
    let baseSql = `SELECT id, title, stimulation_score, target_age_group, themes, image_filename FROM shows`;
    let countSqlBase = `SELECT COUNT(*) as count FROM shows`;
    let whereClauses = ['1=1'];
    const params = [];

    // --- Build WHERE Clauses ---
    if (search) {
        whereClauses.push(`LOWER(title) LIKE LOWER(?)`);
        params.push(`%${search}%`);
    }
     if (minAge !== undefined && maxAge !== undefined) {
        const userMin = parseInt(minAge, 10);
        const userMax = parseInt(maxAge, 10);
        if (!isNaN(userMin) && !isNaN(userMax)) {
             whereClauses.push(`(min_age <= ? AND max_age >= ?)`);
             params.push(userMax, userMin);
        } else {
            console.warn(`Invalid age filter values received: minAge=${minAge}, maxAge=${maxAge}`);
        }
    }
    const stimMin = parseInt(stimScoreMin, 10);
    const stimMax = parseInt(stimScoreMax, 10);
     if (!isNaN(stimMin) && !isNaN(stimMax) && stimMin >= 1 && stimMax <= 5) {
         whereClauses.push(`stimulation_score BETWEEN ? AND ?`);
         params.push(stimMin, stimMax);
     }
    if (themes) {
        const selectedThemes = themes.split(',')
                                   .map(t => t.trim())
                                   .filter(t => t && typeof t === 'string');
        if (selectedThemes.length > 0) {
             selectedThemes.forEach(theme => {
                 const safeTheme = theme.replace(/[%_]/g, '\\$&');
                 whereClauses.push(`themes LIKE ?`);
                params.push(`%"${safeTheme}"%`);
             });
        }
    }
    if (interactivity) { whereClauses.push(`interactivity_level = ?`); params.push(interactivity); }
    if (dialogue) { whereClauses.push(`dialogue_intensity = ?`); params.push(dialogue); }
    if (sceneFreq) { whereClauses.push(`scene_frequency = ?`); params.push(sceneFreq); }

    // --- Combine SQL parts ---
    const whereSql = ` WHERE ${whereClauses.join(' AND ')}`;
    const fullSql = `${baseSql}${whereSql} ORDER BY title ASC LIMIT ? OFFSET ?`;
    const countSql = `${countSqlBase}${whereSql}`;
    const fullParams = [...params, limit, offset];

    // --- Execute Queries ---
    Promise.all([
        new Promise((resolve, reject) => {
            db.all(fullSql, fullParams, (err, rows) => {
                if (err) reject({ query: 'shows', error: err, sql: fullSql, params: fullParams });
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(countSql, params, (err, row) => {
                if (err) reject({ query: 'count', error: err, sql: countSql, params: params });
                else resolve(row ? row.count : 0);
            });
        })
    ]).then(([shows, totalShows]) => {
        shows.forEach(show => {
            try { show.themes = JSON.parse(show.themes || '[]'); }
            catch (e) { console.error(`Error parsing themes for show ID ${show.id} in list view:`, e); show.themes = []; }
        });
        const totalPages = Math.ceil(totalShows / limit);
        res.json({ shows, totalShows, currentPage: parseInt(page, 10), totalPages });
    }).catch(errorInfo => {
         console.error(`Error fetching ${errorInfo.query}:`, errorInfo.error.message);
         console.error("SQL:", errorInfo.sql); console.error("Params:", errorInfo.params);
         res.status(500).json({ error: `Failed to fetch ${errorInfo.query}` });
    });
});

// ==================================================
//          *** ROUTE ORDER FIX ***
// Define the more specific '/api/shows/compare' route BEFORE the general '/api/shows/:id' route.
// ==================================================

// Endpoint for Comparison Tool
app.get('/api/shows/compare', (req, res) => {
    const { ids } = req.query; // Expecting comma-separated IDs: "1,5,12"
    if (!ids || typeof ids !== 'string') {
        // Use a distinct error message here
        return res.status(400).json({ error: 'No show IDs string provided for comparison.' });
    }

    const idArray = ids.split(',')
                      .map(id => parseInt(id.trim(), 10))
                      .filter(id => !isNaN(id) && id > 0)
                      .slice(0, 3); // Limit to max 3 IDs

    if (idArray.length === 0) {
        // Use the specific error message for invalid/no valid IDs
        return res.status(400).json({ error: 'Invalid or no valid show IDs provided after parsing.' });
    }

    const placeholders = idArray.map(() => '?').join(',');
    const sql = `SELECT id, title, stimulation_score, target_age_group, themes, image_filename,
                        dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num
                 FROM shows WHERE id IN (${placeholders})`;

    db.all(sql, idArray, (err, rows) => {
        if (err) {
            console.error("Error fetching shows for comparison:", err.message);
            res.status(500).json({ error: 'Failed to fetch shows for comparison' });
            return;
        }
         rows.forEach(row => {
             try {
                 if (typeof row.themes === 'string' && row.themes.trim().length > 0) { row.themes = JSON.parse(row.themes); }
                 else { row.themes = []; }
             } catch (e) { console.error(`Error parsing themes for comparison show ID ${row.id}:`, e); row.themes = []; }
         });
        const sortedRows = idArray.map(id => rows.find(row => row.id === id)).filter(Boolean);
        res.json(sortedRows);
    });
});


// Endpoint to get details for a single show by ID
// ** This now comes AFTER /api/shows/compare **
app.get('/api/shows/:id', (req, res) => {
    const { id } = req.params;
    const showId = parseInt(id, 10);
    if (isNaN(showId)) {
        // This is the error message that was being triggered incorrectly before
        return res.status(400).json({ error: 'Invalid show ID provided.' });
    }

    const sql = `SELECT *,
                   dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num
                 FROM shows WHERE id = ?`;
    db.get(sql, [showId], (err, row) => {
        if (err) {
            console.error(`Error fetching show with ID ${showId}:`, err.message);
            res.status(500).json({ error: `Failed to fetch show ${showId}` });
        } else if (row) {
             try {
                 if (typeof row.themes === 'string' && row.themes.trim().length > 0){ row.themes = JSON.parse(row.themes); }
                 else { row.themes = []; }
             } catch (e) { console.error(`Error parsing themes for show ID ${showId}:`, e); row.themes = []; }
            res.json(row);
        } else {
            res.status(404).json({ error: `Show with ID ${showId} not found` });
        }
    });
});


// --- Catch-all for unhandled API routes ---
app.use('/api', (req, res, next) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

// --- Server Start ---
const server = app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
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

process.on('SIGTERM', () => {
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
