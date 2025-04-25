// client/src/components/shared/ScoreVisual.jsx
import React from 'react';

const ScoreVisual = ({ score, maxScore = 5 }) => { // Added maxScore prop with default
    const normalizedScore = score ?? 0; // Default to 0 if score is null/undefined

    // Ensure score doesn't exceed maxScore visually
    const displayScore = Math.min(Math.max(normalizedScore, 0), maxScore);

    return (
        <div className="flex items-center space-x-1" title={`Stimulation Score: ${normalizedScore} out of ${maxScore}`}>
            {[...Array(maxScore)].map((_, i) => (
                <div
                    key={i}
                    // Use displayScore for visual filling
                    className={`h-2 w-3 rounded-sm ${i < displayScore ? 'bg-teal-500' : 'bg-gray-300'}`}
                ></div>
            ))}
            {/* Display the actual normalized score, even if it exceeds maxScore */}
            <span className="text-xs font-semibold ml-1">{normalizedScore}/{maxScore}</span>
        </div>
    );
};

export default ScoreVisual;