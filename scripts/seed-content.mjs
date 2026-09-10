// Seed shared xBLiMPs content into Firestore: language workspaces, the reference-grammar
// bibliography (Source records), and per-language phenomena + templates + minimal pairs built
// from the linguists' notes (scratchpad/<lang>.json). Everything is written owner=null (shared),
// so every signed-in user sees it. Auth via the Firebase CLI token (REST, no service key).
//
//   node scripts/seed-content.mjs <dir-with-lang-json>

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const PROJECT_ID = 'xblimps-cd802'
const DIR = process.argv[2] || '.'
const TOKEN = JSON.parse(readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')).tokens?.access_token
if (!TOKEN) { console.error('No Firebase CLI token'); process.exit(1) }
const COMMIT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`
const now = () => new Date().toISOString()

// ---- Firestore value encoding ----
function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } }
  return { mapValue: { fields: toFields(v) } }
}
function toFields(obj) {
  const f = {}
  for (const [k, val] of Object.entries(obj)) { if (val !== undefined) f[k] = toVal(val) }
  return f
}

// ---- record wrapper (mirrors store.recordRow) ----
const APP = (entity) => (String(entity).startsWith('childes_') ? 'childes' : 'xblimps')
function record(entity, data) {
  const row_uid = data.row_uid
  return {
    update: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/records/${row_uid}`,
      fields: toFields({
        row_uid, entity, app: APP(entity), owner: null,
        language: data.language ?? null, workspace_id: data.workspace_id ?? null,
        rev: 1, data, updated_at: now(), updated_by: 'seed',
      }),
    },
  }
}
const stamp = () => ({ row_uid: randomUUID(), rev: 1, updated_at: now(), updated_by: 'seed', owner: null })

// ---- bibliography (reference grammars) ----
const SOURCE_SPECS = [
  { citekey: 'borsley2009', entry_type: 'book', author: 'Borsley, Robert D. and Tallerman, Maggie and Willis, David', year: '2009', title: 'The Syntax of Welsh', publisher: 'Cambridge University Press', languages: ['cy'], phenomena: ['agreement','word-order','clitics','negation','rel-clause','clause','binding','extraction'] },
  { citekey: 'mahootian1997', entry_type: 'book', author: 'Mahootian, Shahrzad', year: '1997', title: 'Persian', publisher: 'Routledge', languages: ['fa'], phenomena: ['linking','case','word-order','agreement','binding','clitics','negation','rel-clause','mood'] },
  { citekey: 'donaldson1993', entry_type: 'book', author: 'Donaldson, Bruce C.', year: '1993', title: 'A Grammar of Afrikaans', publisher: 'Mouton de Gruyter', languages: ['af'], phenomena: ['word-order','negation','agreement','clause','comparative','possession','case'] },
  { citekey: 'kroeger1991', entry_type: 'phdthesis', author: 'Kroeger, Paul', year: '1991', title: 'Phrase Structure and Grammatical Relations in Tagalog', publisher: 'Stanford University', languages: ['tl'], phenomena: ['voice','clitics','case','negation','extraction','agreement'] },
  { citekey: 'rackowski2002', entry_type: 'phdthesis', author: 'Rackowski, Andrea', year: '2002', title: 'The Structure of Tagalog: Specificity, Voice, and the Distribution of Arguments', publisher: 'MIT', languages: ['tl'], phenomena: ['voice','extraction','binding'] },
  { citekey: 'law2016', entry_type: 'article', author: 'Law, Paul', year: '2016', title: 'The Syntax of Tagalog Relative Clauses', journal: 'Linguistics', languages: ['tl'], phenomena: ['rel-clause','case'] },
  { citekey: 'wheeler1999', entry_type: 'book', author: 'Wheeler, Max W. and Yates, Alan and Dols, Nicolau', year: '1999', title: 'Catalan: A Comprehensive Grammar', publisher: 'Routledge', languages: ['ca'], phenomena: ['agreement','clitics','mood','morphophonology','negation','ellipsis','control','extraction','determiner'] },
  { citekey: 'riegel2009', entry_type: 'book', author: 'Riegel, Martin and Pellat, Jean-Christophe and Rioul, René', year: '2009', title: 'Grammaire méthodique du français', publisher: 'Presses Universitaires de France', languages: ['fr'], phenomena: ['agreement','clitics','mood','rel-clause','binding','control','word-order','extraction'] },
]
function bibtexOf(s) {
  const tags = [...s.languages, ...s.phenomena].join(', ')
  const lines = [`  author = {${s.author}}`, `  title = {${s.title}}`, `  year = {${s.year}}`,
    s.publisher ? `  publisher = {${s.publisher}}` : '', s.journal ? `  journal = {${s.journal}}` : '',
    `  keywords = {${tags}}`].filter(Boolean)
  return `@${s.entry_type}{${s.citekey},\n${lines.join(',\n')}\n}`
}
const PRIMARY = { cy: 'src.borsley2009', fa: 'src.mahootian1997', af: 'src.donaldson1993', tl: 'src.kroeger1991', ca: 'src.wheeler1999', fr: 'src.riegel2009' }

// ---- language workspaces ----
const COVERS = { '#185FA5':'linear-gradient(120deg,#cfe2f3,#9fc3e6 60%,#7fb0db)','#1D9E75':'linear-gradient(120deg,#cdeee2,#a6dcc8 60%,#7fcbac)','#BA7517':'linear-gradient(120deg,#f6e7c8,#ecd29a 60%,#e0bd72)','#D85A30':'linear-gradient(120deg,#f7d9c9,#efb89c 60%,#e69972)','#534AB7':'linear-gradient(120deg,#d7d4f0,#b6b0e2 60%,#968fd3)','#0F6E56':'linear-gradient(120deg,#c7e6dc,#9bcfbf 60%,#74b9a3)','#A23E5C':'linear-gradient(120deg,#f0d3da,#e0acb9 60%,#cf8597)','#3E6B8F':'linear-gradient(120deg,#d2e0eb,#aac3d6 60%,#84a6c1)','#7A5C2E':'linear-gradient(120deg,#ead9bf,#d6bd91 60%,#c2a268)','#993C1D':'linear-gradient(120deg,#eed3c6,#dcae98 60%,#c98d72)' }
const LANGS = [
  { language:'cy', name:'Welsh',     icon:'🏴', colour:'#1D9E75', tier:'low',    lead:'Aoife, Lily' },
  { language:'fa', name:'Persian',   icon:'🇮🇷', colour:'#534AB7', tier:'low',    lead:'Yury' },
  { language:'af', name:'Afrikaans', icon:'🇿🇦', colour:'#BA7517', tier:'low',    lead:'Theresa' },
  { language:'tl', name:'Tagalog',   icon:'🇵🇭', colour:'#D85A30', tier:'low',    lead:'Rigel (+ Shivan?)' },
  { language:'ca', name:'Catalan',   icon:'🇪🇸', colour:'#993C1D', tier:'low',    lead:'Nuria' },
  { language:'fr', name:'French',    icon:'🇫🇷', colour:'#185FA5', tier:'higher', lead:'Laura (+ Ellie?)' },
  { language:'de', name:'German',    icon:'🇩🇪', colour:'#0F6E56', tier:'higher', lead:'TBC' },
  { language:'es', name:'Spanish',   icon:'🇪🇸', colour:'#A23E5C', tier:'higher', lead:'Nuria' },
  { language:'da', name:'Danish',    icon:'🇩🇰', colour:'#3E6B8F', tier:'higher', lead:'Paula' },
  { language:'no', name:'Norwegian', icon:'🇳🇴', colour:'#7A5C2E', tier:'higher', lead:'Oeistein' },
]
const CONTENT_LANGS = ['cy', 'ca', 'tl', 'fr', 'fa']

// default template analysis so the card generator works on every template
function analysisFor(t) {
  return {
    parse_good: t.grammatical ? `[S ${t.grammatical}]` : '',
    parse_bad: t.ungrammatical ? `[S ${t.ungrammatical}] ✗ ${t.contrast || ''}` : '',
    perturbation: { type: 'feature_change', target: 'root', relation: '', depth: 0, description: t.contrast || '' },
    paradigm: 'lexical', feature_schema: {}, feature_contrast: '',
    conll_schema: '', gloss_schema: '', translation_schema: t.translation || '',
    penn: '', layers: [],
  }
}
const pageFrom = (note) => (String(note || '').match(/p\.?\s?(\d+)/i)?.[0] || '')

const writes = []

// sources
for (const s of SOURCE_SPECS) {
  writes.push(record('sources', {
    ...stamp(), id: 'src.' + s.citekey, citekey: s.citekey, entry_type: s.entry_type,
    author: s.author, year: s.year, title: s.title, publisher: s.publisher ?? '', journal: s.journal ?? '',
    bibtex: bibtexOf(s), languages: s.languages, phenomena: s.phenomena, contributor: 'seed', note: '',
    language: null,
  }))
}

// workspaces
for (const L of LANGS) {
  writes.push(record('workspaces', {
    ...stamp(), id: 'ws.' + L.language, name: L.name, kind: 'language', icon: L.icon, colour: L.colour,
    cover: COVERS[L.colour] || COVERS['#185FA5'], language: L.language, tier: L.tier, lead: L.lead,
    subtitle: `${L.tier === 'low' ? 'Low-resourced' : 'Higher-resourced'} · lead ${L.lead}`,
    sections: ['Overview', 'Phenomena', 'Template Studio', 'Card flow', 'Export'],
    dashboard: { widgets: [
      { id: randomUUID(), type: 'progress', title: 'Construction progress' },
      { id: randomUUID(), type: 'phenomena', title: 'Phenomena' },
      { id: randomUUID(), type: 'tasks', title: 'Tasks' },
      { id: randomUUID(), type: 'notes', title: 'Notes' },
    ] },
  }))
}

// per-language content
let nPhen = 0, nTpl = 0, nPair = 0
for (const lang of CONTENT_LANGS) {
  const data = JSON.parse(readFileSync(join(DIR, `${lang}.json`), 'utf8'))
  const primary = PRIMARY[lang]
  // dedupe phenomena by slug (keep first, drop any placeholder marked DEDUP_REMOVE)
  const seen = new Set()
  const phenId = {} // slug -> phenomenon id
  for (const p of data.phenomena) {
    if (p.note === 'DEDUP_REMOVE' || seen.has(p.slug)) continue
    seen.add(p.slug)
    const id = `${lang}.${p.slug}`
    phenId[p.slug] = id
    writes.push(record('phenomena', {
      ...stamp(), id, language: lang, label: p.label, family: p.family, complexity: p.complexity || 'med',
      hypothesis: p.hypothesis || '', ref: p.ref || '', note: `${p.tier ? `Tier ${p.tier}. ` : ''}${p.note || ''}`.trim(),
      status: 'planned', target: 100,
    }))
    nPhen++
  }
  const tplId = {} // slug -> template id
  for (const t of data.templates) {
    if (!phenId[t.phenomenon]) continue
    const id = `tpl.${lang}.${t.slug}`
    tplId[t.slug] = id
    writes.push(record('templates', {
      ...stamp(), id, phenomenon_id: phenId[t.phenomenon], language: lang, name: t.name,
      slots: (t.slots || []).map((s) => ({ name: s.name, fillers: s.fillers || [] })),
      grammatical: t.grammatical || '', ungrammatical: t.ungrammatical || '', contrast: t.contrast || '',
      citations: primary ? [{ source_id: primary, page: pageFrom(t.note), example: '', quote: t.contrast || '' }] : [],
      analysis: analysisFor(t),
      validation: { status: 'draft', comments: [] },
    }))
    nTpl++
  }
  for (const pr of (data.pairs || [])) {
    if (!phenId[pr.phenomenon] || !tplId[pr.template]) continue
    writes.push(record('pairs', {
      ...stamp(), id: randomUUID(), language: lang, phenomenon_id: phenId[pr.phenomenon], template_id: tplId[pr.template],
      sentence_good: pr.good || '', sentence_bad: pr.bad || '', contrast_tokens: pr.contrast_tokens || [],
      parse_good: '', parse_bad: '', gloss: '', conll: '', features: {}, feature_contrast: '', paradigm: 'lexical',
      perturbation: { type: 'feature_change', target: 'root', relation: '', depth: 0, description: pr.note || '' },
      translation: pr.translation || '', fillers: {}, author: 'seed',
      status: pr.good ? 'accepted' : 'candidate', notes: pr.note || '',
    }))
    nPair++
  }
}

// ---- commit in chunks of 400 ----
async function commit(chunk) {
  const r = await fetch(COMMIT, {
    method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: chunk }),
  })
  if (!r.ok) throw new Error(`commit ${r.status}: ${(await r.text()).slice(0, 400)}`)
}
for (let i = 0; i < writes.length; i += 400) {
  await commit(writes.slice(i, i + 400))
  console.log(`  committed ${Math.min(i + 400, writes.length)}/${writes.length}`)
}
console.log(`\nDone: ${LANGS.length} workspaces, ${SOURCE_SPECS.length} bibliography sources, ${nPhen} phenomena, ${nTpl} templates, ${nPair} minimal pairs (all shared).`)
