import React, { useState } from 'react'
import type { Workspace } from '../../lib/types'
import { cover } from '../../lib/seed'
import { Ring } from '../../components/ui'
import { STAGES, stageState } from '../../lib/stages'
import { useApp } from '../../state/AppContext'
import { store } from '../../lib/store'

// The xBLiMPs project home — what the project is, how the pipeline works, and a way
// into every language. Shown when you're in the xBLiMPs module but haven't drilled
// into a language yet (nav.workspaceId == null).

const HOW = STAGES.filter((s) => s.key !== 'Overview')

export default function Home({ langs, onOpen }: { langs: Workspace[]; onOpen: (id: string) => void }) {
  const { go } = useApp()
  const [stage, setStage] = useState(0)

  const totals = langs.reduce(
    (a, w) => {
      const s = stageState(w.language ?? '')
      a.phen += s.phenCount; a.tpl += s.tplCount; a.pair += s.pairCount
      return a
    },
    { phen: 0, tpl: 0, pair: 0 },
  )

  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <div className="cover" style={{ background: cover('#185FA5') }}>
        <div className="cover-badge">🔤</div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em' }}>xBLiMPs — multilingual minimal pairs</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 720, lineHeight: 1.55 }}>
          A collaborative platform for building grammatical test suites across many languages — a
          multilingual generalisation of BLiMP for probing what language models know about syntax.
          Each <b>minimal pair</b> contrasts a grammatical sentence with a near-identical ungrammatical
          one, isolating a single phenomenon so we can measure a model's structural sensitivity.
          The focus is under-studied and lower-resourced languages, built with native speakers at the
          University of Cambridge.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card"><div className="eyebrow">Languages</div><div style={{ fontSize: 26, fontWeight: 600 }}>{langs.length}</div></div>
        <div className="card"><div className="eyebrow">Phenomena</div><div style={{ fontSize: 26, fontWeight: 600 }}>{totals.phen}</div></div>
        <div className="card"><div className="eyebrow">Accepted pairs</div><div style={{ fontSize: 26, fontWeight: 600 }}>{totals.pair}</div></div>
      </div>

      {/* the workflow, end to end — so a new contributor understands what happens before/after templates */}
      <h2 style={{ fontSize: 17, margin: '30px 0 4px' }}>The workflow, end to end</h2>
      <p className="faint" style={{ fontSize: 13, marginTop: 0, maxWidth: 720 }}>
        Every language moves from published literature → gold-standard templates → a native-speaker-validated
        benchmark. Documentation and references come first; language-specific judgments are settled collaboratively.
      </p>
      <div className="guide" style={{ maxWidth: 'none', marginTop: 12 }}>
        <div className="info info-purple">
          <div className="info-head"><span className="i-ico">📚</span>Stage 0 — Reference bibliography (do this first)</div>
          <p>Before any template, build the project's <b>central, literature-grounded bibliography</b>. Add the
            descriptive grammars, syntax papers and dissertations you'll draw examples from — attributed
            <b> per language</b> and <b>per contributor</b> — so every future example traces back to a published
            source. It exports to the Overleaf paper and the private HuggingFace dataset.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={() => go({ workspaceId: null, section: 'Bibliography', focus: undefined })}>
            📚 Open the bibliography{store.db.sources.length ? ` (${store.db.sources.length})` : ''}
          </button>
        </div>
        <div className="stage-rail">
          <div className="stage-node info-blue">
            <div className="stage-ico">①</div><div className="stage-kicker">Stage 1</div>
            <div className="stage-title">Documentation</div>
            <div className="stage-blurb">Select 8–10 phenomena from the literature; document references, glosses, trees.</div>
          </div>
          <div className="stage-arrow">→</div>
          <div className="stage-node info-green">
            <div className="stage-ico">②</div><div className="stage-kicker">Stage 2</div>
            <div className="stage-title">Templates</div>
            <div className="stage-blurb">Turn each phenomenon into reusable minimal-pair templates seeded with gold-standard pairs.</div>
          </div>
          <div className="stage-arrow">→</div>
          <div className="stage-node info-yellow">
            <div className="stage-ico">③</div><div className="stage-kicker">Stage 3</div>
            <div className="stage-title">Validation &amp; scaling</div>
            <div className="stage-blurb">Native speakers validate and expand templates into ~100/phenomenon.</div>
          </div>
        </div>
        <div className="info info-blue">
          <div className="info-head"><span className="i-ico">🧭</span>Not a native speaker? You can still contribute</div>
          <p style={{ marginBottom: 0 }}>Your primary role is to <b>consolidate the published literature</b> — read grammars, organise
            phenomena, extract examples, and document references in the bibliography. Native speakers and syntacticians then
            verify language-specific judgments. See the <b>Annotation guide</b> for the full walkthrough.</p>
        </div>
      </div>

      {/* how it works — the guided pipeline, interactive */}
      <h2 style={{ fontSize: 17, margin: '30px 0 4px' }}>How it works</h2>
      <p className="faint" style={{ fontSize: 13, marginTop: 0 }}>Each language project walks through four stages. The rail unlocks them in order.</p>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', alignContent: 'flex-start' }}>
          {HOW.map((s, i) => (
            <button key={s.key} className={`btn btn-sm ${i === stage ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStage(i)}>
              <span style={{ marginRight: 6 }}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
        <div className="card" style={{ minHeight: 72 }}>
          <div className="eyebrow">{HOW[stage].icon} {HOW[stage].label}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>{HOW[stage].blurb}</div>
        </div>
      </div>

      {/* language projects */}
      <h2 style={{ fontSize: 17, margin: '30px 0 12px' }}>Language projects</h2>
      {langs.length === 0 && <div className="empty"><div className="big">🌍</div>No language projects yet.</div>}
      <div className="grid grid-3">
        {langs.map((w) => {
          const s = stageState(w.language ?? '')
          const pct = s.phenCount ? (s.pairCount / (s.phenCount * 100)) * 100 : 0
          return (
            <button key={w.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => onOpen(w.id)}>
              <div className="between" style={{ marginBottom: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="nav-dot" style={{ background: w.colour }} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{w.name}</span>
                </div>
                <Ring pct={pct} label={`${s.pairCount}`} />
              </div>
              {w.subtitle && <div className="faint" style={{ fontSize: 12, marginBottom: 10 }}>{w.subtitle}</div>}
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span className="tag">{s.phenCount} phenomena</span>
                <span className="tag">{s.tplCount} templates</span>
                <span className="tag">{s.pairCount} pairs</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
