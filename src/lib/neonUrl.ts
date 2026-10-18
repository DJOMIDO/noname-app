// Shared by src/lib/neon.ts (runtime) and vite.config.ts (build-time guard),
// so keep this file free of browser- and Vite-specific APIs.

export type NeonUrlResult =
  | { ok: true; baseUrl: string }
  | { ok: false; reason: 'missing' | 'connection-string' | 'missing-database' | 'invalid' }

const isPlaceholder = (value: string) =>
  !value || value.includes('your-') || value.includes('your_')

// Accepts every URL shape the Neon Console shows, provided it carries the
// database name — that name is what the Auth and Data API endpoints are
// derived from, so it cannot be recovered from the host alone:
//   base        https://ep-xxx.<region>.aws.neon.tech/dbname
//   Data API    https://ep-xxx.apirest.<region>.aws.neon.tech/dbname/rest/v1
//   Auth        https://ep-xxx.neonauth.<region>.aws.neon.tech/dbname/auth
//   pooled host https://ep-xxx-pooler.<region>.aws.neon.tech/dbname
// Returns the database base URL that @neondatabase/neon-js derives its
// endpoints from.
// Postgres connection strings are rejected: they carry the database password,
// and every VITE_ variable is inlined into the public JavaScript bundle.
export const normalizeNeonUrl = (raw: string): NeonUrlResult => {
  const value = raw.trim()
  if (isPlaceholder(value)) return { ok: false, reason: 'missing' }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  if (url.protocol === 'postgres:' || url.protocol === 'postgresql:' || url.username || url.password) {
    return { ok: false, reason: 'connection-string' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, reason: 'invalid' }

  const labels = url.hostname.split('.')
  labels[0] = labels[0].replace(/-pooler$/, '')
  if (labels[1] === 'apirest' || labels[1] === 'neonauth') labels.splice(1, 1)
  const host = labels.join('.') + (url.port ? `:${url.port}` : '')

  const path = url.pathname.replace(/\/+$/, '').replace(/\/(rest\/v1|auth)$/, '')
  if (!path) return { ok: false, reason: 'missing-database' }

  return { ok: true, baseUrl: `${url.protocol}//${host}${path}` }
}
