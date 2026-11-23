// Lexical generator: the principal tool of the site. A lead or native speaker writes a template
// (slot headers + per-slot alternatives, with one ✓ and one ✗ slot) and gets every minimal pair.
// Deterministic Cartesian product over human-written alternatives (src/lib/lexgen.ts): no model,
// no network, no randomness. Nothing typed here leaves the browser.

import React, { useEffect, useMemo, useState } from 'react'
import {
  analyse, demoTemplate, expand, pairsToDelimited, splitAlternatives, templateFromText, templateToTSV,
  DEFAULT_OPTIONS, WARN_PER_ROW, WARN_TOTAL, type LexOptions, type LexTemplate, type SlotRole, type GeneratedPair,
} from '../lib/lexgen'
import { downloadText, copyText } from '../lib/download'
import SheetImport from './SheetImport'

const PREVIEW_N = 200
const STORE_KEY = 'xblimps.lexgen.v1'

const ROLE_LABEL: Record<SlotRole, string> = { shared: 'shared slot', good: '✓ correct', bad: '✗ incorrect', off: 'leave out' }

function load(): { t: LexTemplate; o: LexOptions } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (v && v.t && Array.isArray(v.t.columns) && Array.isArray(v.t.rows)) return { t: v.t, o: { ...DEFAULT_OPTIONS, ...v.o } }
  } catch { /* storage unavailable: start from the demo */ }
  return null
}
function save(t: LexTemplate, o: LexOptions) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ t, o })) } catch { /* ignore */ }
}

const safeName = (s: string) => (s.trim() || 'template').replace(/[^\w.-]+/g, '_')

function Pair({ p, goodCol, badCol }: { p: GeneratedPair; goodCol: number; badCol: number }) {
  // highlight the contrast filler inside each sentence (first occurrence, case-insensitive)
  const mark = (s: string, tok: string) => {
    if (!tok) return s
    const i = s.toLowerCase().indexOf(tok.toLowerCase())
    if (i < 0) return s
    return <>{s.slice(0, i)}<mark className="ct">{s.slice(i, i + tok.length)}</mark>{s.slice(i + tok.length)}</>
  }
  return (
    <tr>
      <td className="faint mono">{p.row}.{p.index}</td>
      <td className="pair-good">{mark(p.good, p.fillers[goodCol])}</td>
      <td className="pair-bad">{mark(p.bad, p.fillers[badCol])}</td>
    </tr>
  )
}

export default function Generator() {
  const initial = useMemo(() => load(), [])
  const [t, setT] = useState<LexTemplate>(initial?.t ?? demoTemplate())
  const [o, setO] = useState<LexOptions>(initial?.o ?? DEFAULT_OPTIONS)
  const [paste, setPaste] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { save(t, o) }, [t, o])
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(''), 2200); return () => clearTimeout(h) }, [toast])

  const a = useMemo(() => analyse(t), [t])
  const preview = useMemo(() => {
    if (!a.ok) return []
    const out: GeneratedPair[] = []
    for (const p of expand(t, o, a)) { out.push(p); if (out.length >= PREVIEW_N) break }
    return out
  }, [t, o, a])

  // ---- editing helpers ----
  const setCol = (ci: number, patch: Partial<LexTemplate['columns'][number]>) =>
    setT((cur) => ({ ...cur, columns: cur.columns.map((c, i) => (i === ci ? { ...c, ...patch } : c)) }))
  const setCell = (ri: number, ci: number, v: string) =>
    setT((cur) => ({ ...cur, rows: cur.rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? v : c)) : r)) }))
  const addCol = () => setT((cur) => {
    // insert new ordinary slots before the ✓ / ✗ pair, so the contrast stays at the end by default
    const at = cur.columns.findIndex((c) => c.role !== 'shared')
    const pos = at < 0 ? cur.columns.length : at
    const columns = [...cur.columns]; columns.splice(pos, 0, { label: `{slot_${cur.columns.length + 1}}`, role: 'shared' })
    return { ...cur, columns, rows: cur.rows.map((r) => { const n = [...r]; n.splice(pos, 0, ''); return n }) }
  })
  const delCol = (ci: number) => setT((cur) => ({ ...cur, columns: cur.columns.filter((_, i) => i !== ci), rows: cur.rows.map((r) => r.filter((_, i) => i !== ci)) }))
  const moveCol = (ci: number, d: -1 | 1) => setT((cur) => {
    const j = ci + d
    if (j < 0 || j >= cur.columns.length) return cur
    const sw = <T,>(arr: T[]) => { const n = [...arr]; [n[ci], n[j]] = [n[j], n[ci]]; return n }
    return { ...cur, columns: sw(cur.columns), rows: cur.rows.map(sw) }
  })
  const addRow = () => setT((cur) => ({ ...cur, rows: [...cur.rows, cur.columns.map(() => '')] }))
  const delRow = (ri: number) => setT((cur) => ({ ...cur, rows: cur.rows.filter((_, i) => i !== ri) }))

  const importPaste = () => {
    const nt = templateFromText(paste, t.name)
    if (nt.columns.length === 0) { setToast('Nothing to import'); return }
    setT(nt); setShowPaste(false); setPaste(''); setToast(`Imported ${nt.columns.length} slots × ${nt.rows.length} row(s)`)
  }

  const all = () => (a.ok ? Array.from(expand(t, o, a)) : [])
  const dl = (sep: ',' | '\t') => {
    const pairs = all()
    if (!pairs.length) return
    const body = pairsToDelimited(t, pairs, sep)
    downloadText(`${safeName(t.name)}_pairs.${sep === ',' ? 'csv' : 'tsv'}`, (sep === ',' ? '﻿' : '') + body, sep === ',' ? 'text/csv' : 'text/tab-separated-values')
  }

  const formula = (ri: number) => {
    const plan = a.plans.find((p) => p.row === ri + 1)
    if (!plan) return ''
    const parts: string[] = []
    t.columns.forEach((c, ci) => {
      if (c.role === 'shared') parts.push(String(Math.max(1, plan.alts[ci].length)))
      else if (c.role === 'good') parts.push(`${plan.pairs.length}✓✗`)
    })
    return `${parts.join(' × ')} = ${plan.count.toLocaleString('en-GB')}`
  }

  const errors = a.issues.filter((i) => i.level === 'error')
  const others = a.issues.filter((i) => i.level !== 'error')

  return (
    <div>
      <div className="gen-hero">
        <div>
          <div className="eyebrow-s">xBLiMPs · lexical generation</div>
          <h1>Turn one template row into every minimal pair</h1>
          <p>
            Write the slot headers and, under each slot, the words that can naturally go there. The generator
            combines them into every ✓ / ✗ pair, so you can check the set, download it and paste it into your
            language sheet.
          </p>
          <div className="no-ai">✓ No AI: every word comes from the alternatives you write. Same input, same output. Nothing leaves your browser.</div>
        </div>
        <div className="gen-roles">
          <a className="btn" href="#/guide/lead">I'm a language lead →</a>
          <a className="btn" href="#/guide/native">I'm a native speaker →</a>
        </div>
      </div>

      {/* ---- 0. whole sheet tab ---- */}
      <SheetImport o={o} onOpen={(nt) => {
        setT(nt); setToast(`Opened ${nt.name}`)
        document.getElementById('template-panel')?.scrollIntoView({ behavior: 'smooth' })
      }} />

      {/* ---- 1. template ---- */}
      <div className="panel" id="template-panel">
        <div className="panel-head">
          <span className="step-n">1</span><h2>Template</h2>
          <input className="field" style={{ maxWidth: 240, padding: '5px 9px', fontSize: 13 }} value={t.name}
            aria-label="Template name" onChange={(e) => setT({ ...t, name: e.target.value })} />
          <span className="spacer" />
          <button className="btn btn-sm" onClick={() => setShowPaste((v) => !v)}>{showPaste ? 'Close paste' : 'Paste from sheet'}</button>
          <button className="btn btn-sm" onClick={async () => setToast((await copyText(templateToTSV(t))) ? 'Template copied (tab-separated)' : 'Copy failed')}>Copy template</button>
          <button className="btn btn-sm" onClick={() => { setT(demoTemplate()); setO(DEFAULT_OPTIONS); setToast('Demo restored') }}>Load demo</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setT({ name: 'template', columns: [{ label: '{slot_1}', role: 'shared' }, { label: '{target}', role: 'good' }, { label: '{target_bad}', role: 'bad' }], rows: [['', '', '']] })}>Clear</button>
        </div>
        <div className="panel-body">
          {showPaste && (
            <div style={{ marginBottom: 14 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Copy the header row and one or more rows from your sheet (Google Sheets / Excel cells paste as tab-separated), or paste
                CSV or a Markdown table. Mark the grammatical header with <b>✓</b> and the ungrammatical one with <b>✗</b> (or start it with <b>*</b>).
                Separate alternatives with commas (Persian <b>،</b> works too). For a real comma inside an alternative, double it
                (<b>Segons la meva mare,, Em van dir que</b>), end a single alternative with it (<b>(partir,)</b>), or separate the
                alternatives with <b>|</b> or <b>;</b> instead. Write <b>∅</b> for “leave empty”.
              </div>
              <textarea className="paste" value={paste} onChange={(e) => setPaste(e.target.value)}
                placeholder={'{subj_sg}\t{rel}\t{V_trans}\t{obj_pl}\t{VP_sg} ✓\t*{VP_pl} ✗\n(the refrigerator, the freezer)\tthat\t(stores, holds)\t(all the cakes)\t(runs too cold)\t(run too cold)'} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={importPaste} disabled={!paste.trim()}>Import (replaces the grid)</button>
              </div>
            </div>
          )}

          <div className="grid-wrap">
            <table className="slots">
              <thead>
                <tr>
                  <th />
                  {t.columns.map((c, ci) => (
                    <th key={ci}>
                      <div className={`slot-head ${c.role}`}>
                        <input value={c.label} aria-label={`Slot ${ci + 1} header`} onChange={(e) => setCol(ci, { label: e.target.value })} />
                        <div className="row2">
                          <select value={c.role} aria-label={`Slot ${ci + 1} role`} onChange={(e) => setCol(ci, { role: e.target.value as SlotRole })}>
                            {(['shared', 'good', 'bad', 'off'] as SlotRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                          <button className="x" title="Move left" onClick={() => moveCol(ci, -1)}>‹</button>
                          <button className="x" title="Move right" onClick={() => moveCol(ci, 1)}>›</button>
                          <button className="x" title="Remove slot" onClick={() => delCol(ci)}>×</button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th style={{ minWidth: 0 }}><button className="btn btn-sm" onClick={addCol}>+ slot</button></th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, ri) => (
                  <tr key={ri}>
                    <td className="rown">row {ri + 1}<br /><button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} title="Remove row" onClick={() => delRow(ri)}>×</button></td>
                    {t.columns.map((c, ci) => {
                      const n = splitAlternatives(r[ci] ?? '', c.role).length
                      return (
                        <td key={ci}>
                          <textarea className="cell" value={r[ci] ?? ''} aria-label={`Row ${ri + 1}, ${c.label}`}
                            placeholder="alternative, alternative, …" onChange={(e) => setCell(ri, ci, e.target.value)} />
                          <div className="cell-count">{n} alternative{n === 1 ? '' : 's'}</div>
                        </td>
                      )
                    })}
                    <td className="rown formula">{formula(ri)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-sm" onClick={addRow}>+ row</button>
            <span className="faint" style={{ fontSize: 12.5 }}>
              The ✓ and ✗ alternatives are matched by position: the 1st ✓ goes with the 1st ✗, the 2nd with the 2nd, and so on.
            </span>
          </div>

          <div className="opts" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hair-2)' }}>
            <label>Join slots with
              <select value={o.joiner} onChange={(e) => setO({ ...o, joiner: e.target.value as LexOptions['joiner'] })}>
                <option value=" ">a space</option>
                <option value="">nothing (scripts without spaces)</option>
              </select>
            </label>
            <label><input type="checkbox" checked={o.capitalise} onChange={(e) => setO({ ...o, capitalise: e.target.checked })} /> Capitalise first letter</label>
            <label>End with
              <input type="text" value={o.endPunct} style={{ width: 46 }} onChange={(e) => setO({ ...o, endPunct: e.target.value })} />
            </label>
          </div>
        </div>
      </div>

      {/* ---- 2. generated pairs ---- */}
      <div className="panel">
        <div className="panel-head">
          <span className="step-n">2</span><h2>Generated minimal pairs</h2>
          <span className="spacer" />
          {toast && <span className="toast">{toast}</span>}
          <button className="btn btn-sm btn-primary" disabled={!a.ok || a.total === 0} onClick={() => dl(',')}>Download CSV</button>
          <button className="btn btn-sm" disabled={!a.ok || a.total === 0} onClick={() => dl('\t')}>Download TSV</button>
          <button className="btn btn-sm" disabled={!a.ok || a.total === 0}
            onClick={async () => setToast((await copyText(pairsToDelimited(t, all(), '\t'))) ? 'Pairs copied: paste into a sheet' : 'Copy failed')}>Copy for sheet</button>
        </div>
        <div className="panel-body">
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div className="count-big">{a.ok ? a.total.toLocaleString('en-GB') : '–'}</div>
            <div className="muted">
              minimal pair{a.total === 1 ? '' : 's'} from {a.plans.length} row{a.plans.length === 1 ? '' : 's'}
              {a.ok && a.total > PREVIEW_N && <> · showing the first {PREVIEW_N}</>}
            </div>
          </div>

          {a.explode && a.ok && (
            <div className="explode">
              <b>The combinations are exploding.</b> More than {WARN_PER_ROW.toLocaleString('en-GB')} pairs from one row
              (or {WARN_TOTAL.toLocaleString('en-GB')} in total) usually means some alternatives do not combine naturally with each other,
              and nobody can check that many by hand. Keep each slot to the options that work with <i>every</i> option in the other slots,
              or split the row into several smaller rows. Alternatives are not counted toward your total: the rows are.
            </div>
          )}

          {(errors.length > 0 || others.length > 0) && (
            <ul className="issues">
              {[...errors, ...others].map((i, k) => (
                <li key={k} className={i.level}>{i.row ? <b>Row {i.row}: </b> : null}{i.message}</li>
              ))}
            </ul>
          )}

          {a.ok && preview.length > 0 && (
            <div className="t-wrap" style={{ marginTop: 14 }}>
              <table className="t">
                <thead><tr><th>#</th><th className="good">✓ grammatical</th><th className="bad">✗ ungrammatical</th></tr></thead>
                <tbody>{preview.map((p) => <Pair key={`${p.row}.${p.index}`} p={p} goodCol={a.goodCol} badCol={a.badCol} />)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ---- 3. check ---- */}
      <div className="panel">
        <div className="panel-head"><span className="step-n">3</span><h2>Check before you use them</h2></div>
        <div className="panel-body" style={{ fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>A generated pair is usable only if, for <b>every</b> combination:</p>
          <ul style={{ marginTop: 0 }}>
            <li>the ✓ sentence is something a native speaker would naturally say or write;</li>
            <li>the ✗ sentence is wrong <b>only</b> because of the target phenomenon (for agreement: agreement, not tense or word choice);</li>
            <li>the template's construction is unchanged: only the words inside the slots differ;</li>
            <li>no option clashes with another (e.g. a verb that cannot take one of the objects), and nothing is offensive or names a real person.</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            If one combination fails, remove that alternative or move it to its own row. If the template itself seems impossible in your
            language, <a href="#/guide/native">flag it</a> to your language lead rather than changing it. More in <a href="#/guide/help">common mistakes</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
