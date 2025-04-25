// server/db/queries.js
const { getDbConnection } = require('./connection'); // Import the function to get DB connection

// Runs a query expected to return multiple rows (SELECT)
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = getDbConnection(); // Get the active DB connection
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error(`Error running query: ${sql}`, params, err.message);
                    reject(new Error(`Database query failed: ${err.message}`)); // More generic error
                } else {
                    resolve(rows); // Resolve with array of rows
                }
            });
        } catch (connectionError) {
             reject(connectionError); // Propagate connection errors
        }
    });
}

// Runs a query expected to return a single row (SELECT with LIMIT 1)
function getSingleRow(sql, params = []) {
    return new Promise((resolve, reject) => {
         try {
            const db = getDbConnection();
            db.get(sql, params, (err, row) => {
                if (err) {
                    console.error(`Error getting single row: ${sql}`, params, err.message);
                    reject(new Error(`Database query failed: ${err.message}`));
                } else {
                    resolve(row); // row is undefined if not found
                }
            });
         } catch (connectionError) {
             reject(connectionError);
         }
    });
}

// Runs a query for INSERT, UPDATE, DELETE
function runAction(sql, params = []) {
     return new Promise((resolve, reject) => {
         try {
             const db = getDbConnection();
             // Use function() to access `this` for lastID, changes
             db.run(sql, params, function(err) {
                 if (err) {
                     console.error(`Error running action query: ${sql}`, params, err.message);
                     reject(new Error(`Database action failed: ${err.message}`));
                 } else {
                     // Resolve with info about the action
                     resolve({ lastID: this.lastID, changes: this.changes });
                 }
             });
         } catch (connectionError) {
             reject(connectionError);
         }
     });
 }

// Helper to get themes for a list of show IDs
async function getThemesForShows(showIds) {
    if (!showIds || showIds.length === 0) {
        return {}; // Return empty object if no IDs
    }
    const placeholders = showIds.map(() => '?').join(',');
    const themeSql = `
        SELECT st.show_id, t.name
        FROM show_themes st
        JOIN themes t ON st.theme_id = t.id
        WHERE st.show_id IN (${placeholders})
        ORDER BY st.show_id;
    `;
    try {
        const themeRows = await runQuery(themeSql, showIds); // Use runQuery now
        const themesByShowId = {};
        themeRows.forEach(row => {
            if (!themesByShowId[row.show_id]) {
                themesByShowId[row.show_id] = [];
            }
            themesByShowId[row.show_id].push(row.name);
        });
        return themesByShowId;
    } catch (error) {
        console.error("Error fetching themes for multiple shows:", error.message);
        // Re-throw or handle more gracefully depending on need
        throw error; // Propagate error up
    }
}

// Helper to attach themes to shows
function attachThemesToShowList(shows, themesMap) {
     return shows.map(show => ({
        ...show,
        themes: themesMap[show.id] || [] // Add themes array, default to empty
    }));
}

// Export all query functions
module.exports = {
    runQuery,
    getSingleRow,
    runAction, // Export the action runner too if needed later
    getThemesForShows,
    attachThemesToShowList
};