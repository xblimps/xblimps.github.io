import React, { useState } from 'react'
import { store } from '../../lib/store'
import type { Workspace as WS } from '../../lib/types'
import { cover } from '../../lib/seed'
import { Modal, IconPicker, ColourPicker, Field, useToggle } from '../../components/ui'
import Dashboard from './Dashboard'
import Notes from './Notes'
import Tasks from './Tasks'
import Files from './Files'
import Calendar from './Calendar'
import Phenomena from '../xblimps/Phenomena'
import Templates from '../xblimps/Templates'
import CardFlow from '../xblimps/CardFlow'
import Validation from '../xblimps/Validation'
import Overview from '../xblimps/Overview'
import { stageState, furthestUnlocked, type StageKey } from '../../lib/stages'

function Settings({ ws, onClose }: { ws: WS; onClose: () => void }) {
  return (
    <Modal title="Workspace settings" sub="Make it yours — icon, colour and cover" onClose={onClose}>
      <Field label="Name" value={ws.name} onChange={(v) => store.patch('workspaces', ws.row_uid, { name: v })} />
      <Field label="Subtitle" value={ws.subtitle ?? ''} onChange={(v) => store.patch('workspaces', ws.row_uid, { subtitle: v })} />
      <label className="lbl">Icon</label>
      <IconPicker value={ws.icon} onChange={(e) => store.patch('workspaces', ws.row_uid, { icon: e })} />
      <label className="lbl">Notebook colour</label>
      <ColourPicker value={ws.colour} onChange={(c) => store.patch('workspaces', ws.row_uid, { colour: c, cover: cover(c) })} />
      <div className="divider" />
      <button className="btn" style={{ color: 'var(--bad)' }} onClick={() => { store.remove('workspaces', ws.row_uid); onClose() }}>Delete workspace</button>
    </Modal>
  )
}

export default function WorkspaceView({ workspaceId, section, onSection }: { workspaceId: string; section: string; onSection: (s: string) => void }) {
  const ws = store.db.workspaces.find((w) => w.id === workspaceId)
  const [settings, openSettings, closeSettings] = useToggle()
  if (!ws) return <div className="empty"><div className="big">📭</div>Select a workspace.</div>

  const lang = ws.language ?? ''
  const isLang = ws.kind === 'language'

  // for language projects the rail drives a gated stage sequence; keep users out of
  // a locked or stale section by falling back to the furthest unlocked working stage
  let active = section
  if (isLang) {
    const st = stageState(lang)
    const map: Record<string, StageKey> = { Templates: 'Template Studio', Validation: 'Export', Dashboard: 'Overview' }
    const key = (map[active] ?? active) as StageKey
    if (st.unlocked[key] === false) active = furthestUnlocked(st)
    else active = key
  }

  const render = () => {
    switch (active) {
      case 'Overview': return <Overview ws={ws} />
      case 'Dashboard': return <Dashboard ws={ws} />
      case 'Notes': return <Notes workspaceId={ws.id} />
      case 'Tasks': return <Tasks workspaceId={ws.id} />
      case 'Files': return <Files workspaceId={ws.id} />
      case 'Calendar': return <Calendar workspaceId={ws.id} />
      case 'Phenomena': return <Phenomena language={lang} onOpen={onSection} />
      case 'Template Studio': case 'Templates': return <Templates language={lang} />
      case 'Card flow': return <CardFlow language={lang} />
      case 'Export': case 'Validation': return <Validation language={lang} />
      default: return <Dashboard ws={ws} />
    }
  }

  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <div className="cover" style={{ background: ws.cover || cover(ws.colour) }}>
        <div className="cover-badge">{ws.icon}</div>
      </div>
      <div style={{ marginTop: 40 }} className="between">
        <div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>{ws.name}</h1>
          {ws.subtitle && <div className="muted" style={{ marginTop: 2 }}>{ws.subtitle}</div>}
        </div>
        <button className="btn btn-ghost" onClick={openSettings}>⚙ Customise</button>
      </div>

      {/* language projects are driven by the guided rail; notebooks keep their tab bar */}
      {!isLang && (
        <div className="row" style={{ gap: 4, margin: '18px 0 24px', borderBottom: '1px solid var(--hair)', flexWrap: 'wrap' }}>
          {ws.sections.map((s) => (
            <button key={s} className="btn btn-ghost btn-sm" onClick={() => onSection(s)}
              style={{ borderRadius: 0, borderBottom: section === s ? `2px solid ${ws.colour}` : '2px solid transparent', color: section === s ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: section === s ? 600 : 500 }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: isLang ? 24 : 0 }}>{render()}</div>
      {settings && <Settings ws={ws} onClose={closeSettings} />}
    </div>
  )
}
