// Lexical generator: the central tool of the site. A lead or contributor pastes or writes a slot
// pattern (slot headers, one ✓ and one ✗ slot) and one or more templates (rows of per-slot
// alternatives) and gets every minimal pair, deduplicated. The sheet check (SheetImport) sits beside
// it for whole language-sheet tabs.
// Deterministic Cartesian product over human-written alternatives (src/lib/lexgen.ts): no model,
// no network, no randomness. Nothing typed here leaves the browser.

import React, { useEffect, useMemo, useState } from 'react'
import {
  analyse, dedupePairs, demoTemplate, expand, pairsToDelimited, splitAlternatives, templateFromText, templateToTSV,
  DEFAULT_OPTIONS, WARN_PER_ROW, WARN_TOTAL, type LexOptions, type LexTemplate, type SlotRole, type GeneratedPair,
} from '../lib/lexgen'
import { downloadText, copyText } from '../lib/download'
import SheetImport from './SheetImport'
import { LANGUAGES } from './guide/common'

const PREVIEW_N = 200
/** Count unique pairs live only up to this many generated pairs (beyond it, only at download). */
const UNIQUE_LIVE_MAX = 20000
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
/** Open a template in the generator page (used by the Worked Demo's "try it" button). */
export function loadIntoGenerator(t: LexTemplate, o: LexOptions = DEFAULT_OPTIONS) {
  save(t, o)
  window.location.hash = '#/'
}

const safeName = (s: string) => (s.trim() || 'slot_pattern').replace(/[^\w.-]+/g, '_')

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
      <td className="pair-good" dir="auto">{mark(p.good, p.fillers[goodCol])}</td>
      <td className="pair-bad" dir="auto">{mark(p.bad, p.fillers[badCol])}</td>
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
  // preview: the first PREVIEW_N distinct pairs (repeats are skipped, as in the download)
  const preview = useMemo(() => {
    if (!a.ok) return []
    const out: GeneratedPair[] = []
    const seen = new Set<string>()
    for (const p of expand(t, o, a)) {
      const k = p.good + '\u0000' + p.bad
      if (seen.has(k)) continue
      seen.add(k); out.push(p)
      if (out.length >= PREVIEW_N) break
    }
    return out
  }, [t, o, a])
  // repeated pairs (same ✓ and ✗ sentence), counted live for templates of a reasonable size
  const repeats = useMemo(() => {
    if (!a.ok || a.total > UNIQUE_LIVE_MAX) return null
    const seen = new Set<string>()
    for (const p of expand(t, o, a)) seen.add(p.good + '\u0000' + p.bad)
    return a.total - seen.size
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
    setT(nt); setShowPaste(false); setPaste(''); setToast(`Imported ${nt.columns.length} slots × ${nt.rows.length} template${nt.rows.length === 1 ? '' : 's'}`)
  }

  // every pair, deduplicated: nobody should review the same pair twice
  const all = () => (a.ok ? dedupePairs(Array.from(expand(t, o, a))) : { pairs: [], removed: 0 })
  const dl = (sep: ',' | '\t') => {
    const { pairs, removed } = all()
    if (!pairs.length) return
    const body = pairsToDelimited(t, pairs, sep)
    setToast(`${pairs.length.toLocaleString('en-GB')} unique pairs${removed ? ` (${removed} repeated removed)` : ''}`)
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
    return `${parts.join(' × ')} = ${plan.count.toLocaleString('en-GB')} pairs`
  }

  const errors = a.issues.filter((i) => i.level === 'error')
  const others = a.issues.filter((i) => i.level !== 'error')

  const openPaste = () => {
    setShowPaste(true)
    document.getElementById('template-panel')?.scrollIntoView({ behavior: 'smooth' })
  }
  const openSheet = () => document.getElementById('sheet-panel')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div>
      <div className="gen-hero">
        <div>
          <div className="eyebrow-s">xBLiMPs · lexical generation</div>
          <h1>From template to minimal pairs</h1>
          <p>
            Paste a template row from your language sheet, or a whole sheet tab. The generator expands the alternatives in every slot
            into ✓ / ✗ minimal pairs, removes repeats, and lets you read, download and paste them back into your sheet.
          </p>
          <div className="target-strip">
            <span><b>Template</b> = one sheet row, 3–4 alternatives in every varying slot. The unit that counts.</span>
            <span><b>Target</b>: ~1,000 templates per language (10 macrophenomena × 100) → ~10,000 generated sentences, by 11 Dec.</span>
            <span>Generated sentences do not count. <a href="#/guide">Instructions →</a></span>
          </div>
          <ol className="how-it-works" aria-label="What the generator does">
            <li><b>Slot pattern.</b> The header row: one label per slot, one slot marked ✓ and its partner ✗.</li>
            <li><b>Template.</b> Each row under it lists 3–4 alternatives per slot, written by a native speaker.</li>
            <li><b>Combine.</b> Every combination of one alternative per slot gives a ✓ sentence and its ✗ partner, identical except in the contrast slot.</li>
            <li><b>Deduplicate and check.</b> Repeats are removed; you read every pair, then download or copy them back into your sheet.</li>
          </ol>
          <p className="faint" style={{ fontSize: 13, margin: '6px 0 0' }}>
            Step by step with a real example: <a href="#/guide/demo">Worked Demo</a>. Works for all project languages
            ({LANGUAGES.join(', ')}): it needs no language data, only the words you write. Persian lists can use <b>،</b>; for scripts without spaces set “Join slots with” to “nothing”.
          </p>
          <div className="no-ai">✓ No AI: every word comes from the alternatives people write. Same input, same output. Nothing leaves your browser.</div>
        </div>
      </div>

      <div className="entry-grid">
        <div className="entry-card">
          <div className="eyebrow-s">One slot pattern</div>
          <h3>Generate from template rows</h3>
          <p>Paste the header row (the slot pattern) and one or more template rows, or edit the grid below. Mark the ✓ and ✗ slots; every combination is listed.</p>
          <div className="entry-actions">
            <button className="btn btn-primary btn-sm" onClick={openPaste}>Paste template rows</button>
            <button className="btn btn-sm" onClick={() => { setT(demoTemplate()); setO(DEFAULT_OPTIONS); setToast('Worked example loaded'); document.getElementById('template-panel')?.scrollIntoView({ behavior: 'smooth' }) }}>Load the worked example</button>
          </div>
        </div>
        <div className="entry-card">
          <div className="eyebrow-s">A whole tab</div>
          <h3>Check a language sheet</h3>
          <p>Paste a whole tab: every slot pattern is found and checked, templates are counted against the targets, words repeated across templates are listed, and all pairs download at once.</p>
          <div className="entry-actions">
            <button className="btn btn-sm" onClick={openSheet}>Open the sheet check ↓</button>
            <a className="btn btn-sm btn-ghost" href="#/guide/advice">How to write a template</a>
          </div>
        </div>
      </div>

      {/* ---- 1. template ---- */}
      <div className="panel" id="template-panel">
        <div className="panel-head">
          <span className="step-n">1</span><h2>Slot pattern and templates</h2>
          <input className="field" style={{ maxWidth: 240, padding: '5px 9px', fontSize: 13 }} value={t.name}
            aria-label="Slot pattern name" onChange={(e) => setT({ ...t, name: e.target.value })} />
          <span className="spacer" />
          <button className="btn btn-sm" onClick={() => setShowPaste((v) => !v)}>{showPaste ? 'Close paste' : 'Paste from sheet'}</button>
          <button className="btn btn-sm" onClick={async () => setToast((await copyText(templateToTSV(t))) ? 'Templates copied (tab-separated)' : 'Copy failed')}>Copy templates</button>
          <button className="btn btn-sm" onClick={() => { setT(demoTemplate()); setO(DEFAULT_OPTIONS); setToast('Worked example loaded') }}>Worked example</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setT({ name: 'slot pattern', columns: [{ label: '{slot_1}', role: 'shared' }, { label: '{target}', role: 'good' }, { label: '{target_bad}', role: 'bad' }], rows: [['', '', '']] })}>Clear</button>
        </div>
        <div className="panel-body">
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>
            The header row is the <b>slot pattern</b>; each row under it is one <b>template</b>, with 3–4 alternatives in every varying slot
            (including ✓ and ✗). Every alternative in a row must make sense with every other one, because the generator combines them all.
          </div>
          {showPaste && (
            <div style={{ marginBottom: 14 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Copy the header row and one or more template rows from your sheet (Google Sheets / Excel cells paste as tab-separated), or paste
                CSV or a Markdown table. Mark the grammatical header with <b>✓</b> and the ungrammatical one with <b>✗</b> (or start it with <b>*</b>).
                Separate alternatives with commas (Persian <b>،</b> works too). For a real comma inside an alternative, double it
                (<b>Segons la meva mare,, Em van dir que</b>), end a single alternative with it (<b>(partir,)</b>), or separate the
                alternatives with <b>|</b> or <b>;</b> instead. Write <b>∅</b> for “leave empty”.
              </div>
              <textarea className="paste" dir="auto" value={paste} onChange={(e) => setPaste(e.target.value)}
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
                    <td className="rown">template {ri + 1}<br /><button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} title="Remove template" onClick={() => delRow(ri)}>×</button></td>
                    {t.columns.map((c, ci) => {
                      const n = splitAlternatives(r[ci] ?? '', c.role).length
                      return (
                        <td key={ci}>
                          <textarea className="cell" dir="auto" value={r[ci] ?? ''} aria-label={`Row ${ri + 1}, ${c.label}`}
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
            <button className="btn btn-sm" onClick={addRow}>+ template</button>
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
            onClick={async () => setToast((await copyText(pairsToDelimited(t, all().pairs, '\t'))) ? 'Pairs copied: paste into a sheet' : 'Copy failed')}>Copy for sheet</button>
        </div>
        <div className="panel-body">
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div className="count-big">{a.ok ? a.total.toLocaleString('en-GB') : '–'}</div>
            <div className="muted">
              generated pair{a.total === 1 ? '' : 's'} from <b>{a.plans.length} template{a.plans.length === 1 ? '' : 's'}</b> (templates count; generated pairs do not)
              {repeats != null && repeats > 0 && <> · {repeats.toLocaleString('en-GB')} repeated pair{repeats === 1 ? '' : 's'} removed from the preview and downloads</>}
              {a.ok && a.total > PREVIEW_N && <> · showing the first {PREVIEW_N} distinct</>}
            </div>
          </div>

          {a.explode && a.ok && (
            <div className="explode">
              <b>The combinations are exploding.</b> More than {WARN_PER_ROW.toLocaleString('en-GB')} pairs from one row
              (or {WARN_TOTAL.toLocaleString('en-GB')} in total) usually means some alternatives do not combine naturally with each other,
              and nobody can check that many by hand. Keep each slot to the options that work with <i>every</i> option in the other slots,
              or split the row into several smaller rows. Generated pairs and alternatives do not count toward your total: templates (rows) do.
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

      {/* ---- sheet check, beside the generator ---- */}
      <SheetImport o={o} onOpen={(nt) => {
        setT(nt); setToast(`Opened ${nt.name}`)
        document.getElementById('template-panel')?.scrollIntoView({ behavior: 'smooth' })
      }} />

      {/* ---- 3. check ---- */}
      <div className="panel">
        <div className="panel-head"><span className="step-n">3</span><h2>Check before you use them</h2></div>
        <div className="panel-body" style={{ fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ marginTop: 0 }}>A generated pair is usable only if, for <b>every</b> combination:</p>
          <ul style={{ marginTop: 0 }}>
            <li>the ✓ sentence is something a native speaker would naturally say or write;</li>
            <li>the ✗ sentence is wrong <b>only</b> because of the target phenomenon (for agreement: agreement, not tense or word choice);</li>
            <li>the slot pattern is unchanged: only the words inside the slots differ, and the row is consistent for gender, number and so on;</li>
            <li>no option clashes with another (e.g. a verb that cannot take one of the objects), and nothing is offensive or names a real person.</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Vary your words across templates, too: the sheet check lists words that recur in many templates. If one combination fails, remove that
            alternative or move it to its own row. If the slot pattern itself seems impossible in your language, <a href="#/guide/native">flag it</a> to
            your language lead rather than changing it. More in <a href="#/guide/advice">Advice</a> (writing rules and common mistakes).
          </p>
        </div>
      </div>
    </div>
  )
}
