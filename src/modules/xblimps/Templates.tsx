// Template Studio — author a construction ONCE: slots, surface patterns, reference-grammar
// citations, and the fine-grained Minimalist analysis (parse / perturbation / feature contrast /
// CoNLL-U / gloss schemas). A live derivation preview shows how one instantiation expands into a
// minimal pair plus its auto-derived CoNLL-U and featural contrast. Pair construction (Card flow)
// then just instantiates this — no re-typing of structure.

import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Template, Slot, Citation, TemplateStatus } from '../../lib/types'
import { uid } from '../../lib/id'
import { Panel } from '../../components/ui'
import { PERTURBATION_TYPES } from '../../lib/perturbations'
import { expandTemplate, deriveAnalysis } from '../../lib/derive'

const STATUS_HUE: Record<TemplateStatus, string> = {
  draft: '#7A5C2E', in_review: '#185FA5', validated: '#1D9E75', flagged: '#D85A30',
}

function Editor({ tpl }: { tpl: Template }) {
  const patch = (fields: Partial<Template>) => store.patch('templates', tpl.row_uid, fields as any)
  const patchAnalysis = (fields: Partial<Template['analysis']>) => patch({ analysis: { ...tpl.analysis, ...fields } })
  const updateSlot = (i: number, next: Slot) => { const slots = tpl.slots.map((s, j) => j === i ? next : s); patch({ slots }) }
  const addSlot = () => patch({ slots: [...tpl.slots, { name: 'SLOT' + (tpl.slots.length + 1), fillers: ['…'] }] })

  const [seed, setSeed] = useState(0)
  const exp = expandTemplate(tpl, seed)
  const der = deriveAnalysis(tpl, exp.fillers)

  const sources = store.db.sources
  const cited = new Set(tpl.citations.map((c) => c.source_id))
  const addCitation = (source_id: string) => patch({ citations: [...tpl.citations, { source_id, page: '', example: '', quote: '' }] })
  const updateCitation = (i: number, next: Citation) => patch({ citations: tpl.citations.map((c, j) => j === i ? next : c) })
  const removeCitation = (i: number) => patch({ citations: tpl.citations.filter((_, j) => j !== i) })

  const a = tpl.analysis
  const stHue = STATUS_HUE[tpl.validation.status]

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="between" style={{ marginBottom: 12 }}>
        <input className="field" style={{ fontWeight: 600, flex: 1, marginRight: 10 }} value={tpl.name} onChange={(e) => patch({ name: e.target.value })} />
        <span className="tag" style={{ background: stHue + '18', color: stHue, border: 'none', whiteSpace: 'nowrap' }}>{tpl.validation.status.replace('_', ' ')}</span>
      </div>

      {/* ── slots & fillers ── */}
      <div className="eyebrow" style={{ marginBottom: 8 }}>Slots & fillers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {tpl.slots.map((s, i) => (
          <div key={i} className="row">
            <input className="field mono" style={{ width: 130 }} value={s.name} onChange={(e) => updateSlot(i, { ...s, name: e.target.value.toUpperCase() })} />
            <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {s.fillers.map((fl, j) => (
                <span key={j} className="tag" style={{ background: 'var(--contrast-bg)', color: 'var(--contrast)', border: 'none' }}>
                  {fl}
                  <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={() => updateSlot(i, { ...s, fillers: s.fillers.filter((_, k) => k !== j) })}>✕</button>
                </span>
              ))}
              <input className="field" style={{ width: 120 }} placeholder="+ filler" onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                  updateSlot(i, { ...s, fillers: [...s.fillers, (e.target as HTMLInputElement).value] });
                  (e.target as HTMLInputElement).value = ''
                }
              }} />
            </div>
          </div>
        ))}
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addSlot}>+ Add slot</button>
      </div>

      {/* ── surface patterns ── */}
      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        <div>
          <label className="lbl" style={{ color: 'var(--good)' }}>Grammatical pattern</label>
          <input className="field mono" value={tpl.grammatical} onChange={(e) => patch({ grammatical: e.target.value })} />
        </div>
        <div>
          <label className="lbl" style={{ color: 'var(--bad)' }}>Ungrammatical pattern</label>
          <input className="field mono" value={tpl.ungrammatical} onChange={(e) => patch({ ungrammatical: e.target.value })} />
        </div>
      </div>
      <label className="lbl">Contrast specification</label>
      <input className="field" value={tpl.contrast} onChange={(e) => patch({ contrast: e.target.value })} />

      {/* ── reference grammars ── */}
      <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Reference grammars — port the literature in</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tpl.citations.map((c, i) => {
          const src = sources.find((s) => s.id === c.source_id)
          return (
            <Panel key={i} hue="#534AB7" label={src ? `${src.author.split(' and ')[0].split(',')[0]} (${src.year}) · ${src.citekey}` : 'unknown source'}>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <input className="field mono" style={{ width: 90, fontSize: 12 }} placeholder="page" value={c.page ?? ''} onChange={(e) => updateCitation(i, { ...c, page: e.target.value })} />
                <input className="field mono" style={{ width: 90, fontSize: 12 }} placeholder="example #" value={c.example ?? ''} onChange={(e) => updateCitation(i, { ...c, example: e.target.value })} />
                <input className="field" style={{ flex: 1, minWidth: 160, fontSize: 13 }} placeholder="quoted datum / judgment" value={c.quote ?? ''} onChange={(e) => updateCitation(i, { ...c, quote: e.target.value })} />
                <button className="btn btn-ghost btn-sm" onClick={() => removeCitation(i)}>✕</button>
              </div>
            </Panel>
          )
        })}
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <select className="field" style={{ width: 'auto' }} value="" onChange={(e) => { if (e.target.value) addCitation(e.target.value) }}>
            <option value="">+ cite a source…</option>
            {sources.filter((s) => !cited.has(s.id)).map((s) => (
              <option key={s.id} value={s.id}>{s.citekey} — {s.title}</option>
            ))}
          </select>
          <span className="faint" style={{ fontSize: 12 }}>Manage the library in the Syntax bench →</span>
        </div>
      </div>

      {/* ── fine-grained Minimalist analysis (authored once) ── */}
      <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Minimalist analysis — authored once, auto-derived per pair</div>

      <Panel hue="#1D9E75" label="Perturbation — how the ungrammatical alternant is derived">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {PERTURBATION_TYPES.map((t) => (
            <button key={t.id} className="tag" title={t.note}
              style={{ cursor: 'pointer', background: a.perturbation.type === t.id ? t.hue : t.hue + '18', color: a.perturbation.type === t.id ? '#fff' : t.hue, border: 'none' }}
              onClick={() => patchAnalysis({ perturbation: { ...a.perturbation, type: t.id, target: t.defaultTarget } })}>{t.label}</button>
          ))}
        </div>
        <div className="grid grid-3" style={{ gap: 8 }}>
          <input className="field mono" style={{ fontSize: 12 }} placeholder="target node / relation" value={a.perturbation.target} onChange={(e) => patchAnalysis({ perturbation: { ...a.perturbation, target: e.target.value } })} />
          <input className="field mono" style={{ fontSize: 12 }} placeholder="affected edge head→dep" value={a.perturbation.relation} onChange={(e) => patchAnalysis({ perturbation: { ...a.perturbation, relation: e.target.value } })} />
          <input className="field mono" style={{ fontSize: 12 }} type="number" placeholder="embedding depth" value={a.perturbation.depth} onChange={(e) => patchAnalysis({ perturbation: { ...a.perturbation, depth: +e.target.value } })} />
        </div>
        <input className="field" style={{ marginTop: 8, fontSize: 13 }} placeholder="Description of the structural edit…" value={a.perturbation.description} onChange={(e) => patchAnalysis({ perturbation: { ...a.perturbation, description: e.target.value } })} />
      </Panel>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <Panel hue="#1D9E75" label="Parse schema — grammatical (slot-keyed)">
          <textarea className="field mono" rows={2} style={{ background: 'transparent', border: 'none', fontSize: 12.5, resize: 'vertical' }} value={a.parse_good} onChange={(e) => patchAnalysis({ parse_good: e.target.value })} />
        </Panel>
        <Panel hue="#D85A30" label="Parse schema — ungrammatical (failed derivation)">
          <textarea className="field mono" rows={2} style={{ background: 'transparent', border: 'none', fontSize: 12.5, resize: 'vertical' }} value={a.parse_bad} onChange={(e) => patchAnalysis({ parse_bad: e.target.value })} />
        </Panel>
      </div>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <Panel hue="#185FA5" label="Featural contrast — single feature that flips">
          <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} placeholder="Number" value={a.feature_contrast} onChange={(e) => patchAnalysis({ feature_contrast: e.target.value })} />
          <div className="row" style={{ marginTop: 8, gap: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            {(['lexical', 'featural'] as const).map((p) => (
              <button key={p} className={`btn btn-sm ${a.paradigm === p ? 'btn-accent' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => patchAnalysis({ paradigm: p })}>{p}</button>
            ))}
          </div>
        </Panel>
        <Panel hue="#0F6E56" label="Feature bundle schema (key=val, slot-keyed)">
          <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }}
            placeholder="Number=Plur, Person=3"
            value={Object.entries(a.feature_schema).map(([k, v]) => `${k}=${v}`).join(', ')}
            onChange={(e) => {
              const fs: Record<string, string> = {}
              e.target.value.split(/[,;]/).map((p) => p.trim()).filter(Boolean).forEach((p) => { const [k, v] = p.split('=').map((x) => x.trim()); if (k) fs[k] = v ?? 'Yes' })
              patchAnalysis({ feature_schema: fs })
            }} />
        </Panel>
      </div>

      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <Panel hue="#534AB7" label="Gloss schema (slot-keyed)">
          <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} value={a.gloss_schema} onChange={(e) => patchAnalysis({ gloss_schema: e.target.value })} />
        </Panel>
        <Panel hue="#993C1D" label="CoNLL-U schema (FORM column uses {SLOT})">
          <textarea className="field mono" rows={3} style={{ background: 'transparent', border: 'none', fontSize: 11.5, resize: 'vertical' }} value={a.conll_schema} onChange={(e) => patchAnalysis({ conll_schema: e.target.value })} />
        </Panel>
      </div>

      {/* ── live derivation preview ── */}
      <div className="between" style={{ margin: '18px 0 8px' }}>
        <div className="eyebrow">Live derivation preview</div>
        <button className="btn btn-sm" onClick={() => setSeed((s) => s + 1)}>↻ next instantiation</button>
      </div>
      <div className="grid grid-2">
        <Panel hue="#1D9E75" label="grammatical"><span className="serif" style={{ fontSize: 16 }}>{exp.good}</span></Panel>
        <Panel hue="#D85A30" label="ungrammatical"><span className="serif" style={{ fontSize: 16 }}>{exp.bad}</span></Panel>
      </div>
      <div className="grid grid-2" style={{ marginTop: 10 }}>
        <Panel hue="#185FA5" label={`derived featural contrast · ${der.paradigm}`}>
          <div className="mono" style={{ fontSize: 12 }}>
            <b>{der.feature_contrast || '—'}</b> flips · {Object.entries(der.features).map(([k, v]) => `${k}=${v}`).join(' | ') || '—'}
          </div>
        </Panel>
        <Panel hue="#993C1D" label="derived CoNLL-U">
          <pre className="mono" style={{ fontSize: 10.5, margin: 0, whiteSpace: 'pre-wrap' }}>{der.conll}</pre>
        </Panel>
      </div>
    </div>
  )
}

export default function Templates({ language }: { language: string }) {
  const phen = store.db.phenomena.filter((p) => p.language === language)
  const [phenId, setPhenId] = useState(phen[0]?.id ?? '')
  const templates = store.db.templates.filter((t) => t.language === language && t.phenomenon_id === phenId)

  const add = () => {
    const t: Template = {
      ...ident(), id: 'tpl.' + uid().slice(0, 6), phenomenon_id: phenId, language,
      name: 'New template', slots: [{ name: 'SUBJ', fillers: ['…'] }, { name: 'VERB', fillers: ['…'] }],
      grammatical: '{SUBJ} {VERB}.', ungrammatical: '{SUBJ} {VERB}*.', contrast: '',
      citations: [],
      analysis: {
        parse_good: '[TP [DP {SUBJ}] [T {VERB}]]', parse_bad: '[TP [DP {SUBJ}] [T {VERB}]] ✗ feature checking fails',
        perturbation: { type: 'agreement_flip', target: 'nsubj↔root', relation: '', depth: 0, description: '' },
        paradigm: 'featural', feature_schema: {}, feature_contrast: '',
        conll_schema: '1\t{SUBJ}\t_\t_\t_\t_\t2\tnsubj\n2\t{VERB}\t_\t_\t_\t_\t0\troot',
        gloss_schema: '{SUBJ} {VERB} — “…”',
      },
      validation: { status: 'draft', comments: [] },
    }
    store.upsert('templates', t)
  }

  return (
    <div>
      <div className="between" style={{ marginBottom: 16 }}>
        <select className="field" style={{ width: 'auto' }} value={phenId} onChange={(e) => setPhenId(e.target.value)}>
          {phen.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button className="btn btn-primary" onClick={add}>+ New template</button>
      </div>
      {templates.map((t) => <Editor key={t.row_uid} tpl={t} />)}
      {templates.length === 0 && <div className="empty"><div className="big">🧩</div>No template yet for this phenomenon.</div>}
    </div>
  )
}
