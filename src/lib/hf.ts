// Client-side trigger for the HuggingFace backup.
//
// IMPORTANT: no HF token lives here. The token is server-only (api/hf-sync.ts). This just posts the
// full in-memory DB — including live, browser-only edits that never reach Postgres in demo mode — to
// the serverless endpoint, which mirrors it to the xBLiMPs org as private datasets. That's how we
// guarantee no information loss regardless of which mode the app is running in.

import { store } from './store'
import { supabase } from './supabase'

export interface BackupResult {
  ok: boolean
  user?: string | null
  counts?: Record<string, number>
  datasets?: string[]
  generated_at?: string
  error?: string
}

export async function backupToHuggingFace(): Promise<BackupResult> {
  let auth: Record<string, string> = {}
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) auth = { Authorization: `Bearer ${token}` }
  }
  const res = await fetch('/api/hf-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ db: store.db }),
  })
  const body = (await res.json().catch(() => ({}))) as BackupResult
  if (!res.ok) return { ok: false, error: body.error || `Backup failed (${res.status})` }
  return body
}
