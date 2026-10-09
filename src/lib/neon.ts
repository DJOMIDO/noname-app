import { createClient, defaultDeriveNeonUrls, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const neonUrl = String(import.meta.env.VITE_NEON_URL || '').trim()

const isPlaceholder = (value: string) =>
  !value || value.includes('your-') || value.includes('your_')

// Derives the Neon Auth and Data API endpoints from the database base URL.
// Returns null when the URL is missing, a placeholder, or not a Neon URL.
const deriveUrls = (value: string) => {
  if (isPlaceholder(value)) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return defaultDeriveNeonUrls(value)
  } catch {
    return null
  }
}

const neonUrls = deriveUrls(neonUrl)

export const isNeonConfigured = neonUrls !== null

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
