import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { ChildesDocument, ChildesAnnotation } from '../../lib/types'
import { uid } from '../../lib/id'
import { Modal, Field, useToggle, Panel } from '../../components/ui'

// pastel colour-coded annotation layers
export const LAYERS: { id: ChildesAnnotation['layer']; label: string; hue: string }[] = [
  { id: 'code_switch', label: 'Code-switch', hue: '#534AB7' },
  { id: 'l2_error', label: 'L2 error', hue: '#993C1D' },
  { id: 'developmental', label: 'Developmental', hue: '#0F6E56' },
  { id: 'mwu', label: 'Multi-word unit', hue: '#BA7517' },
  { id: 'other', label: 'Other', hue: '#5C5A54' },
]
const hueOf = (l: string) => LAYERS.find((x) => x.id === l)?.hue ?? '#5C5A54'

// render the transcript with annotated spans highlighted in their layer's pastel hue
function AnnotatedText({ doc, anns, onSelect }: { doc: ChildesDocument; anns: ChildesAnnotation[]; onSelect: (start: number, end: number, text: string) => void }) {
  const sorted = [...anns].sort((a, b) => a.char_start - b.char_start)
  const out: React.ReactNode[] = []
  let cursor = 0
  sorted.forEach((a, i) => {
    if (a.char_start > cursor) out.push(<span key={`t${i}`}>{doc.text.slice(cursor, a.char_start)}</span>)
    const hue = hueOf(a.layer)
    out.push(<mark key={`a${i}`} title={`${a.layer}${a.note ? ' — ' + a.note : ''}`} style={{ background: hue + '26', color: 'inherit', borderBottom: `2px solid ${hue}`, borderRadius: 4, padding: '1px 2px' }}>{doc.text.slice(a.char_start, a.char_end)}</mark>)
    cursor = Math.max(cursor, a.char_end)
  })
  if (cursor < doc.text.length) out.push(<span key="end">{doc.text.slice(cursor)}</span>)

  const onMouseUp = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString()
    const idx = doc.text.indexOf(text)
    if (idx >= 0 && text.trim()) onSelect(idx, idx + text.length, text)
  }

  return (
    <div onMouseUp={onMouseUp} className="serif" style={{ fontSize: 17, lineHeight: 1.9, userSelect: 'text', cursor: 'text' }}>
      {out}
    </div>
  )
}

export default function Childes() {
  const docs = store.db.childes_docs
  const [docId, setDocId] = useState(docs[0]?.row_uid ?? '')
  const doc = docs.find((d) => d.row_uid === docId) ?? docs[0]
  const anns = doc ? store.db.childes_anns.filter((a) => a.document_id === doc.id) : []

  const [sel, setSel] = useState<{ start: number; end: number; text: string } | null>(null)
  const [layer, setLayer] = useState<ChildesAnnotation['layer']>('code_switch')
  const [note, setNote] = useState('')
  const [newDoc, openNew, closeNew] = useToggle()

  const addAnnotation = () => {
    if (!sel || !doc) return
    const a: ChildesAnnotation = {
      ...ident(), id: uid(), document_id: doc.id, char_start: sel.start, char_end: sel.end,
      text_span: sel.text, layer, features: {}, annotator: store.db.session.user, note,
    }
    store.upsert('childes_anns', a)
    setSel(null); setNote('')
  }

  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <div className="cover" style={{ background: 'linear-gradient(120deg,#d7d4f0,#b6b0e2 60%,#968fd3)' }}>
        <div className="cover-badge">🧒</div>
      </div>
      <div style={{ marginTop: 40 }} className="between">
        <div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>CHILDES annotation</h1>
          <div className="muted" style={{ marginTop: 2 }}>Bilingual transcript annotation · code-switching, L2 error & developmental layers</div>
        </div>
        <button className="btn btn-ghost" onClick={openNew}>+ Add transcript</button>
      </div>

      <div className="row" style={{ gap: 8, margin: '20px 0', flexWrap: 'wrap' }}>
        <select className="field" style={{ width: 'auto' }} value={docId} onChange={(e) => { setDocId(e.target.value); setSel(null) }}>
          {docs.map((d) => <option key={d.row_uid} value={d.row_uid}>{d.title} · {d.child} ({d.age})</option>)}
        </select>
        {LAYERS.map((l) => <span key={l.id} className="tag" style={{ background: l.hue + '1e', color: l.hue, border: 'none' }}>● {l.label}</span>)}
      </div>

      {!doc ? <div className="empty"><div className="big">🧒</div>No transcripts yet — add one to start annotating.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22 }}>
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>{doc.title} · {doc.language} · {doc.source}</div>
            <AnnotatedText doc={doc} anns={anns} onSelect={(start, end, text) => setSel({ start, end, text })} />
          </div>

          <div>
            {sel ? (
              <Panel hue={hueOf(layer)} label="New annotation">
                <div className="serif" style={{ fontSize: 15, marginBottom: 10 }}>"{sel.text}"</div>
                <label className="lbl" style={{ marginTop: 0 }}>Layer</label>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {LAYERS.map((l) => (
                    <button key={l.id} className="tag" style={{ cursor: 'pointer', background: layer === l.id ? l.hue : l.hue + '1e', color: layer === l.id ? '#fff' : l.hue, border: 'none' }} onClick={() => setLayer(l.id)}>{l.label}</button>
                  ))}
                </div>
                <Field label="Note" value={note} onChange={setNote} placeholder="e.g. intra-sentential switch" />
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={addAnnotation}>Add</button>
                  <button className="btn btn-ghost" onClick={() => setSel(null)}>Cancel</button>
                </div>
              </Panel>
            ) : (
              <div className="card"><div className="faint" style={{ fontSize: 13 }}>Select text in the transcript to annotate a span.</div></div>
            )}

            <h2 className="section" style={{ marginTop: 22 }}>Annotations ({anns.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {anns.map((a) => (
                <div key={a.row_uid} className="card" style={{ padding: 12, borderLeft: `3px solid ${hueOf(a.layer)}` }}>
                  <div className="between">
                    <span className="tag" style={{ background: hueOf(a.layer) + '1e', color: hueOf(a.layer), border: 'none' }}>{a.layer.replace('_', ' ')}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => store.remove('childes_anns', a.row_uid)}>✕</button>
                  </div>
                  <div className="serif" style={{ fontSize: 14, marginTop: 6 }}>"{a.text_span}"</div>
                  {a.note && <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{a.note}</div>}
                </div>
              ))}
              {anns.length === 0 && <div className="faint" style={{ fontSize: 13 }}>No annotations on this transcript yet.</div>}
            </div>
          </div>
        </div>
      )}

      {newDoc && <NewDoc onClose={closeNew} onCreated={(rid) => setDocId(rid)} />}
    </div>
  )
}

function NewDoc({ onClose, onCreated }: { onClose: () => void; onCreated: (rowUid: string) => void }) {
  const [title, setTitle] = useState(''); const [child, setChild] = useState(''); const [age, setAge] = useState('')
  const [language, setLanguage] = useState('cy/en'); const [text, setText] = useState('')
  const create = () => {
    const d: ChildesDocument = { ...ident(), id: 'chi.' + uid().slice(0, 6), title: title || 'Untitled transcript', child, age, language, source: 'manual', text }
    store.upsert('childes_docs', d); onCreated(d.row_uid); onClose()
  }
  return (
    <Modal title="Add transcript" sub="Paste CHAT/plain transcript text — annotate spans by offset" onClose={onClose}>
      <Field label="Title" value={title} onChange={setTitle} />
      <div className="row"><Field label="Child / corpus" value={child} onChange={setChild} /><Field label="Age (e.g. 2;06)" value={age} onChange={setAge} /></div>
      <Field label="Languages" value={language} onChange={setLanguage} placeholder="cy/en" />
      <Field label="Transcript text" value={text} onChange={setText} textarea />
      <div style={{ marginTop: 18, textAlign: 'right' }}><button className="btn btn-primary" onClick={create}>Add transcript</button></div>
    </Modal>
  )
}
