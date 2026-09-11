// Re-seed Welsh (cy) content: delete existing cy phenomena/templates/pairs, then upload the
// example-based set built from the linguists' notes. Shared (owner=null). Firebase CLI token.
//   node scripts/seed-welsh.mjs <merged-cy.json>

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const PROJECT_ID = 'xblimps-cd802'
const FILE = process.argv[2]
if (!FILE) { console.error('usage: node scripts/seed-welsh.mjs <merged-cy.json>'); process.exit(1) }
const TOKEN = JSON.parse(readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')).tokens?.access_token
if (!TOKEN) { console.error('No Firebase CLI token'); process.exit(1) }
const DB = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const COMMIT = `${DB}:commit`
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
const now = () => new Date().toISOString()
const PRIMARY = 'src.borsley2009'

function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } }
  return { mapValue: { fields: toFields(v) } }
}
const toFields = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, toVal(v)]))
const fromVal = (v) => 'nullValue' in v ? null : 'booleanValue' in v ? v.booleanValue : 'integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? v.doubleValue : 'stringValue' in v ? v.stringValue : 'arrayValue' in v ? (v.arrayValue.values || []).map(fromVal) : 'mapValue' in v ? fromFields(v.mapValue.fields || {}) : null
const fromFields = (f) => Object.fromEntries(Object.entries(f).map(([k, val]) => [k, fromVal(val)]))

const NAMEBASE = `projects/${PROJECT_ID}/databases/(default)/documents`
function updateWrite(entity, data) {
  return { update: { name: `${NAMEBASE}/records/${data.row_uid}`, fields: toFields({
    row_uid: data.row_uid, entity, app: 'xblimps', owner: null,
    language: data.language ?? null, workspace_id: null, rev: 1, data, updated_at: now(), updated_by: 'seed',
  }) } }
}
const stamp = () => ({ row_uid: randomUUID(), rev: 1, updated_at: now(), updated_by: 'seed', owner: null })
async function commit(writes) {
  for (let i = 0; i < writes.length; i += 400) {
    const r = await fetch(COMMIT, { method: 'POST', headers: H, body: JSON.stringify({ writes: writes.slice(i, i + 400) }) })
    if (!r.ok) throw new Error(`commit ${r.status}: ${(await r.text()).slice(0, 300)}`)
    console.log(`  committed ${Math.min(i + 400, writes.length)}/${writes.length}`)
  }
}

// ---- 1. delete existing cy phenomena/templates/pairs ----
async function fetchAll() {
  const out = []; let token = ''
  do {
    const r = await fetch(`${DB}/records?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`, { headers: H })
    if (!r.ok) throw new Error(`list ${r.status}`)
    const j = await r.json()
    for (const d of (j.documents || [])) out.push({ name: d.name, fields: fromFields(d.fields || {}) })
    token = j.nextPageToken || ''
  } while (token)
  return out
}
const all = await fetchAll()
const KILL = new Set(['phenomena', 'templates', 'pairs'])
const dels = all.filter((d) => KILL.has(d.fields.entity) && d.fields.data?.language === 'cy').map((d) => ({ delete: d.name }))
console.log(`deleting ${dels.length} existing cy phenomena/templates/pairs…`)
if (dels.length) await commit(dels)

// ---- 2. upload new cy set ----
function analysisFor(t) {
  return {
    parse_good: t.grammatical ? `[S ${t.grammatical}]` : '',
    parse_bad: t.ungrammatical ? `[S ${t.ungrammatical}] ✗ ${t.contrast || ''}` : '',
    perturbation: { type: 'feature_change', target: 'root', relation: '', depth: 0, description: t.contrast || '' },
    paradigm: 'lexical', feature_schema: {}, feature_contrast: '',
    conll_schema: '', gloss_schema: '', translation_schema: t.translation || '', penn: '', layers: [],
  }
}
const pageFrom = (n) => (String(n || '').match(/p\.?\s?(\d+)/i)?.[0] || '')
const data = JSON.parse(readFileSync(FILE, 'utf8'))
const writes = []
const phenId = {}, seen = new Set()
let nP = 0, nT = 0, nPair = 0
for (const p of data.phenomena) {
  if (seen.has(p.slug)) continue
  seen.add(p.slug)
  const id = `cy.${p.slug}`; phenId[p.slug] = id
  writes.push(updateWrite('phenomena', { ...stamp(), id, language: 'cy', label: p.label, family: p.family,
    complexity: p.complexity || 'med', hypothesis: p.hypothesis || '', ref: p.ref || '',
    note: `${p.tier ? `Tier ${p.tier}. ` : ''}${p.note || ''}`.trim(), status: 'planned', target: 100 }))
  nP++
}
const tplId = {}
for (const t of data.templates) {
  if (!phenId[t.phenomenon] || tplId[t.slug]) continue
  const id = `tpl.cy.${t.slug}`; tplId[t.slug] = id
  // keep only well-formed slot objects (literal templates use no {SLOT} placeholders → [])
  const slots = Array.isArray(t.slots) ? t.slots.filter((s) => s && typeof s === 'object' && s.name).map((s) => ({ name: s.name, fillers: s.fillers || [] })) : []
  writes.push(updateWrite('templates', { ...stamp(), id, phenomenon_id: phenId[t.phenomenon], language: 'cy',
    name: t.name, slots,
    grammatical: t.grammatical || '', ungrammatical: t.ungrammatical || '', contrast: t.contrast || '',
    citations: [{ source_id: PRIMARY, page: pageFrom(t.note), example: '', quote: t.contrast || '' }],
    analysis: analysisFor(t), validation: { status: 'draft', comments: [] } }))
  nT++
}
for (const pr of (data.pairs || [])) {
  if (!phenId[pr.phenomenon] || !tplId[pr.template]) continue
  writes.push(updateWrite('pairs', { ...stamp(), id: randomUUID(), language: 'cy', phenomenon_id: phenId[pr.phenomenon],
    template_id: tplId[pr.template], sentence_good: pr.good || '', sentence_bad: pr.bad || '',
    contrast_tokens: pr.contrast_tokens || [], parse_good: '', parse_bad: '', gloss: pr.note || '', conll: '',
    features: {}, feature_contrast: '', paradigm: 'lexical',
    perturbation: { type: 'feature_change', target: 'root', relation: '', depth: 0, description: pr.note || '' },
    translation: pr.translation || '', fillers: {}, author: 'seed', status: pr.good ? 'accepted' : 'candidate', notes: pr.note || '' }))
  nPair++
}
console.log(`uploading ${nP} phenomena, ${nT} templates, ${nPair} pairs…`)
await commit(writes)
console.log('Welsh reseed done.')
