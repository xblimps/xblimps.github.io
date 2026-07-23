// Auth + profile access model.
//
// Magic-link sign-in via Supabase Auth. A `profiles` row (created by a signup trigger from
// invite metadata) carries the user's role, language assignments and app-access list. The
// `apps` array (e.g. ['xblimps'] or ['xblimps','childes']) is what gates module visibility
// in the UI and — crucially — what Postgres RLS enforces, so xBLiMPs-only users can neither
// see nor query CHILDES data.

import { supabase, isCloud } from './supabase'
import type { Role } from './types'

export type AppKey = 'xblimps' | 'childes'

export interface Profile {
  id: string
  email: string
  name: string
  role: Role
  languages: string[]
  apps: AppKey[]
  state: string
}

// the demo profile used when no backend is configured (full access, local only)
export const DEMO_PROFILE: Profile = {
  id: 'demo', email: 'demo@local', name: 'You', role: 'coordinator',
  languages: [], apps: ['xblimps', 'childes'], state: 'active',
}

// CHILDES annotation is a sole-admin tool under development — only these accounts (and the
// local-only demo profile, i.e. the developer running it offline) may see it.
export const ADMIN_EMAILS = ['sas245@cam.ac.uk', 'suchirsalhan@gmail.com']
export const isAdmin = (p: Profile) => p.id === 'demo' || ADMIN_EMAILS.includes(p.email.trim().toLowerCase())

// Build a demo profile for a given role — used by the `?demo=<role>` preview override in
// local mode so leads / native speakers / reviewers can be viewed without a backend. Ids are
// deliberately NOT 'demo' and emails are not admin emails, so isAdmin() stays false and the
// admin-only modules (CHILDES, roster, sync ledger) are correctly hidden.
const DEMO_NAME: Record<Role, string> = {
  coordinator: 'You', lead: 'Dr Demo Lead', native_speaker: 'Demo Speaker', reviewer: 'Demo Reviewer',
}
export function demoProfile(role: Role): Profile {
  if (role === 'coordinator') return DEMO_PROFILE
  return { id: `demo.${role}`, email: `${role}@demo.local`, name: DEMO_NAME[role], role, languages: [], apps: ['xblimps'], state: 'active' }
}

export async function sendMagicLink(email: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'No backend configured' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error?.message }
}

export async function signInWithPassword(email: string, password: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'No backend configured' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message }
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function loadProfile(): Promise<Profile | null> {
  if (!supabase) return null
  const { data: u } = await supabase.auth.getUser()
  const user = u.user
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error || !data) {
    // profile not provisioned yet — minimal default (xblimps only)
    return { id: user.id, email: user.email ?? '', name: user.email ?? 'User', role: 'native_speaker', languages: [], apps: ['xblimps'], state: 'active' }
  }
  return {
    id: data.id, email: data.email, name: data.name ?? data.email,
    role: data.role, languages: data.languages ?? [], apps: data.apps ?? ['xblimps'], state: data.state ?? 'active',
  }
}

export function onAuthChange(cb: () => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(() => cb())
  return () => data.subscription.unsubscribe()
}

export { isCloud }
