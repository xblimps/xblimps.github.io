// Edge Function: invite a contributor by email (ported from api/invite.ts).
//
// Uses the service-role key (auto-injected as SUPABASE_SERVICE_ROLE_KEY) to send a magic-link
// invite and stamp access metadata. Only a signed-in coordinator may call this — we verify the
// caller's JWT and role server-side first.
import { createClient } from 'npm:@supabase/supabase-js@^2.108.2'
import { corsHeaders, json } from '../_shared/cors.ts'

const URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!URL || !SERVICE) return json({ error: 'Server not configured (missing SUPABASE_SERVICE_ROLE_KEY)' }, 500)

  const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })

  // verify caller is a coordinator
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return json({ error: 'Not authenticated' }, 401)
  const { data: caller } = await admin.auth.getUser(token)
  if (!caller.user) return json({ error: 'Invalid session' }, 401)
  const { data: prof } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle()
  if (prof?.role !== 'coordinator') return json({ error: 'Coordinator access required' }, 403)

  const { email, name, role = 'native_speaker', languages = [], apps = ['xblimps'], redirectTo } =
    await req.json().catch(() => ({}))
  if (!email || typeof email !== 'string') return json({ error: 'email is required' }, 400)

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: name || email, role, languages, apps },
    redirectTo: redirectTo || undefined,
  })
  if (error) return json({ error: error.message }, 400)

  return json({ ok: true, userId: data.user?.id, email })
})
