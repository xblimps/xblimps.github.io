// Template Studio — author a construction ONCE: slots, surface patterns, reference-grammar
// citations, and a scaffolded, multi-layer syntactic analysis. The flow walks the syntactician
// through numbered steps: slots → surface forms → Minimalist tree (live render) → Universal
// Dependencies → Penn Treebank → gloss & features → perturbation → any number of extra annotation
// layers. A live derivation preview shows how one instantiation expands. Card flow just instantiates.

import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Template, Slot, Citation, TemplateStatus, AnnotationLayer, AnnotationLayerKind } from '../../lib/types'
import { uid } from '../../lib/id'
import { Panel } from '../../components/ui'
import SyntaxTree from '../../components/SyntaxTree'
import { PERTURBATION_TYPES } from '../../lib/perturbations'
import { expandTemplate, deriveAnalysis } from '../../lib/derive'

const STATUS_HUE: Record<TemplateStatus, string> = {
  draft: '#7A5C2E', in_review: '#185FA5', validated: '#1D9E75', flagged: '#D85A30',
}

const MIN_SNIPPETS = ['[CP ]', '[C′ ]', '[TP ]', '[T′ ]', '[vP ]', '[VP ]', '[DP ]', '[NP ]', '[PP ]', '[uφ]', '[iφ]', '[EPP]', '[uCase]', '⟨t⟩', '✗']
const PENN_SNIPPETS = ['(S )', '(NP )', '(VP )', '(PP )', '(DT )', '(NN )', '(VBZ )', '(IN )']

const KIND_META: Record<AnnotationLayerKind, { label: string; tree: boolean; hue: string; hint: string }> = {
  minimalist: { label: 'Minimalist tree', tree: true, hue: '#534AB7', hint: 'Labelled bracketing — Merge / X-bar, features, movement' },
  penn: { label: 'Penn Treebank', tree: true, hue: '#7A5C2E', hint: 'Phrase-structure parens, e.g. (S (NP …) (VP …))' },
  ud: { label: 'UD / CoNLL-U', tree: false, hue: '#993C1D', hint: 'Universal Dependencies — 10-column CoNLL-U' },
  gloss: { label: 'Interlinear gloss', tree: false, hue: '#0F6E56', hint: 'Leipzig morpheme gloss' },
  morphology: { label: 'Morphology', tree: false, hue: '#185FA5', hint: 'Segmentation / morphological features' },
  semantics: { label: 'Semantics / LF', tree: false, hue: '#A23E5C', hint: 'Logical form / event semantics' },
  prosody: { label: 'Prosody / info-structure', tree: false, hue: '#BA7517', hint: 'Prosodic phrasing, focus / topic' },
  custom: { label: 'Custom layer', tree: false, hue: '#555', hint: 'Any other annotation tier' },
}

function Step({ n, title, hint, children }: { n: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="tpl-step">
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <span className="step-n">{n}</span>
        <div className="eyebrow" style={{ margin: 0 }}>{title}</div>
      </div>
      {hint && <div className="faint" style={{ fontSize: 12, margin: '3px 0 10px 32px' }}>{hint}</div>}
      <div style={{ marginTop: hint ? 0 : 10 }}>{children}</div>
    </div>
  )
}

// label + bracket textarea + quick-insert chips + live tree
function TreeField({ label, hue, value, onChange, snippets }: { label: string; hue: string; value: string; onChange: (v: string) => void; snippets: string[] }) {
  return (
    <div>
      <label className="lbl" style={{ color: hue }}>{label}</label>
      <textarea className="field mono" rows={2} style={{ fontSize: 12.5, resize: 'vertical' }} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="row" style={{ gap: 4, flexWrap: 'wrap', margin: '6px 0' }}>
        {snippets.map((s) => (
          <button key={s} className="chip-insert" onClick={() => onChange((value ? value + ' ' : '') + s)}>{s}</button>
        ))}
      </div>
      <div className="tree-box"><SyntaxTree source={value} hue={hue} /></div>
    </div>
  )
}

function LayerRow({ layer, onChange, onRemove }: { layer: AnnotationLayer; onChange: (l: AnnotationLayer) => void; onRemove: () => void }) {
  const meta = KIND_META[layer.kind]
  const snippets = layer.kind === 'penn' ? PENN_SNIPPETS : MIN_SNIPPETS
  return (
    <Panel hue={layer.approved ? '#1D9E75' : meta.hue} label={`${meta.label}${layer.approved ? ' · approved ✓' : ''}`}>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <select className="field" style={{ width: 'auto', fontSize: 12.5 }} value={layer.kind} onChange={(e) => onChange({ ...layer, kind: e.target.value as AnnotationLayerKind })}>
          {Object.entries(KIND_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
        <input className="field" style={{ flex: 1, minWidth: 120, fontSize: 12.5 }} placeholder="layer label" value={layer.label} onChange={(e) => onChange({ ...layer, label: e.target.value })} />
        <select className="field" style={{ width: 'auto', fontSize: 12 }} value={layer.variant ?? 'both'} onChange={(e) => onChange({ ...layer, variant: e.target.value as any })}>
          <option value="both">both</option><option value="good">grammatical</option><option value="bad">ungrammatical</option>
        </select>
        <label className="row" style={{ gap: 4, fontSize: 12.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!layer.approved} onChange={(e) => onChange({ ...layer, approved: e.target.checked })} /> approve
        </label>
        <button className="btn btn-ghost btn-sm" onClick={onRemove}>✕</button>
      </div>
      <div className="faint" style={{ fontSize: 11.5, marginBottom: 6 }}>{meta.hint}</div>
      <textarea className="field mono" rows={meta.tree ? 2 : 3} style={{ fontSize: 12, resize: 'vertical' }} value={layer.content} onChange={(e) => onChange({ ...layer, content: e.target.value })} />
      {meta.tree && layer.content.trim() && (
        <div className="tree-box" style={{ marginTop: 8 }}><SyntaxTree source={layer.content} hue={meta.hue} /></div>
      )}
    </Panel>
  )
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
  const layers = a.layers ?? []
  const addLayer = (kind: AnnotationLayerKind) => patchAnalysis({ layers: [...layers, { id: uid(), kind, label: KIND_META[kind].label, content: '', variant: 'both', approved: false }] })
  const updateLayer = (id: string, next: AnnotationLayer) => patchAnalysis({ layers: layers.map((l) => l.id === id ? next : l) })
  const removeLayer = (id: string) => patchAnalysis({ layers: layers.filter((l) => l.id !== id) })
  const stHue = STATUS_HUE[tpl.validation.status]

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <input className="field" style={{ fontWeight: 600, flex: 1, marginRight: 10 }} value={tpl.name} onChange={(e) => patch({ name: e.target.value })} />
        <span className="tag" style={{ background: stHue + '18', color: stHue, border: 'none', whiteSpace: 'nowrap' }}>{tpl.validation.status.replace('_', ' ')}</span>
      </div>
      <div className="faint" style={{ fontSize: 12, marginBottom: 6 }}>Author the structure once — every card derives from it. Add as many annotation layers as the analysis needs.</div>

      {/* ── Step 1 · slots & fillers ── */}
      <Step n="1" title="Slots & fillers" hint="Open positions the card flow samples into. Press Enter to add a filler.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      </Step>

      {/* ── Step 2 · surface forms ── */}
      <Step n="2" title="Surface forms" hint="The minimal pair as strings. Use {SLOT} placeholders; mark the offending token with * in the ungrammatical line.">
        <div className="grid grid-2">
          <div>
            <label className="lbl" style={{ color: 'var(--good)' }}>Grammatical</label>
            <input className="field mono" value={tpl.grammatical} onChange={(e) => patch({ grammatical: e.target.value })} />
          </div>
          <div>
            <label className="lbl" style={{ color: 'var(--bad)' }}>Ungrammatical</label>
            <input className="field mono" value={tpl.ungrammatical} onChange={(e) => patch({ ungrammatical: e.target.value })} />
          </div>
        </div>
        <label className="lbl">Contrast specification</label>
        <input className="field" value={tpl.contrast} onChange={(e) => patch({ contrast: e.target.value })} placeholder="the single thing that differs, e.g. 3PL vs 3SG verb agreement" />
      </Step>

      {/* ── Step 3 · Minimalist syntax (live trees) ── */}
      <Step n="3" title="Minimalist syntax" hint="Type labelled bracketing in as much detail as you like — categories, bar-levels, features [uφ]/[EPP], traces ⟨t⟩. The tree renders live. Insert common nodes with the chips.">
        <div className="grid grid-2">
          <TreeField label="Grammatical derivation" hue="#1D9E75" value={a.parse_good} onChange={(v) => patchAnalysis({ parse_good: v })} snippets={MIN_SNIPPETS} />
          <TreeField label="Ungrammatical derivation (mark the crash with ✗)" hue="#D85A30" value={a.parse_bad} onChange={(v) => patchAnalysis({ parse_bad: v })} snippets={MIN_SNIPPETS} />
        </div>
      </Step>

      {/* ── Step 4 · Universal Dependencies ── */}
      <Step n="4" title="Universal Dependencies (CoNLL-U)" hint="The simplified UD parse — 10 tab-separated columns; the FORM column uses {SLOT}. This is what auto-derives per card.">
        <Panel hue="#993C1D" label="CoNLL-U schema">
          <textarea className="field mono" rows={3} style={{ background: 'transparent', border: 'none', fontSize: 11.5, resize: 'vertical' }} value={a.conll_schema} onChange={(e) => patchAnalysis({ conll_schema: e.target.value })} />
        </Panel>
      </Step>

      {/* ── Step 5 · Penn Treebank ── */}
      <Step n="5" title="Penn Treebank" hint="Optional phrase-structure bracketing with parens, e.g. (S (NP (NNP {SUBJ})) (VP (VBP {VERB}))). Renders as a tree too.">
        <TreeField label="Penn-style parse" hue="#7A5C2E" value={a.penn ?? ''} onChange={(v) => patchAnalysis({ penn: v })} snippets={PENN_SNIPPETS} />
      </Step>

      {/* ── Step 6 · gloss & features ── */}
      <Step n="6" title="Gloss & feature contrast">
        <div className="grid grid-2">
          <Panel hue="#534AB7" label="Gloss schema (slot-keyed)">
            <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} value={a.gloss_schema} onChange={(e) => patchAnalysis({ gloss_schema: e.target.value })} />
          </Panel>
          <Panel hue="#185FA5" label="Featural contrast — single feature that flips">
            <input className="field mono" style={{ background: 'transparent', border: 'none', fontSize: 12.5 }} placeholder="Number" value={a.feature_contrast} onChange={(e) => patchAnalysis({ feature_contrast: e.target.value })} />
            <div className="row" style={{ marginTop: 8, gap: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
              {(['lexical', 'featural'] as const).map((p) => (
                <button key={p} className={`btn btn-sm ${a.paradigm === p ? 'btn-accent' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }} onClick={() => patchAnalysis({ paradigm: p })}>{p}</button>
              ))}
            </div>
          </Panel>
        </div>
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
      </Step>

      {/* ── Step 7 · perturbation ── */}
      <Step n="7" title="Perturbation" hint="How the ungrammatical alternant is derived from the grammatical one — the invariant edit.">
        <Panel hue="#1D9E75" label="Structural edit">
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
      </Step>

      {/* ── Step 8 · extra annotation layers ── */}
      <Step n="8" title="Annotation layers" hint="Stack any number of extra tiers — a second theory's tree, semantics, prosody, morphology — and approve each when it's signed off.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {layers.map((l) => (
            <LayerRow key={l.id} layer={l} onChange={(next) => updateLayer(l.id, next)} onRemove={() => removeLayer(l.id)} />
          ))}
        </div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: layers.length ? 10 : 0 }}>
          <span className="faint" style={{ fontSize: 12.5 }}>+ add layer:</span>
          {(['minimalist', 'penn', 'ud', 'gloss', 'morphology', 'semantics', 'prosody', 'custom'] as AnnotationLayerKind[]).map((k) => (
            <button key={k} className="chip-insert" onClick={() => addLayer(k)}>{KIND_META[k].label}</button>
          ))}
        </div>
      </Step>

      {/* ── reference grammars ── */}
      <Step n="9" title="Reference grammars" hint="Port the literature in — citations live on the template, so every derived card inherits the provenance.">
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
      </Step>

      {/* ── live derivation preview ── */}
      <div className="between" style={{ margin: '20px 0 8px' }}>
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
        parse_good: '[TP [DP {SUBJ}] [T′ [T {VERB}] [vP ⟨{SUBJ}⟩ ⟨{VERB}⟩]]]',
        parse_bad: '[TP [DP {SUBJ}] [T′ [T {VERB}] [vP …]]] ✗ φ-feature checking fails',
        perturbation: { type: 'agreement_flip', target: 'nsubj↔root', relation: '', depth: 0, description: '' },
        paradigm: 'featural', feature_schema: {}, feature_contrast: '',
        conll_schema: '1\t{SUBJ}\t_\t_\t_\t_\t2\tnsubj\n2\t{VERB}\t_\t_\t_\t_\t0\troot',
        gloss_schema: '{SUBJ} {VERB} — “…”',
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
