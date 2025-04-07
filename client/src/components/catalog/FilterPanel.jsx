// client/src/components/Catalog/FilterPanel.jsx
import React, { useState, useEffect } from 'react'; // Keep React and hooks import
import { getThemes } from '../../services/showService'; // Keep service import

// --- Constants defined OUTSIDE the component ---
const ageRanges = [
    { label: 'Any Age', value: { min: 0, max: 99 } },
    { label: 'Toddler (0-2)', value: { min: 0, max: 2 } },
    { label: 'Preschool (3-5)', value: { min: 3, max: 5 } },
    { label: 'Early Elem. (6-8)', value: { min: 6, max: 8 } },
    { label: 'Late Elem. (9-12)', value: { min: 9, max: 12 } },
    { label: 'Teen (13+)', value: { min: 13, max: 99 } },
];
const interactionLevels = ['High', 'Moderate', 'Low-Moderate', 'Low'];
const dialogueIntensities = ['High', 'Moderate-High', 'Moderate', 'Low-Moderate', 'Low', 'Very Low', 'None'];
const sceneFrequencies = ['Very High', 'High', 'Moderate', 'Low', 'Very Low'];
// Remove the old hardcoded themeOptions array if you want, or keep for fallback

// --- Component Definition ---
const FilterPanel = ({ filters = {}, onFilterChange, onReset }) => { // Accept props, provide default for filters

    // --- Hooks called INSIDE the component ---
    const [availableThemes, setAvailableThemes] = useState([]);
    const [themesLoading, setThemesLoading] = useState(true);

    useEffect(() => {
        const fetchThemes = async () => {
            try {
                setThemesLoading(true);
                const themesData = await getThemes();
                setAvailableThemes(themesData || []);
            } catch (error) {
                console.error("Error fetching themes for filter:", error);
            } finally {
                setThemesLoading(false);
            }
        };
        fetchThemes();
    }, []); // Empty dependency array - fetch themes only once

    // --- Event Handler ---
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        let newFilters = { ...filters }; // Copy filters object from props

        if (type === 'checkbox' && name === 'themes') { // Specific check for theme checkbox
            const currentThemes = filters.themes ? filters.themes.split(',').filter(t=>t) : []; // Ensure array even if empty string
            if (checked) {
                newFilters.themes = [...currentThemes, value].join(',');
            } else {
                newFilters.themes = currentThemes.filter(theme => theme !== value).join(',');
            }
            // Ensure empty string if no themes are selected
             if (newFilters.themes === '') delete newFilters.themes; // Remove key if empty for cleaner filter object


        } else if (name === 'ageRange') {
             try {
                const ageValue = JSON.parse(value);
                // Only include min/max age if not 'Any Age'
                 if (ageValue.min === 0 && ageValue.max === 99) {
                     delete newFilters.minAge;
                     delete newFilters.maxAge;
                 } else {
                    newFilters.minAge = ageValue.min;
                    newFilters.maxAge = ageValue.max;
                 }
             } catch(e) { console.error("Error parsing age value", e); }

        } else if (name === 'stimScoreMin' || name === 'stimScoreMax') {
             // Handle sliders - update the specific min or max
             newFilters[name] = value;
             // Optional: Add validation logic here if needed (e.g., min <= max)

        } else {
            // Handle text input and selects
            if (value === '') {
                 // If a dropdown is set back to "Any" (empty value), remove the filter key
                 delete newFilters[name];
            } else {
                newFilters[name] = value;
            }
        }

        // Call the handler passed from CatalogPage
        if (onFilterChange) { // Check if the prop exists
             onFilterChange(newFilters);
        }
    };

    // REMOVED old handleReset and handleThemeChange functions that used internal state

    // --- JSX Rendering ---
    return (
        <div className="space-y-5">
            {/* 1. Show Name */}
            <div>
                <label htmlFor="showName" className="block text-sm font-medium text-gray-700 mb-1">Show Name</label>
                <input
                    type="text"
                    id="showName"
                    name="search" // Name matches the filter key
                    value={filters.search || ''} // Use value from props
                    onChange={handleChange} // Use unified handler
                    placeholder="Enter title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
            </div>

            {/* 2. Age Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <div className="space-y-1">
                    {ageRanges.map(age => (
                        <div key={age.label} className="flex items-center">
                            <input
                                id={`age-${age.label}`}
                                name="ageRange"
                                type="radio"
                                value={JSON.stringify(age.value)}
                                // Check based on minAge/maxAge from props
                                checked={
                                    (filters.minAge === undefined && age.value.min === 0 && age.value.max === 99) || // Handle "Any Age" default
                                    (String(filters.minAge) === String(age.value.min) && String(filters.maxAge) === String(age.value.max))
                                }
                                onChange={handleChange}
                                className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                            />
                            <label htmlFor={`age-${age.label}`} className="ml-2 block text-sm text-gray-900">
                                {age.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Themes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Themes</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 space-y-1 bg-gray-50">
                    {themesLoading ? (
                        <p className="text-xs text-gray-500">Loading themes...</p>
                    ) : availableThemes.length > 0 ? availableThemes.map(theme => (
                        <div key={theme} className="flex items-center">
                            <input
                                id={`theme-${theme}`}
                                name="themes" // Name matches the key updated in handleChange
                                type="checkbox"
                                value={theme}
                                checked={filters.themes ? filters.themes.split(',').includes(theme) : false} // Check based on props
                                onChange={handleChange} // Use unified handler
                                className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label htmlFor={`theme-${theme}`} className="ml-2 block text-sm text-gray-900">
                                {theme}
                            </label>
                        </div>
                    )) : <p className="text-xs text-gray-500">No themes available.</p>}
                 </div>
            </div>

             {/* 4. Interaction Level */}
            <div>
                <label htmlFor="interactionLevel" className="block text-sm font-medium text-gray-700 mb-1">Interaction Level</label>
                <select
                    id="interactionLevel"
                    name="interactivity" // Name matches the filter key
                    value={filters.interactivity || ''} // Use value from props
                    onChange={handleChange} // Use unified handler
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="How much the show prompts viewer interaction..."
                >
                    <option value="">Any</option>
                    {interactionLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

            {/* 5. Dialogue Intensity */}
             <div>
                <label htmlFor="dialogueIntensity" className="block text-sm font-medium text-gray-700 mb-1">Dialogue Intensity</label>
                <select
                    id="dialogueIntensity"
                    name="dialogue" // Name matches the filter key
                    value={filters.dialogue || ''} // Use value from props
                    onChange={handleChange} // Use unified handler
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="Amount and pace of talking..."
                >
                    <option value="">Any</option>
                     {dialogueIntensities.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

             {/* 6. Scene Frequency */}
             <div>
                <label htmlFor="sceneFrequency" className="block text-sm font-medium text-gray-700 mb-1">Scene Frequency</label>
                <select
                    id="sceneFrequency"
                    name="sceneFreq" // Name matches the filter key
                    value={filters.sceneFreq || ''} // Use value from props
                    onChange={handleChange} // Use unified handler
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="How quickly scenes change..."
                >
                    <option value="">Any</option>
                    {sceneFrequencies.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

             {/* 7. Stimulation Score */}
             <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">
                     Stimulation Score Range
                 </label>
                 {/* Min Score */}
                 <div className='pl-2'>
                      <label htmlFor="stimScoreMin" className="block text-xs font-medium text-gray-700 mb-1">
                         Min: {filters.stimScoreMin || 1}
                     </label>
                     <input
                         type="range"
                         id="stimScoreMin"
                         name="stimScoreMin"
                         min="1" max="5" step="1"
                         value={filters.stimScoreMin || '1'} // Use value from props
                         onChange={handleChange} // Use unified handler
                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                     />
                 </div>
                  {/* Max Score */}
                 <div className='pl-2'>
                      <label htmlFor="stimScoreMax" className="block text-xs font-medium text-gray-700 mb-1">
                         Max: {filters.stimScoreMax || 5}
                     </label>
                     <input
                         type="range"
                         id="stimScoreMax"
                         name="stimScoreMax"
                         min="1" max="5" step="1"
                         value={filters.stimScoreMax || '5'} // Use value from props
                         onChange={handleChange} // Use unified handler
                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                     />
                 </div>
             </div>

            {/* Reset button is now handled in CatalogPage */}
        </div>
    );
};

export default FilterPanel;