import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Manifest is fully defined here; plugin writes it to dist/manifest.json
      manifest: {
        name: 'HealthVault',
        short_name: 'HealthVault',
        description: 'Secure patient records for clinicians',
        start_url: '/',
        display: 'standalone',
        background_color: '#1A3C34',
        theme_color: '#1A3C34',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable variants (safe-zone padding applied by icon-gen script)
          { src: '/icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      // Workbox (generateSW) configuration
      workbox: {
        // Cache the app shell
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ico}'],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API calls — network first, fall back to cache
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],

        // Navigate fallback so the SPA router works offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },

      devOptions: {
        // Enable PWA in dev so you can test the service worker locally
        enabled: true,
        type: 'module',
      },
    }),
  ],

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
