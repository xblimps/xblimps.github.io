// Forge — the native-speaker annotator's focused workspace.
//
// HCI goal: turn the annotator from a *blank-page generator* into a primed author. The template
// structure comes from the lead; alongside it we show a small, length-varied sample of real
// corpus sentences (lib/wordbank.ts). Those sentences are NOT slot fillers and need not share the
// construction — they exist to prime vocabulary and topics, so the pairs an annotator writes stay
// lexically and thematically diverse instead of all reusing the template's example words.
//
// Deliberately strips the parse / CoNLL / feature-bundle panels of the lead/reviewer Card flow:
// one decision at a time. Keyboard-driven for rhythm: Space reroll the priming sample, Enter
// accept, R reject.

import React, { useEffect, useMemo, useState } from 'react'
import { store, ident } from '../../lib/store'
import type { MinimalPair, Template, Slot } from '../../lib/types'
import { uid } from '../../lib/id'
import { Ring } from '../../components/ui'
import { useApp } from '../../state/AppContext'
import { emptyPerturbation } from '../../lib/perturbations'
import { primingSample, sentenceLength, hasBank, type PrimingSentence } from '../../lib/wordbank'

const RTL = new Set(['fa'])
const PRIMING_N = 10

// map a phenomenon family to a sensible default perturbation type, so accepted pairs already
// carry a structural tag the lead/reviewer can refine later (annotator never sees this).
const FAMILY_PERT: Record<string, string> = {
  agreement: 'agreement_flip', negation: 'negation', clitics: 'clitic_reorder',
  'word-order': 'reorder_local', case: 'case_marker', morphophonology: 'mutation',
  binding: 'substitution', voice: 'feature_change', mood: 'feature_change', linking: 'feature_change',
}

function highlight(sentence: string, tokens: string[], rtl: boolean) {
  let parts: (string | { c: string })[] = [sentence]
  for (const tok of tokens.filter(Boolean)) {
    const next: typeof parts = []
    for (const p of parts) {
      if (typeof p !== 'string') { next.push(p); continue }
      const idx = p.indexOf(tok)
      if (idx === -1) { next.push(p); continue }
      if (idx > 0) next.push(p.slice(0, idx))
      next.push({ c: tok })
      if (idx + tok.length < p.length) next.push(p.slice(idx + tok.length))
    }
    parts = next
  }
  return (
    <span className="mp-sentence" dir={rtl ? 'rtl' : 'ltr'}>
      {parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : <span key={i} className="contrast-tok">{p.c}</span>)}
    </span>
  )
}

// seed each slot's input from its first hand-authored filler (annotator is free to overwrite).
const seedFillers = (slots: Slot[]): Record<string, string> => {
  const out: Record<string, string> = {}
  slots.forEach((s) => { out[s.name] = (s.fillers ?? []).filter(Boolean)[0] ?? '' })
  return out
}

export default function Forge() {
  const { profile } = useApp()

  // languages the annotator may work in: their assignments ∩ banks, else any language project.
  const langProjects = store.db.workspaces.filter((w) => w.kind === 'language' && w.language)
  const assigned = langProjects.filter((w) => profile.languages.includes(w.language!))
  const choices = (assigned.length ? assigned : langProjects)
  const [lang, setLang] = useState(choices[0]?.language ?? '')

  const phen = store.db.phenomena.filter((p) => p.language === lang)
  const [phenId, setPhenId] = useState(phen.find((p) => p.status === 'active')?.id ?? phen[0]?.id ?? '')
  useEffect(() => {
    const list = store.db.phenomena.filter((p) => p.language === lang)
    setPhenId(list.find((p) => p.status === 'active')?.id ?? list[0]?.id ?? '')
  }, [lang])

  const templates = store.db.templates.filter((t) => t.language === lang && t.phenomenon_id === phenId)
  const [tplId, setTplId] = useState(templates[0]?.id ?? '')
  useEffect(() => { setTplId(templates[0]?.id ?? '') }, [phenId, lang])
  const tpl = templates.find((t) => t.id === tplId)

  const phenObj = phen.find((p) => p.id === phenId)
  const target = phenObj?.target ?? 100
  const accepted = store.db.pairs.filter((p) => p.phenomenon_id === phenId && ['accepted', 'edited', 'validated'].includes(p.status))
  const pct = target ? (accepted.length / target) * 100 : 0
  const rtl = RTL.has(lang)

  const [fillers, setFillers] = useState<Record<string, string>>({})
  const [priming, setPriming] = useState<PrimingSentence[]>([])
  const [flash, setFlash] = useState(false)

  const reprime = () => setPriming(primingSample(lang, PRIMING_N))

  // (re)seed slot inputs whenever the template changes; refresh the priming sample on language.
  useEffect(() => { setFillers(tpl ? seedFillers(tpl.slots) : {}) }, [tpl?.id])
  useEffect(() => { reprime() }, [lang])

  const slots = tpl?.slots ?? []
  const setSlot = (name: string, v: string) => setFillers((f) => ({ ...f, [name]: v }))

  const fill = (pat: string) => pat.replace(/\{(\w+)\}/g, (_, k) => fillers[k] || `{${k}}`)
  const good = tpl ? fill(tpl.grammatical) : ''
  const bad = tpl ? fill(tpl.ungrammatical).replace('*', '') : ''
  const tokens = useMemo(() => Object.values(fillers).filter(Boolean).slice(0, 2), [fillers])

  const commit = (status: MinimalPair['status']) => {
    if (!tpl) return
    const pair: MinimalPair = {
      ...ident(), id: uid(), language: lang, phenomenon_id: phenId, template_id: tpl.id,
      sentence_good: good, sentence_bad: bad, contrast_tokens: tokens,
      parse_good: '', parse_bad: '', gloss: '', conll: '', features: {}, feature_contrast: '', paradigm: 'lexical',
      perturbation: { ...emptyPerturbation(), type: FAMILY_PERT[phenObj?.family ?? ''] ?? 'agreement_flip', description: tpl.contrast },
      fillers, author: store.db.session.user, status, notes: '',
    } as MinimalPair
    store.upsert('pairs', pair)
    if (status === 'accepted') { setFlash(true); setTimeout(() => setFlash(false), 400) }
    setFillers(seedFillers(tpl.slots))  // fresh frame
    reprime()                            // fresh inspiration — keeps the rhythm going
  }

  // keyboard rhythm (ignored while typing a slot value)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === ' ') { e.preventDefault(); reprime() }
      else if (e.key === 'Enter') commit('accepted')
      else if (e.key.toLowerCase() === 'r') commit('rejected')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [tpl?.id, lang, phenId, good, bad, fillers])

  return (
    <div className="forge">
      {/* compact selectors — small, so they don't compete with the task */}
      <div className="between" style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8 }}>
          {choices.length > 1 && (
            <select className="field" style={{ width: 'auto' }} value={lang} onChange={(e) => setLang(e.target.value)}>
              {choices.map((w) => <option key={w.id} value={w.language}>{w.name}</option>)}
            </select>
          )}
          <select className="field" style={{ width: 'auto' }} value={phenId} onChange={(e) => setPhenId(e.target.value)}>
            {phen.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {templates.length > 1 && (
            <select className="field" style={{ width: 'auto' }} value={tplId} onChange={(e) => setTplId(e.target.value)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
        <div className="row">
          <Ring pct={pct} label={`${accepted.length}`} />
          <div className="stack"><b style={{ fontSize: 13 }}>{accepted.length}/{target}</b><span className="faint" style={{ fontSize: 12 }}>accepted</span></div>
        </div>
      </div>

      {!tpl ? (
        <div className="empty"><div className="big">🪄</div>No template here yet — ask your lead to set one up for this phenomenon.</div>
      ) : (
        <>
          {/* plain-language statement of what we are testing */}
          <div className="forge-brief">
            <div className="eyebrow" style={{ marginBottom: 4 }}>What we're testing</div>
            <div>{tpl.contrast || phenObj?.hypothesis || 'Build a minimal pair: one grammatical, one not.'}</div>
          </div>

          {/* template (slot inputs) and the random corpus generator, side by side on one line */}
          <div className="forge-cols">
          {/* priming panel — length-varied corpus sentences for lexical / topic diversity */}
          {hasBank(lang) && (
            <div className="prime">
              <div className="prime-head">
                <div className="prime-title">
                  <span className="eyebrow">For inspiration</span>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    A fresh sample of real sentences — pull in different words and topics so your pairs stay varied. (Not the construction; just priming.)
                  </span>
                </div>
                <button className="reel-btn" title="Fresh sample (space)" onClick={reprime}>↻</button>
              </div>
              <ul className="prime-list">
                {priming.map((s, i) => (
                  <li key={i} className="prime-item" dir={rtl ? 'rtl' : 'ltr'}>
                    <span className="prime-len" title="length (tokens)">{sentenceLength(s)}</span>
                    <span className="prime-text serif">{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* slot inputs — annotator fills the template freely, primed by the sample above */}
          <div className="reel">
            {slots.map((s, i) => (
              <div key={i} className="reel-row">
                <div className="reel-key">
                  <span className="reel-num">{i + 1}</span>
                  <span className="reel-name mono">{s.name}</span>
                  {s.pos && <span className="reel-pos">{s.pos}</span>}
                </div>
                <div className="reel-main">
                  <input
                    className="field reel-input serif"
                    dir={rtl ? 'rtl' : 'ltr'}
                    value={fillers[s.name] ?? ''}
                    placeholder={s.name}
                    onChange={(e) => setSlot(s.name, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          </div>{/* /forge-cols */}

          {/* the minimal-pair card (signature) */}
          <div className={`mp-card ${flash ? 'accept-flash' : ''}`} style={{ marginTop: 18 }}>
            <div className="mp-alt mp-good">
              <div className="mp-flag">● grammatical</div>
              {highlight(good, tokens, rtl)}
            </div>
            <div className="mp-alt mp-bad">
              <div className="mp-flag">✗ ungrammatical</div>
              {highlight(bad, tokens, rtl)}
            </div>
            <div className="mp-actions">
              <button className="act-btn act-accept" onClick={() => commit('accepted')}><span>Accept</span><span className="act-key">↵</span></button>
              <button className="act-btn act-reject" onClick={() => commit('rejected')}><span>Reject</span><span className="act-key">R</span></button>
            </div>
          </div>

          <div className="faint" style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>
            <span className="kbd">space</span> fresh sample · <span className="kbd">↵</span> accept · <span className="kbd">R</span> reject.
            {hasBank(lang) ? ' Sentences above are priming only — write the pair in your own words.' : ' No corpus pool for this language yet — using the template fillers.'}
          </div>
        </>
      )}
    </div>
  )
}
