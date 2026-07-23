import React, { useState } from 'react'
import type { Workspace } from '../../lib/types'
import Dashboard from '../workspace/Dashboard'
import Notes from '../workspace/Notes'
import Tasks from '../workspace/Tasks'
import Files from '../workspace/Files'
import Calendar from '../workspace/Calendar'
import { useApp } from '../../state/AppContext'
import { store } from '../../lib/store'
import { stageState } from '../../lib/stages'

// The folded "notebook" — a holistic view of the same project info. The old per-page
// tabs (Notes / Tasks / Files / Calendar) no longer clutter the rail; they live here
// under the dashboard board as a lightweight inline segmented control.
const PANES = ['Notebook', 'Notes', 'Tasks', 'Files', 'Calendar'] as const
type Pane = typeof PANES[number]

export default function Overview({ ws }: { ws: Workspace }) {
  const { go } = useApp()
  const [pane, setPane] = useState<Pane>('Notebook')

  const lang = ws.language ?? ''
  const st = stageState(lang)
  const refCount = store.db.sources.filter((s) => s.languages.includes(lang)).length

  return (
    <div>
      {/* language workflow banner — where this project is and what to do next */}
      <div className="guide" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <div className="info info-blue">
          <div className="info-head"><span className="i-ico">🧭</span>How this language project works</div>
          <p style={{ marginBottom: 10 }}>
            Work through the stages in the left rail in order. <b>Start with the bibliography</b> (Stage 0):
            document the grammars and papers for {ws.name}, then select 8–10 phenomena from that literature,
            build gold-standard templates, and finally validate &amp; scale with native speakers.
          </p>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <span className="tag" style={{ background: '#F1EAFB', color: '#5C3F92', border: 'none' }}>📚 {refCount} references</span>
            <span className="tag" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: 'none' }}>① {st.phenCount} phenomena</span>
            <span className="tag" style={{ background: 'var(--good-bg)', color: 'var(--good)', border: 'none' }}>② {st.tplCount} templates</span>
            <span className="tag" style={{ background: 'var(--contrast-bg)', color: 'var(--contrast)', border: 'none' }}>③ {st.pairCount} validated pairs</span>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
            onClick={() => go({ view: 'xblimps', workspaceId: null, section: 'Bibliography', focus: lang })}>
            📚 Open {ws.name} bibliography
          </button>
        </div>
      </div>

      <Dashboard ws={ws} />

      <div className="row" style={{ gap: 6, margin: '22px 0 16px', flexWrap: 'wrap' }}>
        {PANES.map((p) => (
          <button key={p} className={`btn btn-sm ${pane === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPane(p)}>
            {p}
          </button>
        ))}
      </div>

      {pane === 'Notebook' && (
        <div className="faint" style={{ fontSize: 13 }}>
          The dashboard above is your project at a glance. Use the tabs to open full notes, tasks, files and deadlines.
        </div>
      )}
      {pane === 'Notes' && <Notes workspaceId={ws.id} />}
      {pane === 'Tasks' && <Tasks workspaceId={ws.id} />}
      {pane === 'Files' && <Files workspaceId={ws.id} />}
      {pane === 'Calendar' && <Calendar workspaceId={ws.id} />}
    </div>
  )
}
