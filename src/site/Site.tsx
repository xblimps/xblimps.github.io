// Public shell of https://xblimps.github.io/ (the canonical xBLiMPs site), in the CAFe theme (cafe.css).
// Home (#/) is the mission and recruitment page. Contribute (#/contribute, #/contribute/<code>) is the contributor
// workflow: language → construction → vocabulary from a real sentence → the contributor's own template. The lexical
// generator was removed on 26 Nov 2026 (its engine lives on as central-team tooling in scripts/lexgen/). Four guide
// pages follow. No sign-in, no backend. Older routes (#/generator, #/lang/<code>, #/guide/demo …) resolve to the page
// that replaced them. The annotation platform (#/app) is admin-only and is not linked from here.

import React, { useEffect, useState } from 'react'
import Home from './Home'
import Contribute from './Contribute'
import { Instructions, Lead, Native, Advice } from './guide/pages'
import { byCode } from './languages'
import './site.css'
import './cafe.css'

export type Page = '' | 'contribute' | 'guide' | 'guide/lead' | 'guide/native' | 'guide/advice'
// Older routes (shared in Slack and docs) resolve to the page that now holds their content.
const ALIASES: Record<string, Page> = {
  'guide/write': 'guide/advice', 'guide/faq': 'guide/advice', 'guide/help': 'guide/advice',
  'guide/handover': 'guide/lead', 'guide/instructions': 'guide', 'guide/demo': 'guide/native',
  // the generator (removed 26 Nov 2026) and its aliases now open the contribution workflow
  generator: 'contribute', check: 'contribute', wand: 'contribute',
}
export type Route = Page
export const SITE_ROUTES: string[] = ['', 'contribute', 'guide', 'guide/lead', 'guide/native', 'guide/advice', ...Object.keys(ALIASES)]
const langOf = (h: string) => (h.startsWith('contribute/') ? h.slice(11) : h.startsWith('lang/') ? h.slice(5) : null)
export const isSiteRoute = (h: string) => SITE_ROUTES.includes(h) || (!!langOf(h) && !!byCode(langOf(h)!))
export const resolveRoute = (r: string): Page => (ALIASES[r] ?? (r as Page))

const NAV: [string, string][] = [
  ['', 'Home'],
  ['contribute', 'Contribute'],
  ['guide', 'Instructions'],
  ['guide/lead', "I'm a Language Lead"],
  ['guide/native', "I'm a Native Speaker"],
  ['guide/advice', 'Advice'],
]

const TITLES: Record<Page, string> = {
  '': 'Does AI really understand your language?', contribute: 'Contribute', guide: 'Instructions', 'guide/lead': "I'm a Language Lead",
  'guide/native': "I'm a Native Speaker", 'guide/advice': 'Advice',
}

type Theme = 'light' | 'dark' | null
const readTheme = (): Theme => { try { return (localStorage.getItem('xblimps.theme') as Theme) || null } catch { return null } }

export default function Site({ route: raw }: { route: string }) {
  const lang = langOf(raw)
  const route = lang ? null : resolveRoute(raw)
  const [theme, setTheme] = useState<Theme>(readTheme)
  useEffect(() => { try { theme ? localStorage.setItem('xblimps.theme', theme) : localStorage.removeItem('xblimps.theme') } catch { /* ignore */ } }, [theme])
  const dark = theme ? theme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches

  useEffect(() => {
    if (route !== null) document.title = `${TITLES[route]} · xBLiMPs`
    window.scrollTo(0, 0)
  }, [route, lang])

  const active = (r: string) => (lang ? r === 'contribute' : route === r)

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
        {lang && <Contribute code={lang} />}
        {route === '' && <Home />}
        {route === 'contribute' && <Contribute code={null} />}
        {route === 'guide' && <Instructions />}
        {route === 'guide/lead' && <Lead />}
        {route === 'guide/native' && <Native />}
        {route === 'guide/advice' && <Advice />}
      </main>

      <footer className="site-foot">
        <div className="site-foot-inner">
          <span>xBLiMPs · Cambridge · ACL 2027 dataset · Afrikaans, Catalan, English, French, Persian, Spanish, Tagalog, Welsh (Basque in phase 2)</span>
          <span>No AI-generated templates, words or sentences. We give you words; you write the grammar.</span>
          <span>Vocabulary samples: FineWeb-2 / FineWeb (ODC-By 1.0), English machine translations by Helsinki-NLP opus-mt (Apache-2.0). Design after the CAFe project site (developerFolio).</span>
        </div>
      </footer>
    </div>
  )
}
