// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Port for the Vite development server (frontend)
    port: 5173, // Explicitly set frontend port (default is often 5173)
    // Proxy API requests to the backend server
    proxy: {
      // Requests starting with /api/... will be forwarded
      '/api': {
        target: 'http://localhost:3001', // Your backend server address (running on port 3001)
        changeOrigin: true, // Recommended for virtual hosted sites and avoids CORS issues in dev
        secure: false, // Set to true if your backend uses HTTPS
        // Optional: Add logging for proxied requests
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Vite Proxy] Forwarding request: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
          });
           proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy] Error:', err);
           });
        },
      }
    }
  }
})