// updateImageFilenames.js
const fs = require('fs');
const path = require('path');

// --- Configuration: Define paths RELATIVE to the project root ---
// Assumes this script is in the project root directory.
const jsonFilePath = path.join('database', 'reviewed_shows.json');
const imageDirPath = path.join('client', 'public', 'images', 'Stim list - show images');
// --- End Configuration ---

// Helper to slugify title into a base filename (without extension)
const slugify = title => {
    if (!title || typeof title !== 'string') return '';
    return title.toLowerCase()
        .replace(/[:()']/g, '') // Remove specific problematic characters
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
};

// --- Main Logic ---
try {
    // Ensure paths exist
    if (!fs.existsSync(jsonFilePath)) {
        throw new Error(`JSON file not found at expected path: ${jsonFilePath}`);
    }
    if (!fs.existsSync(imageDirPath)) {
        throw new Error(`Image directory not found at expected path: ${imageDirPath}`);
    }

    // Load and parse the JSON
    console.log(`Reading JSON from: ${jsonFilePath}`);
    const showsJson = fs.readFileSync(jsonFilePath, 'utf8');
    const shows = JSON.parse(showsJson);
    if (!Array.isArray(shows)) {
        throw new Error('JSON data is not an array.');
    }

    // Get all image filenames in the directory
    console.log(`Scanning images in: ${imageDirPath}`);
    const imageFiles = fs.readdirSync(imageDirPath);
    const imageFileMap = new Map(imageFiles.map(file => [file.toLowerCase(), file])); // Map lowercase names to original names

    console.log(`Found ${imageFiles.length} image files.`);

    const matched = [];
    const unmatched = [];
    let updatedCount = 0;

    // Add matching image filename to each show
    shows.forEach((show, index) => {
        if (!show || !show.title) {
            console.warn(`Skipping show at index ${index} due to missing title.`);
            return;
        }
        // Process only if image_filename is currently missing or null
        if (!show.image_filename) {
            const slug = slugify(show.title);
            if (!slug) {
                console.warn(`Could not generate slug for title: "${show.title}"`);
                unmatched.push(show.title + " (Failed to generate slug)");
                return;
            }

            // Attempt to find a matching image file (case-insensitive start, common extensions)
            let foundMatch = null;
            for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) { // Add more extensions if needed
                const potentialFilename = (slug + ext).toLowerCase();
                if (imageFileMap.has(potentialFilename)) {
                    foundMatch = imageFileMap.get(potentialFilename); // Get original filename casing
                    break;
                }
            }

            if (foundMatch) {
                show.image_filename = foundMatch;
                matched.push(`${show.title} → ${foundMatch}`);
                updatedCount++;
            } else {
                unmatched.push(show.title);
            }
        }
    });

    // Save updated JSON only if changes were made
    if (updatedCount > 0) {
        console.log(`\nSaving updated JSON back to: ${jsonFilePath}`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(shows, null, 2), 'utf8');
        console.log(`✅ ${updatedCount} image filenames added!`);
    } else {
        console.log("\nNo missing image filenames needed updating.");
    }

    // Reporting
    if (matched.length > 0) {
        console.log('\n🟢 Matched Shows:');
        matched.forEach(entry => console.log('  - ' + entry));
    }
    if (unmatched.length > 0) {
        console.log('\n🔴 Unmatched Shows (Could not find corresponding image):');
        unmatched.forEach(title => console.log('  - ' + title));
    }

} catch (error) {
    console.error("\n❌ An error occurred during the script execution:");
    console.error(error.message);
    // Optionally log the full stack trace for more detail
    // console.error(error);
}