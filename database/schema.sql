-- database/schema.sql

-- Drop tables in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS show_themes;
DROP TABLE IF EXISTS themes;
DROP TABLE IF EXISTS shows;

-- Create the main shows table
CREATE TABLE shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    stimulation_score INTEGER CHECK(stimulation_score BETWEEN 1 AND 5),
    platform TEXT,
    target_age_group TEXT,
    min_age INTEGER,
    max_age INTEGER,
    seasons TEXT,
    avg_episode_length TEXT,
    interactivity_level TEXT,
    animation_style TEXT,
    dialogue_intensity TEXT,
    sound_effects_level TEXT,
    music_tempo TEXT,
    total_music_level TEXT,
    total_sound_effect_time_level TEXT,
    scene_frequency TEXT,
    image_filename TEXT,
    dialogue_intensity_num INTEGER CHECK(dialogue_intensity_num IS NULL OR dialogue_intensity_num BETWEEN 0 AND 5),
    scene_frequency_num INTEGER CHECK(scene_frequency_num IS NULL OR scene_frequency_num BETWEEN 0 AND 5),
    sound_effects_level_num INTEGER CHECK(sound_effects_level_num IS NULL OR sound_effects_level_num BETWEEN 0 AND 5),
    total_music_level_num INTEGER CHECK(total_music_level_num IS NULL OR total_music_level_num BETWEEN 0 AND 5)
);

-- Create a separate table for unique themes
CREATE TABLE themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

-- Create a junction table to link shows and themes (Many-to-Many)
CREATE TABLE show_themes (
    show_id INTEGER NOT NULL,
    theme_id INTEGER NOT NULL,
    PRIMARY KEY (show_id, theme_id),
    FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes (id) ON DELETE CASCADE
);

-- --- Indexes for Faster Queries ---

-- Existing Indexes
CREATE INDEX idx_shows_min_age ON shows (min_age);
CREATE INDEX idx_shows_max_age ON shows (max_age);
CREATE INDEX idx_shows_stimulation_score ON shows (stimulation_score);
CREATE INDEX idx_themes_name ON themes (name);
CREATE INDEX idx_show_themes_show_id ON show_themes (show_id);
CREATE INDEX idx_show_themes_theme_id ON show_themes (theme_id);

-- Index for sorting/searching by title (helps exact match, partial for prefix, NOT '%search%')
-- Note: Adding COLLATE NOCASE might help case-insensitive lookups if needed,
-- but the queries already use COLLATE NOCASE where appropriate.
CREATE INDEX idx_shows_title ON shows (title); -- Added explicit index for title

-- *** NEW Indexes for Common Filter Fields ***
CREATE INDEX idx_shows_interactivity ON shows (interactivity_level COLLATE NOCASE);
CREATE INDEX idx_shows_dialogue ON shows (dialogue_intensity COLLATE NOCASE);
CREATE INDEX idx_shows_scene_freq ON shows (scene_frequency COLLATE NOCASE);

-- Optional indexes for numeric scores if heavily used for filtering/sorting
-- CREATE INDEX idx_shows_dialogue_num ON shows (dialogue_intensity_num);
-- CREATE INDEX idx_shows_scene_freq_num ON shows (scene_frequency_num);
-- etc. (Let's hold off on these unless proven necessary)