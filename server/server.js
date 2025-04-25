// server/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDatabase, closeDatabase } = require('./db/connection'); // Import DB connection functions
const apiRouter = require('./api'); // Import the main API router

const app = express();
const port = process.env.PORT || 3001;

// --- Connect to Database ---
connectDatabase((err) => {
    if (err) {
        console.error("Failed to connect to database on startup. Server shutting down.");
        process.exit(1); // Exit if DB connection fails initially
    }

    // --- Start Server Only After DB Connection ---
    // Middleware Setup
    app.use(cors()); // Enable CORS for all origins (adjust if needed for production)
    app.use(express.json()); // Middleware to parse JSON bodies

    // Request Logging Middleware
    app.use((req, res, next) => {
        console.log(`Server Request: ${req.method} ${req.originalUrl}`);
        next();
    });

    // --- API Routes ---
    app.use('/api', apiRouter); // Mount all API routes under /api

    // --- Static Files (If serving frontend build from backend) ---
    // Uncomment if you build the React app and want Node to serve it
    // app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    // app.get('*', (req, res) => {
    //     if (!req.originalUrl.startsWith('/api')) {
    //         res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    //     } else {
    //         next(); // Important for API 404s below
    //     }
    // });

    // --- API 404 Handling (Not Found) ---
    // This middleware runs only if no API route above matched
    app.use('/api', (req, res, next) => {
        console.log(`API route not found: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl.split('?')[0]}` });
    });

    // --- General Error Handling Middleware ---
    // Catches errors from routes or other middleware
    app.use((err, req, res, next) => {
        console.error("Unhandled application error:", err.stack);
        // Avoid sending detailed errors in production
        const statusCode = err.status || 500;
        const message = process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message;
        res.status(statusCode).json({ error: message || 'Something went wrong on the server!' });
    });

    // --- Start Listening ---
    const server = app.listen(port, () => {
        console.log(`Backend server listening at http://localhost:${port}`);
    });

    // --- Graceful Shutdown ---
    const gracefulShutdown = (signal) => {
        console.log(`\n${signal} received. Closing server...`);
        server.close(() => {
            console.log('HTTP server closed.');
            closeDatabase((closeErr) => {
                if (closeErr) {
                    console.error("Error closing database during shutdown:", closeErr);
                    process.exit(1);
                } else {
                    console.log("Database connection closed. Exiting.");
                    process.exit(0);
                }
            });
        });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // CTRL+C
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // kill command

}); // End of connectDatabase callback