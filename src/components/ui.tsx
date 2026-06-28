import React, { useState } from 'react'
import { NOTEBOOK_COLOURS } from '../lib/seed'

export function Ring({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="ring" style={{ ['--pct' as any]: Math.round(pct) }}>
      <span>{label ?? `${Math.round(pct)}`}</span>
    </div>
  )
}

export function Bar({ pct }: { pct: number }) {
  return <div className="bar"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
}

export function Modal({ title, sub, children, onClose }: { title: string; sub?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="between" style={{ marginBottom: 14 }}>
          <div>
            <h3>{title}</h3>
            {sub && <div className="muted" style={{ fontSize: 13 }}>{sub}</div>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMOJI = ['📓','📔','📕','📗','📘','📙','🗒️','📝','🏴','🇮🇷','🇿🇦','🇵🇭','🇪🇸','🇫🇷','🇩🇪','🌍','🔤','🧩','🧠','✍️','🗣️','📚','🔬','⭐']

export function IconPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="emoji-grid">
      {EMOJI.map((e) => (
        <button key={e} className={`emoji-opt ${e === value ? 'sel' : ''}`} onClick={() => onChange(e)}>{e}</button>
      ))}
    </div>
  )
}

export function ColourPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="swatches">
      {NOTEBOOK_COLOURS.map((c) => (
        <button key={c} className={`swatch ${c === value ? 'sel' : ''}`} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
      ))}
    </div>
  )
}

export function Field({ label, value, onChange, placeholder, textarea }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <div>
      {label && <label className="lbl">{label}</label>}
      {textarea
        ? <textarea className="field" rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </div>
  )
}

export function useToggle(init = false) {
  const [on, setOn] = useState(init)
  return [on, () => setOn(true), () => setOn(false)] as const
}

// pastel panel — colourful annotation container
export function Panel({ hue, label, children }: { hue: string; label?: string; children: React.ReactNode }) {
  const bg = hue + '14' // ~8% alpha
  return (
    <div style={{ background: bg, border: `1px solid ${hue}33`, borderRadius: 12, padding: '12px 14px' }}>
      {label && <div className="eyebrow" style={{ color: hue, marginBottom: 6 }}>{label}</div>}
      {children}
    </div>
  )
}
