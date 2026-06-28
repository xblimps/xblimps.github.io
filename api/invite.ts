// Vercel serverless function: invite a contributor by email.
//
// Uses the Supabase service-role key (server-only env) to send a magic-link invite email
// and stamp the new user's access metadata (role, languages, apps), which the signup trigger
// turns into a profile. Only a signed-in coordinator may call this — we verify the caller's
// JWT and role server-side before doing anything.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!URL || !SERVICE) return res.status(500).json({ error: 'Server not configured (missing SUPABASE_SERVICE_ROLE_KEY)' })

  const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })

  // verify caller is a coordinator
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const { data: caller } = await admin.auth.getUser(token)
  if (!caller.user) return res.status(401).json({ error: 'Invalid session' })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', caller.user.id).maybeSingle()
  if (prof?.role !== 'coordinator') return res.status(403).json({ error: 'Coordinator access required' })

  const { email, name, role = 'native_speaker', languages = [], apps = ['xblimps'], redirectTo } = req.body || {}
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email is required' })

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: name || email, role, languages, apps },
    redirectTo: redirectTo || undefined,
  })
  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ ok: true, userId: data.user?.id, email })
}
