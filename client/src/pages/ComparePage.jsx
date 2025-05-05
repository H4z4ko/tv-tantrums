// client/src/pages/ComparePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getShowList, getShowsForComparison } from '../services/showService';
import ScoreVisual from '../components/shared/ScoreVisual';

// Import Chart.js components
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const placeholderImage = "/images/placeholder-show.png";
const MAX_COMPARE = 3;

// --- Comparison Table Component (Optimized with React.memo) ---
const ComparisonTable = React.memo(({ shows }) => {
    if (!shows || shows.length === 0) return null;

    const renderThemes = (themes) => {
        if (!themes || themes.length === 0) return <span className="text-xs text-gray-400 italic">None</span>;
        const displayThemes = themes.slice(0, 3);
        const hasMore = themes.length > 3;
        return (
            <>
                {displayThemes.map((theme, index) => (
                    <span key={index} className="inline-block bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1 whitespace-nowrap">
                        {theme}
                    </span>
                ))}
                {hasMore && <span className="text-xs text-gray-400" title={`${themes.length - 3} more`}>...</span>}
            </>
        );
    };

    const DetailRow = ({ label, values, renderFunc }) => (
        <tr className="border-b border-gray-200 hover:bg-gray-50 group">
            <td className="py-2.5 px-3 text-sm font-semibold text-gray-600 text-left sticky left-0 bg-white md:bg-gray-50 group-hover:bg-gray-100 z-10 w-1/4 whitespace-nowrap">
                {label}
            </td>
            {values.map((value, index) => (
                <td key={index} className="py-2.5 px-3 text-sm text-gray-700 text-center w-1/4 min-w-[150px]"> {/* Added min-width */}
                    {renderFunc ? renderFunc(value) : (value ?? <span className="text-gray-400 italic">N/A</span>)}
                </td>
            ))}
            {Array(MAX_COMPARE - values.length).fill(null).map((_, i) => <td key={`empty-${i}`} className="py-2.5 px-3 w-1/4 min-w-[150px]"></td>)}
        </tr>
    );

    // Define data points for table rows
    const dataPoints = [
        { label: "Stimulation Score", key: 'stimulation_score', render: (val) => <ScoreVisual score={val ?? 0} /> },
        { label: "Target Age", key: 'target_age_group' },
        { label: "Interactivity", key: 'interactivity_level' },
        { label: "Dialogue Intensity", key: 'dialogue_intensity' },
        { label: "Scene Frequency", key: 'scene_frequency' },
        { label: "Sound Effects Level", key: 'sound_effects_level' },
        { label: "Music Tempo", key: 'music_tempo' },
        { label: "Total Music Level", key: 'total_music_level' },
        { label: "Animation Style", key: 'animation_style' },
        { label: "Themes", key: 'themes', render: renderThemes },
    ];

    const showTitles = shows.map(s => s?.title || 'N/A');
    const showImages = shows.map(s => s?.image_filename ? `/images/${s.image_filename}` : placeholderImage);

    return (
        <div className="mt-8 overflow-x-auto shadow-md rounded-lg border border-gray-200">
            <table className="min-w-full border-collapse bg-white">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="py-3 px-3 text-sm font-semibold text-gray-700 text-left sticky left-0 bg-gray-100 z-20 w-1/4">Feature</th>
                        {showTitles.map((title, index) => (
                            <th key={index} className="py-3 px-3 text-sm font-semibold text-gray-700 text-center align-top w-1/4 min-w-[150px]"> {/* Added min-width */}
                                <img
                                    src={showImages[index]}
                                    alt={`${title} poster`}
                                    className="w-20 h-auto object-contain mx-auto mb-1 rounded shadow-sm border border-gray-200 bg-white"
                                    onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }}
                                    loading="lazy"
                                />
                                {title}
                            </th>
                        ))}
                        {Array(MAX_COMPARE - shows.length).fill(null).map((_, i) => <th key={`empty-h-${i}`} className="py-3 px-3 w-1/4 min-w-[150px]"></th>)}
                    </tr>
                </thead>
                <tbody>
                    {dataPoints.map(dp => (
                        <DetailRow
                            key={dp.label}
                            label={dp.label}
                            values={shows.map(s => s ? s[dp.key] : null)}
                            renderFunc={dp.render}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
});


// --- Main ComparePage Component ---
const ComparePage = () => {
    const [showList, setShowList] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [selectedIds, setSelectedIds] = useState(() => Array(MAX_COMPARE).fill(''));
    const [comparisonData, setComparisonData] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState(null);

    // Fetch show list for dropdowns on mount
    useEffect(() => {
        let isMounted = true;
        setListLoading(true); setListError(null);
        getShowList()
            .then(data => { if (isMounted) setShowList(Array.isArray(data) ? data : []); })
            .catch(err => { if (isMounted) setListError(err.message || "Failed to load show list."); })
            .finally(() => { if (isMounted) setListLoading(false); });
        return () => { isMounted = false; };
    }, []);

    // Fetch comparison data when selected IDs change
    useEffect(() => {
        let isMounted = true;
        const idsToCompare = selectedIds.filter(id => id && String(id).trim() !== '');
        if (idsToCompare.length > 0) {
            setCompareLoading(true); setCompareError(null);
            getShowsForComparison(idsToCompare)
                .then(data => { if (isMounted) setComparisonData(Array.isArray(data) ? data : []); })
                .catch(err => {
                     if (isMounted) {
                         setCompareError(err.message || "Failed to load comparison data.");
                         setComparisonData([]);
                     }
                 })
                .finally(() => { if (isMounted) setCompareLoading(false); });
        } else {
            setComparisonData([]); setCompareError(null); setCompareLoading(false);
        }
        return () => { isMounted = false; };
    }, [selectedIds]);

    // Handler for dropdown selection change
    const handleSelectChange = useCallback((index, event) => {
        const newSelectedId = event.target.value;
        setSelectedIds(prev => {
            const newState = [...prev];
            // Prevent selecting the same show in multiple dropdowns
             if (newSelectedId && newState.some((id, i) => id === newSelectedId && i !== index)) {
                 alert("This show is already selected in another slot."); // Simple user feedback
                 return prev; // Don't update state if already selected
             }
            newState[index] = newSelectedId;
            return newState;
        });
    }, []); // Removed selectedIds dependency as we use functional update

    // --- Prepare Chart Data using useMemo ---
    const comparisonChartData = useMemo(() => {
        if (!comparisonData || comparisonData.length === 0) {
            return { barChartData: null, pieChartDataList: [] };
        }

        // 1. Bar Chart Data (Stimulation Scores)
        const barLabels = comparisonData.map(s => s?.title || 'Unknown');
        const barScores = comparisonData.map(s => s?.stimulation_score ?? 0);
        const barColors = ['rgba(75, 192, 192, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(153, 102, 255, 0.7)'];
        const barBorderColors = barColors.map(c => c.replace('0.7', '1'));

        const barChartData = {
            labels: barLabels,
            datasets: [{
                label: 'Overall Stimulation Score (1-5)', data: barScores,
                backgroundColor: barColors.slice(0, comparisonData.length),
                borderColor: barBorderColors.slice(0, comparisonData.length),
                borderWidth: 1, barThickness: 50, maxBarThickness: 70,
            }]
        };

        // 2. Pie Chart Data (Individual Breakdowns)
        const factorLabels = ['Dialogue', 'Scene Freq.', 'Sound FX', 'Music'];
        const factorColors = [
            'rgba(54, 162, 235, 0.7)', 'rgba(255, 159, 64, 0.7)',
            'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'
        ];

        const pieChartDataList = comparisonData.map(show => {
            if (!show) return null;
            const scores = [
                show.dialogue_intensity_num ?? 0, show.scene_frequency_num ?? 0,
                show.sound_effects_level_num ?? 0, show.total_music_level_num ?? 0
            ];
            const total = scores.reduce((sum, s) => sum + s, 0);
            const percentages = total > 0 ? scores.map(s => (s / total) * 100) : [0, 0, 0, 0];
            return {
                title: show.title,
                data: {
                    labels: factorLabels,
                    datasets: [{
                        label: 'Factor Contribution (%)', data: percentages,
                        backgroundColor: factorColors, borderColor: '#ffffff', borderWidth: 1,
                    }]
                }
            };
        }).filter(Boolean);

        return { barChartData, pieChartDataList };

    }, [comparisonData]);

    // --- Chart Options ---
     const commonPieOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels:{ boxWidth: 10, padding: 10, font: { size: 10 } } },
            title: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
        },
    }), []);

    const barOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, indexAxis: 'x',
        scales: { y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1 } } },
        plugins: {
            legend: { display: false }, title: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}` } }
        }
    }), []);

    // --- Render Selectors ---
    const renderSelectors = () => {
        if (listLoading) return Array.from({ length: MAX_COMPARE }).map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>);
        if (listError) return <div className={`col-span-1 md:col-span-${MAX_COMPARE} text-red-600 p-2 text-center`}>Error loading list: {listError}</div>;
        if (showList.length === 0) return <div className={`col-span-1 md:col-span-${MAX_COMPARE} text-gray-500 p-2 text-center`}>No shows available to compare.</div>;

        return selectedIds.map((selectedId, index) => (
            <div key={index}>
                <label htmlFor={`select-show-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {`Show #${index + 1}`}
                </label>
                <select
                    id={`select-show-${index}`} value={selectedId ?? ''} onChange={(e) => handleSelectChange(index, e)}
                    disabled={listLoading || !!listError}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                     <option value="">-- Select a Show --</option>
                     {showList.map(show => (
                         <option key={show.id} value={show.id} disabled={selectedIds.includes(String(show.id)) && selectedId !== String(show.id)}>
                             {show.title}
                         </option>
                     ))}
                 </select>
            </div>
        ));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center text-teal-700 mb-8">Compare Shows</h1>

            {/* --- Show Selection --- */}
            <div className={`grid grid-cols-1 md:grid-cols-${MAX_COMPARE} gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm`}>
                {renderSelectors()}
            </div>

             {/* --- Comparison Loading/Error/Display Area --- */}
            <div className="mt-6 min-h-[400px]">
                 {compareLoading && <p className="text-center text-gray-500 italic mt-10 text-lg animate-pulse">Loading comparison data...</p>}
                 {compareError && <p className="text-center text-red-600 mt-6 bg-red-100 p-4 rounded border border-red-300">{compareError}</p>}

                 {!compareLoading && !compareError && comparisonData.length === 0 && (
                     <p className="text-center text-gray-500 mt-10 italic text-lg">Select 1 to {MAX_COMPARE} shows above to see the comparison.</p>
                 )}

                 {!compareLoading && !compareError && comparisonData.length > 0 && (
                     <div className='space-y-12'>
                         {/* Comparison Table */}
                         <ComparisonTable shows={comparisonData} />

                         {/* --- Charts Section --- */}
                         <div className="space-y-10">
                             {/* Bar Chart: Overall Score Comparison */}
                             {comparisonChartData.barChartData && (
                                <div className="border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm bg-white">
                                    <h2 className="text-xl font-semibold text-center text-gray-700 mb-5">Overall Stimulation Score Comparison</h2>
                                    <div className="relative h-80 max-w-2xl mx-auto"> {/* Constrain width */}
                                        <Bar data={comparisonChartData.barChartData} options={barOptions} />
                                    </div>
                                </div>
                             )}
                             {/* Pie Charts: Individual Breakdowns */}
                             {comparisonChartData.pieChartDataList.length > 0 && (
                                <div className="border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm bg-white">
                                    <h2 className="text-xl font-semibold text-center text-gray-700 mb-5">Sensory Profile Breakdown Comparison</h2>
                                    <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(comparisonChartData.pieChartDataList.length, 3)} gap-6 md:gap-8 items-start`}>
                                        {comparisonChartData.pieChartDataList.map((pieData, index) => (
                                             <div key={index} className="text-center flex flex-col items-center">
                                                 <h3 className="text-base font-medium text-gray-700 mb-2 truncate w-full px-2" title={pieData.title}>{pieData.title}</h3>
                                                 <div className="relative h-60 md:h-64 w-full max-w-[280px]">
                                                     <Pie data={pieData.data} options={commonPieOptions} />
                                                 </div>
                                             </div>
                                         ))}
                                    </div>
                                </div>
                             )}
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default ComparePage;