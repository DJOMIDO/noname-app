import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { normalizeNeonUrl } from './src/lib/neonUrl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ variables are inlined into the public bundle, so refuse to build
  // with a Postgres connection string (it contains the database password).
  const neonUrl = normalizeNeonUrl(loadEnv(mode, process.cwd(), 'VITE_').VITE_NEON_URL ?? '')
  if (!neonUrl.ok && neonUrl.reason === 'connection-string') {
    throw new Error(
      'VITE_NEON_URL contains a Postgres connection string with credentials. ' +
        'Use the Data API URL from Neon Console → Postgres database → Data API instead ' +
        '(e.g. https://ep-xxx.apirest.<region>.aws.neon.tech/neondb/rest/v1), ' +
        'and reset the database password if it was ever deployed.',
    )
  }

  return {
    plugins: [
      vue(),
      tailwindcss(),
      // Minimal PWA: installable manifest + app-shell offline precache.
      // No API responses are cached — Neon Data API calls are per-user and
      // would risk stale or cross-user data in the Service Worker cache.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png'],
        manifest: {
          name: 'vivavia',
          short_name: 'vivavia',
          description: 'Log and explore your flight and train journeys.',
          lang: 'en',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#7b5ff1',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            // Glyph occupies ~55% of the canvas, so the maskable safe zone
            // (central 80%) never crops it.
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Precache the built shell only; runtime responses are not cached.
          globPatterns: ['index.html', 'assets/**/*.{js,css,svg,png,woff2}'],
          // The route-map chunk carries maplibre-gl (~1 MB) but can never render
          // offline: its vector tiles come from OpenFreeMap and are deliberately
          // not cached. Precaching it would charge every install 1 MB for a
          // feature that cannot work without a network, so leave it to load on
          // demand the first time the stats tab is opened.
          globIgnores: ['assets/FlightMapChart-*.js', 'assets/FlightMapChart-*.css'],
          navigateFallback: 'index.html',
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      // MapLibre resolves its web worker relative to `import.meta.url`. Vite's
      // pre-bundling rewrites that to node_modules/.vite/deps/, where the
      // worker file does not exist — the worker pool dies and the map renders
      // as an empty background. Serving it as native ESM keeps the worker next
      // to the real dist/ bundle. Only affects dev; the production build is
      // unaffected.
      exclude: ['maplibre-gl'],
    },
  }
})
