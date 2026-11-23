// Lexical generation: deterministic expansion of a human-written template into minimal pairs.
//
// A template is a header row of slots plus one or more rows of per-slot alternatives, exactly as
// language leads write them in the sheet:
//
//   {subj_sg}                                   | {rel} | {V_trans}                 | ... | {VP_sg} ✓                         | *{VP_pl} ✗
//   (the refrigerator, the display case, ...)   | that  | (stores, contains, holds) | ... | (runs too cold, randomly shuts off) | (run too cold, randomly shut off)
//
// Expansion is a plain Cartesian product over the shared slots, times the ✓/✗ contrast pairs
// (matched by position: the 1st ✓ alternative pairs with the 1st ✗ alternative, and so on).
//
// This module never invents a word. There is no model, no network call and no randomness: every
// token in the output is copied from an alternative a person typed, and the same input always
// gives the same output in the same order. (Project rule: no AI-written templates or sentences.)

export type SlotRole = 'shared' | 'good' | 'bad'

export interface LexColumn {
  label: string
  role: SlotRole
}

export interface LexTemplate {
  name: string
  columns: LexColumn[]
  rows: string[][] // rows[r][c] = the raw cell text (alternatives, separated by commas)
}

export interface LexOptions {
  joiner: ' ' | ''        // how slot values are joined ('' for languages written without spaces)
  capitalise: boolean     // upper-case the first letter of each sentence
  endPunct: string        // appended unless the sentence already ends in . ? ! etc. ('' for none)
}

export const DEFAULT_OPTIONS: LexOptions = { joiner: ' ', capitalise: true, endPunct: '.' }

export interface GeneratedPair {
  row: number           // 1-based template row
  index: number         // 1-based index within the row
  good: string
  bad: string
  fillers: string[]     // value used for each column (✓ and ✗ columns both filled)
}

export type IssueLevel = 'error' | 'warning' | 'note'
export interface Issue {
  level: IssueLevel
  row?: number          // 1-based, undefined = whole template
  message: string
}

/** Above this many pairs from one row, show the "combinations explode" warning. */
export const WARN_PER_ROW = 500
/** Above this many pairs in total, show the warning too. */
export const WARN_TOTAL = 5000
/** Refuse to generate above this; the lead should split the row instead. */
export const HARD_CAP = 200000

/** Written in a cell to mean "leave this slot empty" (an optional slot). */
export const EMPTY_MARKERS = ['∅', '(none)', '—', '-']

// ---------- parsing ----------

/** Role from a header's markers: ✓ = grammatical slot, ✗ or a leading * = ungrammatical slot. */
export function roleFromHeader(h: string): SlotRole {
  const t = h.trim()
  if (/[✗✘×]/.test(t) || t.startsWith('*')) return 'bad'
  if (/[✓✔]/.test(t)) return 'good'
  return 'shared'
}

/** Header label without the ✓ / ✗ / * markers. */
export function cleanLabel(h: string): string {
  return h.replace(/[✓✔✗✘×]/g, '').replace(/^\s*\*/, '').trim()
}

/**
 * Split one cell into its alternatives.
 * "(stores, contains, holds)" → ["stores", "contains", "holds"].
 * Separator: "|" or ";" if the cell contains one (use these when an alternative itself contains
 * a comma), otherwise ",". A leading "*" on ✗ alternatives is dropped. "∅" means an empty filler.
 */
export function splitAlternatives(cell: string, role: SlotRole = 'shared'): string[] {
  let t = (cell ?? '').trim()
  if (role === 'bad') t = t.replace(/^\*\s*/, '')
  // strip one pair of enclosing brackets
  const m = t.match(/^[([{](.*)[)\]}]$/s)
  if (m && !/^\{[^,;|]*\}$/.test(t)) t = m[1].trim()
  if (!t) return []
  const sep = t.includes('|') ? '|' : t.includes(';') ? ';' : ','
  return t.split(sep)
    .map((a) => (role === 'bad' ? a.trim().replace(/^\*\s*/, '') : a.trim()))
    .filter((v) => v !== '')                       // stray separators ("a, b,") are ignored
    .map((v) => (EMPTY_MARKERS.includes(v) ? '' : v)) // ∅ = an explicit empty option
}

/** Parse delimited text: tab-separated (pasted from a spreadsheet), a Markdown table, or CSV. */
export function parseTable(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const nonEmpty = lines.filter((l) => l.trim() !== '')
  if (nonEmpty.length === 0) return []
  if (nonEmpty.some((l) => l.includes('\t'))) {
    return nonEmpty.map((l) => l.split('\t').map((c) => c.trim()))
  }
  if (nonEmpty[0].trim().startsWith('|')) {
    return nonEmpty
      .filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l))
      .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
  }
  return parseCSV(text)
}

/** Minimal RFC-4180 CSV parser (quoted fields, doubled quotes, newlines inside quotes). */
export function parseCSV(text: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let field = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else q = false
      } else field += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(field.trim()); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field.trim()); field = ''
      if (row.some((c) => c !== '')) out.push(row)
      row = []
    } else field += ch
  }
  row.push(field.trim())
  if (row.some((c) => c !== '')) out.push(row)
  return out
}

/** Turn pasted text (first line = slot headers, following lines = rows) into a template. */
export function templateFromText(text: string, name = 'template'): LexTemplate {
  const table = parseTable(text)
  if (table.length === 0) return { name, columns: [], rows: [] }
  const [head, ...body] = table
  const width = Math.max(head.length, ...body.map((r) => r.length))
  const columns: LexColumn[] = Array.from({ length: width }, (_, c) => {
    const h = head[c] ?? ''
    return { label: cleanLabel(h) || `slot ${c + 1}`, role: roleFromHeader(h) }
  })
  const rows = body.map((r) => Array.from({ length: width }, (_, c) => r[c] ?? ''))
  return { name, columns, rows }
}

/** The template as tab-separated text (headers re-marked with ✓ / ✗), for copying back to a sheet. */
export function templateToTSV(t: LexTemplate): string {
  const head = t.columns.map((c) => c.role === 'good' ? `${c.label} ✓` : c.role === 'bad' ? `*${c.label} ✗` : c.label)
  return [head, ...t.rows].map((r) => r.join('\t')).join('\n')
}

// ---------- analysis + expansion ----------

interface RowPlan {
  row: number
  alts: string[][]        // per column, the alternatives (the ✗ column holds the ✗ partners)
  pairs: [string, string][] // ✓/✗ alternatives matched by position
  count: number
}

export interface Analysis {
  issues: Issue[]
  perRow: { row: number; count: number }[]
  total: number
  goodCol: number
  badCol: number
  ok: boolean            // no errors: generation possible
  explode: boolean       // above the warning threshold
  overCap: boolean
  plans: RowPlan[]
}

export function analyse(t: LexTemplate): Analysis {
  const issues: Issue[] = []
  const goodCols = t.columns.map((c, i) => (c.role === 'good' ? i : -1)).filter((i) => i >= 0)
  const badCols = t.columns.map((c, i) => (c.role === 'bad' ? i : -1)).filter((i) => i >= 0)
  if (t.columns.length === 0) issues.push({ level: 'error', message: 'Add slot headers first (the top row of the template).' })
  if (goodCols.length !== 1) issues.push({ level: 'error', message: goodCols.length === 0 ? 'Mark one slot as ✓ (the grammatical alternative).' : 'Only one slot may be ✓: one slot carries the grammatical / ungrammatical contrast.' })
  if (badCols.length !== 1) issues.push({ level: 'error', message: badCols.length === 0 ? 'Mark one slot as ✗ (the ungrammatical alternative of the ✓ slot).' : 'Only one slot may be ✗: one slot carries the grammatical / ungrammatical contrast.' })
  if (t.rows.length === 0 && t.columns.length > 0) issues.push({ level: 'error', message: 'Add at least one row of alternatives under the headers.' })
  const goodCol = goodCols[0] ?? -1
  const badCol = badCols[0] ?? -1
  const plans: RowPlan[] = []
  const structural = issues.some((i) => i.level === 'error')

  t.rows.forEach((cells, r) => {
    const row = r + 1
    const alts = t.columns.map((c, ci) => splitAlternatives(cells[ci] ?? '', c.role))
    if (alts.every((a) => a.length === 0)) return // blank row: ignore silently
    t.columns.forEach((c, ci) => {
      const a = alts[ci]
      if (a.length === 0) {
        if (c.role === 'shared') {
          issues.push({ level: 'note', row, message: `“${c.label}” is empty: treated as left out. Write ∅ to make an empty option explicit.` })
          alts[ci] = ['']
        } else issues.push({ level: 'error', row, message: `The ${c.role === 'good' ? '✓' : '✗'} slot “${c.label}” is empty.` })
      }
      const seen = new Set<string>()
      for (const v of a) {
        if (seen.has(v)) issues.push({ level: 'warning', row, message: `“${c.label}” lists “${v || '∅'}” twice.` })
        seen.add(v)
      }
      if (a.length === 2 && c.role !== 'bad') {
        issues.push({ level: 'note', row, message: `“${c.label}” has ${a.length} alternatives; the sheet convention is 3–4 in every varying slot.` })
      }
    })
    let pairs: [string, string][] = []
    if (goodCol >= 0 && badCol >= 0) {
      const g = alts[goodCol], b = alts[badCol]
      if (g.length && b.length) {
        if (g.length === b.length) pairs = g.map((v, i) => [v, b[i]])
        else if (b.length === 1) pairs = g.map((v) => [v, b[0]])
        else if (g.length === 1) pairs = b.map((v) => [g[0], v])
        else issues.push({ level: 'error', row, message: `✓ has ${g.length} alternatives and ✗ has ${b.length}. They are matched by position (1st ✓ with 1st ✗ …), so give them the same number.` })
        for (const [gv, bv] of pairs) {
          if (gv === bv) issues.push({ level: 'warning', row, message: `✓ “${gv}” and its ✗ partner are identical: that is not a minimal pair.` })
        }
      }
    }
    let count = pairs.length
    t.columns.forEach((c, ci) => { if (c.role === 'shared') count *= Math.max(1, alts[ci].length) })
    plans.push({ row, alts, pairs, count })
  })

  const perRow = plans.map((p) => ({ row: p.row, count: p.count }))
  const total = perRow.reduce((s, r) => s + r.count, 0)
  const explode = total > WARN_TOTAL || perRow.some((r) => r.count > WARN_PER_ROW)
  const overCap = total > HARD_CAP
  for (const r of perRow) {
    if (r.count > WARN_PER_ROW) issues.push({ level: 'warning', row: r.row, message: `This row expands to ${r.count.toLocaleString('en-GB')} pairs. Check every combination is natural; if not, split it into several rows with fewer alternatives.` })
  }
  if (overCap) issues.push({ level: 'error', message: `${total.toLocaleString('en-GB')} pairs is more than the ${HARD_CAP.toLocaleString('en-GB')} limit. Split the template into smaller rows.` })
  const ok = !structural && !overCap && !issues.some((i) => i.level === 'error')
  return { issues, perRow, total, goodCol, badCol, ok, explode, overCap, plans }
}

function tidy(s: string, o: LexOptions): string {
  let out = o.joiner === ' ' ? s.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim() : s.trim()
  if (o.capitalise && out) out = out.charAt(0).toLocaleUpperCase() + out.slice(1)
  if (o.endPunct && out && !/[.?!。？！؟…]$/.test(out)) out += o.endPunct
  return out
}

/**
 * Lazily enumerate every minimal pair, row by row, in a fixed order: columns left to right, the
 * first column changing slowest. Only call when analyse(t).ok is true.
 */
export function* expand(t: LexTemplate, o: LexOptions = DEFAULT_OPTIONS, a: Analysis = analyse(t)): Generator<GeneratedPair> {
  const { goodCol, badCol } = a
  for (const plan of a.plans) {
    // dimensions: each shared column, plus the ✓/✗ pair at the ✓ column's position
    const dims: { col: number; n: number }[] = []
    t.columns.forEach((c, ci) => {
      if (c.role === 'shared') dims.push({ col: ci, n: Math.max(1, plan.alts[ci].length) })
      else if (ci === goodCol) dims.push({ col: ci, n: plan.pairs.length })
    })
    if (dims.some((d) => d.n === 0)) continue
    const idx = dims.map(() => 0)
    let k = 0
    while (true) {
      const fillers: string[] = t.columns.map(() => '')
      dims.forEach((d, di) => {
        if (d.col === goodCol) {
          const [g, b] = plan.pairs[idx[di]]
          fillers[goodCol] = g
          fillers[badCol] = b
        } else fillers[d.col] = plan.alts[d.col][idx[di]] ?? ''
      })
      const order = t.columns.map((_, ci) => ci).filter((ci) => ci !== badCol)
      const goodToks = order.map((ci) => fillers[ci]).filter((v) => v !== '')
      const badToks = order.map((ci) => (ci === goodCol ? fillers[badCol] : fillers[ci])).filter((v) => v !== '')
      k++
      yield { row: plan.row, index: k, good: tidy(goodToks.join(o.joiner), o), bad: tidy(badToks.join(o.joiner), o), fillers }
      // odometer: last dimension fastest
      let d = dims.length - 1
      while (d >= 0) {
        idx[d]++
        if (idx[d] < dims[d].n) break
        idx[d] = 0
        d--
      }
      if (d < 0) break
    }
  }
}

export function expandAll(t: LexTemplate, o: LexOptions = DEFAULT_OPTIONS): GeneratedPair[] {
  const a = analyse(t)
  return a.ok ? Array.from(expand(t, o, a)) : []
}

// ---------- export ----------

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function pairsToDelimited(t: LexTemplate, pairs: GeneratedPair[], sep: ',' | '\t'): string {
  const slotHeads = t.columns.map((c) => (c.role === 'good' ? `${c.label} (✓)` : c.role === 'bad' ? `${c.label} (✗)` : c.label))
  const head = ['template', 'row', 'pair', 'sentence_good', 'sentence_bad', ...slotHeads]
  const clean = (v: string) => (sep === '\t' ? v.replace(/[\t\n\r]+/g, ' ') : csvCell(v))
  const lines = [head, ...pairs.map((p) => [t.name, String(p.row), String(p.index), p.good, p.bad, ...p.fillers])]
  return lines.map((r) => r.map(clean).join(sep)).join('\n') + '\n'
}

// ---------- the demo (human-written; English BLiMP distractor_agree_rc reference row) ----------

export const DEMO_TEMPLATE_TEXT = [
  ['{subj_sg}', '{rel}', '{V_trans}', '{obj_pl}', '{VP_sg} ✓', '*{VP_pl} ✗'].join('\t'),
  [
    '(the refrigerator, the display case, the freezer)',
    'that',
    '(stores, contains, holds)',
    '(all the cakes, all the desserts, the baked goods)',
    '(runs too cold, randomly shuts off)',
    '(run too cold, randomly shut off)',
  ].join('\t'),
].join('\n')

export const demoTemplate = (): LexTemplate => templateFromText(DEMO_TEMPLATE_TEXT, 'distractor_agree_rc')
