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

export type SlotRole = 'shared' | 'good' | 'bad' | 'off'

export interface LexColumn {
  label: string
  role: SlotRole          // 'off' = keep the column in the sheet but leave it out of the sentences
  literal?: boolean       // commas in this column are text, not separators (split only on | or ;)
  optional?: boolean      // header said "(optional)": the slot may also be left empty
}

export interface LexTemplate {
  name: string
  macro?: string          // macrophenomenon / subphenomenon labels, when imported from a sheet tab
  sub?: string
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

/** Slot names that the language sheets use for the ungrammatical side of the contrast. */
const BAD_NAME = /(mismatch|non[-_ ]?agr|nonmatch|ungram|[_-]bad\b|\bbad\b|[_-]wrong\b)/i
const OPTIONAL = /\(?\s*optional\s*\)?/i

/**
 * Role from a header. Explicit markers win: ✓ = grammatical slot, ✗ or a leading * = ungrammatical.
 * Without a marker, the names used in the language sheets are recognised as ✗:
 * {pp_fem_sg_mismatch}, {VP_nonagr}, {DET_numbermismatch}, "UNGRAMMATICAL" under a header, …
 */
export function roleFromHeader(h: string): SlotRole {
  const t = h.trim()
  if (/[✗✘×]/.test(t) || t.startsWith('*')) return 'bad'
  if (/[✓✔]/.test(t)) return 'good'
  if (BAD_NAME.test(t)) return 'bad'
  return 'shared'
}

/** Header label without the ✓ / ✗ / * markers, the "(optional)" note or line breaks. */
export function cleanLabel(h: string): string {
  return h.replace(/[✓✔✗✘×]/g, '').replace(/^\s*\*/, '').replace(OPTIONAL, '').replace(/\s*\n\s*/g, ' ').trim()
}

/** Does the header mark the slot as optional ("{SUBJ} (optional)", "{adjunct}\noptional")? */
export function isOptionalHeader(h: string): boolean {
  return OPTIONAL.test(h)
}

/** A slot whose name is Ø / ∅ (an omitted word): its empty cell means "nothing here". */
const isZeroSlot = (label: string) => /^\{?\s*[Øø∅]\s*\}?$/.test(label.trim())

/** Commas used as separators: Latin, Arabic-script (Persian, Arabic, Urdu), CJK full-width and ideographic. */
const COMMA = /[,،，、]/

/**
 * Split one cell into its alternatives.
 * "(stores, contains, holds)" → ["stores", "contains", "holds"].
 *
 * The cell may be wrapped in (…), {…} or […], also with mismatched brackets as typed in the sheets
 * ("{mangée, achetée, goûtée)"). Separator: "|" or ";" if the cell contains one, otherwise a comma
 * (",", Persian/Arabic "،", full-width "，" or "、").
 *
 * Real commas inside an alternative, as the language sheets write them:
 *   "(Segons la meva mare,, Em van dir que)" → ["Segons la meva mare,", "Em van dir que"]  (doubled comma)
 *   "(partir,)"                               → ["partir,"]                                (trailing comma)
 *   literal = true (column note "commas are not a delimiter in this cell") → split only on | or ;
 * A leading "*" on ✗ alternatives is dropped. "∅" means an empty filler.
 */
export function splitAlternatives(cell: string, role: SlotRole = 'shared', literal = false): string[] {
  let t = (cell ?? '').trim()
  if (role === 'bad') t = t.replace(/^\*\s*/, '')
  // strip one pair of enclosing brackets (any mix: the sheets have "{a, b)")
  const m = t.match(/^[([{](.*)[)\]}]$/s)
  if (m) t = m[1].trim()
  if (!t) return []
  let parts: string[]
  if (t.includes('|')) parts = t.split('|')
  else if (t.includes(';')) parts = t.split(';')
  else if (literal) parts = [t]
  else {
    // split on commas. A doubled comma ("mare,, Em") keeps one comma in the text; a trailing comma
    // is text when the cell has a single alternative ("(partir,)"), otherwise a stray separator
    const comma = t.match(COMMA)?.[0] ?? ','
    const pieces = t.split(COMMA).map((v) => v.trim())
    const trailing = pieces.length > 1 && pieces[pieces.length - 1] === ''
    if (trailing) pieces.pop()
    parts = []
    for (const v of pieces) {
      if (v === '' && parts.length && !parts[parts.length - 1].endsWith(comma)) parts[parts.length - 1] += comma
      else parts.push(v)
    }
    if (trailing && parts.length === 1 && parts[0] !== '') parts[0] += comma
  }
  return parts
    .map((a) => (role === 'bad' ? a.trim().replace(/^\*\s*/, '') : a.trim()))
    .filter((v) => v !== '')                       // stray separators are ignored
    .map((v) => (EMPTY_MARKERS.includes(v) ? '' : v)) // ∅ = an explicit empty option
}

/**
 * Parse delimited text: tab-separated (pasted from a spreadsheet), a Markdown table, or CSV.
 * keepBlank keeps empty rows, so row numbers match the sheet's.
 */
export function parseTable(text: string, keepBlank = false): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n')
  const nonEmpty = lines.filter((l) => l.trim() !== '')
  if (nonEmpty.length === 0) return []
  if (nonEmpty.some((l) => l.includes('\t'))) {
    const rows = parseTSV(text)
    return keepBlank ? rows : rows.filter((r) => r.some((c) => c !== ''))
  }
  if (nonEmpty[0].trim().startsWith('|')) {
    return nonEmpty
      .filter((l) => !/^\s*\|?\s*:?-{2,}/.test(l))
      .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
  }
  return parseCSV(text, keepBlank)
}

/**
 * Tab-separated text as Google Sheets / Excel copy it: a cell holding a line break or a quote is
 * wrapped in double quotes (with "" for a quote). Other cells are taken as they are.
 */
export function parseTSV(text: string): string[][] {
  const src = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  const out: string[][] = []
  let row: string[] = []
  let i = 0
  while (i <= src.length) {
    let field = ''
    if (src[i] === '"') {
      let j = i + 1
      let closed = false
      while (j < src.length) {
        if (src[j] === '"') { if (src[j + 1] === '"') { field += '"'; j += 2; continue } closed = true; j++; break }
        field += src[j++]
      }
      if (closed && (j >= src.length || src[j] === '\t' || src[j] === '\n')) i = j
      else { // not a quoted cell after all: read it plainly
        const k = src.slice(i).search(/[\t\n]/)
        field = k < 0 ? src.slice(i) : src.slice(i, i + k)
        i = k < 0 ? src.length : i + k
      }
    } else {
      const k = src.slice(i).search(/[\t\n]/)
      field = k < 0 ? src.slice(i) : src.slice(i, i + k)
      i = k < 0 ? src.length : i + k
    }
    row.push(field.trim())
    if (i >= src.length) { out.push(row); break }
    if (src[i] === '\n') { out.push(row); row = [] }
    i++
  }
  return out
}

/** Minimal RFC-4180 CSV parser (quoted fields, doubled quotes, newlines inside quotes). */
export function parseCSV(text: string, keepBlank = false): string[][] {
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
      if (keepBlank || row.some((c) => c !== '')) out.push(row)
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
  const columns = columnsFromHeaders(Array.from({ length: width }, (_, c) => head[c] ?? ''))
  const rows = body.map((r) => Array.from({ length: width }, (_, c) => r[c] ?? ''))
  return { name, columns, rows }
}

/**
 * Columns from raw header cells. If the sheet marks only the ✗ slot (e.g. "*{pp_fem_sg_mismatch}" or
 * "{VP_nonagr}"), the nearest slot to its left is taken as the ✓ slot, which is how every language
 * sheet lays out the contrast. Anything else is left for the lead to set in the role menu.
 */
export function columnsFromHeaders(heads: string[]): LexColumn[] {
  const columns: LexColumn[] = heads.map((h, c) => {
    const col: LexColumn = { label: cleanLabel(h) || `slot ${c + 1}`, role: roleFromHeader(h) }
    if (isOptionalHeader(h)) col.optional = true
    return col
  })
  const good = columns.filter((c) => c.role === 'good').length
  const bad = columns.map((c, i) => (c.role === 'bad' ? i : -1)).filter((i) => i >= 0)
  if (good === 0 && bad.length === 1) {
    // the ✓ slot named like the ✗ slot without "_mismatch" / "_nonagr" (it may sit elsewhere: word order)
    const stem = (l: string) => l.replace(/[{}*\s]/g, '').replace(/[_-]?(mismatch|non[-_]?agr|nonmatch|ungram\w*|bad|wrong)$/i, '').replace(/[_-]?agr$/i, '').toLowerCase()
    const want = stem(columns[bad[0]].label)
    const twin = columns.findIndex((c, i) => i !== bad[0] && c.role === 'shared' && stem(c.label) === want)
    if (twin >= 0) { columns[twin].role = 'good'; return columns }
    for (let i = bad[0] - 1; i >= 0; i--) {
      if (columns[i].role === 'shared' && /\{/.test(columns[i].label)) { columns[i].role = 'good'; break }
    }
  }
  return columns
}

/** The template as tab-separated text (headers re-marked with ✓ / ✗), for copying back to a sheet. */
export function templateToTSV(t: LexTemplate): string {
  const head = t.columns.map((c) => {
    const base = c.role === 'good' ? `${c.label} ✓` : c.role === 'bad' ? `*${c.label} ✗` : c.label
    return c.optional ? `${base} (optional)` : base
  })
  return [head, ...t.rows].map((r) => r.join('\t')).join('\n')
}

// ---------- whole sheet tabs ----------

/** A header cell such as "{cod_sg_fem}", "*{pp_mismatch}", "{SUBJ} (optional)", "{coi_1esg/pl)". */
const SLOT_HEAD = /^\*?\s*\{[^\s{}(),'’]+[})]/
const TEMPLATES_MARK = /^templates?\s*:?$/i
const COMMA_NOTE = /commas?\s+(?:are|is)\s+not\s+(?:a\s+)?(?:delimiters?|separators?)\s+in\s+(?:the\s+)?\{?([^}\s]+)\}?/i

export interface SheetTemplate {
  template: LexTemplate
  headerRow: number          // 1-based row of the header in the pasted tab
  dataRows: number[]         // 1-based rows of the seed rows
}

function isHeaderRow(cells: string[], useMarker: boolean): { start: number; end: number } | null {
  const slotIdx = cells.map((c, i) => (SLOT_HEAD.test(c.trim()) ? i : -1)).filter((i) => i >= 0)
  if (slotIdx.length === 0) return null
  const start = slotIdx[0]
  const end = slotIdx[slotIdx.length - 1]
  if (useMarker) {
    return cells.slice(0, start).some((c) => TEMPLATES_MARK.test(c.trim())) ? { start, end } : null
  }
  // no "Templates:" markers in the tab: most cells from the first slot or bracketed cell onward are slot names
  const first = cells.findIndex((c) => SLOT_HEAD.test(c.trim()) || /^[([{]/.test(c.trim()))
  const rest = cells.slice(first).filter((c) => c.trim() !== '')
  const heads = rest.filter((c) => SLOT_HEAD.test(c.trim())).length
  return slotIdx.length >= 2 && heads / rest.length >= 0.5 ? { start, end } : null
}

/**
 * Split a whole sheet tab (copied from Google Sheets / Excel, or a CSV export) into its templates.
 * Works on the layouts the language sheets use: macro / sub labels in the left columns, a header
 * row of {slots} (optionally after a "Templates:" cell), then seed rows of alternatives; several
 * templates stacked in one tab; "Note: commas are not a delimiter in the X cell" notes.
 */
export function sheetToTemplates(text: string): SheetTemplate[] {
  const table = parseTable(text, true)
  const useMarker = table.some((r) => r.some((c) => TEMPLATES_MARK.test(c.trim())) && r.some((c) => SLOT_HEAD.test(c.trim())))
  const out: SheetTemplate[] = []
  let macro = ''
  let sub = ''
  type Label = { col: number; text: string; start: number }
  let cur: { start: number; end: number; heads: string[]; rows: string[][]; dataRows: number[]; headerRow: number; notes: string[]; labels: Label[] } | null = null

  // label cells left of the slots: macro in the first column and sub in the second (when the tab
  // keeps both), skipping "Templates:", row numbers like "1.0" and notes
  const label = (cells: string[], start: number): Label[] => cells
    .map((c, col) => ({ col, text: c.trim(), start }))
    .filter((l) => l.text && !TEMPLATES_MARK.test(l.text) && !/^\d+(\.\d+)?$/.test(l.text) && !/^note\b/i.test(l.text))
  const flush = () => {
    if (!cur) return
    if (cur.rows.length) {
      for (const l of cur.labels) {
        const isMacro = l.start >= 2 ? l.col === 0 : /^\d+\.\s*\S/.test(l.text) && !macro
        if (isMacro) { macro = l.text; sub = '' } else sub = l.text
      }
      const columns = columnsFromHeaders(cur.heads)
      for (const note of cur.notes) {
        const m = note.match(COMMA_NOTE)
        if (!m) continue
        const want = m[1].replace(/[{}]/g, '').toLowerCase()
        columns.forEach((c) => { if (c.label.replace(/[{}]/g, '').toLowerCase() === want) c.literal = true })
      }
      const n = out.filter((o) => o.template.macro === macro && o.template.sub === sub).length + 1
      const name = ([macro, sub].filter(Boolean).join(' · ') || `row ${cur.headerRow}`) + ` · T${n}`
      out.push({ template: { name, macro, sub, columns, rows: cur.rows }, headerRow: cur.headerRow, dataRows: cur.dataRows })
    }
    cur = null
  }

  table.forEach((cells, r) => {
    const h = isHeaderRow(cells, useMarker)
    if (h) {
      flush()
      cur = { ...h, heads: cells.slice(h.start, h.end + 1), rows: [], dataRows: [], headerRow: r + 1, notes: [], labels: label(cells.slice(0, h.start), h.start) }
      return
    }
    if (!cur) {
      // labels above the first header (e.g. "10. Differential Object Marking") just set the context
      return
    }
    const c = cur as NonNullable<typeof cur>
    const left = cells.slice(0, c.start)
    left.forEach((x) => { if (COMMA_NOTE.test(x)) c.notes.push(x) })
    const data = Array.from({ length: c.end - c.start + 1 }, (_, i) => cells[c.start + i] ?? '')
    if (data.every((x) => x.trim() === '')) {
      // an all-blank row inside the slot range: the template may continue below (blank spacer rows)
      return
    }
    if (!c.labels.length) {
      const ls = label(left, c.start)
      if (ls.length) c.labels = ls
    }
    c.rows.push(data)
    c.dataRows.push(r + 1)
  })
  flush()
  return out
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
    const alts = t.columns.map((c, ci) => (c.role === 'off' ? [] : splitAlternatives(cells[ci] ?? '', c.role, !!c.literal)))
    if (alts.every((a) => a.length === 0)) return // blank row: ignore silently
    t.columns.forEach((c, ci) => {
      if (c.role === 'off') return
      const a = alts[ci]
      if (c.optional && !a.includes('')) alts[ci] = [...a, '']   // "(optional)" slot: also without it
      if (a.length === 0 && isZeroSlot(c.label)) { alts[ci] = ['']; return } // {Ø}: nothing here
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
      if (a.length === 2 && c.role === 'shared' && !c.optional) {
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

/** French / Catalan elided words written as their own slot ("qu'", "l'", "j'"): no space after them. */
const ELISION = /(^|[\s(«"])((?:jusqu|lorsqu|puisqu|quoiqu|qu|[cdjlmnst])['’])\s+/giu

function tidy(s: string, o: LexOptions): string {
  let out = o.joiner === ' ' ? s.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').replace(ELISION, '$1$2').trim() : s.trim()
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
      // ✓ sentence: every slot except ✗. ✗ sentence: every slot except ✓, each at its own position.
      // With ✗ right after ✓ (agreement, mood, …) that is "✗ replaces ✓ in place"; with ✗ elsewhere
      // (word order: an adjective or numeral before vs after the noun) the ✗ word moves.
      const used = t.columns.map((_, ci) => ci).filter((ci) => t.columns[ci].role !== 'off')
      const goodToks = used.filter((ci) => ci !== badCol).map((ci) => fillers[ci]).filter((v) => v !== '')
      const badToks = used.filter((ci) => ci !== goodCol).map((ci) => fillers[ci]).filter((v) => v !== '')
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

/**
 * Up to n pairs spread evenly across the expansion (first, middle, last, …), for a lead to sign off
 * a sample. Deterministic: no randomness, so the same template always gives the same sample.
 */
export function samplePairs(t: LexTemplate, n = 3, o: LexOptions = DEFAULT_OPTIONS): GeneratedPair[] {
  const all = expandAll(t, o)
  if (all.length <= n) return all
  const pick = new Set<number>()
  for (let i = 0; i < n; i++) pick.add(Math.round((i * (all.length - 1)) / (n - 1)))
  return [...pick].map((i) => all[i])
}

/** Several templates (e.g. a whole tab) as one CSV/TSV, with macro / sub columns for the sheet. */
export function manyToDelimited(items: { t: LexTemplate; pairs: GeneratedPair[] }[], sep: ',' | '\t'): string {
  const head = ['macrophenomenon', 'subphenomenon', 'template', 'row', 'pair', 'sentence_good', 'sentence_bad']
  const clean = (v: string) => (sep === '\t' ? v.replace(/[\t\n\r]+/g, ' ') : csvCell(v))
  const lines = [head]
  for (const { t, pairs } of items) {
    for (const p of pairs) lines.push([t.macro ?? '', t.sub ?? '', t.name, String(p.row), String(p.index), p.good, p.bad])
  }
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
