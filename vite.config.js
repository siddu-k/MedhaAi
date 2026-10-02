import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    watch: {
      // loose image drops + OneDrive-locked folders must never crash the watcher
      ignored: ['**/mouthmot/**', '**/node_modules/**', '**/dist/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
