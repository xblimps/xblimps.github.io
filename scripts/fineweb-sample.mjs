// Builds the static inspiration pools behind the language pages: random sentences from FineWeb-2 (FineWeb for
// English), one JSON file per language in public/fineweb/<code>.json. The site never calls the datasets API live
// (it is slow and often busy for the large subsets); it draws from these pools in the browser.
//
//   node scripts/fineweb-sample.mjs                 # every language, ~2,000 sentences each
//   node scripts/fineweb-sample.mjs cy fr --n 500   # some languages, a smaller pool
//
// Sentences are inspiration only: they never become templates (templates are human-written), and each keeps its
// source URL for attribution. FineWeb-2 is ODC-By 1.0 (https://huggingface.co/datasets/HuggingFaceFW/fineweb-2).
// Filters: 5–28 words, starts with a capital (no fragments), no spam/adult/gambling terms, no URLs, e-mail addresses
// or long digit runs, mostly letters, deduplicated, at most 3
// sentences per web page (so one site cannot dominate a pool).

import { writeFileSync, mkdirSync } from 'node:fs'

export const SOURCES = {
  af: { dataset: 'HuggingFaceFW/fineweb-2', config: 'afr_Latn' },
  eu: { dataset: 'HuggingFaceFW/fineweb-2', config: 'eus_Latn' },
  ca: { dataset: 'HuggingFaceFW/fineweb-2', config: 'cat_Latn' },
  en: { dataset: 'HuggingFaceFW/fineweb', config: 'sample-10BT' },
  fr: { dataset: 'HuggingFaceFW/fineweb-2', config: 'fra_Latn' },
  fa: { dataset: 'HuggingFaceFW/fineweb-2', config: 'fas_Arab' },
  es: { dataset: 'HuggingFaceFW/fineweb-2', config: 'spa_Latn' },
  tl: { dataset: 'HuggingFaceFW/fineweb-2', config: 'fil_Latn' },   // FineWeb-2 files Tagalog/Filipino as fil_Latn
  cy: { dataset: 'HuggingFaceFW/fineweb-2', config: 'cym_Latn' },
}

const API = 'https://datasets-server.huggingface.co'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      const d = await r.json()
      if (!d.error) return d
      if (i === tries - 1) throw new Error(d.error)
    } catch (e) {
      if (i === tries - 1) throw e
    }
    await sleep(1500 * 2 ** i)
  }
}

// The first parquet shards answer quickly even for the huge subsets; offsets are drawn below this ceiling.
const SAFE_OFFSET = 900_000

async function rowCount({ dataset, config }) {
  try {
    const d = await getJSON(`${API}/size?dataset=${dataset}&config=${config}`, 2)
    const n = d.size.splits.find((s) => s.split === 'train')?.num_rows
    return Math.min(n ?? SAFE_OFFSET, SAFE_OFFSET)
  } catch {
    return SAFE_OFFSET
  }
}

const SPLIT = /(?<=[.!?؟।])\s+(?=[\p{Lu}\p{Lo}"«“¿¡])/u
function sentences(text) {
  return text
    .split(/\n+/)
    .flatMap((p) => p.split(SPLIT))
    .map((s) => s.trim().replace(/\s+/g, ' '))
}

// Spam, adult and gambling pages are common in web crawls; drop any sentence that mentions them (a coarse,
// mostly Latin-script list: the pages are skippable on the site too).
const SPAM = /\b(dating|casino|porn|sex|xxx|escort|viagra|cialis|loan|bitcoin|crypto|forex|betting|bet365|slot machine|onlyfans|webcam|18\+|cbd)\b/iu

function keep(s) {
  const words = s.split(' ')
  if (/^\p{Ll}/u.test(s)) return false          // starts mid-sentence (a fragment)
  if (SPAM.test(s)) return false
  if (words.length < 5 || words.length > 28) return false
  if (/https?:|www\.|@|\d{4,}|\|/.test(s)) return false
  const letters = (s.match(/\p{L}/gu) || []).length
  if (letters / s.length < 0.7) return false
  if (!/[.!?؟]$/.test(s)) return false
  return true
}

async function build(code, n) {
  const src = SOURCES[code]
  const total = await rowCount(src)
  const out = []
  const seen = new Set()
  let calls = 0
  while (out.length < n && calls < Math.ceil(n / 3) + 40) {
    calls++
    const offset = Math.floor(Math.random() * Math.max(1, total - 20))
    let d
    try {
      d = await getJSON(`${API}/rows?dataset=${src.dataset}&config=${src.config}&split=train&offset=${offset}&length=20`)
    } catch (e) {
      process.stdout.write(`  ${code}: skip offset ${offset} (${String(e.message).slice(0, 60)})\n`)
      continue
    }
    for (const { row } of d.rows) {
      let fromPage = 0
      for (const s of sentences(row.text)) {
        if (fromPage >= 3 || !keep(s) || seen.has(s)) continue
        seen.add(s)
        out.push({ s, url: row.url })
        fromPage++
      }
    }
    process.stdout.write(`  ${code}: ${out.length}/${n}\r`)
    await sleep(250)
  }
  mkdirSync('public/fineweb', { recursive: true })
  const file = `public/fineweb/${code}.json`
  writeFileSync(file, JSON.stringify({ code, ...src, licence: 'ODC-By 1.0', built: new Date().toISOString().slice(0, 10),
    sentences: out.slice(0, n) }))
  console.log(`${file}: ${Math.min(out.length, n)} sentences (${calls} requests)`)
}

const args = process.argv.slice(2)
const nIdx = args.indexOf('--n')
const n = nIdx >= 0 ? Number(args[nIdx + 1]) : 2000
const codes = args.filter((a, i) => !a.startsWith('--') && i !== nIdx + 1)
for (const code of codes.length ? codes : Object.keys(SOURCES)) {
  if (!SOURCES[code]) { console.error(`unknown language code ${code}`); continue }
  await build(code, n)
}
