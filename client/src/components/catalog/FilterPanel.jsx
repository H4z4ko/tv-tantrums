// client/src/components/catalog/FilterPanel.jsx
import React, { useState, useEffect } from 'react'; // Standard React imports
import { getThemes } from '../../services/showService'; // To fetch the list of themes

// --- Constants defined OUTSIDE the component (Makes them reusable and keeps component clean) ---
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

// --- Component Definition ---
// We define the component's logic here.
// It receives properties (props) from its parent (CatalogPage):
// - filters: The current filter values (except search) derived from the URL
// - onFilterChange: A function to call when a NON-search filter changes
// - searchInputValue: The current text typed into the search box
// - onSearchInputChange: A function to call specifically when the search box text changes
const FilterPanelComponent = ({ filters = {}, onFilterChange, searchInputValue, onSearchInputChange }) => {
    // console.log("Rendering FilterPanel. Filters:", filters, "SearchVal:", searchInputValue); // For debugging if needed

    // State for loading themes list
    const [availableThemes, setAvailableThemes] = useState([]);
    const [themesLoading, setThemesLoading] = useState(true);

    // Effect to fetch themes when the component first loads
    useEffect(() => {
        const fetchThemes = async () => {
            try {
                setThemesLoading(true);
                const themesData = await getThemes();
                setAvailableThemes(themesData || []);
            } catch (error) {
                console.error("Error fetching themes for filter:", error);
                // Optionally show an error message to the user here
            } finally {
                setThemesLoading(false);
            }
        };
        fetchThemes();
    }, []); // Empty array means this runs only once on mount

    // --- Event Handler for NON-Search Filters ---
    // This function runs when you change things like Age Range, Themes checkboxes, dropdowns, sliders
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        // Make a copy of the current filters (passed in via props)
        // Exclude 'search' as it's handled separately by onSearchInputChange
        const currentNonSearchFilters = { ...filters };
        delete currentNonSearchFilters.search;

        let updatedFilters = { ...currentNonSearchFilters }; // Start with non-search filters

        // Logic for handling different types of inputs
        if (type === 'checkbox' && name === 'themes') {
            const currentThemes = filters.themes ? filters.themes.split(',').filter(t => t) : [];
            if (checked) {
                updatedFilters.themes = [...currentThemes, value].join(',');
            } else {
                updatedFilters.themes = currentThemes.filter(theme => theme !== value).join(',');
            }
            if (!updatedFilters.themes) delete updatedFilters.themes; // Remove key if empty

        } else if (name === 'ageRange') {
             try {
                const ageValue = JSON.parse(value);
                 if (ageValue.min === 0 && ageValue.max === 99) { // "Any Age" selected
                     delete updatedFilters.minAge;
                     delete updatedFilters.maxAge;
                 } else {
                    updatedFilters.minAge = ageValue.min;
                    updatedFilters.maxAge = ageValue.max;
                 }
             } catch(e) { console.error("Error parsing age value", e); }

        } else if (name === 'stimScoreMin' || name === 'stimScoreMax') {
            const newValue = parseInt(value, 10);
            updatedFilters[name] = newValue;

            // Ensure min <= max logic (as before)
            const currentMin = parseInt(updatedFilters.stimScoreMin || filters.stimScoreMin || '1', 10);
            const currentMax = parseInt(updatedFilters.stimScoreMax || filters.stimScoreMax || '5', 10);
            if (name === 'stimScoreMin' && newValue > currentMax) {
                updatedFilters.stimScoreMax = newValue;
            } else if (name === 'stimScoreMax' && newValue < currentMin) {
                updatedFilters.stimScoreMin = newValue;
            }
        } else {
            // Handle selects/dropdowns
            if (value === '') { // If "Any" is selected
                 delete updatedFilters[name];
            } else {
                updatedFilters[name] = value;
            }
        }

        // Call the onFilterChange function (passed from CatalogPage)
        // This tells CatalogPage about the changes to NON-search filters
        if (onFilterChange) {
             onFilterChange(updatedFilters);
        }
    };

    // --- JSX Rendering (What the component looks like) ---
    return (
        <div className="space-y-5 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"> {/* Added some padding/styling */}

            {/* 1. Show Name Input */}
            <div>
                <label htmlFor="showName" className="block text-sm font-medium text-gray-700 mb-1">Show Name</label>
                <input
                    type="text"
                    id="showName"
                    name="search" // HTML attribute, not directly used for filtering logic here
                    value={searchInputValue} // Display the value from CatalogPage's local search state
                    onChange={onSearchInputChange} // Call the specific handler from CatalogPage when typing
                    placeholder="Enter title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
            </div>

            {/* 2. Age Range Radios */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <div className="space-y-1">
                    {ageRanges.map(age => (
                        <div key={age.label} className="flex items-center">
                            <input
                                id={`age-${age.label}`}
                                name="ageRange" // Used by `handleChange`
                                type="radio"
                                value={JSON.stringify(age.value)}
                                // Determine if checked based on `filters` prop from CatalogPage
                                checked={
                                    (filters.minAge === undefined && age.value.min === 0 && age.value.max === 99) ||
                                    (String(filters.minAge) === String(age.value.min) && String(filters.maxAge) === String(age.value.max))
                                }
                                onChange={handleChange} // Use the generic handler for non-search filters
                                className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                            />
                            <label htmlFor={`age-${age.label}`} className="ml-2 block text-sm text-gray-900">
                                {age.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Themes Checkboxes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Themes</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 space-y-1 bg-gray-50">
                    {themesLoading ? (
                        <p className="text-xs text-gray-500 italic">Loading themes...</p>
                    ) : availableThemes.length > 0 ? availableThemes.map(theme => (
                        <div key={theme} className="flex items-center">
                            <input
                                id={`theme-${theme}`}
                                name="themes" // Used by `handleChange`
                                type="checkbox"
                                value={theme}
                                // Determine if checked based on `filters` prop from CatalogPage
                                checked={filters.themes ? filters.themes.split(',').includes(theme) : false}
                                onChange={handleChange} // Use the generic handler
                                className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <label htmlFor={`theme-${theme}`} className="ml-2 block text-sm text-gray-900">
                                {theme}
                            </label>
                        </div>
                    )) : <p className="text-xs text-gray-500 italic">No themes available.</p>}
                 </div>
            </div>

             {/* 4. Interaction Level Dropdown */}
            <div>
                <label htmlFor="interactionLevel" className="block text-sm font-medium text-gray-700 mb-1">Interaction Level</label>
                <select
                    id="interactionLevel"
                    name="interactivity" // Used by `handleChange`, corresponds to filter key
                    value={filters.interactivity || ''} // Display value based on `filters` prop
                    onChange={handleChange} // Use the generic handler
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="How much the show prompts viewer interaction..."
                >
                    <option value="">Any</option>
                    {interactionLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

            {/* 5. Dialogue Intensity Dropdown */}
             <div>
                <label htmlFor="dialogueIntensity" className="block text-sm font-medium text-gray-700 mb-1">Dialogue Intensity</label>
                <select
                    id="dialogueIntensity"
                    name="dialogue" // Used by `handleChange`
                    value={filters.dialogue || ''} // Display value based on `filters` prop
                    onChange={handleChange} // Use the generic handler
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="Amount and pace of talking..."
                >
                    <option value="">Any</option>
                     {dialogueIntensities.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

             {/* 6. Scene Frequency Dropdown */}
             <div>
                <label htmlFor="sceneFrequency" className="block text-sm font-medium text-gray-700 mb-1">Scene Frequency</label>
                <select
                    id="sceneFrequency"
                    name="sceneFreq" // Used by `handleChange`
                    value={filters.sceneFreq || ''} // Display value based on `filters` prop
                    onChange={handleChange} // Use the generic handler
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                    title="How quickly scenes change..."
                >
                    <option value="">Any</option>
                    {sceneFrequencies.map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

             {/* 7. Stimulation Score Sliders */}
             <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">
                     Stimulation Score Range
                 </label>
                 {/* Min Score */}
                 <div className='pl-2'>
                      <label htmlFor="stimScoreMin" className="block text-xs font-medium text-gray-700 mb-1">
                         Min: {filters.stimScoreMin || 1} {/* Display value based on `filters` prop */}
                     </label>
                     <input
                         type="range"
                         id="stimScoreMin"
                         name="stimScoreMin" // Used by `handleChange`
                         min="1" max="5" step="1"
                         value={filters.stimScoreMin || '1'} // Display value based on `filters` prop
                         onChange={handleChange} // Use the generic handler
                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                     />
                 </div>
                  {/* Max Score */}
                 <div className='pl-2'>
                      <label htmlFor="stimScoreMax" className="block text-xs font-medium text-gray-700 mb-1">
                         Max: {filters.stimScoreMax || 5} {/* Display value based on `filters` prop */}
                     </label>
                     <input
                         type="range"
                         id="stimScoreMax"
                         name="stimScoreMax" // Used by `handleChange`
                         min="1" max="5" step="1"
                         value={filters.stimScoreMax || '5'} // Display value based on `filters` prop
                         onChange={handleChange} // Use the generic handler
                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                     />
                 </div>
             </div>

            {/* Reset button is handled in CatalogPage, not here */}
        </div>
    );
};

// Wrap the component with React.memo for performance optimization.
// This prevents re-rendering if the props haven't changed.
const FilterPanel = React.memo(FilterPanelComponent);

export default FilterPanel; // Export the optimized version