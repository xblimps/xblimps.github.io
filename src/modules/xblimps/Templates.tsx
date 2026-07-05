// Template Studio — the unified annotation interface. A template is one horizontal frame: all
// slots side by side, the surface minimal pair, an English translation, and ONE canonical
// "primary annotation" (labelled bracketing). The tree / bracketed / template-with-worked-examples
// views are all AUTO-DERIVED from that primary annotation via a toggle. Richer tiers (UD, Penn,
// gloss, features, perturbation, extra layers) live under an Advanced section. Card flow instantiates.

import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Template, Slot, Citation, TemplateStatus, AnnotationLayer, AnnotationLayerKind } from '../../lib/types'
import { uid } from '../../lib/id'
import { Panel } from '../../components/ui'
import SyntaxTree from '../../components/SyntaxTree'
import { parseBracketTree, serializeIndented } from '../../lib/tree'
import { PERTURBATION_TYPES } from '../../lib/perturbations'
import { expandTemplate, deriveAnalysis, fill } from '../../lib/derive'

const STATUS_HUE: Record<TemplateStatus, string> = {
  draft: '#7A5C2E', in_review: '#185FA5', validated: '#1D9E75', flagged: '#D85A30',
}

const MIN_SNIPPETS = ['[CP ]', '[C′ ]', '[TP ]', '[T′ ]', '[vP ]', '[VP ]', '[DP ]', '[NP ]', '[PP ]', '[uφ]', '[iφ]', '[EPP]', '[uCase]', '⟨t⟩', '✗']
const PENN_SNIPPETS = ['(S )', '(NP )', '(VP )', '(PP )', '(DT )', '(NN )', '(VBZ )', '(IN )']

const KIND_META: Record<AnnotationLayerKind, { label: string; tree: boolean; hue: string }> = {
  minimalist: { label: 'Minimalist tree', tree: true, hue: '#534AB7' },
  penn: { label: 'Penn Treebank', tree: true, hue: '#7A5C2E' },
  ud: { label: 'UD / CoNLL-U', tree: false, hue: '#993C1D' },
  gloss: { label: 'Interlinear gloss', tree: false, hue: '#0F6E56' },
  morphology: { label: 'Morphology', tree: false, hue: '#185FA5' },
  semantics: { label: 'Semantics / LF', tree: false, hue: '#A23E5C' },
  prosody: { label: 'Prosody / info-structure', tree: false, hue: '#BA7517' },
  custom: { label: 'Custom layer', tree: false, hue: '#555' },
}

type View = 'tree' | 'brackets' | 'template'

// the three derived views of the primary annotation
function DerivedView({ view, primary, tpl }: { view: View; primary: string; tpl: Template }) {
  if (view === 'tree') return <SyntaxTree source={primary} />

  if (view === 'brackets') {
    const root = parseBracketTree(primary)
    if (!root) return <div className="faint" style={{ fontSize: 12.5 }}>Type the primary annotation to derive bracketed structure.</div>
    return <pre className="mono" style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>{serializeIndented(root)}</pre>
  }

  // template view — worked examples derived by instantiating the template
  const examples = [0, 1, 2].map((k) => {
    const exp = expandTemplate(tpl, k)
    return { good: exp.good, bad: exp.bad, en: fill(tpl.analysis.translation_schema ?? '', exp.fillers) }
  })
  return (
    <div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {tpl.slots.map((s) => (
          <span key={s.name} className="tag" style={{ background: 'var(--hair-2)', border: '1px solid var(--hair)', color: 'var(--ink-soft)' }}>
            {s.name} · {s.fillers.length} option{s.fillers.length !== 1 ? 's' : ''}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {examples.map((e, i) => (
          <div key={i} className="card" style={{ padding: 12 }}>
            <div className="serif" style={{ fontSize: 15, color: 'var(--good)' }}>✓ {e.good}</div>
            {e.en && <div className="faint" style={{ fontSize: 12.5, margin: '2px 0' }}>↳ {e.en}</div>}
            <div className="serif" style={{ fontSize: 14, color: 'var(--bad)' }}>✗ {e.bad}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LayerRow({ layer, onChange, onRemove }: { layer: AnnotationLayer; onChange: (l: AnnotationLayer) => void; onRemove: () => void }) {
  const meta = KIND_META[layer.kind]
  return (
    <Panel hue={layer.approved ? '#1D9E75' : meta.hue} label={`${meta.label}${layer.approved ? ' · approved ✓' : ''}`}>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <select className="field" style={{ width: 'auto', fontSize: 12.5 }} value={layer.kind} onChange={(e) => onChange({ ...layer, kind: e.target.value as AnnotationLayerKind })}>
          {Object.entries(KIND_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <input className="field" style={{ flex: 1, minWidth: 120, fontSize: 12.5 }} placeholder="layer label" value={layer.label} onChange={(e) => onChange({ ...layer, label: e.target.value })} />
        <label className="row" style={{ gap: 4, fontSize: 12.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!layer.approved} onChange={(e) => onChange({ ...layer, approved: e.target.checked })} /> approve
        </label>
        <button className="btn btn-ghost btn-sm" onClick={onRemove}>✕</button>
      </div>
      <textarea className="field mono" rows={meta.tree ? 2 : 3} style={{ fontSize: 12, resize: 'vertical' }} value={layer.content} onChange={(e) => onChange({ ...layer, content: e.target.value })} />
      {meta.tree && layer.content.trim() && <div className="tree-box" style={{ marginTop: 8 }}><SyntaxTree source={layer.content} hue={meta.hue} /></div>}
    </Panel>
  )
}

function Editor({ tpl }: { tpl: Template }) {
  const patch = (fields: Partial<Template>) => store.patch('templates', tpl.row_uid, fields as any)
  const patchAnalysis = (fields: Partial<Template['analysis']>) => patch({ analysis: { ...tpl.analysis, ...fields } })
  const updateSlot = (i: number, next: Slot) => { const slots = tpl.slots.map((s, j) => j === i ? next : s); patch({ slots }) }
  const removeSlot = (i: number) => patch({ slots: tpl.slots.filter((_, j) => j !== i) })
  const addSlot = () => patch({ slots: [...tpl.slots, { name: 'SLOT' + (tpl.slots.length + 1), fillers: ['…'] }] })

  const [view, setView] = useState<View>('tree')
  const a = tpl.analysis
  const layers = a.layers ?? []
  const addLayer = (kind: AnnotationLayerKind) => patchAnalysis({ layers: [...layers, { id: uid(), kind, label: KIND_META[kind].label, content: '', variant: 'both', approved: false }] })
  const updateLayer = (id: string, next: AnnotationLayer) => patchAnalysis({ layers: layers.map((l) => l.id === id ? next : l) })
  const removeLayer = (id: string) => patchAnalysis({ layers: layers.filter((l) => l.id !== id) })

  const stHue = STATUS_HUE[tpl.validation.status]
  const sources = store.db.sources
  const cited = new Set(tpl.citations.map((c) => c.source_id))
  const addCitation = (source_id: string) => patch({ citations: [...tpl.citations, { source_id, page: '', example: '', quote: '' }] })

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <input className="field" style={{ fontWeight: 600, flex: 1, marginRight: 10 }} value={tpl.name} onChange={(e) => patch({ name: e.target.value })} />
        <span className="tag" style={{ background: stHue + '18', color: stHue, border: 'none', whiteSpace: 'nowrap' }}>{tpl.validation.status.replace('_', ' ')}</span>
      </div>

      {/* ── horizontal slot frame: all slots at once ── */}
      <div className="eyebrow" style={{ margin: '12px 0 8px' }}>Slots — all variable positions at a glance</div>
      <div className="slot-frame">
        {tpl.slots.map((s, i) => (
          <div key={i} className="slot-col">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <input className="field mono" style={{ width: 96, fontSize: 12, padding: '4px 6px' }} value={s.name} onChange={(e) => updateSlot(i, { ...s, name: e.target.value.toUpperCase() })} />
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => removeSlot(i)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {s.fillers.map((fl, j) => (
                <span key={j} className="tag" style={{ background: 'var(--contrast-bg)', color: 'var(--contrast)', border: 'none', justifyContent: 'space-between' }}>
                  {fl}
                  <button className="btn btn-ghost" style={{ padding: 0, fontSize: 11 }} onClick={() => updateSlot(i, { ...s, fillers: s.fillers.filter((_, k) => k !== j) })}>✕</button>
                </span>
              ))}
              <input className="field" style={{ fontSize: 12, padding: '4px 6px' }} placeholder="+ option" onKeyDown={(e) => {
                const v = (e.target as HTMLInputElement).value
                if (e.key === 'Enter' && v) { updateSlot(i, { ...s, fillers: [...s.fillers, v] }); (e.target as HTMLInputElement).value = '' }
              }} />
            </div>
          </div>
        ))}
        <button className="slot-add" onClick={addSlot}>＋<br />slot</button>
      </div>

      {/* ── surface forms + translation ── */}
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div>
          <label className="lbl" style={{ color: 'var(--good)' }}>Grammatical</label>
          <input className="field mono" value={tpl.grammatical} onChange={(e) => patch({ grammatical: e.target.value })} />
        </div>
        <div>
          <label className="lbl" style={{ color: 'var(--bad)' }}>Ungrammatical</label>
          <input className="field mono" value={tpl.ungrammatical} onChange={(e) => patch({ ungrammatical: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 8 }}>
        <div>
          <label className="lbl">Contrast specification</label>
          <input className="field" value={tpl.contrast} onChange={(e) => patch({ contrast: e.target.value })} placeholder="the single thing that differs" />
        </div>
        <div>
          <label className="lbl" style={{ color: '#0F6E56' }}>English translation (slot-keyed)</label>
          <input className="field" value={a.translation_schema ?? ''} onChange={(e) => patchAnalysis({ translation_schema: e.target.value })} placeholder="The children walked to {GOAL}." />
        </div>
      </div>

      {/* ── primary annotation + derived views ── */}
      <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Primary annotation — canonical structure (everything below derives from this)</div>
      <textarea className="field mono" rows={2} style={{ fontSize: 12.5, resize: 'vertical' }} value={a.parse_good} onChange={(e) => patchAnalysis({ parse_good: e.target.value })} />
      <div className="row" style={{ gap: 4, flexWrap: 'wrap', margin: '6px 0' }}>
        {MIN_SNIPPETS.map((s) => <button key={s} className="chip-insert" onClick={() => patchAnalysis({ parse_good: (a.parse_good ? a.parse_good + ' ' : '') + s })}>{s}</button>)}
      </div>

      <div className="row" style={{ gap: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden', width: 'fit-content', margin: '8px 0' }}>
        {(['tree', 'brackets', 'template'] as View[]).map((v) => (
          <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => setView(v)}>
            {v === 'tree' ? 'Syntactic tree' : v === 'brackets' ? 'Bracketed' : 'Template + examples'}
          </button>
        ))}
      </div>
      <div className="tree-box"><DerivedView view={view} primary={a.parse_good} tpl={tpl} /></div>

      {/* ── advanced annotation (optional richer tiers) ── */}
      <details className="adv-block" style={{ marginTop: 16 }}>
        <summary>Advanced annotation — UD / Penn / gloss / features / perturbation / extra layers</summary>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <Panel hue="#D85A30" label="Ungrammatical derivation (failed)">
            <textarea className="field mono" rows={2} style={{ background: 'transparent', border: 'none', fontSize: 12, resize: 'vertical' }} value={a.parse_bad} onChange={(e) => patchAnalysis({ parse_bad: e.target.value })} />
          </Panel>
          <Panel hue="#993C1D" label="Universal Dependencies (CoNLL-U)">
            <textarea className="field mono" rows={2} style={{ background: 'transparent', border: 'none', fontSize: 11.5, resize: 'vertical' }} value={a.conll_schema} onChange={(e) => patchAnalysis({ conll_schema: e.target.value })} />
          </Panel>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="lbl" style={{ color: '#7A5C2E' }}>Penn Treebank</label>
          <textarea className="field mono" rows={2} style={{ fontSize: 12, resize: 'vertical' }} value={a.penn ?? ''} onChange={(e) => patchAnalysis({ penn: e.target.value })} />
          {(a.penn ?? '').trim() && <div className="tree-box" style={{ marginTop: 6 }}><SyntaxTree source={a.penn ?? ''} hue="#7A5C2E" /></div>}
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <Panel hue="#534AB7" label="Gloss schema">
            <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} value={a.gloss_schema} onChange={(e) => patchAnalysis({ gloss_schema: e.target.value })} />
          </Panel>
          <Panel hue="#185FA5" label="Featural contrast">
            <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} placeholder="Number" value={a.feature_contrast} onChange={(e) => patchAnalysis({ feature_contrast: e.target.value })} />
            <div className="row" style={{ marginTop: 8, gap: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
              {(['lexical', 'featural'] as const).map((p) => (
                <button key={p} className={`btn btn-sm ${a.paradigm === p ? 'btn-accent' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => patchAnalysis({ paradigm: p })}>{p}</button>
              ))}
            </div>
          </Panel>
        </div>

        <Panel hue="#0F6E56" label="Feature bundle schema (key=val)">
          <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} placeholder="Number=Plur, Person=3"
            value={Object.entries(a.feature_schema).map(([k, v]) => `${k}=${v}`).join(', ')}
            onChange={(e) => {
              const fs: Record<string, string> = {}
              e.target.value.split(/[,;]/).map((p) => p.trim()).filter(Boolean).forEach((p) => { const [k, v] = p.split('=').map((x) => x.trim()); if (k) fs[k] = v ?? 'Yes' })
              patchAnalysis({ feature_schema: fs })
            }} />
        </Panel>

        <Panel hue="#1D9E75" label="Perturbation — how the ungrammatical alternant is derived">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {PERTURBATION_TYPES.map((t) => (
              <button key={t.id} className="tag" title={t.note}
                style={{ cursor: 'pointer', background: a.perturbation.type === t.id ? t.hue : t.hue + '18', color: a.perturbation.type === t.id ? '#fff' : t.hue, border: 'none' }}
                onClick={() => patchAnalysis({ perturbation: { ...a.perturbation, type: t.id, target: t.defaultTarget } })}>{t.label}</button>
            ))}
          </div>
          <input className="field" style={{ fontSize: 13 }} placeholder="Description of the structural edit…" value={a.perturbation.description} onChange={(e) => patchAnalysis({ perturbation: { ...a.perturbation, description: e.target.value } })} />
        </Panel>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Annotation layers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {layers.map((l) => <LayerRow key={l.id} layer={l} onChange={(next) => updateLayer(l.id, next)} onRemove={() => removeLayer(l.id)} />)}
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: layers.length ? 10 : 0 }}>
          <span className="faint" style={{ fontSize: 12.5 }}>+ add layer:</span>
          {(['minimalist', 'penn', 'ud', 'gloss', 'morphology', 'semantics', 'prosody', 'custom'] as AnnotationLayerKind[]).map((k) => (
            <button key={k} className="chip-insert" onClick={() => addLayer(k)}>{KIND_META[k].label}</button>
          ))}
        </div>

        <div className="eyebrow" style={{ margin: '14px 0 8px' }}>Reference grammars</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tpl.citations.map((c, i) => {
            const src = sources.find((s) => s.id === c.source_id)
            return (
              <Panel key={i} hue="#534AB7" label={src ? `${src.author.split(' and ')[0].split(',')[0]} (${src.year})` : 'unknown source'}>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <input className="field" style={{ flex: 1, minWidth: 160, fontSize: 13 }} placeholder="quoted datum / judgment" value={c.quote ?? ''}
                    onChange={(e) => patch({ citations: tpl.citations.map((x, j) => j === i ? { ...x, quote: e.target.value } : x) })} />
                  <button className="btn btn-ghost btn-sm" onClick={() => patch({ citations: tpl.citations.filter((_, j) => j !== i) })}>✕</button>
                </div>
              </Panel>
            )
          })}
          <select className="field" style={{ width: 'auto' }} value="" onChange={(e) => { if (e.target.value) addCitation(e.target.value) }}>
            <option value="">+ cite a source…</option>
            {sources.filter((s) => !cited.has(s.id)).map((s) => <option key={s.id} value={s.id}>{s.citekey} — {s.title}</option>)}
          </select>
        </div>
      </details>
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
        parse_good: '[TP [DP {SUBJ}] [T′ [T {VERB}] [vP ⟨{SUBJ}⟩ ⟨{VERB}⟩]]]',
        parse_bad: '[TP [DP {SUBJ}] [T′ [T {VERB}] [vP …]]] ✗ φ-feature checking fails',
        perturbation: { type: 'agreement_flip', target: 'nsubj↔root', relation: '', depth: 0, description: '' },
        paradigm: 'featural', feature_schema: {}, feature_contrast: '',
        conll_schema: '1\t{SUBJ}\t_\t_\t_\t_\t2\tnsubj\n2\t{VERB}\t_\t_\t_\t_\t0\troot',
        gloss_schema: '{SUBJ} {VERB} — “…”',
        translation_schema: '',
        penn: '(S (NP {SUBJ}) (VP {VERB}))',
        layers: [],
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
