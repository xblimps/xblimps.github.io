// Whole-tab import: paste a language sheet tab (macro / sub labels, stacked "Templates:" headers,
// seed rows) and get every template in it checked, counted against the targets, sampled three at a
// time for sign-off, and generated in one download. Deterministic (src/lib/lexgen.ts): no model,
// no network, nothing leaves the browser.

import React, { useMemo, useState } from 'react'
import {
  analyse, expand, manyToDelimited, samplePairs, sheetToTemplates,
  type LexOptions, type LexTemplate, type SheetTemplate, type SlotRole, type GeneratedPair,
} from '../lib/lexgen'
import { downloadText } from '../lib/download'

/** Seed rows per subphenomenon and per macrophenomenon in the first release (project targets). */
const PER_SUB = 33
const PER_MACRO = 100

const ROLE_SHORT: Record<SlotRole, string> = { shared: '·', good: '✓', bad: '✗', off: 'off' }
const NEXT_ROLE: Record<SlotRole, SlotRole> = { shared: 'good', good: 'bad', bad: 'off', off: 'shared' }

export default function SheetImport({ o, onOpen }: { o: LexOptions; onOpen: (t: LexTemplate) => void }) {
  const [text, setText] = useState('')
  const [items, setItems] = useState<SheetTemplate[]>([])
  const [samples, setSamples] = useState<Record<number, GeneratedPair[]>>({})

  const read = () => { setItems(sheetToTemplates(text)); setSamples({}) }
  const cycleRole = (k: number, ci: number) => setItems((cur) => cur.map((s, i) => {
    if (i !== k) return s
    const columns = s.template.columns.map((c, j) => (j === ci ? { ...c, role: NEXT_ROLE[c.role] } : c))
    return { ...s, template: { ...s.template, columns } }
  }))

  const analysed = useMemo(() => items.map((s) => ({ s, a: analyse(s.template) })), [items])
  const ok = analysed.filter((x) => x.a.ok)
  const totalPairs = ok.reduce((n, x) => n + x.a.total, 0)
  const seedRows = analysed.reduce((n, x) => n + x.a.plans.length, 0)

  // seed rows per macro / sub (a seed row = one row of alternatives the lead wrote)
  const coverage = useMemo(() => {
    const m = new Map<string, Map<string, number>>()
    for (const { s, a } of analysed) {
      const mk = s.template.macro || '(no macrophenomenon label)'
      const sk = s.template.sub || '(no subphenomenon label)'
      if (!m.has(mk)) m.set(mk, new Map())
      const subs = m.get(mk)!
      subs.set(sk, (subs.get(sk) ?? 0) + a.plans.length)
    }
    return m
  }, [analysed])

  const download = (sep: ',' | '\t') => {
    const body = manyToDelimited(ok.map(({ s, a }) => ({ t: s.template, pairs: Array.from(expand(s.template, o, a)) })), sep)
    downloadText(`xblimps_tab_pairs.${sep === ',' ? 'csv' : 'tsv'}`, (sep === ',' ? '﻿' : '') + body, sep === ',' ? 'text/csv' : 'text/tab-separated-values')
  }
  const sampleAll = () => {
    const out: Record<number, GeneratedPair[]> = {}
    analysed.forEach(({ s, a }, k) => { if (a.ok) out[k] = samplePairs(s.template, 3, o) })
    setSamples(out)
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="step-n">0</span><h2>Check a whole sheet tab</h2>
        <span className="spacer" />
        {items.length > 0 && <>
          <button className="btn btn-sm" onClick={sampleAll} disabled={!ok.length}>3 examples per template</button>
          <button className="btn btn-sm btn-primary" onClick={() => download(',')} disabled={!ok.length}>Download all (CSV)</button>
          <button className="btn btn-sm" onClick={() => download('\t')} disabled={!ok.length}>TSV</button>
        </>}
      </div>
      <div className="panel-body">
        <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
          In your language sheet, select the whole tab (click the top-left corner, or Ctrl/⌘+A), copy, and paste it here.
          The tool finds every template (the <b>Templates:</b> header rows or rows of <b>{'{slots}'}</b>), reads the
          macro- and subphenomenon from the left-hand columns, and checks each one. It understands the sheet conventions:
          <b> *{'{…}'}</b> or <b>_mismatch</b> / <b>_nonagr</b> marks the ✗ slot; a doubled comma (<b>mare,, Em</b>) or a
          trailing comma (<b>(partir,)</b>) is a real comma; a <i>“commas are not a delimiter in the X cell”</i> note is
          respected; <b>(optional)</b> slots can be left out; Persian <b>،</b> works as a separator.
        </div>
        <textarea className="paste" value={text} onChange={(e) => setText(e.target.value)}
          placeholder={'Macrophenomenon\tSubphenomenon\tTemplates:\t{subj}\t{V_sg}\t*{V_sg_mismatch}\n\t\t1.0\t(la fille, Marie)\t(mange, chante)\t(mangent, chantent)'} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={read} disabled={!text.trim()}>Read the tab</button>
          {items.length > 0 && (
            <span className="muted" style={{ fontSize: 13 }}>
              {items.length} template{items.length === 1 ? '' : 's'} · {seedRows} seed row{seedRows === 1 ? '' : 's'} ·
              {' '}{ok.length} ready · {totalPairs.toLocaleString('en-GB')} pairs
            </span>
          )}
          {text.trim() && items.length === 0 && <span className="faint" style={{ fontSize: 13 }}>Press “Read the tab”. No templates found yet means no row of {'{slot}'} headers was found.</span>}
        </div>

        {items.length > 0 && (
          <>
            <h3 style={{ marginTop: 18 }}>Templates found</h3>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Click a slot marker to change its role (· shared → ✓ → ✗ → off). “off” leaves a column out of the sentences,
              e.g. one of two alternative verb columns. Sheets that don't mark ✓/✗ (Catalan's FINAL TEMPLATES) need this once per template.
            </div>
            <div className="t-wrap">
              <table className="t">
                <thead><tr><th>Sheet row</th><th>Template</th><th>Slots</th><th>Seed rows</th><th>Pairs</th><th /></tr></thead>
                <tbody>
                  {analysed.map(({ s, a }, k) => {
                    const err = a.issues.find((i) => i.level === 'error')
                    return (
                      <React.Fragment key={k}>
                        <tr>
                          <td className="faint mono">{s.headerRow}</td>
                          <td style={{ maxWidth: 340 }}>{s.template.name}</td>
                          <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                            {s.template.columns.map((c, ci) => (
                              <button key={ci} className={`role-chip ${c.role}`} title={`${c.label}: click to change role`} onClick={() => cycleRole(k, ci)}>
                                {ROLE_SHORT[c.role]}{c.literal ? ',' : ''}
                              </button>
                            ))}
                          </td>
                          <td>{a.plans.length}</td>
                          <td>{a.ok ? a.total.toLocaleString('en-GB') : <span className="bad-txt" title={err?.message}>needs a fix</span>}</td>
                          <td><button className="btn btn-sm btn-ghost" onClick={() => onOpen(s.template)}>Open ↓</button></td>
                        </tr>
                        {err && <tr><td /><td colSpan={5} className="bad-txt" style={{ fontSize: 12.5 }}>{err.row ? `Seed row ${err.row}: ` : ''}{err.message}</td></tr>}
                        {samples[k]?.map((p, j) => (
                          <tr key={`s${j}`} className="sample-row"><td /><td colSpan={2} className="pair-good">{p.good}</td><td colSpan={3} className="pair-bad">{p.bad}</td></tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 18 }}>Seed rows against the targets</h3>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Targets for 11 December: {PER_MACRO} per macrophenomenon, at least {PER_SUB} per subphenomenon (3 subphenomena each).
              Generated pairs are for checking and variety; the seed rows people write are what count.
            </div>
            <div className="t-wrap">
              <table className="t">
                <thead><tr><th>Macrophenomenon</th><th>Subphenomenon</th><th>Seed rows</th><th>Target</th></tr></thead>
                <tbody>
                  {[...coverage.entries()].map(([mk, subs]) => {
                    const sum = [...subs.values()].reduce((x, y) => x + y, 0)
                    return (
                      <React.Fragment key={mk}>
                        {[...subs.entries()].map(([sk, n], j) => (
                          <tr key={sk}>
                            <td>{j === 0 ? <b>{mk}</b> : ''}</td><td>{sk}</td>
                            <td className={n >= PER_SUB ? 'good-txt' : ''}>{n}</td><td className="faint">≥ {PER_SUB}</td>
                          </tr>
                        ))}
                        <tr><td /><td className="faint">macrophenomenon total</td><td className={sum >= PER_MACRO ? 'good-txt' : ''}><b>{sum}</b></td><td className="faint">{PER_MACRO}</td></tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
