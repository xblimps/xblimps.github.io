// Auth + profile access model (Firebase Auth + Firestore).
//
// Sign-in is by email/password or email-link ("magic link"). A `profiles/{uid}` Firestore doc
// carries the user's role, language assignments and app-access list. The `apps` array (e.g.
// ['xblimps'] or ['xblimps','childes']) gates module visibility in the UI and — crucially —
// is what the Firestore security rules enforce, so xBLiMPs-only users can neither see nor
// query CHILDES data.
//
// Invites are fully client-side: a coordinator writes an `invites/{email}` doc with the new
// user's metadata and sends them an email sign-in link. On that user's first login we adopt
// the invite into their `profiles/{uid}` doc (see loadProfile) and delete the invite.

import {
  signInWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signOut as fbSignOut, onAuthStateChanged, type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { auth, fdb, isCloud } from './firebase'
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
// local-only demo profile, i.e. the developer running it offline) may see it. These emails
// are also bootstrapped as coordinators on their first login (see loadProfile).
export const ADMIN_EMAILS = ['sas245@cam.ac.uk', 'suchirsalhan@gmail.com']
export const isAdmin = (p: Profile) => p.id === 'demo' || ADMIN_EMAILS.includes(p.email.trim().toLowerCase())

// Build a demo profile for a given role — used by the `?demo=<role>` preview override in
// local mode so leads / native speakers / reviewers can be viewed without a backend.
const DEMO_NAME: Record<Role, string> = {
  coordinator: 'You', lead: 'Dr Demo Lead', native_speaker: 'Demo Speaker', reviewer: 'Demo Reviewer',
}
export function demoProfile(role: Role): Profile {
  if (role === 'coordinator') return DEMO_PROFILE
  return { id: `demo.${role}`, email: `${role}@demo.local`, name: DEMO_NAME[role], role, languages: [], apps: ['xblimps'], state: 'active' }
}

const EMAIL_KEY = 'xblimps.emailForSignIn'

// email-link ("magic link") settings — the link returns to this origin, handled in-app.
const linkSettings = () => ({ url: window.location.origin, handleCodeInApp: true })

export async function sendMagicLink(email: string): Promise<{ error?: string }> {
  if (!auth) return { error: 'No backend configured' }
  try {
    await sendSignInLinkToEmail(auth, email, linkSettings())
    try { window.localStorage.setItem(EMAIL_KEY, email) } catch { /* private mode */ }
    return {}
  } catch (e: any) { return { error: e?.message || 'Could not send link' } }
}

export async function signInWithPassword(email: string, password: string): Promise<{ error?: string }> {
  if (!auth) return { error: 'No backend configured' }
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return {}
  } catch (e: any) { return { error: e?.message || 'Sign-in failed' } }
}

// If the current URL is an email sign-in link, complete the sign-in. Called once at boot.
// Returns true when it consumed a link (so the caller can clean the URL).
export async function completeEmailLinkSignIn(): Promise<boolean> {
  if (!auth || !isSignInWithEmailLink(auth, window.location.href)) return false
  let email = ''
  try { email = window.localStorage.getItem(EMAIL_KEY) || '' } catch { /* ignore */ }
  // opened on a different device → we didn't store the email; ask for it.
  if (!email) email = window.prompt('Confirm your email to finish signing in') || ''
  if (!email) return false
  try {
    await signInWithEmailLink(auth, email, window.location.href)
    try { window.localStorage.removeItem(EMAIL_KEY) } catch { /* ignore */ }
    return true
  } catch { return false }
}

export async function signOut() {
  if (auth) await fbSignOut(auth)
}

export function currentUserId(): string | null {
  return auth?.currentUser?.uid ?? null
}

// Load (and, on first login, provision) the signed-in user's profile.
export async function loadProfile(): Promise<Profile | null> {
  if (!auth || !fdb) return null
  const user = auth.currentUser
  if (!user) return null

  const ref = doc(fdb, 'profiles', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const d = snap.data() as any
    return {
      id: user.uid, email: d.email ?? user.email ?? '', name: d.name ?? d.email ?? user.email ?? 'User',
      role: d.role ?? 'native_speaker', languages: d.languages ?? [], apps: d.apps ?? ['xblimps'], state: d.state ?? 'active',
    }
  }

  // No profile yet → provision one. Prefer an invite; bootstrap admins as coordinators;
  // otherwise a minimal xBLiMPs-only default.
  const email = (user.email ?? '').trim().toLowerCase()
  let provisioned: Profile
  const invite = email ? await getDoc(doc(fdb, 'invites', email)) : null
  if (invite?.exists()) {
    const i = invite.data() as any
    provisioned = {
      id: user.uid, email: user.email ?? email, name: i.name ?? user.email ?? 'User',
      role: i.role ?? 'native_speaker', languages: i.languages ?? [], apps: i.apps ?? ['xblimps'], state: 'active',
    }
  } else if (ADMIN_EMAILS.includes(email)) {
    provisioned = { id: user.uid, email: user.email ?? email, name: user.email ?? 'Coordinator', role: 'coordinator', languages: [], apps: ['xblimps', 'childes'], state: 'active' }
  } else {
    provisioned = { id: user.uid, email: user.email ?? email, name: user.email ?? 'User', role: 'native_speaker', languages: [], apps: ['xblimps'], state: 'active' }
  }

  const { id: _id, ...body } = provisioned
  await setDoc(ref, { ...body, created_at: new Date().toISOString() })
  if (invite?.exists()) { try { await deleteDoc(doc(fdb, 'invites', email)) } catch { /* best-effort */ } }
  return provisioned
}

// Subscribe to auth changes. Fires immediately with the current user (or null).
export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!auth) { cb(null); return () => {} }
  return onAuthStateChanged(auth, cb)
}

export { isCloud }
