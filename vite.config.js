import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-icon.png', 'robots.txt'],
      manifest: {
        name: 'Stadi — Learn Skills. Start Earning.',
        short_name: 'Stadi',
        description: 'Practical vocational courses in 15 Kenyan languages. M-Pesa. Offline access.',
        theme_color: '#1A6B4A',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en-KE',
        categories: ['education', 'productivity'],
        icons: [
          { src: '/logo-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/logo-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          {
            name: 'Browse Courses',
            short_name: 'Courses',
            description: 'Browse all vocational courses',
            url: '/courses',
            icons: [{ src: '/logo-icon.png', sizes: '96x96' }],
          },
          {
            name: 'My Dashboard',
            short_name: 'Dashboard',
            description: 'View your learning progress',
            url: '/dashboard',
            icons: [{ src: '/logo-icon.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        // Cache pages for offline
        runtimeCaching: [
          {
            // API responses — network first, fall back to cache
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stadi-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Unsplash & Google Fonts images
            urlPattern: ({ url }) =>
              url.origin.includes('unsplash.com') ||
              url.origin.includes('fonts.googleapis.com') ||
              url.origin.includes('fonts.gstatic.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'stadi-assets-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // App shell — stale while revalidate for static assets
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stadi-static-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
            },
          },
        ],
        // Pre-cache key routes
        additionalManifestEntries: [
          { url: '/', revision: null },
          { url: '/courses', revision: null },
          { url: '/dashboard', revision: null },
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // set true to test SW in dev
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
});
