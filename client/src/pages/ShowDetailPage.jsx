// client/src/pages/ShowDetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useParams, Link } from 'react-router-dom';
import { getShowById } from '../services/showService';
import { Pie } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const placeholderImage = "/images/placeholder-show.png";

const ShowDetailPage = () => {
    const { id } = useParams();
    const [show, setShow] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Removed chart data state - will use memoized variables directly

    console.log("Rendering ShowDetailPage (Memo Fix Attempt). isLoading:", isLoading, "Error:", error);

    // --- Fetch Show Data ---
    useEffect(() => {
        console.log("ShowDetailPage (Memo Fix Attempt) Effect Running for ID:", id);
        if (!id) {
            setIsLoading(false);
            setError("No Show ID provided.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setShow(null); // Reset show data

        getShowById(id)
            .then(fetchedShowData => {
                console.log("Fetched Show Detail Data:", fetchedShowData);
                // ** Only set show data and loading state here **
                setShow(fetchedShowData || null); // Set to null if fetch returns nothing
                setIsLoading(false);
            })
            .catch(err => {
                console.error("ShowDetailPage (Memo Fix Attempt) fetch error:", err);
                setError(err.message || `Failed to load show with ID ${id}.`);
                setShow(null);
                setIsLoading(false);
            });

        return () => {
            console.log("ShowDetailPage (Memo Fix Attempt) Effect Cleanup for ID:", id);
        };
    }, [id]); // Depend only on ID

    // --- Prepare Chart Data using useMemo ---
    const pieChartData = useMemo(() => {
        if (!show) return null; // Return null if show data isn't loaded yet
        console.log("Memoizing Pie Chart Data"); // Log memo calculation

        const dialogueScore = show.dialogue_intensity_num ?? 0;
        const sceneFreqScore = show.scene_frequency_num ?? 0;
        const soundFxScore = show.sound_effects_level_num ?? 0;
        const musicScore = show.total_music_level_num ?? 0;
        const totalScoreSum = dialogueScore + sceneFreqScore + soundFxScore + musicScore;
        let piePercentages = [0, 0, 0, 0];
        if (totalScoreSum > 0) {
            piePercentages = [
                (dialogueScore / totalScoreSum) * 100,
                (sceneFreqScore / totalScoreSum) * 100,
                (soundFxScore / totalScoreSum) * 100,
                (musicScore / totalScoreSum) * 100,
            ];
        }
        return {
            labels: ['Dialogue', 'Scene Freq.', 'Sound FX', 'Music'],
            datasets: [{
                label: 'Approx. Contribution by Factor Score',
                data: piePercentages,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: '#ffffff', borderWidth: 1,
            }]
        };
    }, [show]); // Recalculate only when show data changes

    const barChartData = useMemo(() => {
        if (!show) return null; // Return null if show data isn't loaded yet
        console.log("Memoizing Bar Chart Data"); // Log memo calculation

        return {
            labels: ['Dialogue', 'Scene Freq.', 'Sound FX', 'Music'],
            datasets: [{
                label: show.title || 'This Show',
                data: [
                    show.dialogue_intensity_num ?? 0, show.scene_frequency_num ?? 0,
                    show.sound_effects_level_num ?? 0, show.total_music_level_num ?? 0
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1,
            }]
        };
    }, [show]); // Recalculate only when show data changes


    // --- Chart Options (remain the same) ---
    const chartOptions = {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: false } },
    };
    const barChartOptions = {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: false } }, scales: { y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1 } } }
    };


    // --- Render Logic ---
    if (isLoading) {
        return <p className="text-center text-lg text-gray-600 py-10">Loading show details...</p>;
    }
    if (error) {
        return <p className="text-center text-red-600 bg-red-100 p-4 rounded border border-red-300">{error}</p>;
    }
    if (!show) {
         return <p className="text-center text-gray-500 py-10">Show data not available.</p>;
    }

    // Determine image URL
    const imageUrl = show.image_filename ? `/images/${show.image_filename}` : placeholderImage;

    // Helper function (remains the same)
    const getInteractionExplanation = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return "This show frequently asks questions or prompts viewers to participate (like Blue's Clues or Dora).";
            case 'moderate': return "This show occasionally encourages participation or has interactive segments.";
            case 'low-moderate': return "This show has limited direct interaction, perhaps some songs or simple call-outs.";
            case 'low': return "This show is primarily passive viewing with little to no direct viewer interaction.";
            default: return "Interaction level information not available.";
        }
    };


    // --- JSX Output with Charts using memoized data ---
    return (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 border-b pb-6">
                <div className="md:w-1/3 flex-shrink-0">
                     <img
                        src={imageUrl}
                        alt={`${show.title} primary image`}
                        className="rounded-lg shadow-md w-full object-contain mb-3 bg-gray-100"
                        onError={(e) => { e.target.onerror = null; e.target.src=placeholderImage }}
                     />
                </div>
                <div className="md:w-2/3">
                     <h1 className="text-3xl md:text-4xl font-bold text-teal-800 mb-2">{show.title}</h1>
                    <p className="text-lg text-gray-600 mb-3">
                        <strong>Age Range:</strong> {show.target_age_group}
                    </p>
                    <div className="mb-4">
                        <strong className="text-gray-700">Themes:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {show.themes && show.themes.length > 0 ? show.themes.map((theme, index) => (
                                <span key={index} className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
                                    {theme}
                                </span>
                            )) : <span className="text-sm text-gray-500 italic">None listed</span>}
                        </div>
                    </div>
                     <p className="text-md text-gray-600">
                         <strong>Platform:</strong> {show.platform || 'N/A'}
                     </p>
                      <p className="text-md text-gray-600">
                         <strong>Avg. Episode Length:</strong> {show.avg_episode_length || 'N/A'}
                     </p>
                     {show.seasons && <p className="text-md text-gray-600"><strong>Seasons:</strong> {show.seasons}</p>}
                </div>
            </div>

            {/* Visual Summaries Section - WITH CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Pie Chart Section */}
                <div className="border p-4 rounded-lg shadow-sm">
                     <h2 className="text-xl font-semibold text-center mb-4 text-teal-700">Stimulation Breakdown</h2>
                     <div className="relative h-64 md:h-80">
                         {/* Use memoized data */}
                         {pieChartData ? (
                             <Pie data={pieChartData} options={chartOptions} />
                         ) : (
                             <p className="text-center text-gray-400 italic mt-10">Loading chart...</p>
                         )}
                     </div>
                </div>

                {/* Bar Chart Section */}
                 <div className="border p-4 rounded-lg shadow-sm">
                     <h2 className="text-xl font-semibold text-center mb-4 text-teal-700">Sensory Factor Levels</h2>
                     <div className="relative h-64 md:h-80">
                         {/* Use memoized data */}
                         {barChartData ? (
                             <Bar data={barChartData} options={barChartOptions} />
                         ) : (
                             <p className="text-center text-gray-400 italic mt-10">Loading chart...</p>
                         )}
                     </div>
                </div>
            </div>

             {/* Interaction Level & Narrative Summary */}
             <div className="space-y-6">
                 <div className="border p-4 rounded-lg shadow-sm bg-teal-50">
                     <h2 className="text-xl font-semibold mb-2 text- teal-700">Interaction Level: {show.interactivity_level || 'N/A'}</h2>
                     <p className="text-gray-700">{getInteractionExplanation(show.interactivity_level)}</p>
                 </div>
                 <div className="border p-4 rounded-lg shadow-sm">
                     <h2 className="text-xl font-semibold mb-2 text-gray-700">Summary & Sensory Notes</h2>
                     <p className="text-gray-600 italic">(Detailed narrative summary...)</p>
                     <p className='mt-2 text-sm text-gray-600'><strong>Animation Style:</strong> {show.animation_style || 'N/A'}</p>
                 </div>
             </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
                <Link to="/shows" className="inline-block px-6 py-2 border border-teal-600 text-teal-600 rounded hover:bg-teal-50 transition duration-200">
                    ← Back to Catalog
                </Link>
            </div>
        </div>
    );
};

export default ShowDetailPage;
