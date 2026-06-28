import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Phenomenon } from '../../lib/types'
import { Ring, Modal, Field, useToggle } from '../../components/ui'

const CX: Record<string, string> = { high: 'var(--bad)', med: 'var(--contrast)', low: 'var(--good)' }

export default function Phenomena({ language, onOpen }: { language: string; onOpen: (section: string) => void }) {
  const phen = store.db.phenomena.filter((p) => p.language === language)
  const [open, openIt, close] = useToggle()
  const [f, setF] = useState({ label: '', family: '', hypothesis: '', ref: '', complexity: 'med' as const })

  const accCount = (id: string) => store.db.pairs.filter((p) => p.phenomenon_id === id && ['accepted', 'edited', 'validated'].includes(p.status)).length

  const add = () => {
    if (!f.label.trim()) return
    const id = `${language}.${f.label.toLowerCase().replace(/[^a-z]+/g, '_').slice(0, 20)}`
    const p: Phenomenon = { ...ident(), id, language, label: f.label, family: f.family || 'misc', complexity: f.complexity, hypothesis: f.hypothesis, ref: f.ref, note: '', status: 'planned', target: 100 }
    store.upsert('phenomena', p)
    setF({ label: '', family: '', hypothesis: '', ref: '', complexity: 'med' }); close()
  }
  const toggleStatus = (p: Phenomenon) =>
    store.patch('phenomena', p.row_uid, { status: p.status === 'planned' ? 'active' : p.status === 'active' ? 'complete' : 'planned' })

  return (
    <div>
      <div className="between" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0 }}>{phen.length} phenomena · target 8–10 per language. Complexity is the coarse flag for template construction.</p>
        <button className="btn btn-primary" onClick={openIt}>+ New phenomenon</button>
      </div>
      <div className="grid grid-3">
        {phen.map((p) => {
          const c = accCount(p.id)
          return (
            <div key={p.id} className="card">
              <div className="between" style={{ marginBottom: 8 }}>
                <span className="tag" style={{ color: CX[p.complexity], borderColor: CX[p.complexity] + '55' }}>{p.complexity}</span>
                <Ring pct={(c / p.target) * 100} label={`${c}`} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.label}</div>
              <div className="mono faint" style={{ fontSize: 11.5, marginBottom: 8 }}>{p.id}</div>
              <div className="muted" style={{ fontSize: 13, minHeight: 38 }}>{p.hypothesis}</div>
              <div className="divider" />
              <div className="between">
                <span className="tag">{p.family}</span>
                <button className={`tag ${p.status === 'active' ? 'pill-good' : p.status === 'complete' ? 'pill-accent' : ''}`} onClick={() => toggleStatus(p)}>{p.status}</button>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => onOpen('Templates')}>Templates</button>
                <button className="btn btn-sm btn-accent" onClick={() => onOpen('Card flow')}>Generate →</button>
              </div>
            </div>
          )
        })}
      </div>

      {open && (
        <Modal title="New phenomenon" sub="Writes a row to the phenomenon ontology" onClose={close}>
          <Field label="Name" value={f.label} onChange={(v) => setF({ ...f, label: v })} placeholder="Differential object marking" />
          <Field label="Family (cross-linguistic)" value={f.family} onChange={(v) => setF({ ...f, family: v })} placeholder="case / agreement / binding …" />
          <Field label="Hypothesis — why hard for LMs" value={f.hypothesis} onChange={(v) => setF({ ...f, hypothesis: v })} textarea />
          <Field label="Methodology reference" value={f.ref} onChange={(v) => setF({ ...f, ref: v })} placeholder="Author (year)" />
          <label className="lbl">Coarse complexity</label>
          <select className="field" value={f.complexity} onChange={(e) => setF({ ...f, complexity: e.target.value as any })}>
            <option value="low">low</option><option value="med">med</option><option value="high">high</option>
          </select>
          <div style={{ marginTop: 18, textAlign: 'right' }}><button className="btn btn-primary" onClick={add}>Create</button></div>
        </Modal>
      )}
    </div>
  )
}
