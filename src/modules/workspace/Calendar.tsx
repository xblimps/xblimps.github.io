import React, { useState } from 'react'
import { store, ident } from '../../lib/store'
import type { CalendarEvent } from '../../lib/types'
import { uid } from '../../lib/id'

const KIND_COLOUR: Record<string, string> = { deadline: 'var(--bad)', session: 'var(--accent)', milestone: 'var(--good)', note: 'var(--ink-faint)' }
const TODAY = '2026-06-28'

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7)) // Monday-first
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cells.push(d) }
  return cells
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function CalendarView({ workspaceId, compact }: { workspaceId: string; compact?: boolean }) {
  const events = store.db.events.filter((e) => e.workspace_id === workspaceId)
  const [cursor, setCursor] = useState(() => new Date(2026, 5, 1))
  const [title, setTitle] = useState(''); const [date, setDate] = useState(TODAY)

  if (compact) {
    const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).filter((e) => e.date >= TODAY).slice(0, 4)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map((e) => (
          <div key={e.row_uid} className="row">
            <span className="prio-dot" style={{ background: KIND_COLOUR[e.kind] }} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{e.title}</span>
            <span className="faint mono" style={{ fontSize: 12 }}>{e.date.slice(5)}</span>
          </div>
        ))}
        {upcoming.length === 0 && <div className="faint" style={{ fontSize: 13 }}>No upcoming deadlines.</div>}
      </div>
    )
  }

  const cells = monthMatrix(cursor.getFullYear(), cursor.getMonth())
  const add = () => {
    if (!title.trim()) return
    store.upsert('events', { ...ident(), id: uid(), workspace_id: workspaceId, title: title.trim(), date, kind: 'deadline' } as CalendarEvent)
    setTitle('')
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <input className="field" placeholder="Event…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="field" type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-primary" onClick={add}>Add</button>
      </div>
      <div className="card">
        <div className="between" style={{ marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
          <b>{cursor.toLocaleString('en', { month: 'long', year: 'numeric' })}</b>
          <button className="btn btn-ghost btn-sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
        </div>
        <div className="cal-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="cal-head">{d}</div>)}
          {cells.map((d, i) => {
            const di = iso(d)
            const inMonth = d.getMonth() === cursor.getMonth()
            const evs = events.filter((e) => e.date === di)
            return (
              <div key={i} className={`cal-cell ${inMonth ? '' : 'muted'} ${di === TODAY ? 'today' : ''}`}>
                <div>{d.getDate()}</div>
                {evs.map((e) => <div key={e.row_uid} className="cal-ev" style={{ background: KIND_COLOUR[e.kind] + '22', color: KIND_COLOUR[e.kind] }} title={e.title}>{e.title}</div>)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Calendar({ workspaceId }: { workspaceId: string }) {
  return <CalendarView workspaceId={workspaceId} />
}
