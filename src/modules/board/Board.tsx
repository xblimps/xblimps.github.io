// Completion board — replaces the old personal notebook. A community-wide view of progress
// toward the 100-template / 100k-sentence goal: every template bucketed by status, a contribution
// leaderboard, and the signed-in user's own profile of contributed templates.

import React, { useState } from 'react'
import { store } from '../../lib/store'
import { Bar, Ring } from '../../components/ui'
import Guide from './Guide'

const ACCEPTED = ['accepted', 'edited', 'validated']
export const TARGET_TEMPLATES = 100
export const TARGET_PER_TPL = 1000
export const TARGET_SENTENCES = TARGET_TEMPLATES * TARGET_PER_TPL // 100,000

type TplStatus = 'done' | 'progress' | 'none'
const STATUS_META: Record<TplStatus, { label: string; hue: string; icon: string }> = {
  done: { label: 'Completed', hue: '#1D9E75', icon: '✓' },
  progress: { label: 'In progress', hue: '#BA7517', icon: '◐' },
  none: { label: 'No contributions', hue: '#9A958C', icon: '○' },
}

const fmt = (n: number) => n.toLocaleString('en-US')

function Stat({ label, value, sub, pct }: { label: string; value: string; sub?: string; pct?: number }) {
  return (
    <div className="card">
      <div className="eyebrow">{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 2 }}>{value}</div>
      {sub && <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>}
      {pct != null && <div style={{ marginTop: 10 }}><Bar pct={pct} /></div>}
    </div>
  )
}

export default function Board() {
  const [tab, setTab] = useState<'guide' | 'board' | 'leaderboard' | 'profile'>('guide')
  const me = store.db.session.user

  const templates = store.db.templates
  const pairs = store.db.pairs
  const langName = (code?: string) => store.db.workspaces.find((w) => w.kind === 'language' && w.language === code)?.name ?? code ?? '—'
  const validatedFor = (tid: string) => pairs.filter((p) => p.template_id === tid && ACCEPTED.includes(p.status)).length
  const statusOf = (t: typeof templates[number]): TplStatus => {
    const v = validatedFor(t.id)
    if (t.validation?.status === 'validated' || v >= TARGET_PER_TPL) return 'done'
    if (v > 0 || t.validation?.status === 'in_review') return 'progress'
    return 'none'
  }

  const withStatus = templates.map((t) => ({ t, status: statusOf(t), v: validatedFor(t.id) }))
  const counts: Record<TplStatus, number> = { done: 0, progress: 0, none: 0 }
  withStatus.forEach((x) => { counts[x.status]++ })
  const totalValidated = pairs.filter((p) => ACCEPTED.includes(p.status)).length
  const overallPct = Math.round((counts.done / TARGET_TEMPLATES) * 100)

  // contributors — templates authored (by last editor) + validated sentences submitted
  const contrib: Record<string, { tpl: Set<string>; sents: number }> = {}
  const bump = (name: string) => (contrib[name] ??= { tpl: new Set(), sents: 0 })
  templates.forEach((t) => bump(t.updated_by || '—').tpl.add(t.id))
  pairs.filter((p) => ACCEPTED.includes(p.status)).forEach((p) => bump(p.author || '—').sents++)
  bump(me) // always include the signed-in user
  const rows = Object.entries(contrib)
    .map(([name, c]) => ({ name, templates: c.tpl.size, sentences: c.sents, completion: Math.round((c.tpl.size / TARGET_TEMPLATES) * 100) }))
    .sort((a, b) => b.sentences - a.sentences || b.templates - a.templates)

  const TplCard = ({ t, status, v }: { t: typeof templates[number]; status: TplStatus; v: number }) => {
    const m = STATUS_META[status]
    return (
      <div className="card" style={{ padding: 14, borderLeft: `3px solid ${m.hue}` }}>
        <div className="between" style={{ marginBottom: 6 }}>
          <span className="tag" style={{ background: m.hue + '18', color: m.hue, border: 'none' }}>{m.icon} {m.label}</span>
          <span className="faint mono" style={{ fontSize: 11 }}>{langName(t.language)}</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
        <div className="faint" style={{ fontSize: 11.5, margin: '4px 0 8px' }}>by {t.updated_by || '—'}</div>
        <Bar pct={(v / TARGET_PER_TPL) * 100} />
        <div className="faint mono" style={{ fontSize: 11, marginTop: 4 }}>{fmt(v)} / {fmt(TARGET_PER_TPL)} sentences</div>
      </div>
    )
  }

  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>Completion board</h1>
      <p className="muted" style={{ marginTop: 6 }}>Community progress toward {TARGET_TEMPLATES} templates and {fmt(TARGET_SENTENCES)} validated sentences.</p>

      <div className="row" style={{ gap: 6, margin: '16px 0 20px', flexWrap: 'wrap' }}>
        {(['guide', 'board', 'leaderboard', 'profile'] as const).map((t) => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'guide' ? '📖 Guide' : t === 'board' ? 'Completion board' : t === 'leaderboard' ? 'Leaderboard' : 'My profile'}
          </button>
        ))}
      </div>

      {tab === 'guide' && <Guide />}

      {/* ── community stats (shown on the progress tabs) ── */}
      {tab !== 'guide' && (
      <div className="grid grid-3" style={{ marginBottom: 8 }}>
        <Stat label="Templates" value={`${templates.length} / ${TARGET_TEMPLATES}`} pct={(templates.length / TARGET_TEMPLATES) * 100} />
        <Stat label="Completed templates" value={`${counts.done}`} sub={`${counts.progress} in progress · ${counts.none} untouched`} pct={overallPct} />
        <Stat label="Validated sentences" value={`${fmt(totalValidated)} / ${fmt(TARGET_SENTENCES)}`} pct={(totalValidated / TARGET_SENTENCES) * 100} />
      </div>
      )}

      {tab === 'board' && (
        <div style={{ marginTop: 18 }}>
          {(['done', 'progress', 'none'] as TplStatus[]).map((s) => {
            const items = withStatus.filter((x) => x.status === s)
            const m = STATUS_META[s]
            return (
              <div key={s} style={{ marginBottom: 24 }}>
                <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: m.hue }} />
                  <div className="eyebrow" style={{ margin: 0 }}>{m.label}</div>
                  <span className="nav-count" style={{ marginLeft: 0 }}>{items.length}</span>
                </div>
                {items.length === 0
                  ? <div className="faint" style={{ fontSize: 12.5 }}>None.</div>
                  : <div className="grid grid-3">{items.map((x) => <TplCard key={x.t.id} {...x} />)}</div>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card" style={{ marginTop: 18, padding: 0, overflow: 'hidden' }}>
          <table className="board-table">
            <thead>
              <tr><th>#</th><th>Contributor</th><th>Templates</th><th>Validated sentences</th><th style={{ width: 180 }}>Completion</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className={r.name === me ? 'me-row' : ''}>
                  <td className="mono faint">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}{r.name === me && <span className="faint" style={{ fontWeight: 400 }}> · you</span>}</td>
                  <td className="mono">{r.templates}</td>
                  <td className="mono">{fmt(r.sentences)}</td>
                  <td><div className="row" style={{ gap: 8 }}><Bar pct={r.completion} /><span className="mono faint" style={{ fontSize: 11 }}>{r.completion}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'profile' && (() => {
        const mine = withStatus.filter((x) => (x.t.updated_by || '—') === me)
        const mySents = contrib[me]?.sents ?? 0
        return (
          <div style={{ marginTop: 18 }}>
            <div className="card" style={{ marginBottom: 18 }}>
              <div className="between">
                <div>
                  <div className="eyebrow">Signed in as</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{me}</div>
                  <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>{mine.length} templates contributed · {fmt(mySents)} validated sentences</div>
                </div>
                <Ring pct={(mine.length / TARGET_TEMPLATES) * 100} label={`${mine.length}`} />
              </div>
              <div style={{ marginTop: 12 }}><Bar pct={(mine.length / TARGET_TEMPLATES) * 100} /></div>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{mine.length} / {TARGET_TEMPLATES} templates</div>
            </div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Templates you've contributed to</div>
            {mine.length === 0
              ? <div className="empty"><div className="big">🧩</div>No templates yet — author one in a language project's Template Studio.</div>
              : <div className="grid grid-3">{mine.map((x) => <TplCard key={x.t.id} {...x} />)}</div>}
          </div>
        )
      })()}
    </div>
  )
}
