// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests starting with /api to backend server
      '/api': { // Requests starting with /api/...
        target: 'http://localhost:3001', // Your backend address
        changeOrigin: true, // Recommended
        secure: false, // Change to true if backend uses HTTPS
      }
    }
  }
})