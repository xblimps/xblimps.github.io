import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Task, TaskStatus } from '../../lib/types'
import { uid } from '../../lib/id'

const PRIO: Record<string, string> = { high: 'var(--bad)', med: 'var(--contrast)', low: 'var(--ink-faint)' }
const cycle: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }

export function TaskList({ workspaceId, compact }: { workspaceId: string; compact?: boolean }) {
  const tasks = store.db.tasks.filter((t) => t.workspace_id === workspaceId)
  const [draft, setDraft] = useState('')

  const add = () => {
    if (!draft.trim()) return
    const t: Task = { ...ident(), id: uid(), workspace_id: workspaceId, title: draft.trim(), status: 'todo', priority: 'med', tags: [], due: '' }
    store.upsert('tasks', t); setDraft('')
  }
  const toggle = (t: Task) => store.patch('tasks', t.row_uid, { status: cycle[t.status] })
  const setPrio = (t: Task) => store.patch('tasks', t.row_uid, { priority: t.priority === 'high' ? 'low' : t.priority === 'low' ? 'med' : 'high' })

  const visible = compact ? tasks.filter((t) => t.status !== 'done').slice(0, 5) : tasks

  return (
    <div>
      {!compact && (
        <div className="row" style={{ marginBottom: 12 }}>
          <input className="field" placeholder="Add a task…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
      )}
      <div className={compact ? '' : 'card'} style={compact ? {} : { padding: 0 }}>
        {visible.map((t) => (
          <div key={t.row_uid} className="task-row">
            <button className={`checkbox ${t.status === 'done' ? 'done' : ''}`} onClick={() => toggle(t)}>
              {t.status === 'done' ? '✓' : t.status === 'doing' ? '◐' : ''}
            </button>
            <span className={`task-title ${t.status === 'done' ? 'done' : ''}`} style={{ flex: 1, fontSize: 14 }}>{t.title}</span>
            {t.due && <span className="tag">{t.due}</span>}
            <button className="prio-dot" style={{ background: PRIO[t.priority], border: 'none' }} title={`priority: ${t.priority}`} onClick={() => setPrio(t)} />
            {!compact && <button className="btn btn-ghost btn-sm" onClick={() => store.remove('tasks', t.row_uid)}>✕</button>}
          </div>
        ))}
        {visible.length === 0 && <div className="faint" style={{ padding: compact ? 0 : 14, fontSize: 13 }}>No tasks.</div>}
      </div>
    </div>
  )
}

export default function Tasks({ workspaceId }: { workspaceId: string }) {
  return <TaskList workspaceId={workspaceId} />
}
