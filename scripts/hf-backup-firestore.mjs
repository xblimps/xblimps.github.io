// Back up the live Firestore content to the private HuggingFace datasets.
//
// Pulls every shared `records` doc from Firestore (Firebase CLI token), reconstructs the DB
// snapshot, and mirrors it to the xBLiMPs HF org via the shared payload/hub modules (HF_TOKEN
// from the environment / .env). Same zero-loss mapping the in-app backup uses.
//
//   HF_TOKEN=... node scripts/hf-backup-firestore.mjs

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { buildArtifacts } from './hf/payload.mjs'
import { pushArtifacts, resolveOrg, resolveToken } from './hf/hub.mjs'

const PROJECT_ID = 'xblimps-cd802'
const TOKEN = JSON.parse(readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')).tokens?.access_token
if (!TOKEN) { console.error('No Firebase CLI token'); process.exit(1) }
if (!resolveToken()) { console.error('No HF_TOKEN in environment (source .env first)'); process.exit(1) }

// ---- Firestore value decoding ----
function fromVal(v) {
  if ('nullValue' in v) return null
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('stringValue' in v) return v.stringValue
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromVal)
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {})
  return null
}
const fromFields = (f) => Object.fromEntries(Object.entries(f).map(([k, val]) => [k, fromVal(val)]))

async function fetchAllRecords() {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/records`
  const out = []
  let pageToken = ''
  do {
    const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
    if (!r.ok) throw new Error(`list ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = await r.json()
    for (const d of (j.documents || [])) out.push(fromFields(d.fields || {}))
    pageToken = j.nextPageToken || ''
  } while (pageToken)
  return out
}

const ENTITY_KEYS = ['workspaces','notes','tasks','files','events','phenomena','templates','pairs','sources','childes_docs','childes_anns']

const rows = await fetchAllRecords()
const db = { ops: [], audit: [] }
for (const k of ENTITY_KEYS) db[k] = []
for (const row of rows) {
  const entity = row.entity
  if (Array.isArray(db[entity])) db[entity].push(row.data)
}
const counts = Object.fromEntries(ENTITY_KEYS.map((k) => [k, db[k].length]))
console.log('snapshot:', JSON.stringify(counts))

const stamp = new Date().toISOString()
const { artifacts } = buildArtifacts(db, { stamp, org: resolveOrg() })
const { user, results } = await pushArtifacts(artifacts, { accessToken: resolveToken() })
console.log(`\nPushed to HF as ${user || '(unknown user)'}:`)
for (const r of results) console.log(`  ${r.name} (${r.files} files)`)
