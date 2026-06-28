import React, { useEffect, useMemo, useState } from 'react'
import { store, ident } from '../../lib/store'
import type { MinimalPair, Phenomenon, Template } from '../../lib/types'
import { uid } from '../../lib/id'
import { Ring, Modal, Panel, Field } from '../../components/ui'
import { PERTURBATION_TYPES, perturbationHue } from '../../lib/perturbations'
import type { Perturbation } from '../../lib/types'

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

// expand a template into a candidate pair
function expand(tpl: Template, pick: number): { good: string; bad: string; tokens: string[]; fillers: Record<string, string> } {
  const fillers: Record<string, string> = {}
  tpl.slots.forEach((s) => { fillers[s.name] = s.fillers[pick % s.fillers.length] || s.fillers[0] || s.name })
  const fill = (pat: string) => pat.replace(/\{(\w+)\}/g, (_, k) => fillers[k] ?? `{${k}}`)
  const good = fill(tpl.grammatical)
  const bad = fill(tpl.ungrammatical).replace('*', '')
  const tokens = Object.values(fillers).filter(Boolean).slice(0, 2)
  return { good, bad, tokens, fillers }
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
  const cand = useMemo(() => tpl ? expand(tpl, seed) : null, [tpl, seed])
  const [flash, setFlash] = useState(false)
  const [editing, setEditing] = useState(false)
  const [eGood, setEGood] = useState(''); const [eBad, setEBad] = useState('')
  const [parseG, setParseG] = useState(''); const [parseB, setParseB] = useState(''); const [gloss, setGloss] = useState('')
  const [conll, setConll] = useState(''); const [featContrast, setFeatContrast] = useState(''); const [featBundle, setFeatBundle] = useState('')
  const [paradigm, setParadigm] = useState<'lexical' | 'featural'>('lexical')
  const [pert, setPert] = useState<Perturbation>({ type: 'agreement_flip', target: 'nsubj↔root', relation: '', depth: 0, description: '' })

  if (!tpl || !cand) {
    return <div className="empty"><div className="big">🃏</div>No template for this phenomenon yet. Build one in the Templates tab.</div>
  }

  const parseFeatures = (s: string): Record<string, string> => {
    const out: Record<string, string> = {}
    s.split(/[,;]/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
      const [k, v] = p.split('=').map((x) => x.trim()); if (k) out[k] = v ?? 'Yes'
    })
    return out
  }

  const commit = (status: MinimalPair['status'], good = cand.good, bad = cand.bad) => {
    const pair: MinimalPair = {
      ...ident(), id: uid(), language, phenomenon_id: phenId, template_id: tpl.id,
      sentence_good: good, sentence_bad: bad, contrast_tokens: cand.tokens,
      parse_good: parseG, parse_bad: parseB, gloss, conll,
      features: parseFeatures(featBundle), feature_contrast: featContrast, paradigm,
      perturbation: pert,
      fillers: cand.fillers, author: store.db.session.user, status, notes: '',
    }
    store.upsert('pairs', pair)
    if (status === 'accepted' || status === 'edited') { setFlash(true); setTimeout(() => setFlash(false), 400) }
    setParseG(''); setParseB(''); setGloss(''); setConll(''); setFeatContrast(''); setFeatBundle('')
    setSeed((s) => s + 1)
  }

  // keyboard A / E / R
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editing) return
      const k = e.key.toLowerCase()
      if (k === 'a') commit('accepted')
      else if (k === 'r') commit('rejected')
      else if (k === 'e') { setEGood(cand.good); setEBad(cand.bad); setEditing(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [cand, editing, parseG, parseB, gloss, conll, featContrast, featBundle, paradigm, pert])

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
          <div className="row" style={{ gap: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden' }}>
            <button className={`btn btn-sm ${paradigm === 'lexical' ? 'btn-accent' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => setParadigm('lexical')}>Lexical</button>
            <button className={`btn btn-sm ${paradigm === 'featural' ? 'btn-accent' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => setParadigm('featural')} title="Single-feature contrast for SAE / learning-dynamics analysis">Featural</button>
          </div>
        </div>
        <div className="row">
          <Ring pct={pct} label={`${accepted.length}`} />
          <div className="stack"><b style={{ fontSize: 13 }}>{accepted.length}/{target}</b><span className="faint" style={{ fontSize: 12 }}>accepted</span></div>
        </div>
      </div>

      <div className={`mp-card ${flash ? 'accept-flash' : ''}`}>
        <div className="mp-alt mp-good">
          <div className="mp-flag">● grammatical</div>
          {highlight(cand.good, cand.tokens, rtl)}
        </div>
        <div className="mp-alt mp-bad">
          <div className="mp-flag">✗ ungrammatical</div>
          {highlight(cand.bad, cand.tokens, rtl)}
        </div>
        <div className="mp-actions">
          <button className="act-btn act-accept" onClick={() => commit('accepted')}><span>Accept</span><span className="act-key">A</span></button>
          <button className="act-btn act-edit" onClick={() => { setEGood(cand.good); setEBad(cand.bad); setEditing(true) }}><span>Edit</span><span className="act-key">E</span></button>
          <button className="act-btn act-reject" onClick={() => commit('rejected')}><span>Reject</span><span className="act-key">R</span></button>
        </div>
      </div>

      {/* fine-grained syntactic perturbation */}
      <div style={{ marginTop: 16 }}>
        <Panel hue={perturbationHue(pert.type)} label="Fine-grained perturbation — how bad is derived from good">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {PERTURBATION_TYPES.map((t) => (
              <button key={t.id} className="tag" title={t.note}
                style={{ cursor: 'pointer', background: pert.type === t.id ? t.hue : t.hue + '18', color: pert.type === t.id ? '#fff' : t.hue, border: 'none' }}
                onClick={() => setPert({ ...pert, type: t.id, target: t.defaultTarget })}>{t.label}</button>
            ))}
          </div>
          <div className="grid grid-3" style={{ gap: 8 }}>
            <input className="field mono" style={{ fontSize: 12 }} placeholder="target node / relation" value={pert.target} onChange={(e) => setPert({ ...pert, target: e.target.value })} />
            <input className="field mono" style={{ fontSize: 12 }} placeholder="affected edge head→dep" value={pert.relation} onChange={(e) => setPert({ ...pert, relation: e.target.value })} />
            <input className="field mono" style={{ fontSize: 12 }} type="number" placeholder="embedding depth" value={pert.depth} onChange={(e) => setPert({ ...pert, depth: +e.target.value })} />
          </div>
          <input className="field" style={{ marginTop: 8, fontSize: 13 }} placeholder="Description of the structural edit…" value={pert.description} onChange={(e) => setPert({ ...pert, description: e.target.value })} />
        </Panel>
      </div>

      {/* annotation quality: pastel panels for Minimalist parses + gloss + CoNLL + features */}
      {paradigm === 'featural' && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <Panel hue="#185FA5" label="Contrastive feature (single-feature minimal pair)">
            <input className="field" style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              placeholder="Number — the one feature that flips good→bad" value={featContrast} onChange={(e) => setFeatContrast(e.target.value)} />
          </Panel>
          <Panel hue="#0F6E56" label="Feature bundle  (key=val, …)">
            <input className="field" style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
              placeholder="Number=Plur, Person=3, Definite=Yes" value={featBundle} onChange={(e) => setFeatBundle(e.target.value)} />
          </Panel>
        </div>
      )}
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Panel hue="#1D9E75" label="Minimalist parse — grammatical (Merge / X-bar)">
          <input className="field" style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            placeholder="[TP [T …] [vP [DP …] …]]" value={parseG} onChange={(e) => setParseG(e.target.value)} />
        </Panel>
        <Panel hue="#D85A30" label="Minimalist parse — ungrammatical (failed derivation)">
          <input className="field" style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            placeholder="[TP …] ✗ φ-Agree / feature checking fails" value={parseB} onChange={(e) => setParseB(e.target.value)} />
        </Panel>
      </div>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <Panel hue="#534AB7" label="Interlinear gloss">
          <input className="field" style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            placeholder="walk.PAST.3PL they to-the school — “They walked…”" value={gloss} onChange={(e) => setGloss(e.target.value)} />
        </Panel>
        <Panel hue="#993C1D" label="CoNLL-U dependency annotation">
          <textarea className="field" rows={2} style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 11.5, resize: 'vertical' }}
            placeholder={'1\tword\tlemma\tUPOS\t_\tfeats\thead\tdeprel'} value={conll} onChange={(e) => setConll(e.target.value)} />
        </Panel>
      </div>

      <div className="faint" style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>
        <span className="kbd">A</span> accept · <span className="kbd">E</span> edit · <span className="kbd">R</span> reject — contrast tokens glow amber.
        Minimalist parses, CoNLL-U & feature bundles raise annotation quality for grammar induction & acquisition models.
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
