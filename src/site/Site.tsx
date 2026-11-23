// Public shell: the lexical generator (home: generator + sheet check) and the guide, the one place
// for instructions. No sign-in, no backend.
// The annotation platform stays reachable at #/app (secondary link in the header).

import React, { useEffect } from 'react'
import Generator from './Generator'
import { Hub, Write, Lead, Native, Faq, Demo, Help, Handover } from './guide/pages'
import './site.css'

export type Route = '' | 'guide' | 'guide/write' | 'guide/lead' | 'guide/native' | 'guide/faq' | 'guide/demo' | 'guide/help' | 'guide/handover'
export const SITE_ROUTES: Route[] = ['', 'guide', 'guide/write', 'guide/lead', 'guide/native', 'guide/faq', 'guide/demo', 'guide/help', 'guide/handover']

const GUIDE_NAV: [Route, string][] = [
  ['guide', 'Overview: terms, targets, dates'],
  ['guide/write', 'How to write a template'],
  ['guide/lead', 'Language leads'],
  ['guide/native', 'Native-speaker contributors'],
  ['guide/faq', 'FAQ'],
  ['guide/demo', 'Worked demonstration'],
  ['guide/help', 'Heuristics & troubleshooting'],
  ['guide/handover', 'Handover'],
]

const TITLES: Record<Route, string> = {
  '': 'Lexical generator', guide: 'Guide', 'guide/write': 'How to write a template', 'guide/lead': 'Language leads',
  'guide/native': 'Contributors', 'guide/faq': 'FAQ',
  'guide/demo': 'Worked demonstration', 'guide/help': 'Troubleshooting', 'guide/handover': 'Handover',
}

export default function Site({ route }: { route: Route }) {
  useEffect(() => {
    document.title = `${TITLES[route]} · xBLiMPs`
    window.scrollTo(0, 0)
  }, [route])

  const inGuide = route.startsWith('guide')
  const top: [string, string, boolean][] = [
    ['#/', 'Lexical generator', route === ''],
    ['#/guide', 'Guide', route === 'guide'],
    ['#/guide/write', 'Write a template', route === 'guide/write'],
    ['#/guide/lead', 'Language leads', route === 'guide/lead'],
    ['#/guide/native', 'Contributors', route === 'guide/native'],
    ['#/guide/faq', 'FAQ', route === 'guide/faq'],
  ]

  return (
    <div className="site">
      <header className="site-head">
        <div className="site-head-inner">
          <a className="site-brand" href="#/">
            <span className="site-brand-mark">x</span>
            <span><b>xBLiMPs</b><span>multilingual minimal pairs</span></span>
          </a>
          <nav className="site-nav" aria-label="Main">
            {top.map(([href, label, active]) => <a key={href} href={href} className={active ? 'active' : ''}>{label}</a>)}
          </nav>
          <a className="site-app-link" href="#/app" title="The earlier annotation platform (sign-in)">Annotation platform ↗</a>
        </div>
      </header>

      <main className="site-main">
        {inGuide ? (
          <div className="guide-layout">
            <aside className="guide-side" aria-label="Guide">
              {GUIDE_NAV.map(([r, label]) => <a key={r} href={`#/${r}`} className={route === r ? 'active' : ''}>{label}</a>)}
              <div className="sep" />
              <a href="#/">Lexical generator</a>
            </aside>
            <div>
              {route === 'guide' && <Hub />}
              {route === 'guide/write' && <Write />}
              {route === 'guide/faq' && <Faq />}
              {route === 'guide/lead' && <Lead />}
              {route === 'guide/native' && <Native />}
              {route === 'guide/demo' && <Demo />}
              {route === 'guide/help' && <Help />}
              {route === 'guide/handover' && <Handover />}
            </div>
          </div>
        ) : <Generator />}
      </main>

      <footer className="site-foot">
        <div className="site-foot-inner">
          <span>xBLiMPs · Cambridge · ACL 2027 dataset</span>
          <span>No AI-generated templates, words or sentences: the generator only recombines what people write.</span>
          <a href="#/guide">Guide</a>
          <a href="#/guide/faq">FAQ</a>
          <a href="#/guide/help">Troubleshooting</a>
          <a href="#/guide/handover">Handover</a>
        </div>
      </footer>
    </div>
  )
}
