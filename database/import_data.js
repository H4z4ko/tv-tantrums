// database/import_data.js
console.log("✅ import_data.js script starting..."); // Add start log

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'shows.db');
const jsonPath = path.resolve(__dirname, 'reviewed_shows.json');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// --- Helper Functions ---

function parseAgeGroup(ageString) {
    if (ageString === null || ageString === undefined) {
        // console.warn(`Input ageString is null or undefined. Setting min/max age to null.`); // Optional log
        return { min_age: null, max_age: null };
    }
    if (typeof ageString !== 'string') {
        console.warn(`Input ageString is not a string (type: ${typeof ageString}, value: ${ageString}). Setting min/max age to null.`);
        return { min_age: null, max_age: null };
    }
    const trimmedAgeString = ageString.trim();
    if (trimmedAgeString === '') {
        // console.warn(`Input ageString is an empty or whitespace-only string. Setting min/max age to null.`); // Optional log
        return { min_age: null, max_age: null };
    }
    const lowerCaseAgeString = trimmedAgeString.toLowerCase();

    if (lowerCaseAgeString === 'any' || lowerCaseAgeString === 'all ages' || lowerCaseAgeString === 'any age') {
        return { min_age: 0, max_age: 99 };
    }
    const specificCases = {
        '2+, any': { min_age: 2, max_age: 99 }, '8+': { min_age: 8, max_age: 99 },
        '0-5': { min_age: 0, max_age: 5 }, '0-3': { min_age: 0, max_age: 3 },
        '10-14': { min_age: 10, max_age: 14 }, '10-16': { min_age: 10, max_age: 16 },
        '12+': { min_age: 12, max_age: 99 }, '7-11': { min_age: 7, max_age: 11 },
        '7-12': { min_age: 7, max_age: 12 }, '8-14': { min_age: 8, max_age: 14 },
        '6-12, 12+': { min_age: 6, max_age: 99 }, '7-12, 12+': { min_age: 7, max_age: 99 }
    };
    if (specificCases[lowerCaseAgeString]) { return specificCases[lowerCaseAgeString]; }
    const plusMatch = lowerCaseAgeString.match(/^(\d+)\+$/);
    if (plusMatch) { return { min_age: parseInt(plusMatch[1], 10), max_age: 99 }; }
    const rangeMatch = lowerCaseAgeString.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) { return { min_age: parseInt(rangeMatch[1], 10), max_age: parseInt(rangeMatch[2], 10) }; }
    const singleAgeMatch = lowerCaseAgeString.match(/^(\d+)$/);
    if (singleAgeMatch) { const age = parseInt(singleAgeMatch[1], 10); return { min_age: age, max_age: age }; }

    console.warn(`Could not parse age string: "${ageString}". Setting min/max age to null.`);
    return { min_age: null, max_age: null };
}

function mapLevelToNumber(level) {
    if (!level || typeof level !== 'string') { return null; }
    const l = level.toLowerCase().trim();
    switch (l) {
        case 'none': return 0; case 'very low': return 0;
        case 'low': return 1; case 'low-moderate': return 2;
        case 'moderate': return 3; case 'moderate-high': return 4;
        case 'high': return 5; case 'very high': return 5;
        case 'varies': return 3;
        default:
            // console.warn(`Unknown level "${level}" found, mapping to null.`); // Keep this warning optional
            return null;
    }
}

// --- Database Operation Promises ---
function connectDb(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) { console.error('Error opening database:', err.message); reject(err); }
            else { console.log('Connected to the SQLite database for import.'); resolve(db); }
        });
    });
}

function executeSchema(db, schemaSql) {
    return new Promise((resolve, reject) => {
        db.exec(schemaSql, (err) => {
            if (err) { console.error('Error executing schema:', err.message); reject(err); }
            else { console.log('Database schema applied successfully.'); resolve(); }
        });
    });
}

function runDb(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                if (sql.startsWith('INSERT OR IGNORE INTO themes') && err.message.includes('UNIQUE constraint failed')) {
                    // console.warn(`Theme already exists or constraint failed: ${params[0]}`);
                    resolve({ lastID: this.lastID, changes: this.changes });
                } else if (sql.startsWith('INSERT OR IGNORE INTO show_themes') && err.message.includes('UNIQUE constraint failed')) {
                    // console.warn(`Show-Theme link already exists: ShowID ${params[0]}, ThemeID ${params[1]}`);
                    resolve({ lastID: this.lastID, changes: this.changes });
                } else if (sql.startsWith('INSERT INTO shows') && err.message.includes('UNIQUE constraint failed: shows.title')) {
                    console.warn(`Skipping duplicate show title: ${params[0]}`);
                    resolve({ lastID: 0, changes: 0 });
                } else {
                    console.error(`Error running SQL: ${sql}`, params, err.message);
                    reject(err); // Reject other errors
                }
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

function getDb(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) { console.error(`Error getting row SQL: ${sql}`, params, err.message); reject(err); }
            else { resolve(row); }
        });
    });
}

function closeDb(db) {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) { console.error('Error closing database:', err.message); reject(err); }
            else { console.log('Database connection closed.'); resolve(); }
        });
    });
}

// --- Main Import Logic ---
async function importData() {
    let db;
    try {
        // Delete existing DB file
        if (fs.existsSync(dbPath)) {
            console.log('Deleting existing database file...');
            fs.unlinkSync(dbPath);
            console.log('Existing database deleted.');
        }

        // Connect and Execute Schema
        db = await connectDb(dbPath);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await executeSchema(db, schemaSql); // *** THIS STEP WAS MISSING ***

        // Read and Parse JSON
        let showsData;
        try {
            const jsonData = fs.readFileSync(jsonPath, 'utf8');
            showsData = JSON.parse(jsonData);
        } catch (parseError) {
             console.error(`Fatal Error: Could not parse JSON file at ${jsonPath}`);
             console.error(parseError.message);
             throw new Error("JSON file is malformed.");
        }
        if (!Array.isArray(showsData)) { throw new Error("JSON data is not an array."); }
        console.log(`Read ${showsData.length} show entries from JSON.`);

        // Start Transaction
        await runDb(db, 'BEGIN TRANSACTION;');
        console.log('Transaction started.');

        let showInsertCount = 0, themeInsertCount = 0, linkInsertCount = 0, errorCount = 0, skippedShowCount = 0;
        const themeCache = new Map();

        // SQL statements (Using correct column names)
        const showInsertSql = `INSERT INTO shows (
            title, stimulation_score, platform, target_age_group, min_age, max_age,
            seasons, avg_episode_length, interactivity_level, animation_style,
            dialogue_intensity, sound_effects_level, music_tempo, total_music_level,
            total_sound_effect_time_level, scene_frequency, image_filename,
            dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // 21 params
        const themeInsertSql = `INSERT OR IGNORE INTO themes (name) VALUES (?)`;
        const themeSelectSql = `SELECT id FROM themes WHERE name = ? COLLATE NOCASE`;
        const linkInsertSql = `INSERT OR IGNORE INTO show_themes (show_id, theme_id) VALUES (?, ?)`;

        // --- Loop Start ---
        for (const [index, show] of showsData.entries()) {
            // Validation (Using correct field names)
             if (!show || typeof show !== 'object') { skippedShowCount++; continue; }
             if (typeof show.title !== 'string' || !show.title.trim()) { skippedShowCount++; continue; }
             if (typeof show.stimulation_score !== 'number' || show.stimulation_score < 1 || show.stimulation_score > 5) {
                console.warn(`[Entry ${index}] Skipping entry "${show.title || 'MISSING TITLE'}" due to invalid stimulation_score: ${show.stimulation_score}`);
                skippedShowCount++; continue;
             }

            const title = show.title.trim();

            // Parse age (using correct field name)
            // console.log(`[Entry ${index} - "${title}"] About to parse age group. Input:`, show.target_age_group); // Optional debug log
            let ageResult = parseAgeGroup(show.target_age_group);
            // console.log(`[Entry ${index} - "${title}"] Result from parseAgeGroup:`, JSON.stringify(ageResult)); // Optional debug log
            if (ageResult === undefined) { ageResult = { min_age: null, max_age: null }; errorCount++; }
            const { min_age, max_age } = ageResult;

            // Map levels (using correct field names)
            const dialogueNum = mapLevelToNumber(show.dialogue_intensity);
            const sceneNum = mapLevelToNumber(show.scene_frequency);
            const sfxNum = mapLevelToNumber(show.sound_effects_level);
            const musicNum = mapLevelToNumber(show.total_music_level);

            // Prepare params (using correct field names and order)
            const showParams = [
                title, show.stimulation_score, show.platform, show.target_age_group, min_age, max_age,
                show.seasons, show.avg_episode_length, show.interactivity_level, show.animation_style,
                show.dialogue_intensity, show.sound_effects_level, show.music_tempo, show.total_music_level,
                show.total_sound_effect_time_level, show.scene_frequency, show.image_filename,
                dialogueNum, sceneNum, sfxNum, musicNum,
            ]; // Should match the 21 '?' in showInsertSql

             if (showParams.length !== 21) {
                 console.error(`[Entry ${index} - "${title}"] FATAL: Parameter count mismatch! Expected 21, got ${showParams.length}. Skipping.`);
                 errorCount++;
                 continue; // Skip this entry
             }


            let showId = 0;

            try {
                // Insert Show / Find Existing ID
                 const showResult = await runDb(db, showInsertSql, showParams);
                 if (showResult.changes > 0) {
                     showInsertCount++; showId = showResult.lastID;
                 } else if (showResult.lastID === 0 && showResult.changes === 0) {
                     skippedShowCount++; const existingShow = await getDb(db, 'SELECT id FROM shows WHERE title = ?', [title]);
                     if (existingShow) { showId = existingShow.id; }
                     else { console.error(`CRITICAL: Could not find existing show ID for duplicate title: "${title}"`); errorCount++; continue; }
                 } else { console.error(`Unknown state after trying to insert show: "${title}"`); errorCount++; continue; }

                 // Handle Themes
                 if (showId > 0) {
                     const themes = Array.isArray(show.themes) ? show.themes : [];
                     for (const themeName of themes) {
                         if (typeof themeName !== 'string' || !themeName.trim()) continue;
                         const trimmedTheme = themeName.trim(); let themeId; const lowerTheme = trimmedTheme.toLowerCase();
                         if (themeCache.has(lowerTheme)) { themeId = themeCache.get(lowerTheme); }
                         else {
                             await runDb(db, themeInsertSql, [trimmedTheme]); const themeRow = await getDb(db, themeSelectSql, [trimmedTheme]);
                             if (themeRow) { themeId = themeRow.id; if (!themeCache.has(lowerTheme)) { themeInsertCount++; themeCache.set(lowerTheme, themeId); } }
                             else { console.error(`[Show "${title}"] Failed to find or insert theme: "${trimmedTheme}"`); errorCount++; continue; }
                         }
                         if (themeId) {
                             const linkResult = await runDb(db, linkInsertSql, [showId, themeId]);
                             if (linkResult && typeof linkResult.changes === 'number' && linkResult.changes > 0) { // Safe check
                                 linkInsertCount++;
                             }
                         }
                     }
                 }

            } catch (err) { // Safer Error Logging
                 console.error(`\n--- Error processing entry index ${index}, title "${title}" ---`);
                 console.error("Raw error caught:", err);
                 const errorMessage = err instanceof Error ? err.message : String(err);
                 console.error("Processed error message:", errorMessage);
                 console.error("--- End Error Log ---");
                 errorCount++;
            }
        } // --- End loop ---

        // Commit Transaction
        await runDb(db, 'COMMIT;');
        console.log('Transaction committed.');

        // Final Summary
        console.log('\n--- Import Summary ---');
        console.log(`Successfully inserted ${showInsertCount} NEW shows.`); // Updated wording
        console.log(`Processed approximately ${themeInsertCount} unique themes (new or existing).`);
        console.log(`Successfully created ${linkInsertCount} new show-theme links.`);
        if (skippedShowCount > 0) console.log(`Skipped ${skippedShowCount} entries (invalid data or duplicate titles).`);
        if (errorCount > 0) console.log(`Encountered ${errorCount} errors during processing (check logs above).`);
        console.log('----------------------\n');

    } catch (error) { // Main catch block
        console.error('A critical error occurred during the import process:', error.message);
        if (db && db.open) {
            try { console.log('Attempting to rollback transaction...'); await runDb(db, 'ROLLBACK;'); console.log('Transaction rolled back.'); }
            catch (rollbackErr) { console.error('Failed to rollback transaction:', rollbackErr); }
        }
    } finally { // Finally block
        if (db && db.open) { await closeDb(db); }
        console.log("✅ import_data.js script finished."); // Add end log
    }
}

// Run the import
importData();