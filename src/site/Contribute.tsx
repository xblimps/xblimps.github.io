// Contribute (#/contribute, #/contribute/<code>): the contributor-facing workflow that replaced the lexical generator
// (26 Nov 2026). "We give you words. You write the grammar." Order matters: language → phenomenon → vocabulary from a
// real FineWeb-2 sentence (with a precomputed English machine translation and suggested words) → the contributor's own
// ✓ / ✗ template → a 30-template assignment tracked in this browser → copy or download for the language sheet.
// The sampled sentence is a vocabulary scaffold, never something to copy: the page says so and checks for it.
// No backend: drafts, saved templates and progress live in this browser; nothing is sent anywhere.

import React, { useEffect, useMemo, useState } from 'react'
import { downloadText, copyText } from '../lib/download'
import { LANGUAGE_DATA, byCode, CENTRAL_CONTACT, type Language } from './languages'
import { phenomenaFor } from './phenomena'
import { Confirm } from './guide/common'

const ASSIGNMENT = 30            // templates per contributor
const PER_AREA = 3               // spread across 10 grammatical areas
const AREAS = 10

// ------------------------------------------------------------------ storage (this browser only)
const key = (code: string, what: string) => `xblimps.contribute.${code}.${what}`
function load<T>(k: string, fallback: T, store: Storage | undefined = globalThis.localStorage): T {
  try { const v = store?.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function save(k: string, v: unknown, store: Storage | undefined = globalThis.localStorage) { try { store?.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }

interface Sample { s: string; en: string | null; vocab: string[]; url: string }
interface Pool { code: string; dataset: string; config: string; translation_model: string | null; sentences: Sample[] }
interface Draft { phenomenon: string; good: string; bad: string; notes: string; author: string; credit: boolean }
interface Saved extends Draft { id: string; savedAt: string; words: string[]; source: string; sourceUrl: string }

const tokens = (s: string) => s.toLowerCase().normalize('NFC').match(/[\p{L}\p{M}\d’'-]+/gu) ?? []

/** How much of the ✓ sentence is lifted, in order, from the sample (0–1). High = probably copied or paraphrased. */
function copiedShare(mine: string, sample: string): number {
  const a = tokens(mine), b = tokens(sample)
  if (a.length < 4 || !b.length) return 0
  // longest common subsequence of tokens, relative to the contributor's sentence
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  return dp[a.length][b.length] / a.length
}

/** Word positions where ✓ and ✗ differ (aligned by a token LCS): a minimal pair should differ in very few. */
function differingWords(good: string, bad: string): number {
  const a = tokens(good), b = tokens(bad)
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
  return Math.max(a.length, b.length) - dp[a.length][b.length]
}

// ------------------------------------------------------------------ language picker
function Picker() {
  useEffect(() => { document.title = 'Contribute · xBLiMPs' }, [])
  return (
    <div>
      <section className="c-hero" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <h1>Help us build grammatical examples for your language.</h1>
          <p className="lead">We'll show you randomly selected sentences from real text in your language. Use their <b>words</b> as inspiration to write your own
            natural examples of a grammatical construction. You don't need to translate or rewrite them.</p>
          <p className="lead" style={{ fontWeight: 600 }}>We give you words. You write the grammar.</p>
        </div>
      </section>
      <section className="c-section" style={{ paddingTop: 8 }} aria-labelledby="pick-h">
        <h2 id="pick-h">Choose the language you speak natively</h2>
        <p className="kicker">Nine languages · the same simple workflow for each</p>
        <div className="c-langs">
          {LANGUAGE_DATA.map((l) => (
            <a key={l.code} href={`#/contribute/${l.code}`} className={`c-lang${l.status === 'active' ? '' : ' off'}`}>
              <b>{l.name}</b><span className="native" dir={l.dir}>{l.native}</span>
              <div className="state">{l.status === 'active' ? 'Start →' : 'Phase 2 · start →'}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

// ------------------------------------------------------------------ the language workspace
function Workspace({ lang }: { lang: Language }) {
  const code = lang.code
  const { list: phenomena, source: phSource } = phenomenaFor(code)
  const blank: Draft = { phenomenon: '', good: '', bad: '', notes: '', author: '', credit: true }
  const [draft, setDraft] = useState<Draft>(() => load(key(code, 'draft'), blank))
  const [saved, setSaved] = useState<Saved[]>(() => load(key(code, 'saved'), []))
  const [pool, setPool] = useState<Pool | null>(null)
  const [poolErr, setPoolErr] = useState('')
  const [idx, setIdx] = useState<number | null>(null)
  const [scaffold, setScaffold] = useState<Sample | null>(() => load(key(code, 'scaffold'), null))
  const [toast, setToast] = useState('')
  useEffect(() => { save(key(code, 'draft'), draft) }, [draft, code])
  useEffect(() => { save(key(code, 'saved'), saved) }, [saved, code])
  useEffect(() => { save(key(code, 'scaffold'), scaffold) }, [scaffold, code])
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(''), 2400); return () => clearTimeout(h) }, [toast])
  useEffect(() => { document.title = `${lang.name} · Contribute · xBLiMPs` }, [lang.name])

  // sentences already shown in this browser session are not shown again until the pool runs out
  const seenKey = key(code, 'seen')
  const draw = (p: Pool | null = pool) => {
    if (!p || !p.sentences.length) return
    const seen = new Set<number>(load(seenKey, [] as number[], globalThis.sessionStorage))
    let free = p.sentences.map((_, i) => i).filter((i) => !seen.has(i))
    if (!free.length) { seen.clear(); free = p.sentences.map((_, i) => i) }
    const i = free[Math.floor(Math.random() * free.length)]
    seen.add(i); save(seenKey, [...seen], globalThis.sessionStorage)
    setIdx(i)
  }
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}fineweb/${code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: Pool) => {
        // only sentences with vocabulary and (outside English) a translation are ever shown
        const ok = { ...p, sentences: (p.sentences || []).filter((x) => x.vocab?.length && (p.code === 'en' || x.en)) }
        if (!ok.sentences.length) throw new Error('empty')
        setPool(ok); draw(ok)
      })
      .catch(() => setPoolErr(`Vocabulary samples for ${lang.name} are being prepared. You can still write templates below.`))
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const sample = idx !== null && pool ? pool.sentences[idx] : null
  const byPhenomenon = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of saved) m.set(s.phenomenon, (m.get(s.phenomenon) ?? 0) + 1)
    return m
  }, [saved])
  const areasShown = phenomena.slice(0, Math.max(AREAS, 0))

  // checks: guidance, never a grammaticality judgement
  const issues: { level: 'error' | 'warning' | 'ok'; text: string }[] = []
  if (!draft.phenomenon.trim()) issues.push({ level: 'error', text: 'Choose the grammatical construction you are writing for (step 1).' })
  if (!draft.good.trim() || !draft.bad.trim()) issues.push({ level: 'error', text: 'Write both versions: the correct (✓) sentence and the incorrect (✗) one.' })
  if (!draft.author.trim()) issues.push({ level: 'error', text: 'Add your name so your contribution can be credited and reviewed.' })
  if (draft.good.trim() && draft.bad.trim()) {
    const d = differingWords(draft.good, draft.bad)
    if (d === 0) issues.push({ level: 'error', text: 'The ✓ and ✗ sentences are identical. The ✗ version must differ in the target feature.' })
    else if (d > 2) issues.push({ level: 'warning', text: `The two versions differ in ${d} places. A minimal pair should differ only in the target grammatical feature; check nothing else changed.` })
  }
  const share = scaffold && draft.good.trim() ? copiedShare(draft.good, scaffold.s) : 0
  if (share >= 0.6) issues.push({ level: 'warning', text: 'Your ✓ sentence follows the sample sentence very closely. Use the words, not the sentence: build a new sentence that tests your construction.' })
  const ready = !issues.some((i) => i.level === 'error')

  const saveIt = () => {
    const s: Saved = { ...draft, id: crypto.randomUUID(), savedAt: new Date().toISOString(),
      words: scaffold?.vocab ?? [], source: scaffold?.s ?? '', sourceUrl: scaffold?.url ?? '' }
    setSaved((cur) => [s, ...cur])
    setDraft((d) => ({ ...d, good: '', bad: '', notes: '' }))
    setToast(`Saved (${saved.length + 1} of ${ASSIGNMENT}). Try new words for the next one.`)
    draw()
  }
  const row = (s: Saved) => [s.phenomenon, s.good, s.bad, s.notes, s.credit ? s.author : `${s.author} (no public credit)`, s.source].map((v) => v.replace(/[\t\n]+/g, ' ')).join('\t')
  const copyAll = async () => setToast((await copyText(saved.map(row).join('\n'))) ? `Copied ${saved.length} template(s) for the ${lang.name} sheet` : 'Copy failed: use Download instead')
  const download = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const head = ['language', 'phenomenon', 'grammatical', 'ungrammatical', 'notes_alternatives', 'author', 'public_credit', 'vocabulary_from', 'source_url', 'saved_at']
    const rows = saved.map((s) => [code, s.phenomenon, s.good, s.bad, s.notes, s.author, s.credit ? 'yes' : 'no', s.source, s.sourceUrl, s.savedAt])
    downloadText(`xblimps-${code}-templates.csv`, [head, ...rows].map((r) => r.map(esc).join(',')).join('\n'), 'text/csv')
  }
  const share_ = async () => setToast((await copyText(`${location.origin}${location.pathname}#/contribute/${code}`)) ? 'Link copied: send it to another native speaker' : 'Copy failed')
  const addWord = (w: string) => setDraft((d) => ({ ...d, good: d.good ? `${d.good.replace(/\s+$/, '')} ${w}` : w }))
  const ph = phenomena.find((p) => p.label === draft.phenomenon)
  const done = saved.length

  return (
    <div>
      <a href="#/contribute" className="c-note">← All languages</a>
      <section className="c-hero" style={{ gridTemplateColumns: '1fr', paddingBottom: 6 }}>
        <div>
          <h1>{lang.name} <span className="c-note" style={{ fontSize: 22, fontWeight: 500 }} dir={lang.dir}>{lang.native}</span></h1>
          <p className="lead">We need native speakers of {lang.name} to write natural grammatical examples that capture how {lang.name} actually works.
            Your judgement as a native speaker is something we cannot get by translating English sentences.</p>
          {lang.status === 'phase-2' && <p className="c-callout" style={{ fontSize: 15 }}>{lang.notes?.[0]} Templates you write now are kept for phase 2.</p>}
        </div>
      </section>

      {/* the language's community: four layers */}
      <div className="c-grid" style={{ marginBottom: 18 }}>
        <div className="c-card"><span className="tag">Layer 1 · Language lead</span>
          <h3>{lang.leads?.length ? lang.leads.map((l) => l.name).join(', ') : <Confirm>{lang.name} lead, once they agree to be listed</Confirm>}</h3>
          <p>Defines the grammatical constructions and checks linguistic quality.</p></div>
        <div className="c-card"><span className="tag">Layer 2 · Coordinator</span>
          <h3>{lang.coordinator ? lang.coordinator.name : 'Recruiting'}</h3>
          <p>A native speaker who builds the {lang.name} community, organises sessions and keeps track of progress.</p></div>
        <div className="c-card"><span className="tag">Layer 3 · Core team</span><h3>3–8 speakers</h3>
          <p>A committed group writing the main collection, about 30 templates each.</p></div>
        <div className="c-card"><span className="tag">Layer 4 · Everyone</span><h3>Open to all {lang.name} speakers</h3>
          <p>Write a few templates, suggest constructions, or flag sentences that sound wrong.</p></div>
      </div>
      <div className="c-btns" style={{ marginBottom: 30 }}>
        <a className="c-btn" href="#write">Contribute now ↓</a>
        <a className="c-btn ghost" href={`mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent(`xBLiMPs ${lang.name}: join the core team`)}`}>Build {lang.name}: join the core team</a>
        <a className="c-btn ghost" href={`mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent(`xBLiMPs ${lang.name}: lead or coordinate`)}`}>Lead {lang.name}: lead or coordinate</a>
      </div>

      <h2 id="write" style={{ fontSize: 30, margin: '0 0 6px' }}>Let's write some grammatical examples.</h2>
      <p className="c-note" style={{ marginBottom: 18, fontSize: 15 }}>Your assignment: <b>{ASSIGNMENT} templates</b>, about {PER_AREA} in each of {AREAS} grammatical areas, over as many sessions as you like.
        Your work is saved in this browser as you go.</p>

      <div className="c-two">
        {/* step 1: phenomenon first */}
        <div className="c-card">
          <span className="tag">Step 1 · Your grammatical construction</span>
          <div className="c-field" style={{ marginTop: 8 }}>
            <label htmlFor="ph">Which construction are you writing for?</label>
            <select id="ph" value={phenomena.some((p) => p.label === draft.phenomenon) ? draft.phenomenon : draft.phenomenon ? '__other' : ''}
              onChange={(e) => setDraft({ ...draft, phenomenon: e.target.value === '__other' ? ' ' : e.target.value })}>
              <option value="">Choose…</option>
              {phenomena.map((p) => <option key={p.label} value={p.label}>{p.label}{byPhenomenon.get(p.label) ? ` (${byPhenomenon.get(p.label)} written)` : ''}</option>)}
              <option value="__other">Another construction (from my lead)</option>
            </select>
            {!phenomena.some((p) => p.label === draft.phenomenon) && draft.phenomenon !== '' && (
              <input aria-label="Construction name" value={draft.phenomenon.trim()} placeholder="The construction your lead gave you"
                onChange={(e) => setDraft({ ...draft, phenomenon: e.target.value || ' ' })} />
            )}
            <span className="help">
              {phSource === 'notes'
                ? <>From the {lang.name} linguists' notes (September draft). Your language lead confirms which constructions you work on.</>
                : <>Examples of BLiMP-style constructions. Your language lead tells you which ones {lang.name} uses.</>}
            </span>
          </div>
          {ph?.note && <div className="c-quote" style={{ fontSize: 14.5 }}><b>What we're testing:</b> {ph.note}</div>}
        </div>

        {/* step 2: vocabulary inspiration */}
        <div className="c-card">
          <span className="tag">Step 2 · Vocabulary inspiration</span>
          {poolErr && <p className="c-note" style={{ marginTop: 10 }}>{poolErr}</p>}
          {sample && <>
            <div className="c-sample" dir={lang.dir}>{sample.s}</div>
            {sample.en && <p className="c-en"><span className="c-note">English (machine translation):</span> {sample.en}</p>}
            <p className="c-note" style={{ margin: '10px 0 6px' }}><b>Words you could reuse</b> (tap one to add it to your sentence):</p>
            <div className="c-chips" dir={lang.dir}>{sample.vocab.map((w) => <button key={w} className="c-chip" onClick={() => addWord(w)}>{w}</button>)}</div>
            <div className="c-btns" style={{ marginTop: 14 }}>
              <button className="c-btn small" onClick={() => { setScaffold(sample); setToast('Words selected: now write your own sentence') }}>Use these words</button>
              <button className="c-btn small ghost" onClick={() => draw()}>Another sentence</button>
              <button className="c-btn small ghost" onClick={() => draw()} title="Skip without saving anything">Skip</button>
            </div>
            <p className="c-note" style={{ marginTop: 10 }}>
              <b>Use the words, not the sentence.</b> Rearrange them, swap in other words, change the structure, or build something entirely new.
              {' '}Real text from {pool?.dataset === 'HuggingFaceFW/fineweb' ? 'FineWeb' : 'FineWeb-2'} (ODC-By){pool?.translation_model ? `; translation by ${pool.translation_model.replace('Helsinki-NLP/', '')}` : ''} ·{' '}
              <a href={sample.url} target="_blank" rel="noreferrer nofollow">source</a>. Skip anything unsuitable.
            </p>
          </>}
        </div>
      </div>

      {/* step 3: write */}
      <div className="c-card" style={{ marginTop: 22 }}>
        <span className="tag">Step 3 · Write your own template</span>
        <h3>{draft.phenomenon.trim() ? `Construct an example testing: ${draft.phenomenon.trim()}` : 'Construct an example of your grammatical construction'}</h3>
        {scaffold && (
          <p className="c-note" dir={lang.dir}>Your words: {scaffold.vocab.map((w) => <span key={w} className="c-chip static">{w}</span>)}</p>
        )}
        <div className="c-two" style={{ gap: 14 }}>
          <div className="c-field"><label htmlFor="g">✓ Correct sentence</label>
            <textarea id="g" dir={lang.dir} value={draft.good} onChange={(e) => setDraft({ ...draft, good: e.target.value })}
              placeholder="A natural sentence a native speaker would say" /></div>
          <div className="c-field"><label htmlFor="b">✗ Incorrect version</label>
            <textarea id="b" dir={lang.dir} value={draft.bad} onChange={(e) => setDraft({ ...draft, bad: e.target.value })}
              placeholder="The same sentence, wrong only in the target feature" /></div>
        </div>
        <div className="c-field"><label htmlFor="n">Other words that would also work (optional)</label>
          <input id="n" dir={lang.dir} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="e.g. other subjects or verbs that fit, separated by commas; or a note for your lead" />
          <span className="help">Your lead uses these to turn your example into a full template row (3–4 alternatives per slot).</span></div>
        <div className="c-two" style={{ gap: 14 }}>
          <div className="c-field"><label htmlFor="a">Your name</label>
            <input id="a" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></div>
          <label className="c-check"><input type="checkbox" checked={draft.credit} onChange={(e) => setDraft({ ...draft, credit: e.target.checked })} />
            {' '}Credit me by name in the dataset documentation</label>
        </div>
        <ul className="c-issues">
          {issues.map((i) => <li key={i.text} className={i.level}>{i.text}</li>)}
          {ready && share < 0.6 && <li className="ok">Read both aloud: ✓ natural, ✗ wrong in exactly one way. Then save it.</li>}
        </ul>
        <div className="c-btns"><button className="c-btn" disabled={!ready} onClick={saveIt}>Save template</button></div>
        <p className="c-note" style={{ marginTop: 10 }}>The site checks the shape of your example, not its grammar: that judgement is yours, and your lead reviews it.</p>
      </div>

      {/* step 4: assignment and hand-off */}
      <div className="c-card" style={{ marginTop: 22 }}>
        <span className="tag">Step 4 · Your assignment</span>
        <h3>{done} / {ASSIGNMENT} templates</h3>
        <div className="c-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={ASSIGNMENT}><span style={{ width: `${Math.min(100, (done / ASSIGNMENT) * 100)}%` }} /></div>
        <div className="c-areas">
          {areasShown.map((p) => { const n = byPhenomenon.get(p.label) ?? 0; return (
            <div key={p.label} className={`c-area${n >= PER_AREA ? ' full' : ''}`}><span>{p.label}</span><b>{Math.min(n, PER_AREA)} / {PER_AREA}</b></div>) })}
        </div>
        {done > 0 && <>
          <div className="c-btns" style={{ marginTop: 16 }}>
            <button className="c-btn small" onClick={copyAll}>Copy templates for the {lang.name} sheet</button>
            <button className="c-btn small ghost" onClick={download}>Download (CSV)</button>
          </div>
          <p className="c-note" style={{ marginTop: 8 }}>Paste into the {lang.name} sheet, or send the file to your lead or coordinator. Columns: construction, ✓, ✗, other words, name, the sample you took words from.</p>
          <ul className="c-saved" dir={lang.dir} style={{ marginTop: 12 }}>
            {saved.slice(0, 6).map((s) => <li key={s.id}><span>✓ {s.good}<br /><span className="meta" dir="ltr">{s.phenomenon} · {s.author}</span></span></li>)}
          </ul>
        </>}
        <div className="c-quote" style={{ marginTop: 16 }}>
          <b>Know another {lang.name} speaker?</b> Invite them to write 30 templates too.{' '}
          <button className="c-btn small ghost" onClick={share_}>Copy invitation link</button>
        </div>
      </div>
      {toast && <div className="c-toast" role="status">{toast}</div>}
    </div>
  )
}

export default function Contribute({ code }: { code: string | null }) {
  const lang = code ? byCode(code) : null
  if (code && !lang) return <div className="prose"><h1>Language not found</h1><p><a href="#/contribute">Choose a language</a></p></div>
  // key: a fresh workspace per language, so no state (sample, pool, messages) carries over between languages
  return lang ? <Workspace key={lang.code} lang={lang} /> : <Picker />
}
