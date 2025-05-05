// client/src/pages/ShowDetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getShowById } from '../services/showService';
import ScoreVisual from '../components/shared/ScoreVisual'; // Import ScoreVisual

// Import Chart.js components
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Placeholder image path
const placeholderImage = "/images/placeholder-show.png"; // Make sure this exists

// --- Helper Components ---
const DetailItem = React.memo(({ label, value, children }) => (
    <div className="mb-3 break-words">
        <strong className="text-sm font-semibold text-gray-600 block">{label}:</strong>
        {children ? <div className="text-base text-gray-800 mt-0.5">{children}</div>
                  : <span className="text-base text-gray-800 mt-0.5">{value ?? <span className="text-gray-500 italic">N/A</span>}</span>}
    </div>
));

const ThemeTags = React.memo(({ themes }) => {
    if (!themes || themes.length === 0) return <span className="text-sm text-gray-500 italic">None listed</span>;
    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {themes.map((theme, index) => (
                <span key={index} className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full whitespace-nowrap">{theme}</span>
            ))}
        </div>
    );
});

const InteractionExplanation = React.memo(({ level }) => {
    let explanation = "Interaction level information not available.";
    switch (level?.toLowerCase().trim()) {
        case 'high': explanation = "Frequently asks questions or prompts viewers to participate (e.g., Blue's Clues, Dora)."; break;
        case 'moderate': explanation = "Occasionally encourages participation or has interactive segments."; break;
        case 'low-moderate': explanation = "Limited direct interaction, perhaps some songs or simple call-outs."; break;
        case 'low': explanation = "Primarily passive viewing with little to no direct viewer interaction."; break;
        case 'none': explanation = "No interactive elements are present in this show."; break;
    }
    return <p className="text-gray-700 text-sm mt-1">{explanation}</p>;
});

// --- Main Show Detail Page Component ---
const ShowDetailPage = () => {
    const { id } = useParams();
    const [show, setShow] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Show Data ---
    useEffect(() => {
        const numericId = parseInt(id, 10);
        if (!id || isNaN(numericId) || numericId <= 0) {
            setError("Invalid Show ID provided."); setIsLoading(false); return;
        }
        setIsLoading(true); setError(null); setShow(null);
        const controller = new AbortController();

        getShowById(numericId)
            .then(fetchedShowData => { if (!controller.signal.aborted) {
                if (fetchedShowData) { setShow(fetchedShowData); }
                else { setError(`Show with ID ${numericId} not found.`); }
            }})
            .catch(err => { if (!controller.signal.aborted) setError(err.message || `Failed to load show details.`); })
            .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });

        return () => controller.abort();
    }, [id]);

    // --- Prepare Chart Data using useMemo ---
    const chartData = useMemo(() => {
        if (!show) return { pieData: null, barData: null };
        const factorScores = {
            dialogue: show.dialogue_intensity_num ?? 0, sceneFreq: show.scene_frequency_num ?? 0,
            soundFx: show.sound_effects_level_num ?? 0, music: show.total_music_level_num ?? 0,
        };
        const factorLabels = ['Dialogue', 'Scene Freq.', 'Sound FX', 'Music'];
        const scoresArray = [factorScores.dialogue, factorScores.sceneFreq, factorScores.soundFx, factorScores.music];
        const factorColors = ['rgba(54, 162, 235, 0.7)', 'rgba(255, 159, 64, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
        const factorBorders = factorColors.map(c => c.replace('0.7', '1'));

        const totalScoreSum = scoresArray.reduce((sum, score) => sum + score, 0);
        const piePercentages = totalScoreSum > 0 ? scoresArray.map(score => (score / totalScoreSum) * 100) : [0, 0, 0, 0];
        const pieData = { labels: factorLabels, datasets: [{ label: 'Factor Contribution (%)', data: piePercentages, backgroundColor: factorColors, borderColor: '#ffffff', borderWidth: 1 }] };
        const barData = { labels: factorLabels, datasets: [{ label: `Factor Scores (0-5)`, data: scoresArray, backgroundColor: factorColors, borderColor: factorBorders, borderWidth: 1 }] };
        return { pieData, barData };
    }, [show]);

    // --- Chart Options ---
    const commonChartOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: {size: 11} } },
            title: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } } // For Pie
        },
    }), []);
    const barChartOptions = useMemo(() => ({
        ...commonChartOptions, scales: { y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1 } } },
        plugins: { ...commonChartOptions.plugins, legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.y}` } } } // For Bar
    }), [commonChartOptions]);

    // --- Render Logic ---
    if (isLoading) return <p className="text-center text-lg text-gray-600 py-10 animate-pulse">Loading show details...</p>;
    if (error) return ( <div className="max-w-4xl mx-auto bg-red-50 p-6 md:p-8 rounded-lg shadow-lg border border-red-300 text-center"> <p className="text-red-700 font-semibold mb-2">Error Loading Show</p> <p className="text-red-600">{error}</p> <Link to="/shows" className="mt-4 inline-block px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-100 transition duration-200 text-sm"> ← Back to Catalog </Link> </div> );
    if (!show) return ( <div className="max-w-4xl mx-auto text-center py-10"> <p className="text-gray-500 text-lg">Show data could not be displayed.</p> <Link to="/shows" className="mt-4 inline-block px-4 py-2 border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition duration-200 text-sm"> ← Back to Catalog </Link> </div> );

    const imageUrl = show.image_filename ? `/images/${show.image_filename}` : placeholderImage;
    return (
        <div className="max-w-5xl mx-auto bg-white p-5 md:p-8 rounded-lg shadow-lg border border-gray-100">
            {/* Back Button */}
            <div className="mb-4"> <Link to="/shows" className="text-sm text-teal-600 hover:text-teal-800 hover:underline focus:outline-none focus:ring-1 focus:ring-teal-500 rounded px-1"> ← Back to Catalog </Link> </div>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Image & Key Info */}
                <div className="md:col-span-1 space-y-4">
                    <img src={imageUrl} alt={`${show.title} primary image`} className="rounded-lg shadow-md w-full object-contain border border-gray-200 bg-gray-50 aspect-[3/4]" onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }} loading="lazy" />
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Key Information</h2>
                        <DetailItem label="Target Age Range" value={show.target_age_group} />
                        <DetailItem label="Platform(s)" value={show.platform} />
                        <DetailItem label="Avg. Episode Length" value={show.avg_episode_length} />
                        <DetailItem label="Seasons" value={show.seasons} />
                        <DetailItem label="Overall Stimulation Score"> <ScoreVisual score={show.stimulation_score} /> </DetailItem>
                        <DetailItem label="Themes"> <ThemeTags themes={show.themes} /> </DetailItem>
                    </div>
                </div>
                {/* Right Column: Title, Sensory Details, Charts */}
                 <div className="md:col-span-2 space-y-6">
                     <h1 className="text-3xl md:text-4xl font-bold text-teal-800">{show.title}</h1>
                     <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Sensory Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            <DetailItem label="Dialogue Intensity" value={show.dialogue_intensity} />
                            <DetailItem label="Scene Frequency" value={show.scene_frequency} />
                            <DetailItem label="Sound Effects Level" value={show.sound_effects_level} />
                            <DetailItem label="Music Tempo" value={show.music_tempo} />
                            <DetailItem label="Total Music Level" value={show.total_music_level} />
                             <div className="sm:col-span-2"> <DetailItem label="Interaction Level" value={show.interactivity_level}> <InteractionExplanation level={show.interactivity_level} /> </DetailItem> </div>
                            <DetailItem label="Animation Style" value={show.animation_style} />
                        </div>
                     </div>
                     {/* Charts Section */}
                     {(chartData.pieData || chartData.barData) && (
                        <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Visual Breakdown</h2>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-72 md:h-80">
                                <div className="relative flex flex-col items-center">
                                    <h3 className="text-center text-sm font-medium text-gray-600 mb-2">Factor Contribution</h3>
                                    <div className='w-full h-full max-h-[250px]'> {chartData.pieData ? <Pie data={chartData.pieData} options={commonChartOptions} /> : <p className="err-msg">Data unavailable.</p>} </div>
                                </div>
                                <div className="relative flex flex-col items-center">
                                     <h3 className="text-center text-sm font-medium text-gray-600 mb-2">Factor Scores (0-5)</h3>
                                     <div className='w-full h-full max-h-[250px]'> {chartData.barData ? <Bar data={chartData.barData} options={barChartOptions} /> : <p className="err-msg">Data unavailable.</p>} </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
// Added basic error message class for charts
const ErrMsg = ({ children }) => <p className="text-center text-gray-400 italic text-xs mt-10">{children}</p>;
ShowDetailPage.Err = ErrMsg; // Assign ErrMsg to ShowDetailPage if needed elsewhere (unlikely)

export default ShowDetailPage;