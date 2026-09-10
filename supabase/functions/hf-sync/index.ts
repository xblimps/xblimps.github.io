// Edge Function: back up a posted DB snapshot to private HuggingFace datasets (ported from
// api/hf-sync.ts). The HF token lives server-side only. A signed-in user (any role) is required.
import { createClient } from 'npm:@supabase/supabase-js@^2.108.2'
import { corsHeaders, json } from '../_shared/cors.ts'
// @ts-ignore — pure plain-JS payload builder shared with the CLI + former Vercel fn
import { buildArtifacts } from '../_shared/payload.mjs'
import { pushArtifacts, resolveOrg, resolveToken } from '../_shared/hub.ts'

const URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Require a signed-in user before writing to the org.
  if (URL && SERVICE) {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Not authenticated' }, 401)
    const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: caller } = await admin.auth.getUser(token)
    if (!caller.user) return json({ error: 'Invalid session' }, 401)
  }

  const body = await req.json().catch(() => ({}))
  const db = body.db ?? body
  if (!db || typeof db !== 'object') return json({ error: 'Missing db snapshot' }, 400)

  try {
    const stamp = new Date().toISOString()
    const { artifacts, counts } = buildArtifacts(db, { stamp, org: resolveOrg() })
    const { user, results } = await pushArtifacts(artifacts, { accessToken: resolveToken() })
    return json({ ok: true, user, counts, datasets: results.map((r) => r.name), generated_at: stamp })
  } catch (err) {
    return json({ error: (err as Error)?.message || String(err) }, 500)
  }
})
