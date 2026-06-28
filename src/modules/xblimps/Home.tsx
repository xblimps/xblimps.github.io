import React, { useState } from 'react'
import type { Workspace } from '../../lib/types'
import { cover } from '../../lib/seed'
import { Ring } from '../../components/ui'
import { STAGES, stageState } from '../../lib/stages'

// The xBLiMPs project home — what the project is, how the pipeline works, and a way
// into every language. Shown when you're in the xBLiMPs module but haven't drilled
// into a language yet (nav.workspaceId == null).

const HOW = STAGES.filter((s) => s.key !== 'Overview')

export default function Home({ langs, onOpen }: { langs: Workspace[]; onOpen: (id: string) => void }) {
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
