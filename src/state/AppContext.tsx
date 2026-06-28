import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { store } from '../lib/store'
import { sync } from '../lib/sync'
import type { SyncState } from '../lib/types'

interface Nav {
  view: 'workspaces' | 'xblimps' | 'roster' | 'audit'
  workspaceId: string | null
  section: string
}

interface Ctx {
  v: number                     // store version (re-render trigger)
  syncState: SyncState
  nav: Nav
  go: (n: Partial<Nav>) => void
  openWorkspace: (id: string, section?: string) => void
}

const AppCtx = createContext<Ctx>(null as any)
export const useApp = () => useContext(AppCtx)

// subscribe to the store for re-renders
export function useStore() {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.version,
  )
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const v = useStore()
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [nav, setNav] = useState<Nav>({ view: 'workspaces', workspaceId: store.db.workspaces[0]?.id ?? null, section: 'Dashboard' })

  useEffect(() => { const unsub = sync.subscribe(setSyncState); return () => { unsub() } }, [])

  const go = (n: Partial<Nav>) => setNav((cur) => ({ ...cur, ...n }))
  const openWorkspace = (id: string, section = 'Dashboard') =>
    setNav({ view: 'workspaces', workspaceId: id, section })

  return (
    <AppCtx.Provider value={{ v, syncState, nav, go, openWorkspace }}>
      {children}
    </AppCtx.Provider>
  )
}
