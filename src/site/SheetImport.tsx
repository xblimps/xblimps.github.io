// Sheet check: paste a whole language sheet tab (macro / sub labels, stacked "Templates:" header rows
// = slot patterns, template rows underneath) and get every slot pattern checked, its templates counted
// against the targets, words repeated across many templates listed, three sample pairs per slot
// pattern for sign-off, and every pair (deduplicated) in one download. Deterministic
// (src/lib/lexgen.ts): no model, no network, nothing leaves the browser.

import React, { useMemo, useState } from 'react'
import {
  analyse, expand, findContradictions, manyToDelimited, repeatedWords, samplePairs, sheetToTemplates, REPEAT_MIN_LETTERS,
  type LexOptions, type LexTemplate, type SheetTemplate, type SlotRole, type GeneratedPair,
} from '../lib/lexgen'
import { downloadText } from '../lib/download'

/** Project targets (Suchir, 23–24 Nov 2026): 10 macros × 100 templates = ~1,000 templates per language. */
const PER_MACRO = 100
const PER_LANGUAGE = 1000
const GENERATED_PER_LANGUAGE = 10000
/** Templates per subphenomenon: 0 or 1 sub → 100; 2 → 50 each; 3 (the maximum) → at least 33 each. */
const perSub = (subs: number) => (subs <= 1 ? PER_MACRO : subs === 2 ? 50 : 33)
const TOP_REPEATED = 15

const ROLE_SHORT: Record<SlotRole, string> = { shared: '·', good: '✓', bad: '✗', off: 'off' }
const NEXT_ROLE: Record<SlotRole, SlotRole> = { shared: 'good', good: 'bad', bad: 'off', off: 'shared' }
const NO_SUB = '(no subphenomenon label)'

export default function SheetImport({ o, onOpen }: { o: LexOptions; onOpen: (t: LexTemplate) => void }) {
  const [text, setText] = useState('')
  const [items, setItems] = useState<SheetTemplate[]>([])
  const [samples, setSamples] = useState<Record<number, GeneratedPair[]>>({})
  const [note, setNote] = useState('')

  const read = () => { setItems(sheetToTemplates(text)); setSamples({}); setNote('') }
  const cycleRole = (k: number, ci: number) => setItems((cur) => cur.map((s, i) => {
    if (i !== k) return s
    const columns = s.template.columns.map((c, j) => (j === ci ? { ...c, role: NEXT_ROLE[c.role], inferred: false } : c))
    return { ...s, template: { ...s.template, columns } }
  }))

  const analysed = useMemo(() => items.map((s) => ({ s, a: analyse(s.template) })), [items])
  const ok = analysed.filter((x) => x.a.ok)
  const totalPairs = ok.reduce((n, x) => n + x.a.total, 0)
  // a template = a row with 3+ alternatives in every varying slot and a usable ✓ / ✗ contrast (not
  // every parsed row: rows that fail the rule or have a broken contrast are not counted)
  const rowCount = analysed.reduce((n, x) => n + x.a.plans.length, 0)
  const templateCount = analysed.reduce((n, x) => n + x.a.templates, 0)

  // templates per macro / sub (a template = one row of alternatives under a slot pattern)
  const coverage = useMemo(() => {
    const m = new Map<string, Map<string, number>>()
    for (const { s, a } of analysed) {
      const mk = s.template.macro || '(no macrophenomenon label)'
      const sk = s.template.sub || NO_SUB
      if (!m.has(mk)) m.set(mk, new Map())
      const subs = m.get(mk)!
      subs.set(sk, (subs.get(sk) ?? 0) + a.templates)
    }
    return m
  }, [analysed])

  // lexical repetition across the whole tab (review fatigue)
  const repeated = useMemo(() => repeatedWords(items.map((s) => s.template)).filter((r) => r.templates >= 3).slice(0, TOP_REPEATED), [items])
  const heavy = Math.max(5, Math.ceil(templateCount * 0.1))

  const download = (sep: ',' | '\t') => {
    // deduplicate across the whole tab (nobody should review the same pair twice) and drop identical ✓ = ✗ pairs
    const seen = new Set<string>()
    let removed = 0
    let identical = 0
    const groups = ok.map(({ s, a }) => ({
      t: s.template,
      pairs: Array.from(expand(s.template, o, a)).filter((p) => {
        if (p.good === p.bad) { identical++; return false }
        const key = p.good + '\u0000' + p.bad
        if (seen.has(key)) { removed++; return false }
        seen.add(key)
        return true
      }),
    }))
    const contradictions = findContradictions(groups.flatMap((g) => g.pairs)).length
    const body = manyToDelimited(groups, sep)
    downloadText(`xblimps_tab_pairs.${sep === ',' ? 'csv' : 'tsv'}`, (sep === ',' ? '﻿' : '') + body, sep === ',' ? 'text/csv' : 'text/tab-separated-values')
    setNote([
      `${seen.size.toLocaleString('en-GB')} unique pairs downloaded`,
      removed ? `${removed.toLocaleString('en-GB')} repeated removed` : '',
      identical ? `${identical.toLocaleString('en-GB')} identical ✓ = ✗ removed` : '',
      contradictions ? `${contradictions.toLocaleString('en-GB')} sentence${contradictions === 1 ? '' : 's'} labelled both ✓ and ✗: check the lists` : '',
    ].filter(Boolean).join(' · '))
  }
  const sampleAll = () => {
    const out: Record<number, GeneratedPair[]> = {}
    analysed.forEach(({ s, a }, k) => { if (a.ok) out[k] = samplePairs(s.template, 3, o) })
    setSamples(out)
  }

  return (
    <div className="panel" id="sheet-panel">
      <div className="panel-head">
        <span className="step-n">S</span><h2>Sheet check: a whole language sheet tab</h2>
        <span className="spacer" />
        {note && <span className="toast">{note}</span>}
        {items.length > 0 && <>
          <button className="btn btn-sm" onClick={sampleAll} disabled={!ok.length}>3 sample pairs per slot pattern</button>
          <button className="btn btn-sm btn-primary" onClick={() => download(',')} disabled={!ok.length}>Download all (CSV)</button>
          <button className="btn btn-sm" onClick={() => download('\t')} disabled={!ok.length}>TSV</button>
        </>}
      </div>
      <div className="panel-body">
        <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
          In your language sheet, select the whole tab (click the top-left corner, or Ctrl/⌘+A), copy, and paste it here.
          The tool finds every slot pattern (the <b>Templates:</b> header rows or rows of <b>{'{slots}'}</b>) and the templates under it,
          reads the macro- and subphenomenon from the left-hand columns, counts templates against the targets and lists words repeated
          across many templates. Best results: start each header row with <b>Templates:</b>, put every slot in <b>{'{braces}'}</b>, and mark the
          contrast <b>✓</b> / <b>✗</b> (or <b>*</b>). It also reads the other sheet conventions:
          <b>_mismatch</b> / <b>_nonagr</b> names for the ✗ slot (roles guessed from names are flagged for you to check, and left unset when the
          names are ambiguous); a doubled comma (<b>mare,, Em</b>), a trailing comma (<b>(partir,)</b>) or a cell in <b>[square brackets]</b> keeps
          a real comma; a <i>“commas are not a delimiter in the X cell”</i> note is respected; <b>(optional)</b> slots can be left out; Persian
          <b> ،</b> works as a separator. Columns right of the last {'{slot}'} are shown, never dropped silently.
        </div>
        <textarea className="paste" value={text} onChange={(e) => setText(e.target.value)} aria-label="Paste a whole sheet tab"
          placeholder={'Macrophenomenon\tSubphenomenon\tTemplates:\t{subj}\t{V_sg}\t*{V_sg_mismatch}\n\t\t1.0\t(alternative, alternative, alternative)\t(…)\t(…)'} />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={read} disabled={!text.trim()}>Read the tab</button>
          {items.length > 0 && (
            <span className="muted" style={{ fontSize: 13 }}>
              {items.length} slot pattern{items.length === 1 ? '' : 's'} · {rowCount} row{rowCount === 1 ? '' : 's'} read ·{' '}
              <b>{templateCount} template{templateCount === 1 ? '' : 's'}</b> (3+ alternatives in every varying slot) ·
              {' '}{ok.length} ready · {totalPairs.toLocaleString('en-GB')} generated pairs (before deduplication)
            </span>
          )}
          {text.trim() && items.length === 0 && <span className="faint" style={{ fontSize: 13 }}>Press “Read the tab”. No slot patterns found yet means no row of {'{slot}'} headers was found.</span>}
        </div>

        {items.length > 0 && (
          <>
            <h3 style={{ marginTop: 18 }}>Templates against the targets</h3>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Target for 11 December: ~{PER_LANGUAGE.toLocaleString('en-GB')} templates per language (10 macrophenomena × {PER_MACRO}) → ~{GENERATED_PER_LANGUAGE.toLocaleString('en-GB')} generated sentences.
              Subphenomena are optional, at most 3 per macro: 2 → 50 each; 3 → at least 33 each. Only templates count; generated sentences and alternatives do not.
              A row counts as a template when every varying slot (✓ / ✗ included) has 3 or more alternatives and its ✓ / ✗ lists pair up; other rows are listed below but not counted.
            </div>
            <div className="t-wrap">
              <table className="t">
                <thead><tr><th>Macrophenomenon</th><th>Subphenomenon</th><th>Templates</th><th>Target</th></tr></thead>
                <tbody>
                  {[...coverage.entries()].map(([mk, subs]) => {
                    const sum = [...subs.values()].reduce((x, y) => x + y, 0)
                    const named = [...subs.keys()].filter((k) => k !== NO_SUB).length
                    const target = perSub(named)
                    return (
                      <React.Fragment key={mk}>
                        {[...subs.entries()].map(([sk, n], j) => (
                          <tr key={sk}>
                            <td>{j === 0 ? <b>{mk}</b> : ''}</td><td>{sk}</td>
                            <td className={n >= target ? 'good-txt' : ''}>{n}</td><td className="faint">{named > 1 ? `≥ ${target}` : '—'}</td>
                          </tr>
                        ))}
                        {named > 3 && <tr><td /><td colSpan={3} className="bad-txt" style={{ fontSize: 12.5 }}>More than 3 subphenomena: keep at most 3 per macrophenomenon in this release.</td></tr>}
                        <tr><td /><td className="faint">macrophenomenon total</td><td className={sum >= PER_MACRO ? 'good-txt' : ''}><b>{sum}</b></td><td className="faint">{PER_MACRO}</td></tr>
                      </React.Fragment>
                    )
                  })}
                  <tr><td><b>This tab</b></td><td className="faint">all templates</td><td><b>{templateCount}</b></td><td className="faint">~{PER_LANGUAGE.toLocaleString('en-GB')} per language</td></tr>
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 18 }}>Lexical variety: words repeated across templates</h3>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Words of {REPEAT_MIN_LETTERS}+ letters in the varying slots, by the number of templates they appear in (fixed one-word slots are skipped).
              The same word in template after template (the French pilot's <i>fatiguée</i>) tires native-speaker reviewers: vary it.
              Function words also show up here; look for content words. Highlighted: in {heavy}+ templates.
            </div>
            {repeated.length === 0
              ? <div className="muted" style={{ fontSize: 13 }}>No word appears in three or more templates.</div>
              : (
                <div className="t-wrap">
                  <table className="t">
                    <thead><tr><th>Word</th><th>Templates</th><th>For example in</th></tr></thead>
                    <tbody>
                      {repeated.map((r) => (
                        <tr key={r.word}>
                          <td className={r.templates >= heavy ? 'warn-txt' : ''}><b>{r.word}</b></td>
                          <td className={r.templates >= heavy ? 'warn-txt' : ''}>{r.templates}</td>
                          <td className="faint" style={{ fontSize: 12.5 }}>{r.where.join('; ')}{r.templates > r.where.length ? '; …' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            <h3 style={{ marginTop: 18 }}>Slot patterns found</h3>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Click a slot marker to change its role (· shared → ✓ → ✗ → off). “off” leaves a column out of the sentences,
              e.g. one of two alternative verb columns. Sheets that don't mark ✓/✗ (Catalan's FINAL TEMPLATES) need this once per slot pattern.
            </div>
            <div className="t-wrap">
              <table className="t">
                <thead><tr><th>Sheet row</th><th>Slot pattern</th><th>Slots</th><th>Templates</th><th>Pairs</th><th /></tr></thead>
                <tbody>
                  {analysed.map(({ s, a }, k) => {
                    const err = a.issues.find((i) => i.level === 'error')
                    const warn = err ? undefined : a.issues.find((i) => i.level === 'warning' && i.row === undefined)
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
                          <td title="rows that count as templates / rows read">{a.templates}{a.templates !== a.plans.length ? ` of ${a.plans.length}` : ''}</td>
                          <td>{a.ok ? a.total.toLocaleString('en-GB') : <span className="bad-txt" title={err?.message}>needs a fix</span>}</td>
                          <td><button className="btn btn-sm btn-ghost" onClick={() => onOpen(s.template)}>Open in generator ↑</button></td>
                        </tr>
                        {err && <tr><td /><td colSpan={5} className="bad-txt" style={{ fontSize: 12.5 }}>{err.row ? `Template ${err.row}: ` : ''}{err.message}</td></tr>}
                        {warn && <tr><td /><td colSpan={5} className="warn-txt" style={{ fontSize: 12.5 }}>{warn.message}</td></tr>}
                        {samples[k]?.map((p, j) => (
                          <tr key={`s${j}`} className="sample-row"><td /><td colSpan={2} className="pair-good">{p.good}</td><td colSpan={3} className="pair-bad">{p.bad}</td></tr>
                        ))}
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
