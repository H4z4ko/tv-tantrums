// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import Page Components
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ShowDetailPage from './pages/ShowDetailPage';
import ComparePage from './pages/ComparePage';

// Import Layout Components
import Header from './components/Layout/header';
import Footer from './components/Layout/footer';

function App() {
  return (
    <Router>
      {/* Main container with flex column layout and minimum screen height */}
      <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-800 antialiased">
        <Header />
        {/* Main content area that grows, with consistent padding */}
        <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
          <Routes>
            {/* Core Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shows" element={<CatalogPage />} />
            {/* Use :id parameter for dynamic show detail routes */}
            <Route path="/show/:id" element={<ShowDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />

            {/* Catch-all 404 Route - improved styling */}
            <Route
              path="*"
              element={
                <div className="text-center py-16 px-4">
                  <h2 className="text-4xl font-bold text-red-600 mb-3">404</h2>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h3>
                  <p className="text-gray-500 mb-6">Sorry, the page you are looking for does not exist or may have been moved.</p>
                  <Link to="/" className="inline-block px-6 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                    Go Back Home
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;