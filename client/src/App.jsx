// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Page Components
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ShowDetailPage from './pages/ShowDetailPage';
import ComparePage from './pages/ComparePage'; // <-- Added Import

// Import Layout Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-800">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Core Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shows" element={<CatalogPage />} />
            <Route path="/show/:id" element={<ShowDetailPage />} /> {/* Ensure this uses the actual component */}

            {/* Updated Compare Route */}
            <Route path="/compare" element={<ComparePage />} /> {/* <-- Updated Element */}

            {/* Catch-all Route */}
            <Route path="*" element={<div className="text-red-700 text-center py-10"><h2>404 Page Not Found</h2><p>Sorry, the page you requested does not exist.</p></div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
