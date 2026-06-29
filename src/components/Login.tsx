import React, { useState } from 'react'
import { sendMagicLink, isCloud } from '../lib/auth'
import { useApp } from '../state/AppContext'

const PREVIEWS: { role: 'lead' | 'native_speaker'; label: string; icon: string; blurb: string }[] = [
  { role: 'native_speaker', label: 'Native speaker', icon: '🗣️', blurb: 'Focused Forge — judge minimal-pair cards' },
  { role: 'lead', label: 'Team / lead', icon: '🧑‍🏫', blurb: 'Full workspace — phenomena, templates, cards' },
]

export default function Login() {
  const { demoMode, enterPreview } = useApp()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!email.includes('@')) { setErr('Enter a valid email'); return }
    setBusy(true); setErr('')
    const { error } = await sendMagicLink(email.trim())
    setBusy(false)
    if (error) setErr(error); else setSent(true)
  }

  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', background: 'var(--canvas)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="spine-logo" style={{ margin: '0 auto 16px', width: 54, height: 54, fontSize: 24, borderRadius: 16 }}>x</div>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>xBLiMPs</h1>
          <p className="muted" style={{ marginTop: 6 }}>Multilingual grammatical test-suite platform</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          {!isCloud ? (
            <div className="empty" style={{ padding: '20px 0' }}>
              <p>No backend configured — running in local demo mode.</p>
              <button className="btn btn-primary" onClick={demoMode}>Enter demo</button>
            </div>
          ) : sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>📬</div>
              <h3 style={{ margin: '0 0 6px' }}>Check your inbox</h3>
              <p className="muted" style={{ fontSize: 14 }}>We sent a magic sign-in link to <b>{email}</b>. Open it on this device to continue.</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setSent(false)}>Use a different email</button>
            </div>
          ) : (
            <>
              <label className="lbl" style={{ marginTop: 0 }}>Email address</label>
              <input className="field" type="email" placeholder="you@university.edu" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus />
              {err && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{err}</div>}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} disabled={busy} onClick={submit}>
                {busy ? 'Sending…' : 'Send magic link'}
              </button>
              <p className="faint" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 14 }}>
                Access is invite-only. If you were invited, sign in with the email you were contacted on.
              </p>
            </>
          )}
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
            <span className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.08em' }}>or try a demo login</span>
            <div style={{ flex: 1, height: 1, background: 'var(--hair)' }} />
          </div>
          <div className="grid grid-2" style={{ gap: 10 }}>
            {PREVIEWS.map((p) => (
              <button key={p.role} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: 14 }} onClick={() => enterPreview(p.role)}>
                <div style={{ fontSize: 20 }}>{p.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>{p.label}</div>
                <div className="faint" style={{ fontSize: 11.5, marginTop: 2, lineHeight: 1.4 }}>{p.blurb}</div>
              </button>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 11, textAlign: 'center', marginTop: 10 }}>Demo logins use seeded sample data on this device only — no account or backend.</p>
        </div>

        <p className="faint" style={{ fontSize: 12, textAlign: 'center', marginTop: 18 }}>University of Cambridge · language technologies for under-studied languages</p>
      </div>
    </div>
  )
}
