// server/db/connection.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Construct path relative to this file's location to reach the root/database folder
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'shows.db'); // Go up two levels then into database/
let db = null; // Initialize db as null

function connectDatabase(callback) {
    // Check if already connected
    if (db && db.open) {
        console.log("Database connection already established.");
        if (callback) callback(null, db); // Indicate success
        return;
    }

    console.log(`Attempting to connect to database at: ${dbPath}`);
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { // Use READWRITE for server operations if needed, or READONLY
        if (err) {
            console.error("Error connecting to the database:", err.message);
            db = null; // Ensure db is null on error
            if (callback) callback(err); // Pass error to callback
        } else {
            console.log("Successfully connected to the SQLite database.");
            db.on('error', (dbErr) => { // Add listener for future errors
                console.error('Database runtime error:', dbErr.message);
            });
            if (callback) callback(null, db); // Indicate success
        }
    });
}

function getDbConnection() {
    if (!db || !db.open) {
         // This situation should ideally be handled at startup,
         // but throw an error if accessed while disconnected.
         console.error("FATAL: Database is not connected.");
         throw new Error("Database connection is not available.");
    }
    return db;
}

function closeDatabase(callback) {
    if (db && db.open) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                if (callback) callback(err);
            } else {
                console.log('Database connection closed.');
                db = null; // Reset db variable
                if (callback) callback(null);
            }
        });
    } else {
         if (callback) callback(null); // Already closed or never opened
    }
}

// Export the functions and potentially the db instance (use getDbConnection ideally)
module.exports = {
    connectDatabase,
    getDbConnection,
    closeDatabase
};