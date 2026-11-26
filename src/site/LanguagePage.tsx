// A language's contribution page (#/lang/<code>): who leads it, then the four-step workflow in one place:
// 1 inspiration (random FineWeb-2 sentences), 2 write a template under the lead's slot pattern, 3 check it and
// preview its minimal pairs (the same lexgen engine as the generator), 4 save it in this browser and hand it to
// the language sheet (copy row / download). Nothing is sent anywhere: there is no backend on the public site.
// Inspiration sentences are web text for ideas only; templates must be the contributor's own words.

import React, { useEffect, useMemo, useState } from 'react'
import { analyse, expand, templateFromText, pairsToDelimited, DEFAULT_OPTIONS, type GeneratedPair, type LexTemplate } from '../lib/lexgen'
import { downloadText, copyText } from '../lib/download'
import { byCode, CENTRAL_CONTACT, type Language } from './languages'
import { Confirm } from './guide/common'

// ------------------------------------------------------------------ storage (this browser only)
interface Draft { headers: string; cells: string[]; macro: string; sub: string; author: string }
interface Saved extends Draft { id: string; savedAt: string }
const key = (code: string, what: string) => `xblimps.lang.${code}.${what}`
function load<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function store(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode: work stays in memory */ } }

// The lead's header row: pasted from the sheet (tab-separated) or typed with | between slots.
const splitHeaders = (h: string) => h.split(h.includes('\t') ? '\t' : '|').map((s) => s.trim()).filter(Boolean)
const EXAMPLE_HEADERS = '{subj_sg} | {rel} | {V_trans} | {obj_pl} | {VP_sg} ✓ | *{VP_pl} ✗'

function toTemplate(d: Draft): LexTemplate {
  const heads = splitHeaders(d.headers)
  const cells = heads.map((_, i) => d.cells[i] ?? '')
  return templateFromText(heads.join('\t') + '\n' + cells.join('\t'), d.macro || 'template')
}

// ------------------------------------------------------------------ inspiration
interface Pool { sentences: { s: string; url: string }[]; dataset: string; config: string; built: string }
const pick = <T,>(arr: T[], n: number) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a.slice(0, n) }

function Inspiration({ lang, onSeen }: { lang: Language; onSeen: () => void }) {
  const [pool, setPool] = useState<Pool | null>(null)
  const [err, setErr] = useState('')
  const [shown, setShown] = useState<Pool['sentences']>([])
  const [pinned, setPinned] = useState<Pool['sentences']>(() => load(key(lang.code, 'pinned'), []))
  useEffect(() => { store(key(lang.code, 'pinned'), pinned) }, [pinned, lang.code])
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}fineweb/${lang.code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: Pool) => { setPool(p); setShown(pick(p.sentences, 3)) })
      .catch(() => setErr('No inspiration sentences are available for this language yet.'))
  }, [lang.code])
  const more = () => { if (pool) { setShown(pick(pool.sentences, 3)); onSeen() } }
  const isPinned = (s: string) => pinned.some((p) => p.s === s)
  const toggle = (x: Pool['sentences'][number]) => { setPinned((cur) => (isPinned(x.s) ? cur.filter((p) => p.s !== x.s) : [...cur, x])); onSeen() }

  return (
    <div className="c-card">
      <span className="tag">Step 1 · Inspiration</span>
      <h3>Real sentences in {lang.name}</h3>
      <p>Random sentences from the web, to spark ideas for words and topics. <b>Don't copy them</b>: write your own sentences (the rules forbid copying from websites and using AI tools).</p>
      {err && <p className="c-note">{err}</p>}
      <div dir={lang.dir}>
        {shown.map((x) => (
          <div key={x.s} className={`c-quote${isPinned(x.s) ? ' pinned' : ''}`}>
            {x.s}
            <span className="src">
              <button className="c-btn small ghost" onClick={() => toggle(x)} aria-pressed={isPinned(x.s)}>{isPinned(x.s) ? 'Unpin' : '📌 Keep for later'}</button>{' '}
              <a href={x.url} target="_blank" rel="noreferrer nofollow">source</a>
            </span>
          </div>
        ))}
      </div>
      <div className="c-btns" style={{ marginTop: 10 }}>
        <button className="c-btn small" onClick={more} disabled={!pool}>Show other sentences</button>
      </div>
      {pinned.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary>Kept for later ({pinned.length})</summary>
          <div dir={lang.dir}>{pinned.map((x) => <div key={x.s} className="c-quote pinned">{x.s}</div>)}</div>
        </details>
      )}
      <p className="c-note" style={{ marginTop: 12 }}>
        From {pool?.dataset === 'HuggingFaceFW/fineweb' ? 'FineWeb' : 'FineWeb-2'} ({pool?.config ?? '…'}), ODC-By 1.0. Web text is unedited and may contain mistakes
        or things you would not want to read; skip anything unsuitable.
      </p>
    </div>
  )
}

// ------------------------------------------------------------------ the page
export default function LanguagePage({ code }: { code: string }) {
  const lang = byCode(code)
  const blank: Draft = { headers: '', cells: [], macro: '', sub: '', author: '' }
  const [draft, setDraft] = useState<Draft>(() => load(key(code, 'draft'), blank))
  const [saved, setSaved] = useState<Saved[]>(() => load(key(code, 'saved'), []))
  const [seen, setSeen] = useState<boolean>(() => load(key(code, 'seen'), false))
  const [toast, setToast] = useState('')
  useEffect(() => { store(key(code, 'draft'), draft) }, [draft, code])
  useEffect(() => { store(key(code, 'saved'), saved) }, [saved, code])
  useEffect(() => { store(key(code, 'seen'), seen) }, [seen, code])
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(''), 2200); return () => clearTimeout(h) }, [toast])
  useEffect(() => { if (lang) document.title = `${lang.name} · xBLiMPs` }, [lang])

  const heads = splitHeaders(draft.headers)
  const t = useMemo(() => toTemplate(draft), [draft])
  const a = useMemo(() => analyse(t), [t])
  const pairs = useMemo(() => {
    if (!a.ok) return [] as GeneratedPair[]
    const out: GeneratedPair[] = []; const k = new Set<string>()
    for (const p of expand(t, DEFAULT_OPTIONS, a)) {
      const id = p.good + '\u0000' + p.bad
      if (p.good === p.bad || k.has(id)) continue
      k.add(id); out.push(p)
      if (out.length >= 8) break
    }
    return out
  }, [t, a])

  if (!lang) {
    return <div className="prose"><h1>Language not found</h1><p><a href="#/">Back to all languages</a></p></div>
  }

  const missing: string[] = []
  if (!heads.length) missing.push("your lead's slot pattern")
  if (!draft.macro.trim()) missing.push('the phenomenon')
  if (!draft.author.trim()) missing.push('your name (for credit)')
  const ready = a.ok && missing.length === 0 && a.templates > 0
  const setCell = (i: number, v: string) => setDraft((d) => { const cells = [...d.cells]; cells[i] = v; return { ...d, cells } })

  const saveIt = () => {
    const s: Saved = { ...draft, cells: heads.map((_, i) => draft.cells[i] ?? ''), id: crypto.randomUUID(), savedAt: new Date().toISOString() }
    setSaved((cur) => [s, ...cur])
    setDraft((d) => ({ ...d, cells: [] }))           // keep pattern, phenomenon and name for the next template
    setToast('Saved in this browser. Next template!')
  }
  const sheetRow = (s: Saved) => [...s.cells, s.author].join('\t')
  const copyAll = async () => {
    const ok = await copyText(saved.map(sheetRow).join('\n'))
    setToast(ok ? `Copied ${saved.length} row(s): paste them into your language sheet` : 'Copy failed: use Download instead')
  }
  const downloadAll = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const maxCols = Math.max(0, ...saved.map((s) => s.cells.length))
    const head = ['language', 'macrophenomenon', 'subphenomenon', 'slot_pattern', ...Array.from({ length: maxCols }, (_, i) => `slot_${i + 1}`), 'author', 'saved_at']
    const rows = saved.map((s) => [lang.code, s.macro, s.sub, s.headers, ...Array.from({ length: maxCols }, (_, i) => s.cells[i] ?? ''), s.author, s.savedAt])
    downloadText(`xblimps-${lang.code}-templates.csv`, [head, ...rows].map((r) => r.map(esc).join(',')).join('\n'), 'text/csv')
  }
  const downloadPairs = () => {
    const all = saved.flatMap((s) => { const st = toTemplate(s); const sa = analyse(st); return sa.ok ? [pairsToDelimited(st, Array.from(expand(st, DEFAULT_OPTIONS, sa)), ',')] : [] })
    downloadText(`xblimps-${lang.code}-pairs.csv`, all.join('\n'), 'text/csv')
  }
  const edit = (s: Saved) => { setDraft({ headers: s.headers, cells: s.cells, macro: s.macro, sub: s.sub, author: s.author }); setSaved((cur) => cur.filter((x) => x.id !== s.id)); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const steps = [
    { n: 1, label: 'Inspiration', done: seen },
    { n: 2, label: 'Write', done: heads.length > 0 && t.rows[0]?.some((c) => c.trim()) },
    { n: 3, label: 'Check', done: a.ok && a.templates > 0 },
    { n: 4, label: 'Save & send', done: saved.length > 0 },
  ]
  const now = steps.find((s) => !s.done)?.n

  return (
    <div dir="ltr">
      <a href="#/" className="c-note">← All languages</a>
      <section className="c-hero" style={{ gridTemplateColumns: '1fr', paddingBottom: 8 }}>
        <div>
          <h1>{lang.name} <span className="c-note" style={{ fontSize: 22, fontWeight: 500 }} dir={lang.dir}>{lang.native}</span></h1>
          {lang.status === 'phase-2'
            ? <p className="lead">{lang.notes?.[0]}</p>
            : <p className="lead">Thank you for helping build xBLiMPs for {lang.name}! Find inspiration, write a template under your lead's slot pattern,
                check the pairs it makes, then save it and add it to the {lang.name} sheet.</p>}
        </div>
      </section>

      <div className="c-grid" style={{ marginBottom: 26 }}>
        <div className="c-card">
          <span className="tag">Your language lead</span>
          {lang.leads
            ? lang.leads.map((l) => <div key={l.name}><h3>{l.name}</h3><p>{l.role ?? 'Language lead'}{l.contact ? <> · {l.contact}</> : null}</p></div>)
            : <><h3><Confirm>{lang.name} lead, once they agree to be listed</Confirm></h3><p>Until then, ask in {lang.channel ?? CENTRAL_CONTACT.slack} or e-mail <a href={`mailto:${CENTRAL_CONTACT.email}`}>{CENTRAL_CONTACT.email}</a>.</p></>}
        </div>
        <div className="c-card">
          <span className="tag">What to do</span>
          <h3>One template at a time</h3>
          <p>Get your sheet and slot pattern from your lead. Write 3–4 natural alternatives in every slot; only the ✓ / ✗ slot differs between the pair. Put your name on your templates so you are credited.</p>
        </div>
        <div className="c-card">
          <span className="tag">Help</span>
          <h3>Guides</h3>
          <p><a href="#/guide/native">I'm a native speaker</a> · <a href="#/guide/lead">I'm a language lead</a> · <a href="#/guide/demo">Worked demo</a> · <a href="#/guide/advice">Advice &amp; FAQ</a></p>
        </div>
        {lang.notes && lang.status === 'active' && (
          <div className="c-card"><span className="tag">{lang.name} notes</span><h3>From your lead</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>{lang.notes.map((n) => <li key={n} className="c-note" style={{ fontSize: 14 }}>{n}</li>)}</ul></div>
        )}
      </div>

      {lang.status === 'active' && <>
        <ol className="c-steps" aria-label="Progress">
          {steps.map((s) => <li key={s.n} className={s.done ? 'done' : s.n === now ? 'now' : ''}><span className="n">{s.done ? '✓' : s.n}</span>{s.label}</li>)}
        </ol>

        <div className="c-two">
          <Inspiration lang={lang} onSeen={() => setSeen(true)} />

          <div className="c-card">
            <span className="tag">Step 2 · Write a template</span>
            <h3>Your template</h3>
            <div className="c-field">
              <label htmlFor="hd">Slot pattern (from your lead)</label>
              <input id="hd" value={draft.headers} placeholder={EXAMPLE_HEADERS} onChange={(e) => setDraft({ ...draft, headers: e.target.value })} />
              <span className="help">Paste the header row from your sheet, or type the slots separated by |. Mark the grammatical slot with ✓ and the ungrammatical one with ✗ (or *).
                {!draft.headers && <> <button className="c-btn small ghost" onClick={() => setDraft({ ...draft, headers: EXAMPLE_HEADERS })}>Use the English example</button></>}</span>
            </div>
            <div className="c-two" style={{ gap: 12 }}>
              <div className="c-field"><label htmlFor="mp">Phenomenon</label>
                <input id="mp" value={draft.macro} placeholder="e.g. Subject–verb agreement" onChange={(e) => setDraft({ ...draft, macro: e.target.value })} /></div>
              <div className="c-field"><label htmlFor="sp">Subphenomenon (optional)</label>
                <input id="sp" value={draft.sub} placeholder="e.g. across a relative clause" onChange={(e) => setDraft({ ...draft, sub: e.target.value })} /></div>
            </div>
            {heads.length > 0 && (
              <div className="c-slots" dir={lang.dir}>
                {t.columns.map((c, i) => (
                  <div key={i} className={`c-slot${c.role === 'good' ? ' good' : c.role === 'bad' ? ' bad' : ''}`}>
                    <span className="lbl" dir="ltr">{c.role === 'good' ? '✓ ' : c.role === 'bad' ? '✗ ' : ''}{c.label}</span>
                    <input aria-label={`Alternatives for ${c.label}`} value={draft.cells[i] ?? ''} onChange={(e) => setCell(i, e.target.value)}
                      placeholder={i === 0 ? 'alternative 1, alternative 2, alternative 3' : 'alternatives, separated by commas'} />
                  </div>
                ))}
              </div>
            )}
            <div className="c-field" style={{ marginTop: 14 }}><label htmlFor="au">Your name (for credit)</label>
              <input id="au" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></div>
            <p className="c-note">Use commas between alternatives. If an alternative itself contains a comma, wrap it in [square brackets]. Your draft is kept in this browser as you type.</p>
          </div>
        </div>

        <div className="c-two" style={{ marginTop: 22 }}>
          <div className="c-card">
            <span className="tag">Step 3 · Check</span>
            <h3>{a.ok && a.total > 0 ? `${a.total} minimal pair${a.total === 1 ? '' : 's'} from this template` : 'Checks'}</h3>
            <ul className="c-issues">
              {missing.map((m) => <li key={m} className="warning">Still needed: {m}.</li>)}
              {a.issues.filter((i) => i.level !== 'note' || a.ok).map((i, n) => <li key={n} className={i.level}>{i.message}</li>)}
              {a.ok && heads.length > 0 && a.templates === 0 && (
                <li className="warning">This row does not count as a template yet: every slot that varies (✓ and ✗ included) needs 3–4 alternatives,
                  and ✓ and ✗ need the same number. Slots with a single fixed word are fine.</li>
              )}
              {ready && <li className="ok">Looks good: read the pairs below and make sure every ✓ sounds natural and every ✗ is wrong in exactly one way.</li>}
            </ul>
            {pairs.length > 0 && (
              <table className="c-pairs" dir={lang.dir}><tbody>
                {pairs.map((p) => <tr key={p.index}><td className="g">{p.good}</td><td className="b">{p.bad}</td></tr>)}
              </tbody></table>
            )}
            {pairs.length > 0 && a.total > pairs.length && <p className="c-note">Showing {pairs.length} of {a.total}.</p>}
            <div className="c-btns" style={{ marginTop: 14 }}>
              <button className="c-btn" disabled={!ready} onClick={saveIt}>Save template</button>
            </div>
          </div>

          <div className="c-card">
            <span className="tag">Step 4 · Save &amp; send</span>
            <h3>Your templates ({saved.length})</h3>
            {saved.length === 0
              ? <p>Saved templates appear here. They stay in this browser until you add them to the {lang.name} sheet.</p>
              : <>
                <ul className="c-saved" dir={lang.dir}>
                  {saved.map((s) => (
                    <li key={s.id}><span>{s.cells.filter(Boolean).slice(0, 3).join(' · ')}<br /><span className="meta" dir="ltr">{s.macro}{s.sub ? ` › ${s.sub}` : ''} · {s.author}</span></span>
                      <button className="c-btn small ghost" onClick={() => edit(s)}>Edit</button></li>
                  ))}
                </ul>
                <div className="c-btns" style={{ marginTop: 14 }}>
                  <button className="c-btn small" onClick={copyAll}>Copy rows for the sheet</button>
                  <button className="c-btn small ghost" onClick={downloadAll}>Download templates (CSV)</button>
                  <button className="c-btn small ghost" onClick={downloadPairs}>Download pairs (CSV)</button>
                </div>
                <p className="c-note" style={{ marginTop: 10 }}>Paste the copied rows into your tab of the {lang.name} sheet (one row per template, your name in the last column).
                  Your lead reviews templates there and gives feedback.</p>
              </>}
          </div>
        </div>
      </>}
      {toast && <div className="c-toast" role="status">{toast}</div>}
    </div>
  )
}
