import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import Site, { isSiteRoute } from './site/Site'
import './styles/theme.css'

// After a redeploy an open tab may ask for an old chunk name; reload once to pick up the new build.
const AppShell = lazy(() => import('./AppShell').catch((e) => {
  let tried = false
  try { tried = sessionStorage.getItem('xblimps.chunkReload') === '1'; sessionStorage.setItem('xblimps.chunkReload', '1') } catch { /* ignore */ }
  if (!tried) { window.location.reload(); return new Promise<never>(() => {}) }
  throw e
}))

// Routing: the public site (home, lexical generator + four guide pages) is the default and is all that
// contributors see. The annotation platform lives at #/app and is admin-only: App.tsx shows its
// modules only when isAdmin(profile). Requests carrying the platform's own URL parameters (email
// sign-in links, ?demo= / ?go= / ?lang= local previews) still open the platform directly.
const APP_PARAMS = ['oobCode', 'apiKey', 'demo', 'go', 'lang']
const wantsApp = () => {
  const sp = new URLSearchParams(window.location.search)
  return APP_PARAMS.some((k) => sp.has(k))
}
const parse = (): string => {
  const h = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (h === 'app' || h.startsWith('app/')) return 'app'
  if (isSiteRoute(h)) return h
  return ''
}

function Root() {
  const [route, setRoute] = useState<string>(() => (wantsApp() ? 'app' : parse()))
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  if (route === 'app') {
    return (
      <Suspense fallback={<div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)' }}>Loading…</div>}>
        <AppShell />
      </Suspense>
    )
  }
  return <Site route={route} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
