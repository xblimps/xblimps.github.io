import React, { useState } from 'react'
import { useApp } from './state/AppContext'
import { store, ident } from './lib/store'
import { uid } from './lib/id'
import { cover, NOTEBOOK_COLOURS } from './lib/seed'
import type { Workspace, SyncState } from './lib/types'
import { Modal, IconPicker, ColourPicker, Field, useToggle } from './components/ui'
import WorkspaceView from './modules/workspace/Workspace'
import Roster from './components/Roster'
import Audit from './components/Audit'

const SYNC_LABEL: Record<SyncState, string> = { synced: 'All changes saved', syncing: 'Saving…', offline: 'Offline — queued' }

function SyncChip({ state }: { state: SyncState }) {
  return <span className={`sync-chip sync-${state}`}><span className="pip" />{SYNC_LABEL[state]}</span>
}

function NewWorkspace({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState(''); const [icon, setIcon] = useState('📓')
  const [colour, setColour] = useState(NOTEBOOK_COLOURS[4])
  const create = () => {
    const id = 'ws.' + uid().slice(0, 6)
    const ws: Workspace = {
      ...ident(), id, name: name || 'New notebook', kind: 'notebook', icon, colour, cover: cover(colour),
      subtitle: 'Notebook', sections: ['Dashboard', 'Notes', 'Tasks', 'Files', 'Calendar'],
      dashboard: { widgets: [
        { id: uid(), type: 'progress', title: 'Progress' },
        { id: uid(), type: 'tasks', title: 'Tasks' },
        { id: uid(), type: 'notes', title: 'Notes' },
        { id: uid(), type: 'keyinfo', title: 'Key information' },
      ] },
    }
    store.upsert('workspaces', ws); onCreated(id); onClose()
  }
  return (
    <Modal title="New workspace" sub="A fresh notebook — dashboard, notes, tasks, files, calendar" onClose={onClose}>
      <Field label="Name" value={name} onChange={setName} placeholder="Reading group" />
      <label className="lbl">Icon</label>
      <IconPicker value={icon} onChange={setIcon} />
      <label className="lbl">Notebook colour</label>
      <ColourPicker value={colour} onChange={setColour} />
      <div style={{ marginTop: 12, height: 70, borderRadius: 12, background: cover(colour), position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, bottom: -14, fontSize: 30 }}>{icon}</span>
      </div>
      <div style={{ marginTop: 26, textAlign: 'right' }}><button className="btn btn-primary" onClick={create}>Create workspace</button></div>
    </Modal>
  )
}

export default function App() {
  const { syncState, nav, go, openWorkspace } = useApp()
  const [newWs, openNew, closeNew] = useToggle()

  const workspaces = store.db.workspaces
  const notebooks = workspaces.filter((w) => w.kind === 'notebook')
  const langs = workspaces.filter((w) => w.kind === 'language')

  const inWorkspaces = nav.view === 'workspaces'
  const inXblimps = nav.view === 'xblimps'
  const showRail = inWorkspaces || inXblimps
  const activeWs = workspaces.find((w) => w.id === nav.workspaceId)

  const titleMap: Record<string, string> = { workspaces: activeWs?.name ?? 'Workspaces', xblimps: 'xBLiMPs · minimal pairs', roster: 'Team & onboarding', audit: 'Sync ledger' }

  return (
    <div className={`app ${showRail ? '' : ''}`} style={!showRail ? { gridTemplateColumns: '64px 1fr' } : undefined}>
      {/* spine / module switcher */}
      <div className="spine">
        <div className="spine-logo">x</div>
        <button className={`spine-btn ${inWorkspaces ? 'active' : ''}`} title="Workspaces" onClick={() => go({ view: 'workspaces', section: 'Dashboard' })}>📓</button>
        <button className={`spine-btn ${inXblimps ? 'active' : ''}`} title="xBLiMPs minimal pairs" onClick={() => { const f = langs[0]; go({ view: 'xblimps', workspaceId: f?.id ?? null, section: 'Phenomena' }) }}>🔤</button>
        <button className={`spine-btn ${nav.view === 'roster' ? 'active' : ''}`} title="Team & onboarding" onClick={() => go({ view: 'roster' })}>👥</button>
        <button className={`spine-btn ${nav.view === 'audit' ? 'active' : ''}`} title="Sync ledger" onClick={() => go({ view: 'audit' })}>🗃️</button>
        <div className="spine-spacer" />
        <button className="spine-btn" title="Reset demo data" onClick={() => { if (confirm('Reset all local data to seed?')) store.resetAll() }}>↺</button>
      </div>

      {/* primary rail */}
      {showRail && (
        <div className="rail">
          <div className="rail-head">
            <div className="rail-title">{inXblimps ? 'Language projects' : 'Workspaces'}</div>
            <div className="rail-sub">{inXblimps ? 'minimal-pair generation' : 'your notebooks & projects'}</div>
          </div>
          <div className="rail-body">
            {inWorkspaces && (
              <>
                <div className="rail-section-label">Notebooks</div>
                {notebooks.map((w) => (
                  <button key={w.id} className={`nav-item ${nav.workspaceId === w.id ? 'active' : ''}`} onClick={() => openWorkspace(w.id)}>
                    <span className="nav-emoji">{w.icon}</span><span>{w.name}</span>
                  </button>
                ))}
                <button className="nav-item" onClick={openNew}><span className="nav-emoji">＋</span><span className="muted">New workspace</span></button>
              </>
            )}
            <div className="rail-section-label">Languages</div>
            {langs.map((w) => (
              <button key={w.id} className={`nav-item ${nav.workspaceId === w.id ? 'active' : ''}`}
                onClick={() => go({ view: nav.view, workspaceId: w.id, section: inXblimps ? 'Phenomena' : 'Dashboard' })}>
                <span className="nav-dot" style={{ background: w.colour }} />
                <span>{w.name}</span>
                <span className="nav-count">{store.db.phenomena.filter((p) => p.language === w.language).length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* main */}
      <div className="main">
        <div className="topbar">
          <h1>{titleMap[nav.view]}</h1>
          <div className="spacer" />
          <SyncChip state={syncState} />
          <span className="tag">{store.db.session.user} · {store.db.session.role}</span>
        </div>
        {(inWorkspaces || inXblimps) && activeWs && (
          <WorkspaceView workspaceId={activeWs.id} section={nav.section} onSection={(s) => go({ section: s })} />
        )}
        {(inWorkspaces || inXblimps) && !activeWs && (
          <div className="empty"><div className="big">📓</div>Pick a workspace from the rail{inWorkspaces ? ', or create a new one.' : '.'}</div>
        )}
        {nav.view === 'roster' && <Roster />}
        {nav.view === 'audit' && <Audit />}
      </div>

      {newWs && <NewWorkspace onClose={closeNew} onCreated={(id) => openWorkspace(id)} />}
    </div>
  )
}
