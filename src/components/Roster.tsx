import React from 'react'
import { store } from '../lib/store'
import { ROSTER } from '../lib/seed'

const STATES = ['invited', 'access_granted', 'trained', 'active', 'complete']
const STATE_LABEL: Record<string, string> = { invited: 'Invited', access_granted: 'Access granted', trained: 'Trained', active: 'Active', complete: 'Complete' }

export default function Roster() {
  const langs = store.db.workspaces.filter((w) => w.kind === 'language')

  return (
    <div className="main-inner" style={{ paddingTop: 8 }}>
      <p className="muted">Each contributor moves invited → access granted → trained → active → complete. The matrix shows who is unblocked and who is the critical path.</p>

      <h2 className="section">Onboarding matrix</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', fontSize: 13 }}>
          <div style={{ padding: '10px 14px', fontWeight: 600, borderBottom: '1px solid var(--hair)' }}>Contributor</div>
          {STATES.map((s) => <div key={s} style={{ padding: '10px 8px', fontWeight: 600, borderBottom: '1px solid var(--hair)', textAlign: 'center', fontSize: 11.5 }} className="faint">{STATE_LABEL[s]}</div>)}
          {ROSTER.map((m, i) => {
            const reached = STATES.indexOf(m.state)
            const ws = langs.find((w) => w.language === m.language)
            return (
              <React.Fragment key={i}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{ws?.icon}</span>
                  <span>{m.name}</span>
                  <span className="tag" style={{ marginLeft: 'auto' }}>{m.role.replace('_', ' ')}</span>
                </div>
                {STATES.map((s, j) => (
                  <div key={s} style={{ padding: '10px 8px', borderBottom: '1px solid var(--hair-2)', textAlign: 'center' }}>
                    {j <= reached ? <span style={{ color: j === reached ? 'var(--good)' : 'var(--ink-faint)' }}>{j === reached ? '●' : '○'}</span> : <span className="faint">·</span>}
                  </div>
                ))}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <h2 className="section">Languages</h2>
      <div className="grid grid-3">
        {langs.map((ws) => {
          const phen = store.db.phenomena.filter((p) => p.language === ws.language)
          const native = ROSTER.find((r) => r.language === ws.language && r.role === 'native_speaker')
          return (
            <div key={ws.id} className="card">
              <div className="row" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{ws.icon}</span>
                <div><div style={{ fontWeight: 600 }}>{ws.name}</div><div className="faint" style={{ fontSize: 12 }}>{ws.tier} · {ws.lead}</div></div>
              </div>
              <div className="row between" style={{ fontSize: 13 }}>
                <span className="muted">{phen.length} phenomena</span>
                <span className={`tag ${native?.state === 'invited' ? 'pill-bad' : native?.state === 'active' ? 'pill-good' : 'pill-amber'}`}>{native ? STATE_LABEL[native.state] : '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
