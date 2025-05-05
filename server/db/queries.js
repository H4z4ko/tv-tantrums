// server/db/queries.js
const { getDbConnection } = require('./connection'); // Import the function to get DB connection

// Helper to log query errors consistently
function logQueryError(sql, params, error) {
     console.error(`--- Database Query Error ---`);
     console.error(`SQL: ${sql}`);
     if (params && params.length > 0) {
         console.error(`Parameters: ${JSON.stringify(params)}`);
     }
     console.error(`Error Message: ${error.message}`);
     // console.error(`Stack Trace: ${error.stack}`); // Optional: Uncomment for full stack
     console.error(`--------------------------`);
}

// Runs a query expected to return multiple rows (SELECT)
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = getDbConnection(); // Get the active DB connection
            db.all(sql, params, (err, rows) => {
                if (err) {
                    logQueryError(sql, params, err);
                    reject(new Error('Database query failed. Please check server logs.')); // Generic message to client
                } else {
                    resolve(rows || []); // Ensure an array is always resolved
                }
            });
        } catch (connectionError) {
             console.error("Database connection error in runQuery:", connectionError);
             reject(new Error("Database connection error."));
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
                     logQueryError(sql, params, err);
                     reject(new Error('Database query failed. Please check server logs.'));
                } else {
                    resolve(row); // row is undefined if not found, which is expected behavior
                }
            });
         } catch (connectionError) {
             console.error("Database connection error in getSingleRow:", connectionError);
             reject(new Error("Database connection error."));
         }
    });
}

// Runs a query for INSERT, UPDATE, DELETE
function runAction(sql, params = []) {
     return new Promise((resolve, reject) => {
         try {
             const db = getDbConnection();
             // Use function() to access `this` for lastID, changes
             db.run(sql, params, function(err) { // `function` keyword is important here
                 if (err) {
                     logQueryError(sql, params, err);
                     reject(new Error('Database action failed. Please check server logs.'));
                 } else {
                     // Resolve with info about the action
                     resolve({ lastID: this.lastID, changes: this.changes });
                 }
             });
         } catch (connectionError) {
              console.error("Database connection error in runAction:", connectionError);
             reject(new Error("Database connection error."));
         }
     });
 }

// Helper to get themes for a list of show IDs efficiently
async function getThemesForShows(showIds) {
    const themesByShowId = {}; // Initialize map
    if (!showIds || showIds.length === 0) {
        return themesByShowId; // Return empty map if no IDs
    }
    // Ensure IDs are unique and valid numbers before querying
    const uniqueValidIds = [...new Set(showIds.filter(id => typeof id === 'number' && id > 0))];
    if (uniqueValidIds.length === 0) {
        return themesByShowId; // Return empty if no valid IDs remain
    }

    const placeholders = uniqueValidIds.map(() => '?').join(',');
    const themeSql = `
        SELECT st.show_id, t.name
        FROM show_themes st
        JOIN themes t ON st.theme_id = t.id
        WHERE st.show_id IN (${placeholders})
        ORDER BY st.show_id, t.name COLLATE NOCASE; -- Ensure consistent theme order
    `;
    try {
        const themeRows = await runQuery(themeSql, uniqueValidIds); // Use runQuery now
        // Group themes by show_id
        themeRows.forEach(row => {
            if (!themesByShowId[row.show_id]) {
                themesByShowId[row.show_id] = [];
            }
            themesByShowId[row.show_id].push(row.name);
        });
        return themesByShowId;
    } catch (error) {
        // Error is logged within runQuery, re-throw a specific error for this context
        console.error("getThemesForShows failed after runQuery succeeded or failed:", error);
        throw new Error('Failed to retrieve themes for shows.');
    }
}

// Helper to attach themes (from the map) to a list of show objects
function attachThemesToShowList(shows, themesMap) {
     return shows.map(show => ({
        ...show,
        // Ensure themes is always an array, even if show.id is not in themesMap
        themes: themesMap[show.id] || []
    }));
}

// Export all query functions
module.exports = {
    runQuery,
    getSingleRow,
    runAction,
    getThemesForShows,
    attachThemesToShowList
};