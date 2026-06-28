import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { FileLink } from '../../lib/types'
import { uid } from '../../lib/id'
import { Modal, Field, useToggle } from '../../components/ui'

const ICON: Record<string, string> = { doc: '📄', sheet: '📊', transcript: '🗣️', pdf: '📕', link: '🔗', image: '🖼️' }

export function FileList({ workspaceId, compact }: { workspaceId: string; compact?: boolean }) {
  const files = store.db.files.filter((f) => f.workspace_id === workspaceId)
  const [open, openIt, close] = useToggle()
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [kind, setKind] = useState<FileLink['kind']>('doc')

  const add = () => {
    if (!title.trim()) return
    store.upsert('files', { ...ident(), id: uid(), workspace_id: workspaceId, title: title.trim(), url: url || '#', kind, note: '' } as FileLink)
    setTitle(''); setUrl(''); close()
  }

  return (
    <div>
      {!compact && <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={openIt}>+ Add file / link</button>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map((f) => (
          <a key={f.row_uid} className="card row" href={f.url} target="_blank" rel="noreferrer" style={{ padding: 12, textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontSize: 22 }}>{ICON[f.kind]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{f.title}</div>
              {f.note && <div className="faint" style={{ fontSize: 12 }}>{f.note}</div>}
            </div>
            <span className="tag">{f.kind}</span>
            {!compact && <button className="btn btn-ghost btn-sm" onClick={(e) => { e.preventDefault(); store.remove('files', f.row_uid) }}>✕</button>}
          </a>
        ))}
        {files.length === 0 && <div className="faint" style={{ fontSize: 13 }}>No files linked.</div>}
      </div>
      {open && (
        <Modal title="Add file or link" onClose={close}>
          <Field label="Title" value={title} onChange={setTitle} placeholder="Transcript 01" />
          <Field label="URL" value={url} onChange={setUrl} placeholder="https://…" />
          <label className="lbl">Kind</label>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            {['doc', 'sheet', 'transcript', 'pdf', 'link', 'image'].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <div style={{ marginTop: 18, textAlign: 'right' }}><button className="btn btn-primary" onClick={add}>Add</button></div>
        </Modal>
      )}
    </div>
  )
}

export default function Files({ workspaceId }: { workspaceId: string }) {
  return <FileList workspaceId={workspaceId} />
}
