import { createClient, defaultDeriveNeonUrls, SupabaseAuthAdapter } from '@neondatabase/neon-js'
import { normalizeNeonUrl, type NeonUrlResult } from './neonUrl'

const normalized = normalizeNeonUrl(String(import.meta.env.VITE_NEON_URL || ''))

// Derives the Neon Auth and Data API endpoints from the database base URL.
const deriveUrls = (result: NeonUrlResult) => {
  if (!result.ok) return null

  try {
    return defaultDeriveNeonUrls(result.baseUrl)
  } catch {
    return null
  }
}

const neonUrls = deriveUrls(normalized)

export const isNeonConfigured = neonUrls !== null

// Why the configuration was rejected, for ConfigurationError.vue.
export const neonConfigError = normalized.ok ? (neonUrls ? null : 'invalid') : normalized.reason

// Keep the client export stable for existing components. The app does not mount
// those components when configuration is invalid.
export const client = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: neonUrls?.auth ?? 'https://configuration.invalid/auth',
  },
  dataApi: {
    url: neonUrls?.dataApi ?? 'https://configuration.invalid/rest/v1',
  },
})

export const authRedirectUrl =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
