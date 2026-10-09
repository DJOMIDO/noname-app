import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
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
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }
})
