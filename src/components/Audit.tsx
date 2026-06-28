import React from 'react'
import { store } from '../lib/store'

export default function Audit() {
  const audit = [...store.db.audit].reverse().slice(0, 200)
  const ops = store.db.ops
  const pending = ops.filter((o) => !o.flushed).length

  return (
    <div className="main-inner" style={{ paddingTop: 8 }}>
      <p className="muted">The append-only ledger. Every mutation is an idempotent op (client op_id) keyed on an immutable row_uid; full state is reconstructable from this log. This is the zero-loss backstop.</p>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card stat"><span className="n">{ops.length}</span><span className="l">ops logged</span></div>
        <div className="card stat"><span className="n">{audit.length > 199 ? '200+' : store.db.audit.length}</span><span className="l">audit entries</span></div>
        <div className="card stat"><span className="n">{pending}</span><span className="l">pending flush</span></div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 110px 1fr 1fr 90px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          {['time', 'entity', 'field', 'change', 'user'].map((h) => (
            <div key={h} className="faint" style={{ padding: '8px 12px', borderBottom: '1px solid var(--hair)', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: '.05em' }}>{h}</div>
          ))}
          {audit.map((a, i) => (
            <React.Fragment key={i}>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--hair-2)' }}>{a.ts.slice(11, 19)}</div>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--hair-2)' }}>{a.entity}</div>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--hair-2)', color: 'var(--accent)' }}>{a.field}</div>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--hair-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${a.old} → ${a.new}`}>
                <span className="faint">{String(a.old).slice(0, 18)}</span> → {String(a.new).slice(0, 22)}
              </div>
              <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--hair-2)' }}>{a.user}</div>
            </React.Fragment>
          ))}
        </div>
        {audit.length === 0 && <div className="faint" style={{ padding: 16 }}>No mutations yet.</div>}
      </div>
    </div>
  )
}
