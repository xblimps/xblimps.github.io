import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Template, Slot } from '../../lib/types'
import { uid } from '../../lib/id'
import { Panel } from '../../components/ui'

function preview(tpl: Template) {
  const fillers: Record<string, string> = {}
  tpl.slots.forEach((s) => { fillers[s.name] = s.fillers[0] || s.name })
  const fill = (pat: string) => pat.replace(/\{(\w+)\}/g, (_, k) => fillers[k] ?? `{${k}}`)
  return { good: fill(tpl.grammatical), bad: fill(tpl.ungrammatical).replace('*', '') }
}

function Editor({ tpl }: { tpl: Template }) {
  const patch = (fields: Partial<Template>) => store.patch('templates', tpl.row_uid, fields as any)
  const updateSlot = (i: number, next: Slot) => { const slots = tpl.slots.map((s, j) => j === i ? next : s); patch({ slots }) }
  const addSlot = () => patch({ slots: [...tpl.slots, { name: 'SLOT' + (tpl.slots.length + 1), fillers: ['…'] }] })
  const pv = preview(tpl)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <input className="field" style={{ fontWeight: 600, marginBottom: 12 }} value={tpl.name} onChange={(e) => patch({ name: e.target.value })} />

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

      <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Live preview</div>
      <div className="grid grid-2">
        <Panel hue="#1D9E75" label="grammatical"><span className="serif" style={{ fontSize: 16 }}>{pv.good}</span></Panel>
        <Panel hue="#D85A30" label="ungrammatical"><span className="serif" style={{ fontSize: 16 }}>{pv.bad}</span></Panel>
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
