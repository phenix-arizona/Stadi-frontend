import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-icon.png'],
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
          // FIX: 'any' avoids the "Resource size is not correct" error
          // when you only have one logo-icon.png that isn't exactly 192x192 or 512x512
          { src: '/logo-icon.png', sizes: 'any', type: 'image/png', purpose: 'any'      },
          { src: '/logo-icon.png', sizes: 'any', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Browse Courses', short_name: 'Courses',   url: '/courses',   icons: [{ src: '/logo-icon.png', sizes: 'any' }] },
          { name: 'My Dashboard',   short_name: 'Dashboard', url: '/dashboard', icons: [{ src: '/logo-icon.png', sizes: 'any' }] },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // API — network first, cache fallback
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'stadi-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // External images & fonts
            urlPattern: ({ url }) =>
              url.origin.includes('unsplash.com')        ||
              url.origin.includes('fonts.googleapis.com') ||
              url.origin.includes('fonts.gstatic.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'stadi-assets-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Static assets — stale while revalidate
            urlPattern: ({ request }) =>
              request.destination === 'script' ||
              request.destination === 'style'  ||
              request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stadi-static-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
        // FIX: This is the key fix for the MIME type error.
        // navigateFallback tells the SW to serve index.html for SPA navigation,
        // but the denylist prevents it from intercepting actual JS/CSS asset requests
        // (which would cause the server to return index.html with MIME type text/html
        // for a script — exactly the error you saw).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,       // never intercept API calls
          /\.\w{2,5}$/,     // never intercept requests for actual files (.js, .css, .png etc)
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
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