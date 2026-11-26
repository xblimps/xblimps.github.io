// Lexical generator (#/generator, #/generator/<code>): the public contributor tool. Pick a language, get a random real
// sentence from FineWeb-2 (FineWeb for English) with a precomputed English machine translation and words to reuse.
// "We give you words. You write the grammar." That is all it does: writing templates is private, in each language's
// sheet with its lead (decision of 26 Nov 2026: no construction lists, assignments or writing workflow on the public
// site). Each language page also recruits: "You can be…" with one action per role.

import React, { useEffect, useState } from 'react'
import { copyText } from '../lib/download'
import { LANGUAGE_DATA, byCode, CENTRAL_CONTACT, type Language } from './languages'

interface Sample { s: string; en: string | null; vocab: string[]; url: string }
interface Pool { code: string; dataset: string; translation_model: string | null; sentences: Sample[] }

const mail = (subject: string) => `mailto:${CENTRAL_CONTACT.email}?subject=${encodeURIComponent(subject)}`
function load<T>(k: string, fallback: T): T { try { const v = sessionStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback } }
function save(k: string, v: unknown) { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export function YouCanBe({ lang }: { lang?: Language }) {
  const name = lang?.name ?? 'your language'
  const tag = lang ? `xBLiMPs ${lang.name}` : 'xBLiMPs'
  const roles: [string, string, string, string, string][] = [
    ['✍️', 'You can contribute', `Write a few sentences or hundreds, whenever you have time. Five minutes is enough to help.`, 'I want to contribute', `${tag}: I want to contribute`],
    ['🤝', 'You can join a core team', `Work with 3–8 other speakers to write and review ${name}'s main collection.`, 'Join a team', `${tag}: join a core team`],
    ['📣', 'You can be a coordinator', `Bring ${lang ? `${lang.name} speakers` : 'speakers'} together, run sessions and make sure everyone is credited.`, 'Coordinate', `${tag}: coordinator`],
    ['🔬', 'You can be a language lead', `As a linguist, choose the grammatical constructions and check the quality.`, 'Lead', `${tag}: language lead`],
  ]
  return (
    <div className="m-roles">
      {roles.map(([ico, h, p, cta, subj]) => (
        <div key={h} className="m-role"><div className="m-ico" aria-hidden="true">{ico}</div><h3>{h}</h3><p>{p}</p>
          <a className="c-btn small" href={mail(subj)}>{cta}</a></div>
      ))}
    </div>
  )
}

function Picker() {
  useEffect(() => { document.title = 'Lexical generator · xBLiMPs' }, [])
  return (
    <div>
      <section className="c-hero" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <p className="m-eyebrow">Lexical generator</p>
          <h1>Real words from your language, in one click.</h1>
          <p className="lead">Pick your language and we'll show you a random sentence from real text, with an English translation and words you can reuse.
            Use the <b>words</b>, not the sentence, to write your own grammatical examples.</p>
          <p className="lead" style={{ fontWeight: 600 }}>We give you words. You write the grammar.</p>
        </div>
      </section>
      <LanguageGrid to="generator" />
    </div>
  )
}

export function LanguageGrid({ to }: { to: string }) {
  return (
    <div className="c-langs">
      {LANGUAGE_DATA.map((l) => (
        <a key={l.code} href={`#/${to}/${l.code}`} className="c-lang">
          <span className="m-recruit">Recruiting</span>
          <b dir={l.dir} style={{ fontSize: 20 }}>{l.native}</b><span className="native">{l.name}{l.status === 'phase-2' ? ' · phase 2' : ''}</span>
          <div className="state">Open →</div>
        </a>
      ))}
      <a className="c-lang m-add" href={mail('xBLiMPs: add my language')}>
        <b style={{ fontSize: 28, lineHeight: 1 }}>+</b><span className="native">Add your language</span>
        <div className="state">Start it with us →</div>
      </a>
    </div>
  )
}

function LanguageGenerator({ lang }: { lang: Language }) {
  const code = lang.code
  const [pool, setPool] = useState<Pool | null>(null)
  const [err, setErr] = useState('')
  const [idx, setIdx] = useState<number | null>(null)
  const [copied, setCopied] = useState('')
  useEffect(() => { document.title = `${lang.name} · Lexical generator · xBLiMPs` }, [lang.name])

  const seenKey = `xblimps.generator.${code}.seen`
  const draw = (p: Pool | null = pool) => {
    if (!p?.sentences.length) return
    const seen = new Set<number>(load(seenKey, [] as number[]))
    let free = p.sentences.map((_, i) => i).filter((i) => !seen.has(i))
    if (!free.length) { seen.clear(); free = p.sentences.map((_, i) => i) }
    const i = free[Math.floor(Math.random() * free.length)]
    seen.add(i); save(seenKey, [...seen]); setIdx(i); setCopied('')
  }
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}fineweb/${code}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: Pool) => {
        const ok = { ...p, sentences: (p.sentences || []).filter((x) => x.vocab?.length && (p.code === 'en' || x.en)) }
        if (!ok.sentences.length) throw new Error('empty')
        setPool(ok); draw(ok)
      })
      .catch(() => setErr(`Sentences for ${lang.name} are on their way.`))
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const sample = idx !== null && pool ? pool.sentences[idx] : null
  const copyWords = async () => { if (sample && (await copyText(sample.vocab.join(', ')))) setCopied('Words copied') }

  return (
    <div>
      <a href="#/generator" className="c-note">← All languages</a>
      <section className="c-hero" style={{ gridTemplateColumns: '1fr', paddingBottom: 4 }}>
        <div>
          <p className="m-eyebrow">We're recruiting {lang.name} speakers{lang.status === 'phase-2' ? ' · phase 2' : ''}</p>
          <h1><span dir={lang.dir}>{lang.native}</span>{lang.native !== lang.name && <span className="c-note" style={{ fontSize: 24, fontWeight: 500 }}> · {lang.name}</span>}</h1>
          <p className="lead">Whether you can write a few sentences or hundreds, your knowledge of {lang.name} helps test whether AI really understands it.</p>
        </div>
      </section>

      <div className="m-gen">
        {err && <p className="c-note">{err}</p>}
        {sample && <>
          <p className="m-eyebrow" style={{ marginBottom: 8 }}>A real sentence in {lang.name}</p>
          <div className="m-gen-sentence" dir={lang.dir}>{sample.s}</div>
          {sample.en && <p className="m-gen-en"><span className="c-note">English (machine translation)</span><br />{sample.en}</p>}
          <p className="m-eyebrow" style={{ margin: '22px 0 10px' }}>Words you could reuse</p>
          <div className="c-chips" dir={lang.dir}>{sample.vocab.map((w) => <span key={w} className="c-chip static m-chip">{w}</span>)}</div>
          <div className="c-btns" style={{ marginTop: 22 }}>
            <button className="c-btn" onClick={() => draw()}>Another sentence</button>
            <button className="c-btn ghost" onClick={copyWords}>{copied || 'Copy the words'}</button>
            <button className="c-btn ghost" onClick={() => draw()}>Skip</button>
          </div>
          <div className="c-callout" style={{ marginTop: 22 }}>
            <h3>Use the words, not the sentence.</h3>
            <p style={{ margin: 0, lineHeight: 1.6 }}>Don't copy, translate or paraphrase it. Take a few words and build your own new sentences that test the grammatical
              construction your lead gave you.</p>
          </div>
          <p className="c-note" style={{ marginTop: 14 }}>Real text from {pool?.dataset === 'HuggingFaceFW/fineweb' ? 'FineWeb' : 'FineWeb-2'} (ODC-By)
            {pool?.translation_model ? `, translated by ${pool.translation_model.replace(/^(Helsinki-NLP|facebook)\//, '')}` : ''} ·{' '}
            <a href={sample.url} target="_blank" rel="noreferrer nofollow">source</a>. Web text is unedited: skip anything unsuitable.</p>
        </>}
      </div>

      <section className="c-section" aria-labelledby="ycb-h">
        <p className="m-eyebrow">What can you do?</p>
        <h2 id="ycb-h" style={{ fontSize: 'clamp(26px, 3.6vw, 40px)' }}>You can be part of {lang.name} in xBLiMPs.</h2>
        <YouCanBe lang={lang} />
        <div className="c-quote" style={{ marginTop: 18 }}>
          <b>Know another {lang.name} speaker?</b> The more people write, the more varied and reliable the tests.{' '}
          <button className="c-btn small ghost" onClick={async () => { await copyText(`${location.origin}${location.pathname}#/generator/${code}`); setCopied('Link copied') }}>Copy invitation link</button>
        </div>
      </section>
    </div>
  )
}

export default function Generator({ code }: { code: string | null }) {
  const lang = code ? byCode(code) : null
  if (code && !lang) return <div className="prose"><h1>Language not found</h1><p><a href="#/generator">Choose a language</a></p></div>
  // key: a fresh generator per language, so nothing carries over between languages
  return lang ? <LanguageGenerator key={lang.code} lang={lang} /> : <Picker />
}
