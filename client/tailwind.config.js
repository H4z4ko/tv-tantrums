// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all JS/JSX files in src
  ],
  theme: {
    extend: {
      // Add aspect ratio utilities for consistent image containers
      aspectRatio: {
           '3/4': '3 / 4', // Portrait aspect ratio
           '4/3': '4 / 3',
           '16/9': '16 / 9',
           '1/1': '1 / 1',
      },
      // Optional: Add custom theme extensions here if needed later
      // colors: { 'brand-teal': '#008080', },
      // fontFamily: { sans: ['Inter', 'sans-serif'], },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Uncomment if you need form styling plugin
  ],
}