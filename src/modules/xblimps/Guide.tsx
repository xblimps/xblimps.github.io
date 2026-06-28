import React from 'react'
import { cover } from '../../lib/seed'
import { Panel } from '../../components/ui'
import { STAGES } from '../../lib/stages'

// Task guidelines — the workflow, best practices, and how to author templates. Written
// for syntacticians who may be more comfortable with a tree than a slot grid, so it
// bridges from a syntactic analysis to an operational xBLiMPs template.

const WORK = STAGES.filter((s) => s.key !== 'Overview')

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, margin: '30px 0 10px', letterSpacing: '-0.01em' }}>{children}</h2>
}

export default function Guide() {
  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <div className="cover" style={{ background: cover('#1D9E75') }}>
        <div className="cover-badge">📖</div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>Annotation guide</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 720, lineHeight: 1.55 }}>
          How to build a minimal-pair test suite, from phenomenon to export. The goal of each pair is
          to isolate <b>one</b> grammatical contrast so a language model's failure can only be explained
          by that phenomenon — nothing else should change between the grammatical and ungrammatical sentence.
        </p>
      </div>

      {/* the pipeline */}
      <H>The workflow</H>
      <div className="grid grid-2" style={{ gap: 14 }}>
        {WORK.map((s) => (
          <div key={s.key} className="card">
            <div className="eyebrow">{s.icon} {s.label}</div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>{s.blurb}</div>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 13, marginTop: 10 }}>
        Stages unlock in order: add a phenomenon before a template, a template before cards, accept
        cards before export. The rail shows a 🔒 with what's needed to continue.
      </p>

      {/* best practices */}
      <H>Best practices</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Panel hue="#185FA5" label="One contrast per pair">
          Vary a single feature. If you flip subject–verb agreement, keep tense, word order, lexical
          items and punctuation identical. Anything else that differs becomes a confound.
        </Panel>
        <Panel hue="#BA7517" label="Minimal, natural, unambiguous">
          The grammatical member should be fully natural to a native speaker; the ungrammatical member
          should be clearly bad for the intended reason — not merely odd, rare, or pragmatically marked.
        </Panel>
        <Panel hue="#1D9E75" label="Ground it in the literature">
          Cite the reference grammar or paper the contrast comes from. Citations live on the template,
          so every card derived from it inherits the same provenance.
        </Panel>
        <Panel hue="#D85A30" label="Cover the paradigm">
          Aim for ~100 examples per phenomenon by sampling many lexical fillers through one template,
          rather than hand-writing each sentence. Breadth of fillers is what makes the suite robust.
        </Panel>
      </div>

      {/* templates */}
      <H>How to create a template</H>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 760 }}>
        A template is a reusable sentence frame with <b>slots</b>. You write the frame once; the card
        flow samples fillers into the slots to mass-produce pairs. A template has four parts:
      </p>
      <ol className="muted" style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 760 }}>
        <li><b>Slots</b> — named placeholders like <code>{'{SUBJ}'}</code>, <code>{'{VERB}'}</code>, each with a list of fillers (and optionally a POS / frequency band, or corpus sampling from the word bank).</li>
        <li><b>Grammatical frame</b> — e.g. <code>{'{VERB} {SUBJ} {GOAL}.'}</code></li>
        <li><b>Ungrammatical frame</b> — the same frame with the single perturbation, e.g. a starred verb form <code>{'{VERB}* {SUBJ} {GOAL}.'}</code></li>
        <li><b>Contrast note</b> — one line stating exactly what differs (e.g. "3PL vs 3SG verb agreement against subject type").</li>
      </ol>
      <Panel hue="#185FA5" label="Worked example — verb agreement (Welsh)">
        <div className="mono" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
          slots: VERB = [Cerddon, Rhedon, Canon]; SUBJ = [nhw, Aled a Sara, y plant]; GOAL = [i'r ysgol, adref]<br />
          ✓ grammatical:&nbsp;&nbsp;&nbsp;{'{VERB} {SUBJ} {GOAL}.'}<br />
          ✗ ungrammatical:&nbsp;{'{VERB}* {SUBJ} {GOAL}.'}<br />
          contrast: 3PL vs 3SG agreement morphology against subject type
        </div>
      </Panel>

      {/* the tree bridge */}
      <H>Prefer a syntax tree?</H>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 760 }}>
        You don't have to think in slots first. Many syntacticians find it easier to start from the
        structure and convert. A reliable recipe:
      </p>
      <Panel hue="#BA7517" label="From tree to template">
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7 }}>
          <li>Sketch the analysis — bracketed notation works: <code className="mono">[TP [DP the children] [T' [T -PL] [VP ran home]]]</code>.</li>
          <li>Mark the node that carries the contrast (here the agreement feature on T).</li>
          <li>Turn the open lexical positions (DP, V, PP…) into slots; keep the rest as fixed frame text.</li>
          <li>Derive the ungrammatical member by perturbing <i>only</i> the marked node (flip the agreement feature → starred form).</li>
          <li>Paste the bracketed tree and Minimalist/feature analysis into the template's analysis fields so it travels with every card and exports to CoNLL-U.</li>
        </ol>
      </Panel>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 10 }}>
        Template Studio keeps the structural analysis (parse, feature bundles, perturbation type) on the
        template itself — author it once and the card flow auto-derives it per pair, so you never
        re-annotate structure card by card.
      </p>

    </div>
  )
}
