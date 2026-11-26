// Public shell of https://xblimps.github.io/ (the canonical xBLiMPs site), in the CAFe theme (cafe.css).
// Home (#/) is the language picker; each language has a contribution page (#/lang/<code>) with inspiration
// sentences, the template editor, checks and save/export. The lexical generator with the sheet check moved to
// #/generator; the five guide pages are unchanged. No sign-in, no backend. Older routes are kept as aliases so
// links already shared still work. The annotation platform (#/app) is admin-only and is not linked from here.

import React, { useEffect, useState } from 'react'
import Generator from './Generator'
import Home from './Home'
import LanguagePage from './LanguagePage'
import { Instructions, Lead, Native, Demo, Advice } from './guide/pages'
import { byCode } from './languages'
import './site.css'
import './cafe.css'

export type Page = '' | 'generator' | 'guide' | 'guide/lead' | 'guide/native' | 'guide/demo' | 'guide/advice'
// Older routes (shared in Slack and docs) resolve to the page that now holds their content.
const ALIASES: Record<string, Page> = {
  'guide/write': 'guide/advice', 'guide/faq': 'guide/advice', 'guide/help': 'guide/advice',
  'guide/handover': 'guide/lead', 'guide/instructions': 'guide', 'check': 'generator', 'wand': 'generator',
}
export type Route = Page
export const SITE_ROUTES: string[] = ['', 'generator', 'guide', 'guide/lead', 'guide/native', 'guide/demo', 'guide/advice', ...Object.keys(ALIASES)]
export const isSiteRoute = (h: string) => SITE_ROUTES.includes(h) || (h.startsWith('lang/') && !!byCode(h.slice(5)))
export const resolveRoute = (r: string): Page => (ALIASES[r] ?? (r as Page))

const NAV: [string, string][] = [
  ['', 'Languages'],
  ['generator', '🪄 Generator'],
  ['guide', 'Instructions'],
  ['guide/lead', "I'm a Language Lead"],
  ['guide/native', "I'm a Native Speaker"],
  ['guide/demo', 'Worked Demo'],
  ['guide/advice', 'Advice'],
]

const TITLES: Record<Page, string> = {
  '': 'Contribute to xBLiMPs', generator: 'Lexical generator', guide: 'Instructions', 'guide/lead': "I'm a Language Lead",
  'guide/native': "I'm a Native Speaker", 'guide/demo': 'Worked Demo', 'guide/advice': 'Advice',
}

type Theme = 'light' | 'dark' | null
const readTheme = (): Theme => { try { return (localStorage.getItem('xblimps.theme') as Theme) || null } catch { return null } }

export default function Site({ route: raw }: { route: string }) {
  const lang = raw.startsWith('lang/') ? raw.slice(5) : null
  const route = lang ? null : resolveRoute(raw)
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => { try { theme ? localStorage.setItem('xblimps.theme', theme) : localStorage.removeItem('xblimps.theme') } catch { /* ignore */ } }, [theme])
  const dark = theme ? theme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches

  useEffect(() => {
    if (route !== null) document.title = `${TITLES[route]} · xBLiMPs`
    window.scrollTo(0, 0)
  }, [route, lang])

  const active = (r: string) => (lang ? r === '' : route === r)

  return (
    <div className="site cafe" data-theme={theme ?? undefined}>
      <a href="#main" className="sr-only">Skip to content</a>
      <header className="site-head">
        <div className="site-head-inner">
          <a className="site-brand" href="#/" aria-label="xBLiMPs home">
            <span className="sig">&lt;xBLiMPs/&gt;<small>multilingual minimal pairs</small></span>
          </a>
          <nav className="site-nav" aria-label="Main">
            {NAV.map(([r, label]) => (
              <a key={r} href={`#/${r}`} className={active(r) ? 'active' : ''} aria-current={active(r) ? 'page' : undefined}>{label}</a>
            ))}
          </nav>
          <button className="theme-toggle" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="site-main" id="main">
        {lang && <LanguagePage code={lang} />}
        {route === '' && <Home />}
        {route === 'generator' && <Generator />}
        {route === 'guide' && <Instructions />}
        {route === 'guide/lead' && <Lead />}
        {route === 'guide/native' && <Native />}
        {route === 'guide/demo' && <Demo />}
        {route === 'guide/advice' && <Advice />}
      </main>

      <footer className="site-foot">
        <div className="site-foot-inner">
          <span>xBLiMPs · Cambridge · ACL 2027 dataset · Afrikaans, Catalan, English, French, Persian, Spanish, Tagalog, Welsh (Basque in phase 2)</span>
          <span>No AI-generated templates, words or sentences: the generator only recombines what people write.</span>
          <span>Inspiration sentences: FineWeb-2 / FineWeb (ODC-By 1.0). Design after the CAFe project site (developerFolio).</span>
        </div>
      </footer>
    </div>
  )
}
