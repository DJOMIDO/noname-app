import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const isPlaceholder = (value: string) =>
  !value || value.includes('your-') || value.includes('your_')

export const isSupabaseConfigured = (() => {
  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) return false

  try {
    const url = new URL(supabaseUrl)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
})()

// Keep the client export stable for existing components. The app does not mount
// those components when configuration is invalid.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://configuration.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'invalid-anon-key',
)

export const authRedirectUrl =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '')
