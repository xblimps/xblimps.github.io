// Card flow — pair CONSTRUCTION. A template is instantiated and its full analysis (parse,
// CoNLL-U, gloss, feature contrast, perturbation) is auto-derived from the template's authored
// schemas. The annotator's job is fast judgment: Accept / Edit / Reject + a naturalness rating.
// The derived analysis is shown read-only; an "override" affordance lets a specific instance
// hand-edit a field when needed (recorded in `overrides` so it isn't a template-wide change).

import React, { useEffect, useMemo, useState } from 'react'
import { store, ident } from '../../lib/store'
import type { MinimalPair, Template } from '../../lib/types'
import { uid } from '../../lib/id'
import { Ring, Modal, Panel, Field } from '../../components/ui'
import { perturbationHue, perturbationLabel } from '../../lib/perturbations'
import { expandTemplate, derivePair } from '../../lib/derive'

const RTL = new Set(['fa'])

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

export default function CardFlow({ language }: { language: string }) {
  const phen = store.db.phenomena.filter((p) => p.language === language)
  const [phenId, setPhenId] = useState(phen.find((p) => p.status === 'active')?.id ?? phen[0]?.id ?? '')
  const templates = store.db.templates.filter((t) => t.language === language && t.phenomenon_id === phenId)
  const [tplId, setTplId] = useState(templates[0]?.id ?? '')
  useEffect(() => { setTplId(templates[0]?.id ?? '') }, [phenId])
  const tpl = templates.find((t) => t.id === tplId)

  const phenObj = phen.find((p) => p.id === phenId)
  const target = phenObj?.target ?? 100
  const accepted = store.db.pairs.filter((p) => p.phenomenon_id === phenId && ['accepted', 'edited', 'validated'].includes(p.status))
  const pct = (accepted.length / target) * 100
  const rtl = RTL.has(language)

  const [seed, setSeed] = useState(0)
  const [flash, setFlash] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eGood, setEGood] = useState(''); const [eBad, setEBad] = useState('')
  const [naturalness, setNaturalness] = useState(0)
  const [showAnalysis, setShowAnalysis] = useState(true)
  // per-instance overrides of derived analysis fields
  const [over, setOver] = useState<Partial<Pick<MinimalPair, 'parse_good' | 'parse_bad' | 'gloss' | 'conll' | 'feature_contrast' | 'translation'>>>({})

  // derived snapshot for the current instantiation (template analysis + fillers)
  const derived = useMemo(() => tpl ? derivePair(tpl, expandTemplate(tpl, seed)) : null, [tpl, seed])

  if (!tpl || !derived) {
    return <div className="empty"><div className="big">🃏</div>No template for this phenomenon yet. Author one in Template Studio.</div>
  }

  // effective analysis = derived ⊕ overrides
  const eff = { ...derived, ...over }
  const overrides = Object.keys(over)

  const resetCard = () => { setOver({}); setNaturalness(0); setSeed((s) => s + 1) }

  const commit = (status: MinimalPair['status'], good = eff.sentence_good, bad = eff.sentence_bad) => {
    const pair: MinimalPair = {
      ...ident(), id: uid(), language, phenomenon_id: phenId, template_id: tpl.id,
      sentence_good: good, sentence_bad: bad, contrast_tokens: eff.contrast_tokens,
      parse_good: eff.parse_good, parse_bad: eff.parse_bad, gloss: eff.gloss, conll: eff.conll,
      features: eff.features, feature_contrast: eff.feature_contrast, paradigm: eff.paradigm,
      perturbation: eff.perturbation, translation: eff.translation, fillers: eff.fillers,
      overrides: overrides.length ? overrides : undefined,
      author: store.db.session.user, status,
      naturalness_score: naturalness || undefined, notes: '',
    }
    store.upsert('pairs', pair)
    if (status === 'accepted' || status === 'edited') { setFlash(true); setTimeout(() => setFlash(false), 400) }
    resetCard()
  }

  // keyboard A / E / R
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editing) return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (k === 'a') commit('accepted')
      else if (k === 'r') commit('rejected')
      else if (k === 'e') { setEGood(eff.sentence_good); setEBad(eff.sentence_bad); setEditing(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [derived, over, editing, naturalness])

  const phue = perturbationHue(eff.perturbation.type)

  return (
    <div className="cardflow">
      <div className="between" style={{ marginBottom: 18 }}>
        <div className="row">
          <select className="field" style={{ width: 'auto' }} value={phenId} onChange={(e) => setPhenId(e.target.value)}>
            {phen.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {templates.length > 1 && (
            <select className="field" style={{ width: 'auto' }} value={tplId} onChange={(e) => setTplId(e.target.value)}>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <span className="tag" style={{ background: phue + '18', color: phue, border: 'none' }} title={eff.perturbation.description}>
            {perturbationLabel(eff.perturbation.type)} · {eff.paradigm}
          </span>
        </div>
        <div className="row">
          <Ring pct={pct} label={`${accepted.length}`} />
          <div className="stack"><b style={{ fontSize: 13 }}>{accepted.length}/{target}</b><span className="faint" style={{ fontSize: 12 }}>accepted</span></div>
        </div>
      </div>

      <div className={`mp-card ${flash ? 'accept-flash' : ''}`}>
        <div className="mp-alt mp-good">
          <div className="mp-flag">● grammatical</div>
          {highlight(eff.sentence_good, eff.contrast_tokens, rtl)}
        </div>
        <div className="mp-alt mp-bad">
          <div className="mp-flag">✗ ungrammatical</div>
          {highlight(eff.sentence_bad, eff.contrast_tokens, rtl)}
        </div>
        <div className="mp-actions">
          <button className="act-btn act-accept" onClick={() => commit('accepted')}><span>Accept</span><span className="act-key">A</span></button>
          <button className="act-btn act-edit" onClick={() => { setEGood(eff.sentence_good); setEBad(eff.sentence_bad); setEditing(true) }}><span>Edit</span><span className="act-key">E</span></button>
          <button className="act-btn act-reject" onClick={() => commit('rejected')}><span>Reject</span><span className="act-key">R</span></button>
        </div>
      </div>

      {/* English translation — collected for every correct sentence (cross-linguistic access) */}
      <div style={{ marginTop: 14 }}>
        <Panel hue="#0F6E56" label="English translation — of the grammatical sentence">
          <input className="field" dir="ltr"
            style={{ background: over.translation != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 14 }}
            placeholder="Natural English translation…"
            value={eff.translation} onChange={(e) => setOver({ ...over, translation: e.target.value })} />
        </Panel>
      </div>

      {/* naturalness rating */}
      <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 14 }}>
        <span className="faint" style={{ fontSize: 12.5 }}>Naturalness</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={`btn btn-sm ${naturalness >= n ? 'btn-accent' : 'btn-ghost'}`} style={{ minWidth: 30 }} onClick={() => setNaturalness(n === naturalness ? 0 : n)}>{n}</button>
        ))}
      </div>

      {/* auto-derived analysis (read-only, overridable) */}
      <div className="between" style={{ margin: '18px 0 8px' }}>
        <div className="eyebrow">Analysis — auto-derived from template{overrides.length ? ` · ${overrides.length} override${overrides.length > 1 ? 's' : ''}` : ''}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowAnalysis((v) => !v)}>{showAnalysis ? 'Hide' : 'Show'}</button>
      </div>

      {showAnalysis && (
        <>
          <div className="grid grid-2">
            <Panel hue="#1D9E75" label="Minimalist parse — grammatical">
              <input className="field mono" style={{ background: over.parse_good != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 12.5 }}
                value={eff.parse_good} onChange={(e) => setOver({ ...over, parse_good: e.target.value })} />
            </Panel>
            <Panel hue="#D85A30" label="Minimalist parse — ungrammatical">
              <input className="field mono" style={{ background: over.parse_bad != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 12.5 }}
                value={eff.parse_bad} onChange={(e) => setOver({ ...over, parse_bad: e.target.value })} />
            </Panel>
          </div>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <Panel hue="#534AB7" label="Interlinear gloss">
              <input className="field mono" style={{ background: over.gloss != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 12.5 }}
                value={eff.gloss} onChange={(e) => setOver({ ...over, gloss: e.target.value })} />
            </Panel>
            <Panel hue="#185FA5" label={`Featural contrast · ${eff.paradigm}`}>
              <div className="mono" style={{ fontSize: 12 }}>
                <input className="field mono" style={{ background: over.feature_contrast != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 12.5, marginBottom: 4 }}
                  value={eff.feature_contrast} onChange={(e) => setOver({ ...over, feature_contrast: e.target.value })} />
                <span className="faint">{Object.entries(eff.features).map(([k, v]) => `${k}=${v}`).join(' | ') || '—'}</span>
              </div>
            </Panel>
          </div>
          <div style={{ marginTop: 12 }}>
            <Panel hue="#993C1D" label="CoNLL-U dependency annotation">
              <textarea className="field mono" rows={3} style={{ background: over.conll != null ? 'var(--contrast-bg)' : 'transparent', border: 'none', fontSize: 11.5, resize: 'vertical' }}
                value={eff.conll} onChange={(e) => setOver({ ...over, conll: e.target.value })} />
            </Panel>
          </div>
        </>
      )}

      <div className="faint" style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>
        <span className="kbd">A</span> accept · <span className="kbd">E</span> edit · <span className="kbd">R</span> reject — analysis is derived from the template; edit a field to override it for this instance only.
      </div>

      {editing && (
        <Modal title="Edit candidate" sub="Touch only the filler/token under contrast" onClose={() => setEditing(false)}>
          <Field label="Grammatical" value={eGood} onChange={setEGood} />
          <Field label="Ungrammatical" value={eBad} onChange={setEBad} />
          <div style={{ marginTop: 18, textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={() => { commit('edited', eGood, eBad); setEditing(false) }}>Save & accept</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
