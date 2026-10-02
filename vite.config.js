import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    open: true,
    watch: {
      // loose image drops + locked files must never crash the watcher
      ignored: ['**/mouthmot/**', '**/MEDHA2D/**', '**/*.png', '**/node_modules/**', '**/dist/**'],
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
