-- database/schema.sql

DROP TABLE IF EXISTS shows;

CREATE TABLE shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    stimulation_score INTEGER,
    platform TEXT,
    target_age_group TEXT, -- Store original string for display
    min_age INTEGER,        -- Parsed minimum age for filtering
    max_age INTEGER,        -- Parsed maximum age for filtering
    seasons TEXT,
    avg_episode_length TEXT,
    themes TEXT,            -- Store as JSON string
    interactivity_level TEXT,
    animation_style TEXT,
    dialogue_intensity TEXT,
    sound_effects_level TEXT,
    music_tempo TEXT,
    total_music_level TEXT,
    total_sound_effect_time_level TEXT,
    scene_frequency TEXT,
    image_filename TEXT,
    -- Add numerical versions for charting/advanced filtering if needed
    dialogue_intensity_num INTEGER,
    scene_frequency_num INTEGER,
    sound_effects_level_num INTEGER,
    total_music_level_num INTEGER
);

-- Optional: Create indexes for faster filtering
CREATE INDEX idx_min_age ON shows (min_age);
CREATE INDEX idx_max_age ON shows (max_age);
CREATE INDEX idx_stimulation_score ON shows (stimulation_score);