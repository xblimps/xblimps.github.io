import React, { useState } from 'react'
import { useApp } from './state/AppContext'
import { store, ident } from './lib/store'
import { uid } from './lib/id'
import { cover, NOTEBOOK_COLOURS } from './lib/seed'
import type { Workspace, SyncState } from './lib/types'
import { Modal, IconPicker, ColourPicker, Field, useToggle } from './components/ui'
import WorkspaceView from './modules/workspace/Workspace'
import Home from './modules/xblimps/Home'
import Guide from './modules/xblimps/Guide'
import { STAGES, stageState, stageCount } from './lib/stages'
import Forge from './modules/xblimps/Forge'
import Bench from './modules/xblimps/Bench'
import Team from './components/Team'
import Audit from './components/Audit'
import Childes from './modules/childes/Childes'
import Login from './components/Login'
import { isAdmin } from './lib/auth'

const SYNC_LABEL: Record<SyncState, string> = { synced: 'All changes saved', syncing: 'Saving…', offline: 'Offline — queued' }
const SyncChip = ({ state }: { state: SyncState }) => <span className={`sync-chip sync-${state}`}><span className="pip" />{SYNC_LABEL[state]}</span>

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
      <label className="lbl">Icon</label><IconPicker value={icon} onChange={setIcon} />
      <label className="lbl">Notebook colour</label><ColourPicker value={colour} onChange={setColour} />
      <div style={{ marginTop: 12, height: 70, borderRadius: 12, background: cover(colour), position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, bottom: -14, fontSize: 30 }}>{icon}</span>
      </div>
      <div style={{ marginTop: 26, textAlign: 'right' }}><button className="btn btn-primary" onClick={create}>Create workspace</button></div>
    </Modal>
  )
}

export default function App() {
  const { boot, profile, syncState, signOutNow, nav, go, openWorkspace } = useApp()
  const [newWs, openNew, closeNew] = useToggle()

  if (boot === 'loading') return <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ink-soft)' }}>Loading…</div>
  if (boot === 'signed_out') return <Login />

  // admin-only modules (sole-admin tooling) — CHILDES annotation, the team/onboarding
  // roster, and the sync ledger are not shown to leads, native speakers or reviewers.
  const admin = isAdmin(profile)
  // native speakers get a stripped-down app: only their Forge workspace (cognitive relief —
  // none of the coordinator machinery). Everyone else keeps the full module switcher.
  const onlyForge = profile.role === 'native_speaker'
  const workspaces = store.db.workspaces
  const notebooks = workspaces.filter((w) => w.kind === 'notebook')
  const langs = workspaces.filter((w) => w.kind === 'language')

  const inWorkspaces = nav.view === 'workspaces'
  const inXblimps = nav.view === 'xblimps'
  const showRail = inWorkspaces || inXblimps
  const activeWs = workspaces.find((w) => w.id === nav.workspaceId)
  const titleMap: Record<string, string> = { workspaces: activeWs?.name ?? 'Workspaces', xblimps: 'xBLiMPs · minimal pairs', forge: 'Minimal-pair forge', bench: 'Syntax bench · template validation', roster: 'Team & onboarding', audit: 'Sync ledger', childes: 'CHILDES annotation' }

  return (
    <div className="app" style={!showRail ? { gridTemplateColumns: '64px 1fr' } : undefined}>
      {/* spine / module switcher */}
      <div className="spine">
        <div className="spine-logo">x</div>
        {!onlyForge && <button className={`spine-btn ${inWorkspaces ? 'active' : ''}`} title="Workspaces" onClick={() => go({ view: 'workspaces', section: 'Dashboard' })}>📓</button>}
        {!onlyForge && <button className={`spine-btn ${inXblimps ? 'active' : ''}`} title="xBLiMPs minimal pairs" onClick={() => go({ view: 'xblimps', workspaceId: null, section: 'Home' })}>🔤</button>}
        <button className={`spine-btn ${nav.view === 'forge' ? 'active' : ''}`} title="Minimal-pair forge" onClick={() => go({ view: 'forge' })}>🪄</button>
        {!onlyForge && <button className={`spine-btn ${nav.view === 'bench' ? 'active' : ''}`} title="Syntax bench — template validation" onClick={() => go({ view: 'bench' })}>🧬</button>}
        {admin && <button className={`spine-btn ${nav.view === 'childes' ? 'active' : ''}`} title="CHILDES annotation" onClick={() => go({ view: 'childes' })}>🧒</button>}
        {admin && <button className={`spine-btn ${nav.view === 'roster' ? 'active' : ''}`} title="Team & onboarding" onClick={() => go({ view: 'roster' })}>👥</button>}
        {admin && <button className={`spine-btn ${nav.view === 'audit' ? 'active' : ''}`} title="Sync ledger" onClick={() => go({ view: 'audit' })}>🗃️</button>}
        <div className="spine-spacer" />
        <button className="spine-btn" title="Sign out" onClick={signOutNow}>⎋</button>
      </div>

      {/* primary rail */}
      {showRail && (
        <div className="rail">
          {/* ── Workspaces: notebook list ── */}
          {inWorkspaces && (
            <>
              <div className="rail-head">
                <div className="rail-title">Workspaces</div>
                <div className="rail-sub">your notebooks & projects</div>
              </div>
              <div className="rail-body">
                <div className="rail-section-label">Notebooks</div>
                {notebooks.map((w) => (
                  <button key={w.id} className={`nav-item ${nav.workspaceId === w.id ? 'active' : ''}`} onClick={() => openWorkspace(w.id)}>
                    <span className="nav-emoji">{w.icon}</span><span>{w.name}</span>
                  </button>
                ))}
                <button className="nav-item" onClick={openNew}><span className="nav-emoji">＋</span><span className="muted">New workspace</span></button>
              </div>
            </>
          )}

          {/* ── xBLiMPs: language picker (no drill-in yet) ── */}
          {inXblimps && !activeWs && (
            <>
              <div className="rail-head">
                <div className="rail-title">Language projects</div>
                <div className="rail-sub">minimal-pair generation</div>
              </div>
              <div className="rail-body">
                <button className={`nav-item ${nav.section === 'Home' ? 'active' : ''}`} onClick={() => go({ workspaceId: null, section: 'Home' })}>
                  <span className="nav-emoji">🏠</span><span>Home</span>
                </button>
                <button className={`nav-item ${nav.section === 'Guide' ? 'active' : ''}`} onClick={() => go({ workspaceId: null, section: 'Guide' })}>
                  <span className="nav-emoji">📖</span><span>Annotation guide</span>
                </button>
                <div className="rail-section-label">Languages</div>
                {langs.map((w) => (
                  <button key={w.id} className="nav-item"
                    onClick={() => go({ view: 'xblimps', workspaceId: w.id, section: 'Overview' })}>
                    <span className="nav-dot" style={{ background: w.colour }} /><span>{w.name}</span>
                    <span className="nav-count">{store.db.phenomena.filter((p) => p.language === w.language).length}</span>
                  </button>
                ))}
                {langs.length === 0 && <div className="faint" style={{ fontSize: 12.5, padding: 8 }}>No language projects yet.</div>}
              </div>
            </>
          )}

          {/* ── xBLiMPs: drilled into a language — guided gated stages ── */}
          {inXblimps && activeWs && (() => {
            const st = stageState(activeWs.language ?? '')
            return (
              <>
                <div className="rail-head">
                  <button className="rail-back" onClick={() => go({ workspaceId: null, section: 'Home' })}>← All languages</button>
                  <div className="rail-title" style={{ marginTop: 8 }}>{activeWs.name}</div>
                  <div className="rail-sub">{activeWs.subtitle}</div>
                </div>
                <div className="rail-body">
                  {STAGES.map((s) => {
                    const unlocked = st.unlocked[s.key]
                    const count = stageCount(st, s.key)
                    return (
                      <button key={s.key} disabled={!unlocked}
                        className={`nav-item nav-stage ${nav.section === s.key ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                        title={unlocked ? '' : st.lockHint[s.key]}
                        onClick={() => unlocked && go({ section: s.key })}>
                        <span className="nav-emoji nav-stage-n">{unlocked ? s.icon : '🔒'}</span>
                        <span>{s.label}</span>
                        {unlocked && count
                          ? <span className="nav-count">{count}</span>
                          : !unlocked && <span className="nav-lockhint">{st.lockHint[s.key]}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* main */}
      <div className="main">
        <div className="topbar">
          <h1>{titleMap[nav.view]}</h1>
          <div className="spacer" />
          <SyncChip state={syncState} />
          <span className="tag">{profile.name} · {profile.role.replace('_', ' ')}</span>
        </div>
        {(inWorkspaces || inXblimps) && activeWs && <WorkspaceView workspaceId={activeWs.id} section={nav.section} onSection={(s) => go({ section: s })} />}
        {inXblimps && !activeWs && nav.section === 'Guide' && <Guide />}
        {inXblimps && !activeWs && nav.section !== 'Guide' && <Home langs={langs} onOpen={(id) => go({ view: 'xblimps', workspaceId: id, section: 'Overview' })} />}
        {inWorkspaces && !activeWs && <div className="empty"><div className="big">📓</div>Pick a workspace from the rail, or create a new one.</div>}
        {nav.view === 'forge' && <Forge />}
        {nav.view === 'bench' && <Bench />}
        {nav.view === 'roster' && (admin ? <Team /> : <div className="empty"><div className="big">🔒</div>You don't have access to this project.</div>)}
        {nav.view === 'audit' && (admin ? <Audit /> : <div className="empty"><div className="big">🔒</div>You don't have access to this project.</div>)}
        {nav.view === 'childes' && (admin ? <Childes /> : <div className="empty"><div className="big">🔒</div>You don't have access to this project.</div>)}
      </div>

      {newWs && <NewWorkspace onClose={closeNew} onCreated={(id) => openWorkspace(id)} />}
    </div>
  )
}
