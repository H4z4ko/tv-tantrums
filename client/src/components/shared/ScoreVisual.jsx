// client/src/components/shared/ScoreVisual.jsx
import React from 'react';

const ScoreVisual = ({ score, maxScore = 5, label = "Stimulation Score" }) => {
    // Handle potential null/undefined score, default to 0
    const normalizedScore = score ?? 0;

    // Ensure score doesn't visually exceed maxScore or go below 0
    const displayScore = Math.min(Math.max(normalizedScore, 0), maxScore);

    // Determine color based on score (example thresholds)
    let barColorClass = 'bg-gray-300'; // Default for unfilled bars
    let textColorClass = 'text-gray-700';
    if (normalizedScore <= 2) {
        barColorClass = 'bg-green-500'; // Low stimulation
        textColorClass = 'text-green-700';
    } else if (normalizedScore <= 3) { // Adjusted threshold slightly
        barColorClass = 'bg-yellow-500'; // Moderate stimulation
        textColorClass = 'text-yellow-700';
    } else {
        barColorClass = 'bg-red-500'; // High stimulation
        textColorClass = 'text-red-700';
    }

    const tooltipText = `${label}: ${normalizedScore} out of ${maxScore}`;

    return (
        // Add tooltip title to the container
        <div className="flex items-center space-x-1" title={tooltipText}>
            {/* Render the bars */}
            {[...Array(maxScore)].map((_, i) => (
                <div
                    key={i}
                    // Apply color if index is less than the score to display
                    className={`h-2.5 w-4 rounded-sm transition-colors duration-300 ${i < displayScore ? barColorClass : 'bg-gray-300'}`} // Slightly larger bars, added transition
                ></div>
            ))}
            {/* Display the numeric score, colored based on level */}
            <span className={`text-xs font-semibold ml-1.5 ${textColorClass}`}>{normalizedScore}/{maxScore}</span>
        </div>
    );
};

export default ScoreVisual;