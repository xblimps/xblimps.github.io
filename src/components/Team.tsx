import React, { useEffect, useState } from 'react'
import { store } from '../lib/store'
import { ROSTER } from '../lib/seed'
import { supabase, isCloud } from '../lib/supabase'
import { useApp } from '../state/AppContext'
import { Modal, Field, useToggle } from './ui'

const STATES = ['invited', 'access_granted', 'trained', 'active', 'complete']
const STATE_LABEL: Record<string, string> = { invited: 'Invited', access_granted: 'Access granted', trained: 'Trained', active: 'Active', complete: 'Complete' }
const LANG_OPTS = [['cy', 'Welsh'], ['fa', 'Persian'], ['af', 'Afrikaans'], ['tl', 'Tagalog'], ['ca', 'Catalan'], ['fr', 'French'], ['de', 'German']]

interface ProfileRow { id: string; email: string; name: string; role: string; languages: string[]; apps: string[]; state: string }

function recruitmentEmail(lang: string, name: string, hours: string, amount: string) {
  const L = LANG_OPTS.find((l) => l[0] === lang)?.[1] ?? '[language X]'
  return `Subject: Native-speaker contributor — ${L} grammatical dataset

Hello ${name || '[name]'},

We are a group of linguists and computer scientists from the University of Cambridge creating better language technologies for under-studied languages. As part of this, we are creating datasets used to test how well language models have learned the grammatical structures of a given language.

To help construct these datasets, we are recruiting native speakers of several languages. We are contacting you because we believe you may be able to help with our ${L} dataset. Involvement would consist of creating example sentences in ${L} for around ten grammatical phenomena already selected by our team of linguists. Each phenomenon requires around 100 sentences, so we estimate an overall commitment of about ${hours || '[X]'} hours. We would compensate contributors £${amount || '[amount]'} for their contributions, and would also like to invite them to be authors of the dataset and the resulting published article.

If you would be interested, we are happy to provide more information or answer any questions.

Best,
The xBLiMPs team`
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState(''); const [name, setName] = useState('')
  const [role, setRole] = useState('native_speaker')
  const [langs, setLangs] = useState<string[]>([])
  const [apps, setApps] = useState<string[]>(['xblimps'])
  const [hours, setHours] = useState('15'); const [amount, setAmount] = useState('150')
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const invite = async () => {
    if (!email.includes('@')) { setMsg('Enter a valid email'); return }
    setBusy(true); setMsg('')
    try {
      const { data } = await supabase!.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), name, role, languages: langs, apps, redirectTo: window.location.origin }),
      })
      const body = await res.json()
      if (!res.ok) setMsg(body.error || 'Invite failed')
      else setMsg(`✓ Invite email sent to ${email}`)
    } catch (e: any) { setMsg(e.message || 'Network error') }
    setBusy(false)
  }

  return (
    <Modal title="Invite contributor" sub="Sends a magic-link invite email and provisions access" onClose={onClose}>
      <Field label="Email" value={email} onChange={setEmail} placeholder="speaker@example.com" />
      <Field label="Name" value={name} onChange={setName} placeholder="Full name" />
      <label className="lbl">Role</label>
      <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
        {['coordinator', 'lead', 'native_speaker', 'reviewer'].map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
      </select>

      <label className="lbl">Language assignments</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {LANG_OPTS.map(([code, label]) => (
          <button key={code} className="tag" style={{ cursor: 'pointer', background: langs.includes(code) ? 'var(--accent)' : undefined, color: langs.includes(code) ? '#fff' : undefined, border: langs.includes(code) ? 'none' : undefined }} onClick={() => toggle(langs, code, setLangs)}>{label}</button>
        ))}
      </div>

      <label className="lbl">App access</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['xblimps', 'xBLiMPs'], ['childes', 'CHILDES annotation']].map(([code, label]) => (
          <button key={code} className="tag" style={{ cursor: 'pointer', background: apps.includes(code) ? 'var(--good)' : undefined, color: apps.includes(code) ? '#fff' : undefined, border: apps.includes(code) ? 'none' : undefined }} onClick={() => toggle(apps, code, setApps)}>{apps.includes(code) ? '✓ ' : ''}{label}</button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>CHILDES access is opt-in — leave it off and the user cannot see or query that project.</p>

      {role === 'native_speaker' && (
        <>
          <div className="row" style={{ marginTop: 12 }}>
            <Field label="Est. hours" value={hours} onChange={setHours} />
            <Field label="Compensation £" value={amount} onChange={setAmount} />
          </div>
          <label className="lbl">Recruitment email preview</label>
          <textarea className="field mono" rows={7} style={{ fontSize: 11.5 }} readOnly value={recruitmentEmail(langs[0] ?? '', name, hours, amount)} />
        </>
      )}

      {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.startsWith('✓') ? 'var(--good)' : 'var(--bad)' }}>{msg}</div>}
      <div style={{ marginTop: 18, textAlign: 'right' }}>
        <button className="btn btn-primary" disabled={busy} onClick={invite}>{busy ? 'Sending…' : 'Send invite'}</button>
      </div>
    </Modal>
  )
}

function CloudTeam() {
  const { profile } = useApp()
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [open, openIt, close] = useToggle()
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const { data } = await supabase!.from('profiles').select('*').order('created_at')
    setRows((data as ProfileRow[]) ?? []); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const updateAccess = async (id: string, field: 'apps' | 'role' | 'state', value: any) => {
    await supabase!.from('profiles').update({ [field]: value }).eq('id', id)
    refresh()
  }

  return (
    <div>
      <div className="between" style={{ marginBottom: 14 }}>
        <p className="muted" style={{ margin: 0 }}>Accounts in the database. Toggle CHILDES access per person — it takes effect immediately via row-level security.</p>
        <div className="row">
          {store.db.phenomena.length === 0 && (
            <button className="btn" title="Populate a fresh database with the phenomenon inventory & language projects"
              onClick={async () => { try { await store.seedCloud(profile.apps) } catch (e: any) { alert('Seed failed: ' + e.message) } }}>Seed starter inventory</button>
          )}
          <button className="btn btn-primary" onClick={openIt}>+ Invite contributor</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr 1fr', fontSize: 13 }}>
          {['Person', 'Role', 'Languages', 'App access', 'State'].map((h) => (
            <div key={h} className="faint" style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair)', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase' }}>{h}</div>
          ))}
          {rows.map((p) => (
            <React.Fragment key={p.id}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)' }}>
                <div style={{ fontWeight: 500 }}>{p.name}</div><div className="faint" style={{ fontSize: 12 }}>{p.email}</div>
              </div>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)' }}>{p.role?.replace('_', ' ')}</div>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)' }}>{(p.languages ?? []).join(', ') || '—'}</div>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['xblimps', 'childes'].map((a) => {
                  const on = (p.apps ?? []).includes(a)
                  return <button key={a} className={`tag ${on ? 'pill-good' : ''}`} style={{ cursor: 'pointer' }}
                    onClick={() => updateAccess(p.id, 'apps', on ? p.apps.filter((x) => x !== a) : [...(p.apps ?? []), a])}>{on ? '✓ ' : ''}{a}</button>
                })}
              </div>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)' }}>{p.state}</div>
            </React.Fragment>
          ))}
        </div>
        {loading && <div className="faint" style={{ padding: 16 }}>Loading…</div>}
        {!loading && rows.length === 0 && <div className="faint" style={{ padding: 16 }}>No accounts yet — invite your first contributor.</div>}
      </div>
      {open && <InviteModal onClose={close} />}
    </div>
  )
}

function DemoMatrix() {
  const langs = store.db.workspaces.filter((w) => w.kind === 'language')
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', fontSize: 13 }}>
        <div style={{ padding: '10px 14px', fontWeight: 600, borderBottom: '1px solid var(--hair)' }}>Contributor</div>
        {STATES.map((s) => <div key={s} className="faint" style={{ padding: '10px 8px', fontWeight: 600, borderBottom: '1px solid var(--hair)', textAlign: 'center', fontSize: 11 }}>{STATE_LABEL[s]}</div>)}
        {ROSTER.map((m, i) => {
          const reached = STATES.indexOf(m.state)
          const ws = langs.find((w) => w.language === m.language)
          return (
            <React.Fragment key={i}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--hair-2)', display: 'flex', gap: 8 }}>
                <span>{ws?.icon}</span><span>{m.name}</span><span className="tag" style={{ marginLeft: 'auto' }}>{m.role.replace('_', ' ')}</span>
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
  )
}

export default function Team() {
  const { profile } = useApp()
  const isCoord = profile.role === 'coordinator'

  return (
    <div className="main-inner" style={{ paddingTop: 8 }}>
      <p className="muted">Each contributor moves invited → access granted → trained → active → complete. Magic-link invites email the contributor and provision their access.</p>
      <h2 className="section">{isCloud ? 'Accounts & access' : 'Onboarding matrix (demo)'}</h2>
      {isCloud && isCoord ? <CloudTeam /> : <DemoMatrix />}
      {isCloud && !isCoord && <p className="faint" style={{ fontSize: 13 }}>Account management is coordinator-only.</p>}
    </div>
  )
}
