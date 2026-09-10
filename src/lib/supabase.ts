// Supabase client. The app runs in one of two modes:
//   - cloud: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set → real auth + Postgres.
//   - demo:  no env → local-first seed in localStorage (preview without a backend).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloud = Boolean(url && anon)

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

// Absolute URL for a Supabase Edge Function. The SPA is hosted on GitHub Pages (static, no
// serverless), so backend endpoints — invite emails, HF backup — live in Supabase functions and
// must be called by full URL, not a relative "/api/..." path.
export const fnUrl = (name: string): string =>
  url ? `${url.replace(/\/$/, '')}/functions/v1/${name}` : `/api/${name}`
