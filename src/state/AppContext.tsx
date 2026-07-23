import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { store } from '../lib/store'
import { sync } from '../lib/sync'
import type { SyncState } from '../lib/types'
import { isCloud, supabase } from '../lib/supabase'
import { loadProfile, onAuthChange, signOut, DEMO_PROFILE, demoProfile, type Profile } from '../lib/auth'
import type { Role } from './../lib/types'

interface Nav {
  view: 'board' | 'xblimps' | 'forge' | 'bench' | 'roster' | 'audit' | 'childes'
  workspaceId: string | null
  section: string
  focus?: string          // optional deep-link hint (e.g. the language to preselect in Bibliography)
}

// native-speaker annotators land directly in their focused Forge workspace
const homeView = (p: Profile): Nav['view'] => (p.role === 'native_speaker' ? 'forge' : 'board')

// the Workspaces module lists notebooks only (languages live under xBLiMPs), so boot
// into the first notebook rather than whatever happens to be workspaces[0]
const firstNotebook = (): string | null => store.db.workspaces.find((w) => w.kind === 'notebook')?.id ?? null

// local-only persona preview: `?demo=lead` / `?demo=native_speaker` etc. lets us view the
// app as a given role without a backend. Ignored in cloud mode (real auth wins).
const ROLES: Role[] = ['coordinator', 'lead', 'native_speaker', 'reviewer']
const demoRole = (): Role | null => {
  if (typeof window === 'undefined') return null
  const r = new URLSearchParams(window.location.search).get('demo')
  return r && ROLES.includes(r as Role) ? (r as Role) : null
}

type BootState = 'loading' | 'signed_out' | 'ready'

interface Ctx {
  v: number
  syncState: SyncState
  boot: BootState
  profile: Profile
  demoMode: () => void
  enterPreview: (role: Role) => void
  signOutNow: () => void
  nav: Nav
  go: (n: Partial<Nav>) => void
}

const AppCtx = createContext<Ctx>(null as any)
export const useApp = () => useContext(AppCtx)

export function useStore() {
  return useSyncExternalStore((cb) => store.subscribe(cb), () => store.version)
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const v = useStore()
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [boot, setBoot] = useState<BootState>(isCloud ? 'loading' : 'ready')
  const [profile, setProfile] = useState<Profile>(DEMO_PROFILE)
  const [nav, setNav] = useState<Nav>({ view: 'board', workspaceId: null, section: 'Dashboard' })

  useEffect(() => { const unsub = sync.subscribe(setSyncState); return () => { unsub() } }, [])

  // boot: in cloud mode, watch auth → hydrate; in demo mode, ready immediately
  useEffect(() => {
    if (!isCloud) {
      const r = demoRole()
      const p = r ? demoProfile(r) : DEMO_PROFILE
      if (r) setProfile(p)
      const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
      const goParam = sp.get('go') as Nav['view'] | null
      const langParam = sp.get('lang')
      // deep-link into a language stage (e.g. ?lang=cy&section=Template%20Studio) for previews
      const langWs = langParam ? store.db.workspaces.find((w) => w.language === langParam || w.id === langParam) : null
      if (langWs) {
        setNav((n) => ({ ...n, view: 'xblimps', workspaceId: langWs.id, section: sp.get('section') || 'Template Studio' }))
        return
      }
      const view = goParam && ['board', 'xblimps', 'forge', 'bench', 'roster', 'audit', 'childes'].includes(goParam) ? goParam : homeView(p)
      setNav((n) => ({ ...n, view, workspaceId: view === 'xblimps' ? null : firstNotebook(), section: view === 'xblimps' ? 'Home' : n.section }))
      return
    }
    let alive = true
    const boot = async () => {
      const { data } = await supabase!.auth.getSession()
      if (!alive) return
      if (!data.session) { setBoot('signed_out'); return }
      const p = await loadProfile()
      if (!alive) return
      if (p) {
        setProfile(p)
        await store.hydrate(p)
        setNav((n) => ({ ...n, view: homeView(p), workspaceId: firstNotebook() }))
        setBoot('ready')
      } else setBoot('signed_out')
    }
    boot()
    const unsub = onAuthChange(() => boot())
    return () => { alive = false; unsub() }
  }, [])

  const demoMode = () => { setProfile(DEMO_PROFILE); setBoot('ready') }

  // default/quick logins — enter a local seeded demo session as a given persona (works on the
  // deployed cloud site too, without a magic link). Native speakers land in the Forge.
  const enterPreview = (role: Role) => {
    const p = demoProfile(role)
    store.enterDemoMode()
    setProfile(p)
    setNav({ view: homeView(p), workspaceId: firstNotebook(), section: 'Dashboard' })
    setBoot('ready')
  }

  const signOutNow = async () => { store.disconnect(); await signOut(); setBoot('signed_out') }

  const go = (n: Partial<Nav>) => setNav((cur) => ({ ...cur, ...n }))

  return (
    <AppCtx.Provider value={{ v, syncState, boot, profile, demoMode, enterPreview, signOutNow, nav, go }}>
      {children}
    </AppCtx.Provider>
  )
}
