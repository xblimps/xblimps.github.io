import React, { useState } from 'react'
import { store } from '../../lib/store'
import type { Workspace, Widget, WidgetType } from '../../lib/types'
import { uid } from '../../lib/id'
import { Bar, Modal, useToggle, Panel } from '../../components/ui'
import { TaskList } from './Tasks'
import { FileList } from './Files'
import { CalendarView } from './Calendar'

const WIDGET_META: Record<WidgetType, { icon: string; label: string }> = {
  notes: { icon: '📝', label: 'Notes' },
  tasks: { icon: '✅', label: 'Tasks' },
  files: { icon: '📎', label: 'Files & links' },
  calendar: { icon: '📅', label: 'Deadlines' },
  keyinfo: { icon: '🔑', label: 'Key information' },
  links: { icon: '🔗', label: 'Pinned links' },
  image: { icon: '🖼️', label: 'Image' },
  progress: { icon: '📈', label: 'Progress' },
  phenomena: { icon: '🧩', label: 'Phenomena' },
}

function NotesWidget({ ws }: { ws: Workspace }) {
  const notes = store.db.notes.filter((n) => n.workspace_id === ws.id).slice(0, 3)
  if (notes.length === 0) return <div className="faint" style={{ fontSize: 13 }}>No notes yet.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notes.map((n) => (
        <div key={n.row_uid}>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{n.pinned ? '📌 ' : ''}{n.title}</div>
          <div className="faint" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            dangerouslySetInnerHTML={{ __html: n.html.replace(/<[^>]+>/g, ' ').slice(0, 70) }} />
        </div>
      ))}
    </div>
  )
}

function KeyInfo({ ws }: { ws: Workspace }) {
  const [text, setText] = useState(ws.dashboard.widgets.find((w) => w.type === 'keyinfo')?.config?.text ?? '')
  const rows = ws.kind === 'language'
    ? [['Language', ws.language?.toUpperCase()], ['Tier', ws.tier], ['Lead', ws.lead], ['Target', '8–10 phenomena · ~100 ex.']]
    : [['Kind', 'Notebook'], ['Owner', store.db.session.user]]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 13.5, marginBottom: 10 }}>
        {rows.map(([k, v]) => <React.Fragment key={k}><span className="faint">{k}</span><span style={{ fontWeight: 500 }}>{v}</span></React.Fragment>)}
      </div>
      <textarea className="field" rows={3} placeholder="Add key information…" value={text}
        onChange={(e) => {
          setText(e.target.value)
          const w = ws.dashboard.widgets.find((x) => x.type === 'keyinfo')
          if (w) { w.config = { ...(w.config || {}), text: e.target.value }; store.patch('workspaces', ws.row_uid, { dashboard: ws.dashboard }) }
        }} />
    </div>
  )
}

function ProgressWidget({ ws }: { ws: Workspace }) {
  if (ws.kind !== 'language') {
    const tasks = store.db.tasks.filter((t) => t.workspace_id === ws.id)
    const done = tasks.filter((t) => t.status === 'done').length
    const pct = tasks.length ? (done / tasks.length) * 100 : 0
    return <div><div className="between" style={{ fontSize: 13, marginBottom: 6 }}><span>Tasks complete</span><b>{done}/{tasks.length}</b></div><Bar pct={pct} /></div>
  }
  const phen = store.db.phenomena.filter((p) => p.language === ws.language)
  const total = phen.reduce((a, p) => a + p.target, 0)
  const pairs = store.db.pairs.filter((p) => p.language === ws.language && (p.status === 'accepted' || p.status === 'validated' || p.status === 'edited'))
  const pct = total ? (pairs.length / total) * 100 : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div className="between" style={{ fontSize: 13, marginBottom: 6 }}><span>Examples accepted</span><b>{pairs.length}/{total}</b></div>
        <Bar pct={pct} />
      </div>
      <div className="row" style={{ gap: 18 }}>
        <div className="stat"><span className="n">{phen.length}</span><span className="l">phenomena</span></div>
        <div className="stat"><span className="n">{phen.filter((p) => p.status === 'active').length}</span><span className="l">active</span></div>
        <div className="stat"><span className="n">{Math.round(pct)}%</span><span className="l">to target</span></div>
      </div>
    </div>
  )
}

function PhenomenaWidget({ ws }: { ws: Workspace }) {
  const phen = store.db.phenomena.filter((p) => p.language === ws.language).slice(0, 6)
  const C: Record<string, string> = { high: 'var(--bad)', med: 'var(--contrast)', low: 'var(--good)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {phen.map((p) => (
        <div key={p.id} className="row">
          <span className="prio-dot" style={{ background: C[p.complexity] }} />
          <span style={{ flex: 1, fontSize: 13.5 }}>{p.label}</span>
          <span className="tag">{p.status}</span>
        </div>
      ))}
    </div>
  )
}

function LinksWidget({ ws, w }: { ws: Workspace; w: Widget }) {
  const links: { t: string; u: string }[] = w.config?.links ?? []
  const [t, setT] = useState(''); const [u, setU] = useState('')
  const save = (next: any[]) => { w.config = { ...(w.config || {}), links: next }; store.patch('workspaces', ws.row_uid, { dashboard: ws.dashboard }) }
  return (
    <div>
      {links.map((l, i) => (
        <div key={i} className="row" style={{ marginBottom: 6 }}>
          <a className="scrim-link" href={l.u} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 13.5 }}>🔗 {l.t}</a>
          <button className="btn btn-ghost btn-sm" onClick={() => save(links.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 8 }}>
        <input className="field" placeholder="label" value={t} onChange={(e) => setT(e.target.value)} />
        <input className="field" placeholder="url" value={u} onChange={(e) => setU(e.target.value)} />
        <button className="btn btn-sm" onClick={() => { if (t) { save([...links, { t, u: u || '#' }]); setT(''); setU('') } }}>+</button>
      </div>
    </div>
  )
}

function ImageWidget({ ws, w }: { ws: Workspace; w: Widget }) {
  const url = w.config?.url ?? ''
  return (
    <div>
      {url ? <img src={url} alt="" style={{ width: '100%', borderRadius: 8 }} /> : <div className="faint" style={{ fontSize: 13 }}>Paste an image URL.</div>}
      <input className="field" style={{ marginTop: 8 }} placeholder="Image URL" defaultValue={url}
        onBlur={(e) => { w.config = { url: e.target.value }; store.patch('workspaces', ws.row_uid, { dashboard: ws.dashboard }) }} />
    </div>
  )
}

function WidgetBody({ ws, w }: { ws: Workspace; w: Widget }) {
  switch (w.type) {
    case 'tasks': return <TaskList workspaceId={ws.id} compact />
    case 'files': return <FileList workspaceId={ws.id} compact />
    case 'calendar': return <CalendarView workspaceId={ws.id} compact />
    case 'notes': return <NotesWidget ws={ws} />
    case 'keyinfo': return <KeyInfo ws={ws} />
    case 'progress': return <ProgressWidget ws={ws} />
    case 'phenomena': return <PhenomenaWidget ws={ws} />
    case 'links': return <LinksWidget ws={ws} w={w} />
    case 'image': return <ImageWidget ws={ws} w={w} />
    default: return null
  }
}

export default function Dashboard({ ws }: { ws: Workspace }) {
  const [adding, openAdd, closeAdd] = useToggle()
  const widgets = ws.dashboard.widgets

  const addWidget = (type: WidgetType) => {
    widgets.push({ id: uid(), type, title: WIDGET_META[type].label })
    store.patch('workspaces', ws.row_uid, { dashboard: ws.dashboard }); closeAdd()
  }
  const removeWidget = (id: string) => {
    ws.dashboard.widgets = widgets.filter((w) => w.id !== id)
    store.patch('workspaces', ws.row_uid, { dashboard: ws.dashboard })
  }

  return (
    <div>
      <div className="between" style={{ marginBottom: 16 }}>
        <Panel hue={ws.colour} label="Workspace dashboard">
          <span style={{ fontSize: 14 }}>Customise this space — add, arrange and remove widgets just like the main dashboard.</span>
        </Panel>
        <button className="btn btn-primary" onClick={openAdd} style={{ flex: 'none' }}>+ Add widget</button>
      </div>
      <div className="grid grid-2">
        {widgets.map((w) => (
          <div key={w.id} className="widget" style={{ gridColumn: (w.type === 'progress' || w.type === 'calendar') ? 'span 1' : undefined }}>
            <div className="widget-head">
              <span>{WIDGET_META[w.type].icon}</span><span>{w.title}</span>
              <button className="gear btn btn-ghost btn-sm" onClick={() => removeWidget(w.id)} title="Remove widget">✕</button>
            </div>
            <div className="widget-body"><WidgetBody ws={ws} w={w} /></div>
          </div>
        ))}
      </div>
      {widgets.length === 0 && <div className="empty"><div className="big">🧱</div>Empty dashboard. Add a widget to begin.</div>}

      {adding && (
        <Modal title="Add widget" sub="Pick a block for this workspace dashboard" onClose={closeAdd}>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {(Object.keys(WIDGET_META) as WidgetType[]).map((t) => (
              <button key={t} className="card row" style={{ textAlign: 'left' }} onClick={() => addWidget(t)}>
                <span style={{ fontSize: 22 }}>{WIDGET_META[t].icon}</span>
                <span style={{ fontWeight: 500 }}>{WIDGET_META[t].label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
