
const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/My Web Sites/sensory-friendly-shows/database/reviewed_shows.json';
const imageDir = 'C:/My Web Sites/sensory-friendly-shows/client/public/images/Stim list - show images';

// Helper to slugify title into a base filename (without extension)
const slugify = title => title.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Load and parse the JSON
const shows = JSON.parse(fs.readFileSync(jsonPath));

// Get all image filenames in the directory
const imageFiles = fs.readdirSync(imageDir);

const matched = [];
const unmatched = [];

// Add matching image filename to each show
shows.forEach(show => {
  if (!show.image_filename) {
    const slug = slugify(show.title);
    const match = imageFiles.find(file =>
      file.toLowerCase().startsWith(slug) &&
      (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg'))
    );
    if (match) {
      show.image_filename = match;
      matched.push(`${show.title} → ${match}`);
    } else {
      unmatched.push(show.title);
    }
  }
});

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(shows, null, 2));

console.log('✅ Image filenames (.jpg/.jpeg) added where available!\n');
console.log('🟢 Matched Shows:');
matched.forEach(entry => console.log('  - ' + entry));

console.log('\n🔴 Unmatched Shows:');
unmatched.forEach(title => console.log('  - ' + title));
