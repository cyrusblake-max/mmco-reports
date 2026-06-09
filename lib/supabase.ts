/**
 * Tiny Supabase REST wrapper — no SDK needed, no npm install.
 *
 * Setup: in Vercel Env Vars set
 *   NEXT_PUBLIC_SUPABASE_URL       = https://<project>.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJh...   (the long anon JWT)
 *
 * If either is missing, the store falls back to localStorage automatically.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(URL && KEY)

export async function sb<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const headers = new Headers(init.headers)
  headers.set('apikey', KEY)
  headers.set('Authorization', `Bearer ${KEY}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${URL}/rest/v1${path}`, { ...init, headers, cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`)
  }
  // Some Supabase endpoints (DELETE, PATCH no-content) return empty body
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}
