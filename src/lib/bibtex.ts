// Minimal BibTeX round-trip for the reference-grammar Source library.
//
// We keep the raw entry on each Source (`bibtex` field) as the source of truth, plus a
// few parsed fields for display/search. `parseBibtex` is deliberately small — it handles
// the common `@type{key, field = {…}}` / `field = "…"` shapes used in linguistics
// bibliographies, not the full BibTeX grammar.

import type { Source } from './types'
import { uid, now } from './id'

const stamp = () => ({ row_uid: uid(), rev: 1, updated_at: now(), updated_by: 'You' })

// strip one layer of {…} or "…" wrapping and collapse whitespace
function unwrap(v: string): string {
  let s = v.trim().replace(/,\s*$/, '').trim()
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1)
  }
  return s.replace(/\s+/g, ' ').trim()
}

// split the body of an entry into top-level "field = value" pairs, respecting brace depth
function splitFields(body: string): string[] {
  const out: string[] = []
  let depth = 0, cur = ''
  for (const ch of body) {
    if (ch === '{') depth++
    else if (ch === '}') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

export function parseBibtex(text: string): Source[] {
  const sources: Source[] = []
  // match @type{ key, …fields… } balancing the outermost braces by scanning
  const re = /@(\w+)\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const entryType = m[1].toLowerCase()
    const start = m.index
    // find the matching close brace
    let depth = 1, i = re.lastIndex
    for (; i < text.length && depth > 0; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') depth--
    }
    const inner = text.slice(re.lastIndex, i - 1)
    re.lastIndex = i

    const commaIdx = inner.indexOf(',')
    const citekey = (commaIdx === -1 ? inner : inner.slice(0, commaIdx)).trim()
    const fieldsBody = commaIdx === -1 ? '' : inner.slice(commaIdx + 1)

    const fields: Record<string, string> = {}
    for (const f of splitFields(fieldsBody)) {
      const eq = f.indexOf('=')
      if (eq === -1) continue
      const k = f.slice(0, eq).trim().toLowerCase()
      if (k) fields[k] = unwrap(f.slice(eq + 1))
    }

    const raw = text.slice(start, i).trim()
    sources.push({
      ...stamp(), id: 'src.' + (citekey || uid().slice(0, 6)),
      citekey: citekey || 'key' + uid().slice(0, 4),
      entry_type: entryType,
      author: fields.author ?? '', year: fields.year ?? '', title: fields.title ?? '',
      publisher: fields.publisher, journal: fields.journal, url: fields.url, doi: fields.doi,
      bibtex: raw, languages: [], phenomena: [],
      note: fields.note,
    })
  }
  return sources
}

// Serialise a Source back to BibTeX. Prefer the stored raw entry; otherwise build one
// from the parsed fields. Always annotates language/phenomenon tags as keywords.
export function sourceToBibtex(s: Source): string {
  const tags = [...s.languages, ...s.phenomena].filter(Boolean)
  if (s.bibtex && s.bibtex.trim().startsWith('@')) {
    if (!tags.length || /keywords\s*=/.test(s.bibtex)) return s.bibtex.trim()
    // inject keywords before the closing brace
    const body = s.bibtex.trim().replace(/}\s*$/, '')
    return `${body},\n  keywords = {${tags.join(', ')}}\n}`
  }
  const lines = [
    `  author = {${s.author}}`,
    `  title = {${s.title}}`,
    `  year = {${s.year}}`,
    s.publisher ? `  publisher = {${s.publisher}}` : '',
    s.journal ? `  journal = {${s.journal}}` : '',
    s.url ? `  url = {${s.url}}` : '',
    s.doi ? `  doi = {${s.doi}}` : '',
    tags.length ? `  keywords = {${tags.join(', ')}}` : '',
  ].filter(Boolean)
  return `@${s.entry_type || 'book'}{${s.citekey},\n${lines.join(',\n')}\n}`
}

export function toBibtex(sources: Source[]): string {
  return sources.map(sourceToBibtex).join('\n\n') + '\n'
}
