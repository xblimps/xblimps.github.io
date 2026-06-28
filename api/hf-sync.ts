// Vercel serverless function: back up a posted DB snapshot to private HuggingFace datasets.
//
// The HF token lives here (server-side) — NEVER in the SPA bundle. The app posts its full in-memory
// DB (store.db) to this endpoint, which mirrors it to the xBLiMPs org as private datasets. This is
// the path that captures live, browser-only edits (demo mode keeps everything in localStorage).
//
// If Supabase is configured we require a valid signed-in user (any role) to avoid an open write to
// the org; in demo mode (no Supabase) there is no auth to check, so we allow it.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore — plain-JS shared modules (also used by scripts/hf-sync.ts)
import { buildArtifacts } from '../scripts/hf/payload.mjs'
// @ts-ignore
import { pushArtifacts, resolveOrg, resolveToken } from '../scripts/hf/hub.mjs'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // If a backend exists, only signed-in users may trigger a backup.
  if (URL && SERVICE) {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: caller } = await admin.auth.getUser(token)
    if (!caller.user) return res.status(401).json({ error: 'Invalid session' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const db = body.db ?? body
  if (!db || typeof db !== 'object') return res.status(400).json({ error: 'Missing db snapshot' })

  try {
    const stamp = new Date().toISOString()
    const { artifacts, counts } = buildArtifacts(db, { stamp, org: resolveOrg() })
    const { user, results } = await pushArtifacts(artifacts, { accessToken: resolveToken() })
    return res.status(200).json({ ok: true, user, counts, datasets: results.map((r: any) => r.name), generated_at: stamp })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) })
  }
}
