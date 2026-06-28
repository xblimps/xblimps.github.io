import React, { useState } from 'react'
import { store } from '../../lib/store'
import type { MinimalPair, Source } from '../../lib/types'
import { Panel } from '../../components/ui'
import { perturbationLabel, perturbationHue } from '../../lib/perturbations'
import { toBibtex } from '../../lib/bibtex'
import { backupToHuggingFace } from '../../lib/hf'

// the reference-grammar sources cited by the templates behind a set of pairs
function citedSources(pairs: MinimalPair[]): Source[] {
  const tplIds = new Set(pairs.map((p) => p.template_id))
  const srcIds = new Set<string>()
  store.db.templates.filter((t) => tplIds.has(t.id)).forEach((t) => t.citations.forEach((c) => srcIds.add(c.source_id)))
  return store.db.sources.filter((s) => srcIds.has(s.id))
}

// a compact "Author (Year)" citation string for a pair, via its template
function citationLabel(p: MinimalPair): string {
  const tpl = store.db.templates.find((t) => t.id === p.template_id)
  if (!tpl) return ''
  return tpl.citations.map((c) => {
    const s = store.db.sources.find((x) => x.id === c.source_id)
    if (!s) return ''
    return `${s.author.split(' and ')[0].split(',')[0]} ${s.year}${c.page ? `:${c.page}` : ''}`
  }).filter(Boolean).join('; ')
}

function download(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  URL.revokeObjectURL(a.href)
}

const csvCell = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`

function toCSV(pairs: MinimalPair[]) {
  const cols = ['id', 'language', 'phenomenon_id', 'paradigm', 'sentence_good', 'sentence_bad', 'contrast_tokens', 'feature_contrast', 'status', 'author', 'naturalness_score', 'prolific_score']
  const head = cols.join(',')
  const rows = pairs.map((p) => cols.map((c) => csvCell(Array.isArray((p as any)[c]) ? (p as any)[c].join(' | ') : (p as any)[c])).join(','))
  return [head, ...rows].join('\n')
}

// CoNLL-U: prefer stored annotation; else a minimal stub from the sentence
function toCoNLLU(pairs: MinimalPair[]) {
  return pairs.map((p, i) => {
    const pe = p.perturbation
    const cite = citationLabel(p)
    const meta = `# sent_id = ${p.id}\n# text = ${p.sentence_good}\n# phenomenon = ${p.phenomenon_id}\n# minimalist_parse = ${p.parse_good || '_'}\n# features = ${Object.entries(p.features || {}).map(([k, v]) => `${k}=${v}`).join('|') || '_'}\n# perturbation = ${pe ? `${pe.type}|target=${pe.target}|depth=${pe.depth}` : '_'}\n# reference = ${cite || '_'}`
    const body = p.conll?.trim()
      ? p.conll.trim()
      : p.sentence_good.replace(/[.?!]$/, '').split(/\s+/).map((w, j) =>
          `${j + 1}\t${w}\t_\t_\t_\t_\t${j === 0 ? 0 : 1}\t${j === 0 ? 'root' : 'dep'}`).join('\n')
    return `${meta}\n${body}\n`
  }).join('\n')
}

function toJSON(pairs: MinimalPair[]) {
  return JSON.stringify(pairs.map((p) => ({
    id: p.id, language: p.language, phenomenon: p.phenomenon_id, paradigm: p.paradigm,
    sentence_good: p.sentence_good, sentence_bad: p.sentence_bad, contrast_tokens: p.contrast_tokens,
    minimalist_parse_good: p.parse_good, minimalist_parse_bad: p.parse_bad, gloss: p.gloss,
    conllu: p.conll, features: p.features, feature_contrast: p.feature_contrast,
    perturbation: p.perturbation, reference: citationLabel(p), status: p.status,
  })), null, 2)
}

function toProlific(pairs: MinimalPair[]) {
  const head = 'item_id,sentence,task'
  const rows = pairs.flatMap((p) => [
    `${p.id}_g,${csvCell(p.sentence_good)},grammaticality+naturalness`,
    `${p.id}_b,${csvCell(p.sentence_bad)},grammaticality+naturalness`,
  ])
  return [head, ...rows].join('\n')
}

export default function Validation({ language }: { language: string }) {
  const all = store.db.pairs.filter((p) => p.language === language)
  const accepted = all.filter((p) => ['accepted', 'edited', 'validated'].includes(p.status))
  const featural = all.filter((p) => p.paradigm === 'featural')
  const [n, setN] = useState(50)
  const [preview, setPreview] = useState('')
  const [backup, setBackup] = useState<{ busy: boolean; msg: string; ok?: boolean }>({ busy: false, msg: '' })

  const runBackup = async () => {
    setBackup({ busy: true, msg: 'Mirroring all templates, pairs & metadata to HuggingFace…' })
    try {
      const r = await backupToHuggingFace()
      if (!r.ok) { setBackup({ busy: false, ok: false, msg: r.error || 'Backup failed' }); return }
      const total = Object.values(r.counts || {}).reduce((a, b) => a + b, 0)
      setBackup({ busy: false, ok: true, msg: `✓ Backed up ${total} records to ${(r.datasets || []).length} private dataset(s)${r.user ? ` as ${r.user}` : ''}.` })
    } catch (e: any) { setBackup({ busy: false, ok: false, msg: e?.message || 'Network error' }) }
  }

  const sample = () => {
    // stratified by phenomenon
    const byPhen: Record<string, MinimalPair[]> = {}
    accepted.forEach((p) => { (byPhen[p.phenomenon_id] ??= []).push(p) })
    const keys = Object.keys(byPhen)
    const per = Math.max(1, Math.floor(n / Math.max(1, keys.length)))
    const out: MinimalPair[] = []
    keys.forEach((k) => out.push(...byPhen[k].slice(0, per)))
    return out.slice(0, n)
  }

  const cards = [
    { t: 'Minimal-pair CSV', d: 'minimal_pair_row schema for the benchmarking pipeline', go: () => download(`xblimps_${language}.csv`, toCSV(accepted), 'text/csv') },
    { t: 'CoNLL-U', d: 'Dependency annotation + Minimalist parse + features in comments — grammar induction & acquisition models', go: () => download(`xblimps_${language}.conllu`, toCoNLLU(accepted)) },
    { t: 'JSON (rich)', d: 'Full records incl. Minimalist parses, gloss, feature bundles', go: () => download(`xblimps_${language}.json`, toJSON(accepted), 'application/json') },
    { t: 'Prolific batch', d: 'Stratified grammaticality + naturalness sample', go: () => { const s = sample(); download(`prolific_${language}.csv`, toProlific(s), 'text/csv') } },
    { t: 'References (.bib)', d: 'BibTeX for every reference grammar cited by accepted pairs', go: () => download(`xblimps_${language}.bib`, toBibtex(citedSources(accepted))) },
  ]

  return (
    <div>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card stat"><span className="n">{all.length}</span><span className="l">candidates total</span></div>
        <div className="card stat"><span className="n">{accepted.length}</span><span className="l">accepted / validated</span></div>
        <div className="card stat"><span className="n">{featural.length}</span><span className="l">featural pairs (SAE)</span></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Fine-grained perturbation coverage</div>
        {(() => {
          const counts: Record<string, number> = {}
          all.forEach((p) => { const k = p.perturbation?.type ?? 'none'; counts[k] = (counts[k] ?? 0) + 1 })
          const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
          if (entries.length === 0) return <div className="faint" style={{ fontSize: 13 }}>No perturbations annotated yet.</div>
          return (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {entries.map(([k, c]) => (
                <span key={k} className="tag" style={{ background: perturbationHue(k) + '18', color: perturbationHue(k), border: 'none' }}>
                  {perturbationLabel(k)} · {c}
                </span>
              ))}
            </div>
          )
        })()}
      </div>

      <Panel hue="#185FA5" label="Stage 4 — validation & export">
        <p style={{ margin: '4px 0 12px', fontSize: 14 }}>Draw a stratified sample to Prolific (grammaticality + naturalness), then re-ingest scores. Export the shared corpus for the benchmarking subsystem and for grammar-induction / acquisition models.</p>
        <div className="row" style={{ marginBottom: 14 }}>
          <label className="lbl" style={{ margin: 0 }}>Prolific sample size</label>
          <input className="field" type="number" style={{ width: 100 }} value={n} onChange={(e) => setN(+e.target.value)} />
        </div>
      </Panel>

      <div className="card between" style={{ marginBottom: 20, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Back up everything to HuggingFace</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Mirrors the <b>entire project</b> — all languages' templates, minimal pairs, phenomena, sources,
            notes and the audit ledger — to private datasets under the xBLiMPs org. Zero information loss.
          </div>
          {backup.msg && <div style={{ fontSize: 13, marginTop: 6, color: backup.ok === false ? 'var(--bad, #c0392b)' : 'var(--ink-soft)' }}>{backup.msg}</div>}
        </div>
        <button className="btn btn-primary" disabled={backup.busy} onClick={runBackup}>
          {backup.busy ? 'Backing up…' : 'Back up now'}
        </button>
      </div>

      <h2 className="section">Exports</h2>
      <div className="grid grid-2">
        {cards.map((c) => (
          <div key={c.t} className="card between">
            <div>
              <div style={{ fontWeight: 600 }}>{c.t}</div>
              <div className="muted" style={{ fontSize: 13 }}>{c.d}</div>
            </div>
            <button className="btn btn-primary" onClick={c.go}>Export</button>
          </div>
        ))}
      </div>

      <h2 className="section">Accepted examples</h2>
      <div className="card" style={{ padding: 0 }}>
        {accepted.slice(0, 30).map((p) => (
          <div key={p.id} className="task-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 15 }}>{p.sentence_good}</div>
              <div className="serif faint" style={{ fontSize: 14, textDecoration: 'line-through' }}>{p.sentence_bad}</div>
              {p.parse_good && <div className="mono faint" style={{ fontSize: 11, marginTop: 3 }}>{p.parse_good}</div>}
            </div>
            <span className={`tag ${p.paradigm === 'featural' ? 'pill-accent' : ''}`}>{p.paradigm}</span>
            <span className="tag pill-good">{p.status}</span>
          </div>
        ))}
        {accepted.length === 0 && <div className="faint" style={{ padding: 16 }}>No accepted examples yet — generate some in the card flow.</div>}
      </div>
    </div>
  )
}
