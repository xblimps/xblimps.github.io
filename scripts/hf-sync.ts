// One-command, headless HuggingFace backup of the entire xBLiMPs dataset.
//
//   npm run hf:sync                 # source the data automatically (see below), push private datasets
//   npm run hf:sync -- --file x.json  # push a snapshot.json exported from the app
//   npm run hf:sync -- --dry          # build the payload and report, push nothing
//
// Data source precedence:
//   1. --file <snapshot.json>            (an export from the running app)
//   2. Supabase  (SUPABASE_URL + a key)  — the cloud source of truth, all `records`
//   3. the local seed inventory          (buildSeed) — so it always has *something* to mirror
//
// Live browser-only edits (demo mode, localStorage) are not reachable here — back those up from the
// app via the "Back up to HuggingFace" button, which posts through /api/hf-sync.

import { readFileSync } from 'node:fs'
import { buildArtifacts, ENTITY_KEYS } from './hf/payload.mjs'
import { pushArtifacts, resolveOrg, resolveToken } from './hf/hub.mjs'
import { buildSeed } from '../src/lib/seed'

const argv = process.argv.slice(2)
const flag = (n: string) => argv.includes(n)
const opt = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }

function emptyDB(): any {
  const db: any = { session: {} }
  for (const k of [...ENTITY_KEYS, 'ops', 'audit']) db[k] = []
  return db
}

async function fromSupabase(url: string, key: string) {
  const db = emptyDB()
  // Page through every record so nothing is truncated by the default row limit.
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${url}/rest/v1/records?select=entity,data`, {
      headers: { apikey: key, authorization: `Bearer ${key}`, range: `${from}-${from + PAGE - 1}`, prefer: 'count=exact' },
    })
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
    const rows = (await res.json()) as { entity: string; data: any }[]
    for (const r of rows) if (Array.isArray(db[r.entity])) db[r.entity].push(r.data)
    if (rows.length < PAGE) break
  }
  return db
}

async function sourceDB(): Promise<{ db: any; source: string }> {
  const file = opt('--file')
  if (file) {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return { db: parsed.db ?? parsed, source: `file:${file}` }
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (url && key) return { db: await fromSupabase(url, key), source: 'supabase' }
  return { db: buildSeed(), source: 'seed' }
}

async function main() {
  const { db, source } = await sourceDB()
  const org = resolveOrg()
  const stamp = new Date().toISOString()
  const { artifacts, counts } = buildArtifacts(db, { stamp, org })

  console.log(`xBLiMPs → HuggingFace sync`)
  console.log(`  source : ${source}`)
  console.log(`  org    : ${org} (datasets are PRIVATE)`)
  console.log(`  records:`, Object.entries(counts).filter(([, n]) => (n as number) > 0).map(([k, n]) => `${k}=${n}`).join(' ') || '(none)')
  console.log(`  repos  :`, Object.keys(artifacts).join(', '))

  if (flag('--dry')) { console.log('  --dry: nothing uploaded.'); return }

  const token = resolveToken()
  if (token.startsWith('hf_xzy')) console.warn('  ⚠ using the hardcoded fallback token — set HF_TOKEN and rotate it.')

  const { user, results } = await pushArtifacts(artifacts, { accessToken: token })
  console.log(`  pushed as: ${user ?? '(unknown user)'}`)
  for (const r of results) console.log(`  ✓ https://huggingface.co/datasets/${r.name}  (${r.files} files)`)
  console.log('Done — all datasets are private.')
}

main().catch((e) => { console.error('hf:sync failed:', e?.message || e); process.exit(1) })
