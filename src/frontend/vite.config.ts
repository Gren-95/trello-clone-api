import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7000,
    strictPort: false, // Allow fallback to next available port
    host: true, // Listen on all local IPs
    open: true, // Automatically open the browser
  },
})
