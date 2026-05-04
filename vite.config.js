import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa'; // npm install vite-plugin-pwa

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // FIX: Generate /sw.js and wire up the manifest.
    // Without this, /sw.js returns 404 — the missing file that
    // triggers the broken-SW → stale-cache → React #418 chain.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,         // we handle registration in main.jsx
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      // Keep using /public/manifest.json — we manage it manually so we can
      // include Kenyan-language metadata and custom shortcuts.
      // The apple-touch-icon.png is generated from favicon.svg at build time
      // via the scripts/generate-icons.js helper (run once, commit the output).
      manifest: false,
    }),
  ],
  resolve: { alias: { '@': path.resolve(rootDir, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        timeout: 30000,
      },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
});
