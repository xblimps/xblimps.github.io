// Home (#/): the mission and recruitment page (26 Nov 2026). It sells participation in a scientific project, not a
// spreadsheet exercise: "Does AI really understand your language? Help us find out." Then audiences, how it works
// ("we give you words, you write the grammar"), three ways to join, the four layers of each language, the project at a
// glance (targets only; live counts appear once submissions are connected, never invented), recognition, languages,
// team, sessions, research and contact. Copy follows Suchir's brand direction. The example pair is the human-written
// English reference row used across the guide.

import React from 'react'
import { LANGUAGE_DATA, CENTRAL_CONTACT } from './languages'
import { Sessions, Confirm } from './guide/common'

export default function Home() {
  return (
    <div>
      <section className="c-hero" aria-labelledby="hello">
        <div>
          <h1 id="hello">Does AI really understand your language?</h1>
          <p className="lead" style={{ fontSize: 22, fontWeight: 600, color: 'var(--c-ink)' }}>Help us find out.</p>
          <p className="lead">
            AI is learning to speak the world's languages. But speaking a language and understanding its grammar are not the same thing.
            xBLiMPs is an open scientific project bringing together native speakers, linguists and researchers to investigate what language
            models really know about human language.
          </p>
          <p className="lead"><b>We believe the people who know a language best should have a voice in how AI is tested.</b></p>
          <div className="c-btns">
            <a className="c-btn" href="#/contribute">Bring your language into xBLiMPs</a>
            <a className="c-btn ghost" href="#how">How it works</a>
          </div>
          <p className="c-note" style={{ marginTop: 14 }}>An open research collaboration · University of Cambridge</p>
        </div>
        <div className="c-hero-art" aria-label="An example minimal pair">
          <div className="c-pair">
            <p className="c-note" style={{ margin: 0, fontWeight: 600 }}>A grammatical test, written by a person:</p>
            <div className="g">✓ The refrigerator that stores all the cakes <mark>runs</mark> too cold.</div>
            <div className="b">✗ The refrigerator that stores all the cakes <mark>run</mark> too cold.</div>
            <p className="c-note" style={{ margin: 0 }}>The verb must agree with <i>the refrigerator</i>, not with <i>the cakes</i> next to it.
              Does a language model prefer the first sentence, in every language? That is what xBLiMPs measures.</p>
          </div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="who-for">
        <h2 id="who-for">Your knowledge is the research contribution</h2>
        <p className="kicker">You don't need to build AI models to contribute to AI research</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Native speakers</span><h3>Your language deserves to be understood by AI</h3>
            <p>You know what sounds right in your language. AI might not. No linguistics degree needed.</p></div>
          <div className="c-card"><span className="tag">Linguists</span><h3>Put linguistic theory to the test</h3>
            <p>Turn agreement, word order, morphology and syntax into controlled experiments on how machines process language.</p></div>
          <div className="c-card"><span className="tag">Students</span><h3>Turn your knowledge into research</h3>
            <p>Contribute to an international collaboration on human language and artificial intelligence, and be credited for it.</p></div>
          <div className="c-card"><span className="tag">Multilingual communities</span><h3>The future of AI shouldn't belong to English alone</h3>
            <p>Help bring the world's linguistic diversity into how AI is evaluated.</p></div>
        </div>
      </section>

      <section className="c-section" id="how" aria-labelledby="how-h">
        <h2 id="how-h">How it works</h2>
        <p className="kicker">We give you words. You write the grammar.</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">1</span><h3>Choose your language</h3><p>Select the language you speak natively.</p></div>
          <div className="c-card"><span className="tag">2</span><h3>See your construction</h3><p>We tell you which grammatical construction to work on, for example subject–verb agreement.</p></div>
          <div className="c-card"><span className="tag">3</span><h3>Look at the words</h3><p>We show you a sentence from real text in your language, with an English translation and words you could reuse.</p></div>
          <div className="c-card"><span className="tag">4</span><h3>Write your own examples</h3><p>A correct sentence and an incorrect version that differs only in the target feature.</p></div>
          <div className="c-card"><span className="tag">5</span><h3>Submit</h3><p>Add your templates to your language's sheet. Repeat with new words to keep the dataset diverse.</p></div>
        </div>
        <div className="c-callout" style={{ marginTop: 20 }}>
          <h3>Use the words, NOT the sentence.</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Don't copy, translate or paraphrase the sample sentence. Rearrange its words, substitute others, change the structure, or build
            something entirely new. Asked for subject–verb agreement, you might take <i>refrigerator</i>, <i>cakes</i>, <i>store</i> and <i>freezer</i> and write your own
            sentences that test whether the verb agrees with its subject.</p>
        </div>
      </section>

      <section className="c-section" aria-labelledby="join-h">
        <h2 id="join-h">Three ways to join</h2>
        <p className="kicker">Choose the commitment that suits you</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Lead a language</span><h3>Take scientific or community ownership</h3>
            <p>As a linguist, define the constructions and check quality. As a native-speaker coordinator, build and run your language's community.</p>
            <p style={{ marginTop: 10 }}><a href={`mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent('xBLiMPs: lead or coordinate a language')}`}>Get in touch →</a></p></div>
          <div className="c-card"><span className="tag">Build a language</span><h3>Join a core team</h3>
            <p>A small, committed group of 3–8 speakers who write about 30 templates each and review one another's work.</p>
            <p style={{ marginTop: 10 }}><a href={`mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent('xBLiMPs: join a core team')}`}>Join a team →</a></p></div>
          <div className="c-card"><span className="tag">Contribute to a language</span><h3>Whenever you have time</h3>
            <p>Write a few templates, suggest a construction, or flag a sentence that sounds wrong. Five minutes is enough to help.</p>
            <p style={{ marginTop: 10 }}><a href="#/contribute">Start now →</a></p></div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="layers-h">
        <h2 id="layers-h">Every language, four layers</h2>
        <p className="kicker">A small research community around each language</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Layer 1</span><h3>Language lead</h3><p>A linguistics researcher who defines the constructions, designs templates and validates quality.</p></div>
          <div className="c-card"><span className="tag">Layer 2</span><h3>Native-speaker coordinator</h3><p>Recruits speakers, runs onboarding, allocates work, follows up and makes sure everyone is credited.</p></div>
          <div className="c-card"><span className="tag">Layer 3</span><h3>Core team</h3><p>3–8 dedicated speakers who write and review the main collection of templates.</p></div>
          <div className="c-card"><span className="tag">Layer 4</span><h3>Open community</h3><p>Anyone who speaks the language: extra templates, suggested constructions, naturalness judgements.</p></div>
        </div>
      </section>

      <section className="c-section" aria-labelledby="glance-h">
        <h2 id="glance-h">The project at a glance</h2>
        <p className="kicker">Targets for the ACL 2027 dataset</p>
        <div className="c-stats">
          <div className="c-stat"><b>{LANGUAGE_DATA.filter((l) => l.status === 'active').length}</b><span>languages in the first release (Basque in phase 2)</span></div>
          <div className="c-stat"><b>~1,000</b><span>human-written templates per language</span></div>
          <div className="c-stat"><b>10</b><span>grammatical areas per language, ~100 templates each</span></div>
          <div className="c-stat"><b>30</b><span>templates per contributor, about 3 per area</span></div>
          <div className="c-stat"><b>11 Dec</b><span>datasets complete; paper submitted 4 Jan 2027</span></div>
        </div>
        <p className="c-note" style={{ marginTop: 12 }}>Live counts of contributors and approved templates will appear here once submissions are connected to the site.
          We count <b>approved</b> templates, not just submitted ones.</p>
      </section>

      <section className="c-section" aria-labelledby="credit-h">
        <h2 id="credit-h">Recognition</h2>
        <p className="kicker">Contributors are research collaborators</p>
        <div className="c-grid">
          <div className="c-card"><h3>Credited by name</h3><p>With your permission, in the paper and the dataset documentation, from one batch of templates.</p></div>
          <div className="c-card"><h3>Co-authorship</h3><p>Substantial contributions (about 300 templates, agreed with the team in advance) can lead to co-authorship.</p></div>
          <div className="c-card"><h3>A path to leading</h3><p>Especially knowledgeable contributors can become reviewers, coordinators or language leads.</p></div>
        </div>
        <p className="c-note" style={{ marginTop: 10 }}>Payment for paid languages and the details of credit are in the <a href="#/guide/native">native-speaker guide</a>.</p>
      </section>

      <section className="c-section" id="languages" aria-labelledby="langs-h">
        <h2 id="langs-h">Choose your language</h2>
        <p className="kicker">Each language has its own page and team</p>
        <div className="c-langs">
          {LANGUAGE_DATA.map((l) => (
            <a key={l.code} href={`#/contribute/${l.code}`} className={`c-lang${l.status === 'active' ? '' : ' off'}`}>
              <b>{l.name}</b><span className="native" dir={l.dir}>{l.native}</span>
              <div className="state">{l.status === 'active' ? 'Contribute →' : 'Phase 2 · find out more →'}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="c-section" aria-labelledby="team-h">
        <h2 id="team-h">Who we are</h2>
        <p className="kicker">University of Cambridge, with language leads around the world</p>
        <div className="c-grid">
          <div className="c-card"><span className="tag">Central team</span><h3>University of Cambridge</h3><p>{CENTRAL_CONTACT.team}</p></div>
          <div className="c-card"><span className="tag">Language leads</span><h3>One or two per language</h3>
            <p>Listed on each language's page once they agree. <Confirm>lead names, once each lead agrees to be listed</Confirm></p></div>
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
            <p>The English benchmark whose minimal-pair design xBLiMPs extends to many languages, with original sentences written by native speakers.</p></a>
          <div className="c-card"><span className="tag">ACL 2027 · in preparation</span><h3>xBLiMPs</h3>
            <p>An open benchmark of human-written grammatical tests across languages, and what they reveal about language models.</p></div>
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
