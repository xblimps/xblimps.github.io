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
