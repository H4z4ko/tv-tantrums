// database/import_data.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'shows.db');
const jsonPath = path.resolve(__dirname, 'reviewed_shows.json');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Helper function to parse age string (e.g., "3-8", "12+", "Any")
function parseAgeGroup(ageString) {
    if (!ageString || typeof ageString !== 'string') {
        return { min_age: 0, max_age: 99 }; // Default for missing/invalid
    }
    ageString = ageString.trim().toLowerCase();

    if (ageString === 'any' || ageString === 'all ages' || ageString === 'any age') {
         return { min_age: 0, max_age: 99 };
    }
     if (ageString === '2+, any') { // Specific case from data
         return { min_age: 2, max_age: 99 };
    }
     if (ageString === '8+') { // Specific case from data
         return { min_age: 8, max_age: 99 };
     }
     if (ageString === '0-5') { // Specific case from data
         return { min_age: 0, max_age: 5 };
     }
     if (ageString === '0-3') { // Specific case from data
         return { min_age: 0, max_age: 3 };
     }


    const plusMatch = ageString.match(/^(\d+)\+$/);
    if (plusMatch) {
        return { min_age: parseInt(plusMatch[1], 10), max_age: 99 };
    }

    const rangeMatch = ageString.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
        return { min_age: parseInt(rangeMatch[1], 10), max_age: parseInt(rangeMatch[2], 10) };
    }

    // Handle complex cases like "6-12, 12+" -> take min and max overall
    const complexMatch = ageString.match(/(\d+)\s*-\s*(\d+),\s*(\d+)\+/);
     if (complexMatch) {
         const min1 = parseInt(complexMatch[1], 10);
         // const max1 = parseInt(complexMatch[2], 10); // Not needed for overall max
         const min2 = parseInt(complexMatch[3], 10);
         return { min_age: Math.min(min1, min2), max_age: 99 };
     }
     // Handle "7-12, 12+"
      const complexMatch2 = ageString.match(/(\d+)\s*-\s*(\d+),\s*(\d+)\+/);
       if (complexMatch2) {
           return { min_age: 7, max_age: 99 };
       }


     // Handle single number ages if they appear (treat as min=max=age)
     const singleAgeMatch = ageString.match(/^(\d+)$/);
     if (singleAgeMatch) {
          const age = parseInt(singleAgeMatch[1], 10);
         return { min_age: age, max_age: age };
     }

    console.warn(`Could not parse age string: "${ageString}". Defaulting to 0-99.`);
    return { min_age: 0, max_age: 99 }; // Fallback
}

// Helper to map descriptive levels to numbers for charts/potential filtering
// Using a simple scale: None/Very Low=0, Low=1, Low-Moderate=2, Moderate=3, Moderate-High=4, High=5, Very High=6
function mapLevelToNumber(level) {
    if (!level || typeof level !== 'string') return null;
    const l = level.toLowerCase().trim();
    switch (l) {
        case 'none': return 0;
        case 'very low': return 0; // Grouping None and Very Low
        case 'low': return 1;
        case 'low-moderate': return 2;
        case 'moderate': return 3;
        case 'moderate-high': return 4;
        case 'high': return 5;
        case 'very high': return 6;
        // Handle specific cases if needed, e.g., music tempo 'Varies'
        case 'varies': return 3; // Treat 'Varies' as Moderate for now
        default:
            console.warn(`Unknown level "${level}" found, mapping to null.`);
            return null; // Unknown level
    }
}


// Delete existing DB file to start fresh (optional)
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log('Existing database deleted.');
    } catch (delErr) {
        console.error('Error deleting existing database file:', delErr);
        // Decide if you want to stop here or continue
        // return;
    }
}

// Connect to the SQLite database (creates if not exists)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

// Read and execute schema
let schemaSql;
try {
    schemaSql = fs.readFileSync(schemaPath, 'utf8');
} catch (readErr) {
    console.error('Error reading schema file:', readErr);
    db.close();
    return;
}


db.exec(schemaSql, (err) => {
    if (err) {
        console.error('Error executing schema:', err.message);
        db.close();
        return;
    }
    console.log('Database schema applied successfully.');

    // Read and parse the JSON data
    let showsData;
    try {
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        showsData = JSON.parse(jsonData);
         if (!Array.isArray(showsData)) {
            throw new Error("JSON data is not an array.");
         }
    } catch (err) {
        console.error('Error reading or parsing JSON file:', err);
        db.close();
        return;
    }

    // Prepare the SQL statement for insertion
    const insertSql = `INSERT INTO shows (
        title, stimulation_score, platform, target_age_group, min_age, max_age,
        seasons, avg_episode_length, themes, interactivity_level, animation_style,
        dialogue_intensity, sound_effects_level, music_tempo, total_music_level,
        total_sound_effect_time_level, scene_frequency, image_filename,
        dialogue_intensity_num, scene_frequency_num, sound_effects_level_num, total_music_level_num
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Use db.serialize to ensure sequential execution order
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (beginErr) => {
             if(beginErr) {
                 console.error("Error beginning transaction:", beginErr.message);
                 db.close();
                 return;
             }
        });


        const stmt = db.prepare(insertSql, (prepareErr) => {
            if(prepareErr){
                console.error("Error preparing statement:", prepareErr.message);
                db.run('ROLLBACK;');
                db.close();
                return;
            }
        });

        let count = 0;
        let errorCount = 0;
        showsData.forEach((show, index) => {
            if (!show || typeof show.title !== 'string') {
                console.warn(`Skipping invalid show entry at index ${index}.`);
                errorCount++;
                return; // Skip this entry
            }

            const { min_age, max_age } = parseAgeGroup(show.target_age_group);
            const themesString = JSON.stringify(show.themes || []); // Store themes array as JSON string

            // Map levels to numbers
            const dialogueNum = mapLevelToNumber(show.dialogue_intensity);
            const sceneNum = mapLevelToNumber(show.scene_frequency);
            const sfxNum = mapLevelToNumber(show.sound_effects_level);
            const musicNum = mapLevelToNumber(show.total_music_level);
            const sfxTimeNum = mapLevelToNumber(show.total_sound_effect_time_level); // Also map this one


            stmt.run(
                show.title,
                show.stimulation_score,
                show.platform,
                show.target_age_group,
                min_age,
                max_age,
                show.seasons,
                show.avg_episode_length,
                themesString,
                show.interactivity_level,
                show.animation_style,
                show.dialogue_intensity,
                show.sound_effects_level,
                show.music_tempo,
                show.total_music_level,
                show.total_sound_effect_time_level,
                show.scene_frequency,
                show.image_filename, // Still null, but include the column
                dialogueNum,
                sceneNum,
                sfxNum,
                musicNum,
                (err) => {
                    if (err) {
                        // Log duplicates or other errors but continue if possible
                        if (err.message.includes('UNIQUE constraint failed: shows.title')) {
                            console.warn(`Skipping duplicate title: "${show.title}"`);
                        } else {
                            console.error(`Error inserting row for "${show.title}":`, err.message);
                        }
                        errorCount++;
                    } else {
                        count++;
                    }
                }
            );
        });

        stmt.finalize((finalizeErr) => {
             if (finalizeErr) {
                console.error('Error finalizing statement:', finalizeErr.message);
                db.run('ROLLBACK;', (rollbackErr) => {
                     if(rollbackErr) console.error("Rollback error:", rollbackErr.message);
                     db.close((closeErr) => {
                         if(closeErr) console.error("DB close error after finalize error:", closeErr.message);
                     });
                });
                return;
            }

            db.run('COMMIT;', (commitErr) => {
                 if (commitErr) {
                    console.error('Error committing transaction:', commitErr.message);
                 } else {
                     console.log(`Successfully inserted ${count} shows into the database.`);
                     if (errorCount > 0) {
                        console.log(`${errorCount} entries were skipped due to errors or invalid data.`);
                     }
                 }
                // Close the database connection regardless of commit success/failure
                db.close((closeErr) => {
                    if (closeErr) {
                        console.error('Error closing database:', closeErr.message);
                    } else {
                        console.log('Database connection closed.');
                    }
                });
            });
        });
    });
});