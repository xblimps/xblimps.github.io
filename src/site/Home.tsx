// Home (#/): the marketing and recruitment page (v3, 26 Nov 2026). It sells participation in a scientific project:
// "Does AI really understand your language?" The hook is a 30-second quiz built from real human-written minimal pairs
// (the English reference row and pairs from the linguists' notes in scripts/seed-data); it never claims model results,
// which do not exist yet. No invented
// numbers, testimonials or logos. xBLiMPs runs in phases, language by language, towards 182 BLiMPs: no deadline
// countdowns on the public site (26 Nov 2026). Recruitment is people-first ("You can be…") and at scale.

import React, { useEffect, useMemo, useState } from 'react'
import { LANGUAGE_DATA, CENTRAL_CONTACT } from './languages'
import { Sessions } from './guide/common'
import { YouCanBe, LanguageGrid } from './Generator'

// Real pairs: English = the guide's human-written reference row; the others are from the linguists' notes
// (scripts/seed-data/<code>.json), with their English gloss and explanation.
const QUIZ = [
  { lang: 'English', good: 'The refrigerator that stores all the cakes runs too cold.', bad: 'The refrigerator that stores all the cakes run too cold.',
    gloss: null, why: 'The verb agrees with "the refrigerator", not with "the cakes" right next to it.' },
  { lang: 'French', good: 'Elle est arrivée.', bad: 'Elle est arrivé.', gloss: 'She has arrived.',
    why: 'With être, the past participle agrees with a feminine subject: arrivée.' },
  { lang: 'Catalan', good: 'Els nens juguen al parc.', bad: 'Els nens juga al parc.', gloss: 'The children play in the park.',
    why: 'A plural subject needs a plural verb: juguen, not juga.' },
  { lang: 'Welsh', good: 'Pa fyfyrwyr enillodd y wobr?', bad: 'Pa fyfyrwyr enillon y wobr?', gloss: 'Which students won the prize?',
    why: 'Welsh "anti-agreement": when the subject is questioned, the verb stays in the default singular form.' },
  { lang: 'Tagalog', good: 'Bumili ang lalake ng isda sa tindahan.', bad: 'Bumili ang lalake ang isda sa tindahan.', gloss: 'The man bought fish at the store.',
    why: 'Only one phrase can be the "ang" pivot in an ordinary clause, so the fish must be marked "ng".' },
]

function Quiz() {
  // fixed order per visit, but the ✓ sentence is not always on the same side
  const order = useMemo(() => QUIZ.map(() => Math.random() < 0.5), [])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<null | 'good' | 'bad'>(null)
  const [score, setScore] = useState(0)
  const finished = i >= QUIZ.length
  if (finished) {
    return (
      <div className="m-quiz done">
        <div className="m-quiz-score">{score} / {QUIZ.length}</div>
        <h3>You just took the test we give language models.</h3>
        <p>For each pair, a model should find the grammatical sentence more likely. Native speakers get these right without thinking. xBLiMPs measures whether
          AI does, in every language. <b>Now help us write the tests.</b></p>
        <div className="c-btns" style={{ justifyContent: 'center' }}>
          <a className="c-btn" href="#/generator">Get involved in your language</a>
          <button className="c-btn ghost" onClick={() => { setI(0); setScore(0); setPicked(null) }}>Try again</button>
        </div>
      </div>
    )
  }
  const q = QUIZ[i]
  const sides: ('good' | 'bad')[] = order[i] ? ['good', 'bad'] : ['bad', 'good']
  const choose = (k: 'good' | 'bad') => { if (picked) return; setPicked(k); if (k === 'bad') setScore((s) => s + 1) }
  return (
    <div className="m-quiz">
      <div className="m-quiz-top"><span className="m-pill">{q.lang}</span><span className="c-note">Question {i + 1} of {QUIZ.length}</span></div>
      <h3>Which sentence is <u>wrong</u>?</h3>
      <div className="m-choices">
        {sides.map((k) => {
          const state = picked ? (k === 'bad' ? 'is-bad' : 'is-good') : ''
          return (
            <button key={k} className={`m-choice ${state} ${picked === k ? 'picked' : ''}`} onClick={() => choose(k)} disabled={!!picked}>
              {picked && <span className="m-mark" aria-hidden="true">{k === 'bad' ? '✗' : '✓'}</span>}{k === 'good' ? q.good : q.bad}
            </button>
          )
        })}
      </div>
      {picked && (
        <div className="m-reveal" role="status">
          <b>{picked === 'bad' ? 'Correct!' : 'Not quite.'}</b> {q.why}{q.gloss && <> <span className="c-note">({q.gloss})</span></>}
          <div><button className="c-btn small" style={{ marginTop: 10 }} onClick={() => { setI(i + 1); setPicked(null) }}>{i + 1 < QUIZ.length ? 'Next →' : 'See your score'}</button></div>
        </div>
      )}
      <p className="c-note" style={{ marginTop: 12 }}>Real pairs written by our linguists, not by AI.</p>
    </div>
  )
}

const SHARE_TEXT = 'Does AI really understand your language? Help build open grammar tests for AI in 9 languages with xBLiMPs (University of Cambridge).'

function Share() {
  const url = typeof location !== 'undefined' ? `${location.origin}${location.pathname}` : 'https://xblimps.github.io/'
  const [ok, setOk] = useState(false)
  const enc = encodeURIComponent
  return (
    <div className="m-share">
      <span>Know a native speaker? Share xBLiMPs:</span>
      <a href={`https://wa.me/?text=${enc(`${SHARE_TEXT} ${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noreferrer">LinkedIn</a>
      <a href={`https://x.com/intent/post?text=${enc(SHARE_TEXT)}&url=${enc(url)}`} target="_blank" rel="noreferrer">X</a>
      <a href={`https://bsky.app/intent/compose?text=${enc(`${SHARE_TEXT} ${url}`)}`} target="_blank" rel="noreferrer">Bluesky</a>
      <button onClick={async () => { try { await navigator.clipboard.writeText(url); setOk(true) } catch { /* ignore */ } }}>{ok ? 'Link copied ✓' : 'Copy link'}</button>
    </div>
  )
}

const FAQ: [string, string][] = [
  ['Do I need a linguistics degree?', 'No. If you speak the language natively, you already have the knowledge we need. Your language lead explains each grammatical construction in plain words.'],
  ['How much do I need to write?', 'As much or as little as you like. A few sentences help; some people write hundreds. A batch of 25 templates takes about an hour. We need many speakers per language, so every contribution counts.'],
  ['What exactly do I write?', 'Pairs of sentences: one correct, and one that is wrong in exactly one grammatical way. We give you real sentences from your language for vocabulary; you write the grammar.'],
  ['Can I use AI tools or copy sentences?', 'No. Every template must come from a person\'s own knowledge of the language. That is the whole point: we are testing AI against human judgement.'],
  ['Will I be credited?', 'Yes. With your permission you are acknowledged by name in the paper and the dataset, from one batch. Substantial contributions (about 300 templates, agreed in advance) can lead to co-authorship.'],
  ['My language is not listed.', `Add it! Email ${CENTRAL_CONTACT.email}. New languages join a later phase through a language lead and a native-speaker coordinator, and you can be either.`],
]

export default function Home() {
    return (
    <div className="m">
      {/* hero */}
      <section className="m-hero" aria-labelledby="hello">
        <div className="m-hero-inner">
          <p className="m-eyebrow">Open research · University of Cambridge · Phase 1 · {LANGUAGE_DATA.length} languages and growing</p>
          <h1 id="hello">Does AI really understand <span className="m-grad">your language?</span></h1>
          <p className="m-sub">AI sounds fluent. But does it know the rules? Help us find out, with the people who know each language best: its native speakers.</p>
          <div className="c-btns">
            <a className="c-btn m-big" href="#languages">Bring your language into xBLiMPs</a>
            <a className="c-btn ghost m-big" href="#quiz">Take the 30-second test</a>
          </div>
          <p className="m-trust">We're recruiting native speakers · Write a few sentences or hundreds · No linguistics degree needed · Credited by name</p>
        </div>
        <div className="m-marquee" aria-label="Project languages">
          <div className="m-track">
            {[...LANGUAGE_DATA, ...LANGUAGE_DATA].map((l, k) => <span key={k} dir={l.dir}>{l.native}</span>)}
          </div>
        </div>
      </section>

      {/* the hook */}
      <section className="c-section m-center" id="quiz" aria-labelledby="quiz-h">
        <p className="m-eyebrow">Try it</p>
        <h2 id="quiz-h">Can you spot the mistake? Can AI?</h2>
        <p className="m-lede">Five real pairs from five languages. Each pair is identical except in one place. This is exactly how we test language models.</p>
        <Quiz />
      </section>

      {/* why */}
      <section className="c-section" aria-labelledby="why-h">
        <p className="m-eyebrow">Why it matters</p>
        <h2 id="why-h">The future of AI shouldn't belong to English alone.</h2>
        <div className="c-grid m-why">
          <div className="c-card"><div className="m-ico" aria-hidden="true">🌍</div><h3>Most AI is tested in English</h3>
            <p>A model that looks brilliant in English may stumble on the grammar of other languages. We need tests that are native to each language, not translated.</p></div>
          <div className="c-card"><div className="m-ico" aria-hidden="true">🧠</div><h3>Fluency is not understanding</h3>
            <p>Convincing text is not proof that a model knows the rules behind it. Minimal pairs isolate one rule at a time, so the answer is unambiguous.</p></div>
          <div className="c-card"><div className="m-ico" aria-hidden="true">🗣️</div><h3>Native speakers know best</h3>
            <p>What sounds right in your language can't be looked up or translated from English. Your judgement is the research contribution.</p></div>
        </div>
      </section>

      {/* how */}
      <section className="c-section" id="how" aria-labelledby="how-h">
        <p className="m-eyebrow">How it works</p>
        <h2 id="how-h">We give you words. You write the grammar.</h2>
        <div className="m-steps">
          <div><span>1</span><h3>Pick your language</h3><p>Your language lead gives you a grammatical construction to work on, like subject–verb agreement.</p></div>
          <div><span>2</span><h3>Grab some words</h3><p>The lexical generator shows you a real sentence from your language, with an English translation and words you can reuse.</p></div>
          <div><span>3</span><h3>Write a test</h3><p>A correct sentence and a version that is wrong in exactly one way. Use the words, not the sentence.</p></div>
          <div><span>4</span><h3>Make it count</h3><p>A few or hundreds: every test counts. Your lead reviews them, and they become part of an open benchmark.</p></div>
        </div>
        <div className="c-btns" style={{ marginTop: 22 }}><a className="c-btn" href="#/generator">Open the lexical generator</a></div>
      </section>

      {/* what you get */}
      <section className="c-section" aria-labelledby="get-h">
        <p className="m-eyebrow">What you get</p>
        <h2 id="get-h">You're not filling in a spreadsheet. You're joining a research project.</h2>
        <div className="c-grid">
          <div className="c-card"><h3>📄 Your name in the research</h3><p>Acknowledged by name in the paper and the open dataset (with your permission).</p></div>
          <div className="c-card"><h3>✍️ A path to co-authorship</h3><p>Substantial contributions, agreed with the team in advance, can lead to co-authorship of the ACL 2027 paper.</p></div>
          <div className="c-card"><h3>🎓 Real research experience</h3><p>Learn how linguistic theory becomes a controlled experiment, alongside Cambridge researchers.</p></div>
          <div className="c-card"><h3>🧭 Lead your language</h3><p>Grow from contributor to reviewer, coordinator or language lead.</p></div>
        </div>
        <p className="c-note" style={{ marginTop: 10 }}>Payment for paid languages and the exact credit rules are in the <a href="#/guide/native">contributor guide</a>.</p>
      </section>

      {/* who */}
      <section className="c-section" aria-labelledby="who-h">
        <p className="m-eyebrow">Who we need</p>
        <h2 id="who-h">There's a place for you, whatever your background.</h2>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Native speakers</span><h3>Your language deserves to be understood by AI.</h3><p>Write a few tests or join a core team.</p></div>
          <div className="c-card"><span className="tag">Linguists</span><h3>Put linguistic theory to the test.</h3><p>Lead a language: choose the constructions and design the templates.</p></div>
          <div className="c-card"><span className="tag">Students</span><h3>Turn your knowledge into research.</h3><p>A real contribution to AI research, with your name on it.</p></div>
          <div className="c-card"><span className="tag">Community builders</span><h3>Bring your language community together.</h3><p>Become a native-speaker coordinator and grow your language's team.</p></div>
        </div>
      </section>

      {/* people first */}
      <section className="c-section" aria-labelledby="join-h">
        <p className="m-eyebrow">What can you do?</p>
        <h2 id="join-h">You can be part of xBLiMPs, in whatever way suits you.</h2>
        <YouCanBe />
        <div className="m-newlang">
          <div><h3>🌱 You can start a new language</h3>
            <p>Is your language missing? Become its first lead or coordinator, and we'll help you bring it into the next phase of xBLiMPs.</p></div>
          <a className="c-btn" href={`mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent('xBLiMPs: add my language')}`}>Add your language</a>
        </div>
      </section>

      {/* phases */}
      <section className="m-band" aria-labelledby="phases-h">
        <div>
          <h2 id="phases-h">Built in phases, language by language, towards 182 BLiMPs.</h2>
          <p>Phase 1 covers the languages below and the first xBLiMPs paper. Every phase adds new languages and new grammatical tests, so there is always room for yours.</p>
        </div>
        <a className="c-btn m-big m-light" href="#languages">Join a language</a>
      </section>

      {/* languages */}
      <section className="c-section" id="languages" aria-labelledby="langs-h">
        <p className="m-eyebrow">We're recruiting native speakers</p>
        <h2 id="langs-h">Choose your language</h2>
        <p className="m-lede">Whether you can write a few sentences or hundreds, we need you. The more speakers per language, the richer the tests.</p>
        <LanguageGrid to="generator" />
      </section>

      {/* faq */}
      <section className="c-section" aria-labelledby="faq-h">
        <p className="m-eyebrow">Questions</p>
        <h2 id="faq-h">Good to know</h2>
        <div className="m-faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="c-section" aria-labelledby="sess-h">
        <p className="m-eyebrow">Meet us</p>
        <h2 id="sess-h">Drop-in sessions (UK time)</h2>
        <Sessions />
      </section>

      <section className="c-section" aria-labelledby="team-h">
        <p className="m-eyebrow">Who we are</p>
        <h2 id="team-h">An open research collaboration</h2>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Central team · University of Cambridge</span><p style={{ marginTop: 8 }}>{CENTRAL_CONTACT.team}</p></div>
          <a className="c-card" href="https://aclanthology.org/2020.tacl-1.25/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <span className="tag">Builds on · Warstadt et al., 2020</span><h3>BLiMP</h3><p>The English benchmark of linguistic minimal pairs that xBLiMPs extends to many languages, with original sentences written by native speakers.</p></a>
          <div className="c-card"><span className="tag">Contact</span><p style={{ marginTop: 8 }}>{CENTRAL_CONTACT.slack} on the CambridgeNLP Slack, or <a href={`mailto:${CENTRAL_CONTACT.email}`}>{CENTRAL_CONTACT.email}</a>.</p></div>
        </div>
      </section>

      {/* final cta */}
      <section className="m-final">
        <h2>Your language. Your knowledge. A global scientific project.</h2>
        <p>Help make AI accountable to the world's languages.</p>
        <a className="c-btn m-big m-light" href="#/generator">Bring your language into xBLiMPs</a>
        <Share />
      </section>
    </div>
  )
}
