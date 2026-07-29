import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same path shape as production: forward /api/* straight to the local
      // Express server (no rewrite). Uploads are absolute Vercel Blob URLs.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
