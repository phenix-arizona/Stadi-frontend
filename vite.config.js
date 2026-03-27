// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'stadi-frontend-production.up.railway.app',
      '.railway.app', // allows all railway subdomains
    ],
  },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 800 },
});