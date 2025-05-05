// database/import_data.js
console.log("✅ import_data.js script starting...");

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'shows.db');
const jsonPath = path.resolve(__dirname, 'reviewed_shows.json');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// --- Helper Functions ---

function parseAgeGroup(ageString) {
    if (ageString === null || ageString === undefined) return { min_age: null, max_age: null };
    if (typeof ageString !== 'string') {
        console.warn(`Input ageString is not a string (type: ${typeof ageString}, value: ${ageString}). Setting min/max age to null.`);
        return { min_age: null, max_age: null };
    }
    const trimmedAgeString = ageString.trim();
    if (trimmedAgeString === '') return { min_age: null, max_age: null };
    const lowerCaseAgeString = trimmedAgeString.toLowerCase();

    const specificCases = {
        'any': { min_age: 0, max_age: 99 }, 'all ages': { min_age: 0, max_age: 99 }, 'any age': { min_age: 0, max_age: 99 },
        '0-3': { min_age: 0, max_age: 3 }, '0-5': { min_age: 0, max_age: 5 },
        '1-4': { min_age: 1, max_age: 4 }, '1-5': { min_age: 1, max_age: 5 },
        '2-4': { min_age: 2, max_age: 4 }, '2-5': { min_age: 2, max_age: 5 }, '2-6': { min_age: 2, max_age: 6 }, '2-8': { min_age: 2, max_age: 8 },
        '3-6': { min_age: 3, max_age: 6 }, '3-7': { min_age: 3, max_age: 7 }, '3-8': { min_age: 3, max_age: 8 },
        '4-7': { min_age: 4, max_age: 7 }, '4-8': { min_age: 4, max_age: 8 }, '4-10': { min_age: 4, max_age: 10 },
        '5-8': { min_age: 5, max_age: 8 }, '5-9': { min_age: 5, max_age: 9 }, '5-10': { min_age: 5, max_age: 10 }, '5-12': { min_age: 5, max_age: 12 },
        '6-10': { min_age: 6, max_age: 10 }, '6-12': { min_age: 6, max_age: 12 },
        '7-11': { min_age: 7, max_age: 11 }, '7-12': { min_age: 7, max_age: 12 },
        '8-12': { min_age: 8, max_age: 12 }, '8-14': { min_age: 8, max_age: 14 },
        '9-12': { min_age: 9, max_age: 12 },
        '10-14': { min_age: 10, max_age: 14 }, '10-16': { min_age: 10, max_age: 16 },
        '2+, any': { min_age: 2, max_age: 99 },
        '6-12, 12+': { min_age: 6, max_age: 99 }, '7-12, 12+': { min_age: 7, max_age: 99 },
        '0+': { min_age: 0, max_age: 99 }, '1+': { min_age: 1, max_age: 99 }, '2+': { min_age: 2, max_age: 99 }, '3+': { min_age: 3, max_age: 99 },
        '4+': { min_age: 4, max_age: 99 }, '5+': { min_age: 5, max_age: 99 }, '6+': { min_age: 6, max_age: 99 }, '7+': { min_age: 7, max_age: 99 },
        '8+': { min_age: 8, max_age: 99 }, '10+': { min_age: 10, max_age: 99 }, '12+': { min_age: 12, max_age: 99 },
    };
    if (specificCases[lowerCaseAgeString]) return specificCases[lowerCaseAgeString];

    const plusMatch = lowerCaseAgeString.match(/^(\d+)\s*\+$/);
    if (plusMatch) return { min_age: parseInt(plusMatch[1], 10), max_age: 99 };
    const rangeMatch = lowerCaseAgeString.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) { const min = parseInt(rangeMatch[1], 10); const max = parseInt(rangeMatch[2], 10); return { min_age: Math.min(min, max), max_age: Math.max(min, max) }; }
    const singleAgeMatch = lowerCaseAgeString.match(/^(\d+)$/);
    if (singleAgeMatch) { const age = parseInt(singleAgeMatch[1], 10); return { min_age: age, max_age: age }; }

    console.warn(`Could not parse age string: "${ageString}". Setting min/max age to null.`);
    return { min_age: null, max_age: null };
}

function mapLevelToNumber(level) {
    if (!level || typeof level !== 'string') return null;
    const l = level.toLowerCase().trim();
    switch (l) {
        case 'none': return 0;
        case 'very low': return 1;
        case 'low': return 2;
        case 'low-moderate': return 3;
        case 'moderate': return 3;
        case 'moderate-high': return 4;
        case 'high': return 5;
        case 'very high': return 5;
        case 'varies': return 3; // Map 'Varies' to moderate as a default
        default: return null; // Return null for unknown values
    }
}

// --- Database Operation Promises ---
function connectDb(dbPath) { /* ... (no change needed) ... */ return new Promise((resolve, reject) => { const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => { if (err) { console.error('Error opening database:', err.message); reject(err); } else { console.log('Connected to the SQLite database for import.'); resolve(db); } }); }); }
function executeSchema(db, schemaSql) { /* ... (no change needed) ... */ return new Promise((resolve, reject) => { db.exec(schemaSql, (err) => { if (err) { console.error('Error executing schema:', err.message); reject(err); } else { console.log('Database schema applied successfully.'); resolve(); } }); }); }
function runDb(db, sql, params = []) { /* ... (no change needed, already handles skips) ... */ return new Promise((resolve, reject) => { db.run(sql, params, function(err) { if (err) { if (sql.startsWith('INSERT OR IGNORE INTO themes') && err.message.includes('UNIQUE constraint failed')) { resolve({ lastID: this.lastID, changes: this.changes, skipped: true }); } else if (sql.startsWith('INSERT OR IGNORE INTO show_themes') && err.message.includes('UNIQUE constraint failed')) { resolve({ lastID: this.lastID, changes: this.changes, skipped: true }); } else if (sql.startsWith('INSERT INTO shows') && err.message.includes('UNIQUE constraint failed: shows.title')) { console.warn(`Skipping duplicate show title (unique constraint): "${params[0]}"`); resolve({ lastID: 0, changes: 0, skipped: true }); } else { console.error(`Error running SQL: ${sql}`, params, err.message); reject(err); } } else { resolve({ lastID: this.lastID, changes: this.changes, skipped: false }); } }); }); }
function getDb(db, sql, params = []) { /* ... (no change needed) ... */ return new Promise((resolve, reject) => { db.get(sql, params, (err, row) => { if (err) { console.error(`Error getting row SQL: ${sql}`, params, err.message); reject(err); } else { resolve(row); } }); }); }
function closeDb(db) { /* ... (no change needed) ... */ return new Promise((resolve, reject) => { db.close((err) => { if (err) { console.error('Error closing database:', err.message); reject(err); } else { console.log('Database connection closed.'); resolve(); } }); }); }

// --- Main Import Logic ---
async function importData() {
    let db;
    try {
        if (fs.existsSync(dbPath)) { fs.unlinkSync(dbPath); console.log('Existing database deleted.'); }
        db = await connectDb(dbPath);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await executeSchema(db, schemaSql);

        let showsData;
        try { const jsonData = fs.readFileSync(jsonPath, 'utf8'); showsData = JSON.parse(jsonData); }
        catch (parseError) { console.error(`Fatal Error reading/parsing JSON: ${parseError.message}`); throw new Error("JSON file error."); }
        if (!Array.isArray(showsData)) { throw new Error("JSON data is not an array."); }
        console.log(`Read ${showsData.length} show entries from JSON.`);

        await runDb(db, 'BEGIN TRANSACTION;'); console.log('Transaction started.');
        let showInsertCount = 0, themeInsertCount = 0, linkInsertCount = 0, errorCount = 0, skippedShowCount = 0;
        const themeCache = new Map();

        const showInsertSql = `INSERT INTO shows ( title, stimulation_score, platform, target_age_group, min_age, max_age, seasons, avg_episode_length, interactivity_level, animation_style, dialogue_intensity, sound_effects_level, music_tempo, total_music_level, total_sound_effect_time_level, scene_frequency, image_filename, dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const themeInsertSql = `INSERT OR IGNORE INTO themes (name) VALUES (?)`;
        const themeSelectSql = `SELECT id FROM themes WHERE name = ? COLLATE NOCASE`;
        const linkInsertSql = `INSERT OR IGNORE INTO show_themes (show_id, theme_id) VALUES (?, ?)`;

        for (const [index, show] of showsData.entries()) {
            if (!show || typeof show !== 'object' || typeof show.title !== 'string' || !show.title.trim() || typeof show.stimulation_score !== 'number' || show.stimulation_score < 1 || show.stimulation_score > 5) {
                console.warn(`[Entry ${index}] Skipping entry due to invalid base data: Title='${show?.title}', Score=${show?.stimulation_score}`);
                skippedShowCount++; continue;
            }
            const title = show.title.trim();
            let ageResult = parseAgeGroup(show.target_age_group);
            const { min_age, max_age } = ageResult;
            const dialogueNum = mapLevelToNumber(show.dialogue_intensity);
            const sceneNum = mapLevelToNumber(show.scene_frequency);
            const sfxNum = mapLevelToNumber(show.sound_effects_level);
            const musicNum = mapLevelToNumber(show.total_music_level);

            const showParams = [ title, show.stimulation_score, show.platform, show.target_age_group, min_age, max_age, show.seasons, show.avg_episode_length, show.interactivity_level, show.animation_style, show.dialogue_intensity, show.sound_effects_level, show.music_tempo, show.total_music_level, show.total_sound_effect_time_level, show.scene_frequency, show.image_filename, dialogueNum, sceneNum, sfxNum, musicNum ];
            if (showParams.length !== 21) { console.error(`[Entry ${index} - "${title}"] Parameter count mismatch! Skipping.`); errorCount++; continue; }

            let showId = 0;
            try {
                const showResult = await runDb(db, showInsertSql, showParams);
                if (showResult.skipped) {
                    skippedShowCount++; const existingShow = await getDb(db, 'SELECT id FROM shows WHERE title = ? COLLATE NOCASE', [title]);
                    if (existingShow) { showId = existingShow.id; } else { console.error(`CRITICAL: Could not find existing show ID for skipped duplicate: "${title}"`); errorCount++; continue; }
                } else if (showResult.changes > 0) { showInsertCount++; showId = showResult.lastID; }
                else { console.error(`Unknown state inserting show: "${title}"`); errorCount++; continue; }

                if (showId > 0 && Array.isArray(show.themes)) {
                    for (const themeName of show.themes) {
                        if (typeof themeName !== 'string' || !themeName.trim()) continue;
                        const trimmedTheme = themeName.trim(); const lowerTheme = trimmedTheme.toLowerCase(); let themeId;
                        if (themeCache.has(lowerTheme)) { themeId = themeCache.get(lowerTheme); }
                        else {
                            await runDb(db, themeInsertSql, [trimmedTheme]); const themeRow = await getDb(db, themeSelectSql, [trimmedTheme]);
                            if (themeRow) { themeId = themeRow.id; if (!themeCache.has(lowerTheme)) { themeInsertCount++; themeCache.set(lowerTheme, themeId); } }
                            else { console.error(`[Show "${title}"] Failed to get/insert theme ID for: "${trimmedTheme}"`); errorCount++; continue; }
                        }
                        if (themeId) { const linkResult = await runDb(db, linkInsertSql, [showId, themeId]); if (linkResult && !linkResult.skipped && linkResult.changes > 0) { linkInsertCount++; } }
                    }
                }
            } catch (err) { console.error(`\n--- Error processing entry index ${index}, title "${title}" ---\n${err.message}\n--- End Error Log ---`); errorCount++; }
        } // End show loop

        await runDb(db, 'COMMIT;'); console.log('Transaction committed.');
        console.log(`\n--- Import Summary ---\nInserted ${showInsertCount} NEW shows.\nSkipped ${skippedShowCount} shows.\nProcessed ~${themeInsertCount} unique themes.\nCreated ${linkInsertCount} new show-theme links.\nErrors: ${errorCount}.\n----------------------\n`);
    } catch (error) {
        console.error('CRITICAL error during import:', error.message);
        if (db) { try { db.run('ROLLBACK', (rbErr) => { if (rbErr) console.error('Rollback failed:', rbErr); else console.log('Transaction rolled back.'); }); } catch (rbCatch) { console.error('Rollback error:', rbCatch); } }
    } finally { if (db) { await closeDb(db); } console.log("✅ import_data.js script finished."); }
}
importData();