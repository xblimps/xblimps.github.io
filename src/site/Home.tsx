// Home page (#/): CAFe-style landing whose primary action is choosing a language. Sections follow the CAFe
// reference (greeting → what it is → how it works → people → sessions → research → contact). The example pair is
// the human-written English reference row used across the guide (BLiMP distractor_agree_rc); never invent examples.

import React, { useMemo, useState } from 'react'
import { LANGUAGE_DATA, CENTRAL_CONTACT } from './languages'
import { Sessions, Confirm } from './guide/common'

export default function Home() {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return LANGUAGE_DATA.filter((l) => !s || l.name.toLowerCase().includes(s) || l.native.toLowerCase().includes(s) || l.code === s)
  }, [q])

  return (
    <div>
      <section className="c-hero" aria-labelledby="hello">
        <div>
          <h1 id="hello">Welcome to xBLiMPs! <span aria-hidden="true">👋</span></h1>
          <p className="lead">
            xBLiMPs is a new set of grammar tests for language models in many languages, written by native speakers and linguists.
            Each test is a <b>minimal pair</b>: two sentences that are identical except in one place, where one is grammatical and the other is not.
          </p>
          <ul className="bullets">
            <li><span aria-hidden="true">🌍</span> Pick your language and see real sentences from it for inspiration.</li>
            <li><span aria-hidden="true">✍️</span> Write templates in your browser, with live checks and a preview of the pairs they make.</li>
            <li><span aria-hidden="true">🤝</span> Your language lead reviews your work; contributors are credited.</li>
          </ul>
          <div className="c-btns">
            <a className="c-btn" href="#languages">Choose your language</a>
            <a className="c-btn ghost" href="#/guide">How it works</a>
            <a className="c-btn ghost" href="#/generator">🪄 Generator</a>
          </div>
        </div>
        <div className="c-hero-art" aria-label="An example minimal pair">
          <div className="c-pair">
            <div className="g">✓ The refrigerator that stores all the cakes <mark>runs</mark> too cold.</div>
            <div className="b">✗ The refrigerator that stores all the cakes <mark>run</mark> too cold.</div>
            <p className="c-note" style={{ margin: 0 }}>The verb must agree with <i>the refrigerator</i>, not with <i>the cakes</i> next to it.
              A good language model should prefer the first sentence.</p>
          </div>
        </div>
      </section>

      <section className="c-section" id="languages" aria-labelledby="langs-h">
        <h2 id="langs-h">Choose your language</h2>
        <p className="kicker">Start contributing in a few clicks</p>
        <input className="c-search" type="search" placeholder="Search languages (e.g. Welsh, Cymraeg)…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search languages" />
        <div className="c-langs">
          {shown.map((l) => (
            <a key={l.code} href={`#/lang/${l.code}`} className={`c-lang${l.status === 'active' ? '' : ' off'}`}>
              <b>{l.name}</b>
              <span className="native" dir={l.dir}>{l.native}</span>
              <div className="state">{l.status === 'active' ? 'Contribute →' : 'Phase 2 · find out more →'}</div>
            </a>
          ))}
          {shown.length === 0 && <p className="c-note">No language matches “{q}”. Missing yours? Ask in {CENTRAL_CONTACT.slack} or e-mail {CENTRAL_CONTACT.email}.</p>}
        </div>
      </section>

      <section className="c-section" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <p className="kicker">Four steps, all in your browser</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Step 1</span><h3>Find inspiration</h3>
            <p>See random sentences from the web in your language (FineWeb-2). They are only for ideas: every template you write is your own.</p></div>
          <div className="c-card"><span className="tag">Step 2</span><h3>Write a template</h3>
            <p>Fill your lead's slot pattern with 3–4 natural alternatives per slot, including the one slot where ✓ and ✗ differ.</p></div>
          <div className="c-card"><span className="tag">Step 3</span><h3>Check the pairs</h3>
            <p>The site checks the template and shows the minimal pairs it generates, so you can catch anything that sounds wrong.</p></div>
          <div className="c-card"><span className="tag">Step 4</span><h3>Save and send</h3>
            <p>Your templates are saved in this browser. Copy them into your language's sheet, or download them for your lead to review.</p></div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="who-h">
        <h2 id="who-h">Who's who</h2>
        <p className="kicker">Leads design, native speakers write, everyone is credited</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Central team</span><h3>University of Cambridge</h3><p>{CENTRAL_CONTACT.team}</p></div>
          <div className="c-card"><span className="tag">Language leads</span><h3>One per language</h3>
            <p>Leads choose the phenomena, design slot patterns and review templates. Each language page lists its lead. <Confirm>lead names, once each lead agrees to be listed</Confirm></p></div>
          <div className="c-card"><span className="tag">Contributors</span><h3>Native speakers</h3>
            <p>Write templates under the lead's slot patterns. Paid contributors are acknowledged; substantial contributions may qualify for co-authorship, agreed with the team.</p></div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="sess-h">
        <h2 id="sess-h">Sessions</h2>
        <p className="kicker">Drop in, ask questions, write templates together (UK time)</p>
        <Sessions />
      </section>

      <section className="c-section" aria-labelledby="res-h">
        <h2 id="res-h">Research</h2>
        <p className="kicker">Where xBLiMPs comes from</p>
        <div className="c-grid">
          <a className="c-card" href="https://aclanthology.org/2020.tacl-1.25/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <span className="tag">Warstadt et al., 2020 · TACL</span><h3>BLiMP: The Benchmark of Linguistic Minimal Pairs for English</h3>
            <p>The English benchmark whose template-and-minimal-pair design xBLiMPs extends to many languages.</p></a>
          <div className="c-card"><span className="tag">ACL 2027 · in preparation</span><h3>xBLiMPs</h3>
            <p>Original, human-written templates for each language; datasets complete on 11 Dec 2026, paper submitted on 4 Jan 2027.</p></div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="contact-h">
        <h2 id="contact-h">Contact us</h2>
        <p className="kicker">There are no silly questions</p>
        <p>Ask in <b>{CENTRAL_CONTACT.slack}</b> on the CambridgeNLP Slack, ask your language lead, or e-mail <a href={`mailto:${CENTRAL_CONTACT.email}`}>{CENTRAL_CONTACT.email}</a>.</p>
      </section>
    </div>
  )
}
