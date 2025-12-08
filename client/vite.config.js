import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    },
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  build: {
    sourcemap: false
  },
  css: {
    devSourcemap: false
  },
  // Suppress sourcemap warnings for face-api.js
  logLevel: 'info'
})
