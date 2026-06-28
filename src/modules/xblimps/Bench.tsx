// Syntax bench — the typological validator's workspace. Cross-language by design: every template
// is grouped by its phenomenon family (agreement, binding, case …) so a syntactician can compare
// the same construction across Welsh / Catalan / French / German at once, inspect the analysis and
// its reference grammars, skim sample derived pairs, and validate or flag the template. A second
// tab is the reusable BibTeX source library (import / export .bib, tag by language + phenomenon).

import React, { useMemo, useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Template, Source, TemplateStatus } from '../../lib/types'
import { uid, now } from '../../lib/id'
import { Panel } from '../../components/ui'
import { perturbationHue, perturbationLabel } from '../../lib/perturbations'
import { expandTemplate } from '../../lib/derive'
import { parseBibtex, toBibtex } from '../../lib/bibtex'

function download(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  URL.revokeObjectURL(a.href)
}

const STATUS_HUE: Record<TemplateStatus, string> = {
  draft: '#7A5C2E', in_review: '#185FA5', validated: '#1D9E75', flagged: '#D85A30',
}
const STATUSES: TemplateStatus[] = ['draft', 'in_review', 'validated', 'flagged']

const langName = (code: string) => store.db.workspaces.find((w) => w.language === code)?.name ?? code

function familyOf(t: Template): string {
  return store.db.phenomena.find((p) => p.id === t.phenomenon_id)?.family ?? 'uncategorised'
}

// ── one template row in the validator ──
function TemplateRow({ tpl, divergent }: { tpl: Template; divergent: { pert: boolean; contrast: boolean } }) {
  const setStatus = (status: TemplateStatus) =>
    store.patch('templates', tpl.row_uid, { validation: { ...tpl.validation, status, validated_by: status === 'validated' ? store.db.session.user : tpl.validation.validated_by } })
  const setNote = (typology_note: string) => store.patch('templates', tpl.row_uid, { validation: { ...tpl.validation, typology_note } })
  const addComment = (text: string) => store.patch('templates', tpl.row_uid, { validation: { ...tpl.validation, comments: [...tpl.validation.comments, { user: store.db.session.user, ts: now(), text }] } })

  const samples = useMemo(() => [0, 1].map((s) => expandTemplate(tpl, s)), [tpl, tpl.rev])
  const phue = perturbationHue(tpl.analysis.perturbation.type)
  const stHue = STATUS_HUE[tpl.validation.status]
  const cites = tpl.citations.map((c) => store.db.sources.find((s) => s.id === c.source_id)).filter(Boolean) as Source[]

  return (
    <div className="card" style={{ marginBottom: 12, borderLeft: `3px solid ${stHue}` }}>
      <div className="between" style={{ marginBottom: 8 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="nav-dot" style={{ background: store.db.workspaces.find((w) => w.language === tpl.language)?.colour ?? '#999' }} />
          <b>{langName(tpl.language)}</b>
          <span className="faint" style={{ fontSize: 13 }}>{tpl.name}</span>
        </div>
        <div className="row" style={{ gap: 4 }}>
          {STATUSES.map((s) => (
            <button key={s} className="btn btn-sm" title={s}
              style={{ background: tpl.validation.status === s ? STATUS_HUE[s] : STATUS_HUE[s] + '14', color: tpl.validation.status === s ? '#fff' : STATUS_HUE[s], border: 'none' }}
              onClick={() => setStatus(s)}>{s === 'validated' ? '✓ validate' : s === 'flagged' ? '⚑ flag' : s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span className="tag" style={{ background: phue + '18', color: phue, border: 'none' }} title={tpl.analysis.perturbation.description}>
          {perturbationLabel(tpl.analysis.perturbation.type)} · {tpl.analysis.paradigm}
        </span>
        {tpl.analysis.feature_contrast && <span className="tag">⊕ {tpl.analysis.feature_contrast}</span>}
        {divergent.pert && <span className="tag" style={{ background: '#D85A3018', color: '#D85A30', border: 'none' }} title="Perturbation type differs from siblings in this family">⚠ perturbation differs from family</span>}
        {divergent.contrast && <span className="tag" style={{ background: '#BA751718', color: '#BA7517', border: 'none' }} title="Contrast feature differs from siblings in this family">⚠ contrast differs from family</span>}
      </div>

      {cites.length > 0 && (
        <div className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>
          📖 {cites.map((s, i) => {
            const c = tpl.citations[i]
            return `${s.author.split(' and ')[0].split(',')[0]} (${s.year})${c?.page ? ` p.${c.page}` : ''}${c?.example ? ` ex.${c.example}` : ''}`
          }).join(' · ')}
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 8 }}>
        {samples.map((s, i) => (
          <Panel key={i} hue="#1D9E75" label={`sample ${i + 1}`}>
            <div className="serif" style={{ fontSize: 14 }}>{s.good}</div>
            <div className="serif faint" style={{ fontSize: 13, textDecoration: 'line-through' }}>{s.bad}</div>
          </Panel>
        ))}
      </div>

      <input className="field" style={{ fontSize: 13, marginBottom: 8 }} placeholder="Typological note — judgment, cross-linguistic comparison…" defaultValue={tpl.validation.typology_note ?? ''} onBlur={(e) => setNote(e.target.value)} />
      {tpl.validation.comments.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {tpl.validation.comments.map((c, i) => (
            <div key={i} className="faint" style={{ fontSize: 12.5 }}><b>{c.user}:</b> {c.text}</div>
          ))}
        </div>
      )}
      <input className="field" style={{ fontSize: 13 }} placeholder="+ comment (Enter)" onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLInputElement).value) { addComment((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' }
      }} />
    </div>
  )
}

function ByFamily() {
  const templates = store.db.templates
  const families = useMemo(() => {
    const by: Record<string, Template[]> = {}
    templates.forEach((t) => { (by[familyOf(t)] ??= []).push(t) })
    return Object.entries(by).sort((a, b) => b[1].length - a[1].length)
  }, [templates])

  return (
    <div>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
        Every template across all languages, grouped by cross-linguistic family. Compare the analysis and its
        reference grammars side by side, then validate or flag. ⚠ markers flag a template whose perturbation or
        contrast feature diverges from its siblings in the same family.
      </p>
      {families.map(([family, tpls]) => {
        const pertTypes = new Set(tpls.map((t) => t.analysis.perturbation.type))
        const contrasts = new Set(tpls.map((t) => t.analysis.feature_contrast).filter(Boolean))
        const validated = tpls.filter((t) => t.validation.status === 'validated').length
        return (
          <div key={family} style={{ marginBottom: 24 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <h2 className="section" style={{ margin: 0 }}>{family} <span className="faint" style={{ fontWeight: 400, fontSize: 14 }}>· {tpls.length} template{tpls.length > 1 ? 's' : ''} · {[...new Set(tpls.map((t) => t.language))].map(langName).join(', ')}</span></h2>
              <span className="tag pill-good">{validated}/{tpls.length} validated</span>
            </div>
            {tpls.map((t) => (
              <TemplateRow key={t.row_uid} tpl={t}
                divergent={{ pert: pertTypes.size > 1, contrast: contrasts.size > 1 && !!t.analysis.feature_contrast }} />
            ))}
          </div>
        )
      })}
      {families.length === 0 && <div className="empty"><div className="big">🧬</div>No templates yet — author some in a language workspace.</div>}
    </div>
  )
}

// ── BibTeX source library ──
function Sources() {
  const sources = store.db.sources
  const [bib, setBib] = useState('')
  const usedBy = (id: string) => store.db.templates.filter((t) => t.citations.some((c) => c.source_id === id)).length

  const importBib = () => {
    const parsed = parseBibtex(bib)
    let added = 0
    parsed.forEach((s) => {
      const existing = sources.find((x) => x.citekey === s.citekey)
      if (existing) store.patch('sources', existing.row_uid, { bibtex: s.bibtex, author: s.author, title: s.title, year: s.year })
      else { store.upsert('sources', { ...s, ...ident(), rev: 1 }); added++ }
    })
    setBib('')
    if (parsed.length) alert(`Imported ${parsed.length} entr${parsed.length > 1 ? 'ies' : 'y'} (${added} new).`)
  }

  const addBlank = () => {
    const key = 'newkey' + uid().slice(0, 4)
    store.upsert('sources', { ...ident(), rev: 1, id: 'src.' + key, citekey: key, entry_type: 'book', author: '', year: '', title: '', bibtex: '', languages: [], phenomena: [], note: '' })
  }
  const patch = (s: Source, fields: Partial<Source>) => store.patch('sources', s.row_uid, fields as any)
  const editTags = (s: Source, key: 'languages' | 'phenomena', value: string) =>
    patch(s, { [key]: value.split(',').map((x) => x.trim()).filter(Boolean) } as any)

  return (
    <div>
      <div className="between" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>The reference-grammar bibliography, shared across templates and tagged by language + phenomenon.</p>
        <div className="row">
          <button className="btn btn-sm" onClick={addBlank}>+ Entry</button>
          <button className="btn btn-sm" onClick={() => download('xblimps_references.bib', toBibtex(sources))}>⬇ Export .bib</button>
        </div>
      </div>

      <Panel hue="#534AB7" label="Import BibTeX — paste entries, matched by citekey">
        <textarea className="field mono" rows={3} style={{ fontSize: 11.5 }} placeholder="@book{borsley2009, author = {…}, title = {…}, year = {2009}}" value={bib} onChange={(e) => setBib(e.target.value)} />
        <div style={{ marginTop: 8, textAlign: 'right' }}><button className="btn btn-primary btn-sm" disabled={!bib.trim()} onClick={importBib}>Import</button></div>
      </Panel>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sources.map((s) => (
          <div key={s.row_uid} className="card">
            <div className="between" style={{ marginBottom: 6 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="tag mono">{s.citekey}</span>
                <span className="faint" style={{ fontSize: 12 }}>{usedBy(s.id)} template{usedBy(s.id) === 1 ? '' : 's'}</span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => store.remove('sources', s.row_uid)}>✕</button>
            </div>
            <div className="grid grid-2" style={{ gap: 8 }}>
              <input className="field" style={{ fontSize: 13 }} placeholder="author" value={s.author} onChange={(e) => patch(s, { author: e.target.value })} />
              <input className="field" style={{ fontSize: 13 }} placeholder="year" value={s.year} onChange={(e) => patch(s, { year: e.target.value })} />
            </div>
            <input className="field" style={{ fontSize: 13, marginTop: 8 }} placeholder="title" value={s.title} onChange={(e) => patch(s, { title: e.target.value })} />
            <div className="grid grid-2" style={{ gap: 8, marginTop: 8 }}>
              <div>
                <label className="lbl">Languages</label>
                <input className="field mono" style={{ fontSize: 12 }} placeholder="cy, ca" defaultValue={s.languages.join(', ')} onBlur={(e) => editTags(s, 'languages', e.target.value)} />
              </div>
              <div>
                <label className="lbl">Phenomena</label>
                <input className="field mono" style={{ fontSize: 12 }} placeholder="agreement, clitics" defaultValue={s.phenomena.join(', ')} onBlur={(e) => editTags(s, 'phenomena', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {sources.length === 0 && <div className="empty"><div className="big">📚</div>No sources yet — import a .bib or add an entry.</div>}
      </div>
    </div>
  )
}

export default function Bench() {
  const [tab, setTab] = useState<'family' | 'sources'>('family')
  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <div className="row" style={{ gap: 4, margin: '0 0 20px', borderBottom: '1px solid var(--hair)' }}>
        {([['family', 'Templates by family'], ['sources', 'Sources']] as const).map(([k, label]) => (
          <button key={k} className="btn btn-ghost btn-sm" onClick={() => setTab(k)}
            style={{ borderRadius: 0, borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent', color: tab === k ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: tab === k ? 600 : 500 }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'family' ? <ByFamily /> : <Sources />}
    </div>
  )
}
