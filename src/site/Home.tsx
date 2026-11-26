// Home (#/): the marketing and recruitment page (v3, 26 Nov 2026). It sells participation in a scientific project:
// "Does AI really understand your language?" The hook is a 30-second quiz built from real human-written minimal pairs
// (the English reference row and pairs from the linguists' notes in scripts/seed-data); it never claims model results,
// which do not exist yet. No invented
// numbers, testimonials or logos. xBLiMPs runs in phases, language by language, towards 182 BLiMPs: no deadline
// countdowns on the public site (26 Nov 2026). Recruitment is people-first ("You can be…") and at scale.

import React, { useEffect, useMemo, useState } from 'react'
import { LANGUAGE_DATA, CENTRAL_CONTACT } from './languages'
import { Sessions } from './guide/common'
import { LanguageGrid, Flag } from './Generator'

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

const mailto = (subject: string) => `mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent(subject)}`

export default function Home() {
  return (
    <div className="m">
      {/* hero: the CAFe greeting (welcoming, two columns, flags instead of a scrolling list of names) */}
      <section className="c-hero m-welcome" aria-labelledby="hello">
        <div>
          <p className="m-eyebrow">Open research · University of Cambridge · Phase 1</p>
          <h1 id="hello">Welcome to xBLiMPs! <span aria-hidden="true">👋</span></h1>
          <p className="lead">Does AI really understand <b>your language</b>? We're building open grammar tests for AI, written by the people who know each
            language best: its native speakers. Write a few sentences or hundreds; no linguistics degree needed, and you're credited by name.</p>
          <div className="c-btns">
            <a className="c-btn" href="#languages">Get involved</a>
            <a className="c-btn ghost" href="#quiz">Take the 30-second test</a>
          </div>
        </div>
        <div className="m-flags-card" aria-label="Project languages">
          <p className="m-eyebrow" style={{ margin: '0 0 12px' }}>{LANGUAGE_DATA.length} languages and growing</p>
          <div className="m-flags">
            {LANGUAGE_DATA.map((l) => (
              <a key={l.code} href={`#/generator/${l.code}`} title={l.name}>
                <Flag lang={l} size={36} /><span dir={l.dir}>{l.native}</span>
              </a>
            ))}
            <a href="#new-languages" className="m-flags-add"><b aria-hidden="true">+</b><span>Yours?</span></a>
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
        <h2 id="why-h">Most AI is tested in English. We need to change that.</h2>
        <div className="m-points">
          <p><b>Fluency isn't understanding.</b> Our tests reveal whether AI actually knows the grammar behind a sentence.</p>
          <p><b>Your language matters.</b> Native speakers bring knowledge that translation cannot replace. Your contribution helps make AI better for everyone.</p>
        </div>
      </section>

      {/* how */}
      <section className="c-section" id="how" aria-labelledby="how-h">
        <p className="m-eyebrow">How it works</p>
        <h2 id="how-h">We give you words. You write the grammar.</h2>
        <ol className="m-compact">
          <li><b>Pick a language.</b> Choose a grammatical feature with your language lead.</li>
          <li><b>Get your words.</b> Use our generator to find words from real sentences.</li>
          <li><b>Write two sentences.</b> One correct, one with exactly one grammatical mistake.</li>
          <li><b>Submit your tests.</b> Your work helps build an open benchmark for researchers worldwide.</li>
        </ol>
        <div className="c-btns" style={{ marginTop: 18 }}><a className="c-btn" href="#/generator">Start creating tests →</a></div>
      </section>

      {/* get involved + what you get */}
      <section className="c-section" id="involved" aria-labelledby="involved-h">
        <p className="m-eyebrow">Get involved</p>
        <h2 id="involved-h">There's more than one way to contribute.</h2>
        <div className="m-two">
          <ul className="m-compact m-ways">
            <li><b>Write tests.</b> Create a few sentences or hundreds using our <a href="#/generator">lexical generator</a>. <a href={mailto('xBLiMPs: I want to contribute')}>I want to contribute →</a></li>
            <li><b>Join a language team.</b> Work with other speakers to build and review your language's collection. <a href={mailto('xBLiMPs: join a core team')}>Join a team →</a></li>
            <li><b>Coordinate a community.</b> Bring speakers together and grow your language team. <a href={mailto('xBLiMPs: coordinator')}>Coordinate →</a></li>
            <li><b>Lead a language.</b> Choose grammatical constructions, guide contributors and review tests. <a href={mailto('xBLiMPs: language lead')}>Lead →</a></li>
          </ul>
          <div className="m-get">
            <h3>What you get</h3>
            <ul className="m-compact">
              <li><b>Research credit.</b> Named acknowledgement in the papers and the open dataset, with your permission.</li>
              <li><b>A path to co-authorship.</b> We publish in batches of papers as languages are completed. Substantial contributions, agreed in advance, can earn co-authorship.</li>
              <li><b>Research experience.</b> Work alongside Cambridge researchers and develop practical research skills.</li>
              <li><b>Room to grow.</b> Progress from contributor to reviewer, coordinator or language lead.</li>
            </ul>
            <p className="c-note" style={{ margin: '10px 0 0' }}>Payment for paid languages and credit rules are in the <a href="#/guide/native">contributor guide</a>.</p>
          </div>
        </div>
        <div className="c-btns" style={{ marginTop: 20 }}><a className="c-btn" href="#languages">Find your way into xBLiMPs →</a></div>
      </section>

      {/* phases */}
      <section className="m-band" aria-labelledby="phases-h">
        <div>
          <h2 id="phases-h">Built in phases, language by language, towards 182 BLiMPs.</h2>
          <p>Every phase adds new languages and new grammatical tests, so there is always room for yours.</p>
        </div>
      </section>

      {/* languages: ongoing projects vs new languages */}
      <section className="c-section" id="languages" aria-labelledby="langs-h">
        <p className="m-eyebrow">Join our ongoing projects</p>
        <h2 id="langs-h">Write tests in a language we're already building.</h2>
        <p className="m-lede">We're recruiting native speakers for every language below. A few sentences or hundreds: every test counts.</p>
        <LanguageGrid to="generator" add={false} />
      </section>

      <section className="c-section" id="new-languages" aria-labelledby="new-h">
        <div className="m-newlang">
          <div>
            <p className="m-eyebrow" style={{ margin: '0 0 6px' }}>Start a new language</p>
            <h3 id="new-h">We're recruiting language leads for Korean, Arabic and many more.</h3>
            <p>Linguists and native speakers: bring a new language into the next phase of xBLiMPs as its lead or coordinator. We'll help you set it up.</p>
          </div>
          <a className="c-btn" href={mailto('xBLiMPs: add my language')}>Start a new language</a>
        </div>
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
