import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies API + Socket.io to the Express backend on :4000
// so the browser talks to one origin (no CORS friction locally).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:4000', ws: true, changeOrigin: true },
    },
  },
});