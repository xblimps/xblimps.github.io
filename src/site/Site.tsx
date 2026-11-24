// Public shell of https://xblimps.github.io/ (the canonical xBLiMPs site): the lexical generator
// (home, the wand: generator + sheet check) and five guide pages. No sign-in, no backend.
// Navigation is deliberately minimal: wand, Instructions, I'm a Language Lead, I'm a Native Speaker,
// Worked Demo, Advice. Older guide routes are kept as aliases so links already shared still work.
// The annotation platform (#/app) is admin-only and is not linked from here.

import React, { useEffect } from 'react'
import Generator from './Generator'
import { Instructions, Lead, Native, Demo, Advice } from './guide/pages'
import './site.css'

export type Page = '' | 'guide' | 'guide/lead' | 'guide/native' | 'guide/demo' | 'guide/advice'
// Older routes (shared in Slack and docs) resolve to the page that now holds their content.
const ALIASES: Record<string, Page> = {
  'guide/write': 'guide/advice', 'guide/faq': 'guide/advice', 'guide/help': 'guide/advice',
  'guide/handover': 'guide/lead', 'guide/instructions': 'guide',
}
export type Route = Page
export const SITE_ROUTES: string[] = ['', 'guide', 'guide/lead', 'guide/native', 'guide/demo', 'guide/advice', ...Object.keys(ALIASES)]
export const resolveRoute = (r: string): Page => (ALIASES[r] ?? (r as Page))

const NAV: [Page, string, string][] = [
  ['', '🪄', 'Lexical generator'],
  ['guide', '', 'Instructions'],
  ['guide/lead', '', "I'm a Language Lead"],
  ['guide/native', '', "I'm a Native Speaker"],
  ['guide/demo', '', 'Worked Demo'],
  ['guide/advice', '', 'Advice'],
]

const TITLES: Record<Page, string> = {
  '': 'Lexical generator', guide: 'Instructions', 'guide/lead': "I'm a Language Lead",
  'guide/native': "I'm a Native Speaker", 'guide/demo': 'Worked Demo', 'guide/advice': 'Advice',
}

export default function Site({ route: raw }: { route: string }) {
  const route = resolveRoute(raw)
  useEffect(() => {
    document.title = `${TITLES[route]} · xBLiMPs`
    window.scrollTo(0, 0)
  }, [route])

  return (
    <div className="site">
      <header className="site-head">
        <div className="site-head-inner">
          <a className="site-brand" href="#/">
            <span className="site-brand-mark">x</span>
            <span><b>xBLiMPs</b><span>multilingual minimal pairs</span></span>
          </a>
          <nav className="site-nav" aria-label="Main">
            {NAV.map(([r, icon, label]) => (
              <a key={r} href={`#/${r}`} className={route === r ? 'active' : ''} title={label} aria-current={route === r ? 'page' : undefined}>
                {icon ? <><span aria-hidden="true">{icon}</span> {label}</> : label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="site-main">
        {route === '' && <Generator />}
        {route === 'guide' && <Instructions />}
        {route === 'guide/lead' && <Lead />}
        {route === 'guide/native' && <Native />}
        {route === 'guide/demo' && <Demo />}
        {route === 'guide/advice' && <Advice />}
      </main>

      <footer className="site-foot">
        <div className="site-foot-inner">
          <span>xBLiMPs · Cambridge · ACL 2027 dataset · Afrikaans, Basque, Catalan, English, French, Persian, Spanish, Tagalog, Welsh</span>
          <span>No AI-generated templates, words or sentences: the generator only recombines what people write.</span>
        </div>
      </footer>
    </div>
  )
}
