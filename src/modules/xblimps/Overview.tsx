import React, { useState } from 'react'
import type { Workspace } from '../../lib/types'
import Dashboard from '../workspace/Dashboard'
import Notes from '../workspace/Notes'
import Tasks from '../workspace/Tasks'
import Files from '../workspace/Files'
import Calendar from '../workspace/Calendar'

// The folded "notebook" — a holistic view of the same project info. The old per-page
// tabs (Notes / Tasks / Files / Calendar) no longer clutter the rail; they live here
// under the dashboard board as a lightweight inline segmented control.
const PANES = ['Notebook', 'Notes', 'Tasks', 'Files', 'Calendar'] as const
type Pane = typeof PANES[number]

export default function Overview({ ws }: { ws: Workspace }) {
  const [pane, setPane] = useState<Pane>('Notebook')

  return (
    <div>
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
