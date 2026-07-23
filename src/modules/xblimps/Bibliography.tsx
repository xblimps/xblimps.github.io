// Central BibTeX reference manager — the project's canonical, literature-grounded bibliography.
//
// This is "Stage 0": before any template is built, every phenomenon's examples must be traceable
// to a published source. References are attributed *per language* (which grammars/papers cover
// which language) and *per contributor* (who documented them), and can be exported as .bib for
// the Overleaf paper and pushed to the private HuggingFace bibliography dataset.

import React, { useMemo, useState } from 'react'
import { store, ident } from '../../lib/store'
import { useStore } from '../../state/AppContext'
import type { Source } from '../../lib/types'
import { parseBibtex, sourceToBibtex, toBibtex, groupByLanguage, groupByContributor } from '../../lib/bibtex'
import { downloadText, copyText } from '../../lib/download'
import { backupToHuggingFace, type BackupResult } from '../../lib/hf'

// The project's Overleaf paper (from the project homepage doc). References imported here should be
// pasted into / uploaded as its references.bib.
const OVERLEAF_URL = 'https://www.overleaf.com/1365516448fkrnkvmyjpym'

// team members from the project homepage — seed options for the contributor picker
const TEAM = ['Suchir Salhan', 'Catherine Arnett', 'Lily Goulder', 'Laura Barbenel', 'Aoife O’Driscoll',
  'Nuria Bosch Masip', 'Rigel Cierniak', 'Yury Makarov', 'Theresa Biberauer', 'Ellie']

type View = 'list' | 'lang' | 'contrib'

export default function Bibliography({ initialLanguage }: { initialLanguage?: string }) {
  useStore() // re-render on store changes
  const me = store.db.session.user
  const sources = store.db.sources
  const langWs = store.db.workspaces.filter((w) => w.kind === 'language')
  const langName = (code: string) => langWs.find((w) => w.language === code)?.name ?? code
  const langCodes = useMemo(
    () => [...new Set([...langWs.map((w) => w.language ?? ''), ...sources.flatMap((s) => s.languages)])].filter(Boolean).sort(),
    [langWs, sources],
  )
  const contributors = useMemo(
    () => [...new Set([...TEAM, me, ...sources.map((s) => s.contributor).filter(Boolean) as string[]])],
    [sources, me],
  )

  const [view, setView] = useState<View>('list')
  const [q, setQ] = useState('')
  const [langFilter, setLangFilter] = useState<string>(initialLanguage || 'all')
  const [contribFilter, setContribFilter] = useState<string>('all')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [push, setPush] = useState<{ busy: boolean; res?: BackupResult }>({ busy: false })
  const [flash, setFlash] = useState('')

  const flashMsg = (m: string) => { setFlash(m); setTimeout(() => setFlash(''), 2500) }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return sources.filter((s) => {
      if (langFilter !== 'all' && !s.languages.includes(langFilter)) return false
      if (contribFilter !== 'all' && (s.contributor || '') !== contribFilter) return false
      if (!needle) return true
      return [s.citekey, s.title, s.author, s.year, s.journal, s.publisher, (s.phenomena || []).join(' ')]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    }).sort((a, b) => a.citekey.localeCompare(b.citekey))
  }, [sources, q, langFilter, contribFilter])

  const scopeLabel = langFilter === 'all' ? 'all languages' : langName(langFilter)
  const bibText = () => toBibtex(filtered, scopeLabel)
  const bibName = () => (langFilter === 'all' ? 'references.bib' : `references_${langFilter}.bib`)

  const doDownload = () => downloadText(bibName(), bibText(), 'application/x-bibtex')
  const doCopy = async () => flashMsg((await copyText(bibText())) ? 'Copied .bib to clipboard' : 'Copy failed — use Download instead')
  const doOverleaf = async () => {
    const ok = await copyText(bibText())
    window.open(OVERLEAF_URL, '_blank', 'noopener,noreferrer')
    flashMsg(ok ? 'Copied .bib — paste it into the Overleaf references.bib' : 'Opened Overleaf — use Download to get the .bib')
  }
  const doPush = async () => {
    setPush({ busy: true })
    const res = await backupToHuggingFace()
    setPush({ busy: false, res })
  }

  const del = (s: Source) => { if (confirm(`Delete reference "${s.citekey}"?`)) store.remove('sources', s.row_uid) }

  return (
    <div className="main-inner" style={{ paddingTop: 18 }}>
      <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>Reference bibliography</h1>
      <p className="muted" style={{ marginTop: 6, maxWidth: 720 }}>
        The project's central, literature-grounded reference library — attributed <b>per language</b> and
        <b> per contributor</b>. Build this <b>before</b> templates: every example must trace back to a published
        source. Export as <span className="mono">.bib</span> for the Overleaf paper, or push to the private
        HuggingFace bibliography dataset.
      </p>

      {/* stats */}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="card"><div className="eyebrow">References</div><div style={{ fontSize: 26, fontWeight: 600 }}>{sources.length}</div></div>
        <div className="card"><div className="eyebrow">Languages covered</div><div style={{ fontSize: 26, fontWeight: 600 }}>{new Set(sources.flatMap((s) => s.languages)).size}</div></div>
        <div className="card"><div className="eyebrow">Contributors</div><div style={{ fontSize: 26, fontWeight: 600 }}>{new Set(sources.map((s) => s.contributor).filter(Boolean)).size}</div></div>
      </div>

      {/* toolbar */}
      <div className="row" style={{ gap: 8, margin: '18px 0 8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="field" style={{ maxWidth: 220 }} placeholder="Search references…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field" style={{ maxWidth: 180 }} value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
          <option value="all">All languages</option>
          {langCodes.map((c) => <option key={c} value={c}>{langName(c)}</option>)}
        </select>
        <select className="field" style={{ maxWidth: 180 }} value={contribFilter} onChange={(e) => setContribFilter(e.target.value)}>
          <option value="all">All contributors</option>
          {contributors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="row" style={{ gap: 4 }}>
          {(['list', 'lang', 'contrib'] as View[]).map((vw) => (
            <button key={vw} className={`btn btn-sm ${view === vw ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView(vw)}>
              {vw === 'list' ? 'List' : vw === 'lang' ? 'By language' : 'By contributor'}
            </button>
          ))}
        </div>
        <div className="spacer" style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setEditing(null) }}>+ Add reference</button>
      </div>

      {/* export / push bar */}
      <div className="card" style={{ padding: 12, margin: '8px 0 4px' }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Export {langFilter === 'all' ? '' : `· ${langName(langFilter)}`} ({filtered.length})</span>
          <div className="spacer" style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={doDownload}>⬇ Download .bib</button>
          <button className="btn btn-sm" onClick={doCopy}>⧉ Copy .bib</button>
          <button className="btn btn-sm" onClick={doOverleaf}>📄 Send to Overleaf</button>
          <button className="btn btn-sm btn-primary" disabled={push.busy} onClick={doPush}>
            {push.busy ? 'Pushing…' : '🤗 Push to HuggingFace'}
          </button>
        </div>
        {flash && <div className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>{flash}</div>}
        {push.res && (
          <div style={{ fontSize: 12.5, marginTop: 8, color: push.res.ok ? 'var(--good)' : 'var(--bad)' }}>
            {push.res.ok
              ? `✓ Synced to ${push.res.datasets?.length ?? 0} private dataset(s)${push.res.user ? ` as ${push.res.user}` : ''}. The bibliography lives at xBLiMPs/xblimps-bibliography.`
              : `✗ ${push.res.error}`}
          </div>
        )}
      </div>

      {(adding || editing) && (
        <SourceForm
          key={editing || 'new'}
          source={editing ? sources.find((s) => s.row_uid === editing) : undefined}
          langCodes={langCodes} langName={langName} contributors={contributors} me={me}
          presetLang={langFilter !== 'all' ? langFilter : undefined}
          onDone={() => { setAdding(false); setEditing(null) }}
        />
      )}

      {/* results */}
      <div style={{ marginTop: 16 }}>
        {filtered.length === 0 && (
          <div className="empty"><div className="big">📚</div>
            No references yet{langFilter !== 'all' ? ` for ${langName(langFilter)}` : ''}. Add grammars, syntax papers and dissertations before building templates.
          </div>
        )}

        {view === 'list' && filtered.map((s) => (
          <SourceCard key={s.row_uid} s={s} langName={langName} onEdit={() => { setEditing(s.row_uid); setAdding(false) }} onDelete={() => del(s)}
            onCopy={async () => flashMsg((await copyText(sourceToBibtex(s))) ? `Copied @${s.citekey}` : 'Copy failed')} />
        ))}

        {view === 'lang' && Object.entries(groupByLanguage(filtered)).sort().map(([code, list]) => (
          <Group key={code} title={code === '(unassigned)' ? 'Unassigned' : langName(code)} count={list.length}
            onExport={() => downloadText(`references_${code}.bib`, toBibtex(list, code === '(unassigned)' ? 'unassigned' : langName(code)), 'application/x-bibtex')}>
            {list.map((s) => <SourceCard key={s.row_uid} s={s} langName={langName} onEdit={() => { setEditing(s.row_uid); setAdding(false) }} onDelete={() => del(s)}
              onCopy={async () => flashMsg((await copyText(sourceToBibtex(s))) ? `Copied @${s.citekey}` : 'Copy failed')} />)}
          </Group>
        ))}

        {view === 'contrib' && Object.entries(groupByContributor(filtered)).sort().map(([name, list]) => (
          <Group key={name} title={name} count={list.length}
            onExport={() => downloadText(`references_${name.replace(/\s+/g, '_')}.bib`, toBibtex(list, `contributed by ${name}`), 'application/x-bibtex')}>
            {list.map((s) => <SourceCard key={s.row_uid} s={s} langName={langName} onEdit={() => { setEditing(s.row_uid); setAdding(false) }} onDelete={() => del(s)}
              onCopy={async () => flashMsg((await copyText(sourceToBibtex(s))) ? `Copied @${s.citekey}` : 'Copy failed')} />)}
          </Group>
        ))}
      </div>
    </div>
  )
}

function Group({ title, count, onExport, children }: { title: string; count: number; onExport: () => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <div className="eyebrow" style={{ margin: 0 }}>{title}</div>
        <span className="nav-count">{count}</span>
        <div className="spacer" style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={onExport}>⬇ .bib</button>
      </div>
      {children}
    </div>
  )
}

function SourceCard({ s, langName, onEdit, onDelete, onCopy }:
  { s: Source; langName: (c: string) => string; onEdit: () => void; onDelete: () => void; onCopy: () => void }) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10, borderLeft: '3px solid #534AB7' }}>
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: '#534AB7' }}>{s.citekey}</span>
            <span className="faint" style={{ fontSize: 11.5 }}>{s.entry_type}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 3 }}>{s.title || '(untitled)'}</div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{s.author}{s.year ? ` · ${s.year}` : ''}{s.journal ? ` · ${s.journal}` : s.publisher ? ` · ${s.publisher}` : ''}</div>
        </div>
        <div className="row" style={{ gap: 4, flex: 'none' }}>
          <button className="btn btn-ghost btn-sm" title="Copy this entry" onClick={onCopy}>⧉</button>
          <button className="btn btn-ghost btn-sm" title="Edit attribution" onClick={onEdit}>✎</button>
          <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--bad)' }} onClick={onDelete}>🗑</button>
        </div>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {s.languages.map((l) => <span key={l} className="tag" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: 'none' }}>{langName(l)}</span>)}
        {(s.phenomena || []).map((p) => <span key={p} className="tag">{p}</span>)}
        <span className="tag" style={{ background: '#F1EAFB', color: '#5C3F92', border: 'none' }}>👤 {s.contributor || 'unattributed'}</span>
        {s.url && <a className="tag mono" style={{ textDecoration: 'none' }} href={s.url} target="_blank" rel="noreferrer">↗ link</a>}
      </div>
    </div>
  )
}

// Add / edit a reference. Paste one or more BibTeX @entries (preferred — use published entries), or
// fill the manual fields. Every entry is tagged with the covered language(s) and credited contributor.
function SourceForm({ source, langCodes, langName, contributors, me, presetLang, onDone }:
  { source?: Source; langCodes: string[]; langName: (c: string) => string; contributors: string[]; me: string; presetLang?: string; onDone: () => void }) {
  const isEdit = !!source
  const [bibtex, setBibtex] = useState(source?.bibtex ?? '')
  const [citekey, setCitekey] = useState(source?.citekey ?? '')
  const [author, setAuthor] = useState(source?.author ?? '')
  const [year, setYear] = useState(source?.year ?? '')
  const [title, setTitle] = useState(source?.title ?? '')
  const [url, setUrl] = useState(source?.url ?? '')
  const [langs, setLangs] = useState<string[]>(source?.languages ?? (presetLang ? [presetLang] : []))
  const [phen, setPhen] = useState((source?.phenomena ?? []).join(', '))
  const [contributor, setContributor] = useState(source?.contributor ?? me)
  const [err, setErr] = useState('')

  const toggleLang = (c: string) => setLangs((cur) => cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c])
  const phenList = () => phen.split(',').map((x) => x.trim()).filter(Boolean)

  const save = () => {
    setErr('')
    const raw = bibtex.trim()
    if (!isEdit && raw.startsWith('@')) {
      const parsed = parseBibtex(raw)
      if (!parsed.length) { setErr('Could not parse any @entry from the BibTeX.'); return }
      for (const p of parsed) {
        const existing = store.db.sources.find((s) => s.citekey === p.citekey)
        const rec = { ...p, languages: langs, phenomena: phenList(), contributor }
        if (existing) store.patch('sources', existing.row_uid, { languages: langs, phenomena: phenList(), contributor, bibtex: p.bibtex })
        else store.upsert('sources', { ...rec, ...ident() })
      }
      onDone(); return
    }
    // manual / edit path
    if (!citekey.trim()) { setErr('A citekey is required.'); return }
    const fields = {
      citekey: citekey.trim(), author, year, title, url,
      languages: langs, phenomena: phenList(), contributor,
      bibtex: raw.startsWith('@') ? raw : '',
    }
    if (isEdit) store.patch('sources', source!.row_uid, fields)
    else store.upsert('sources', { ...ident(), id: 'src.' + citekey.trim(), entry_type: 'book', publisher: '', journal: '', doi: '', note: '', ...fields } as any)
    onDone()
  }

  return (
    <div className="card" style={{ padding: 16, marginTop: 4, borderColor: 'var(--accent)' }}>
      <div className="between" style={{ marginBottom: 8 }}>
        <div className="eyebrow" style={{ margin: 0 }}>{isEdit ? `Edit ${source!.citekey}` : 'Add reference'}</div>
        <button className="btn btn-ghost btn-sm" onClick={onDone}>✕</button>
      </div>

      {!isEdit && (
        <>
          <label className="lbl" style={{ marginTop: 0 }}>Paste BibTeX (one or more @entries — preferred)</label>
          <textarea className="field" rows={5} style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            placeholder={'@book{borsley2009,\n  author = {Borsley, Robert D. and Tallerman, Maggie and Willis, David},\n  title = {The Syntax of Welsh},\n  year = {2007},\n  publisher = {Cambridge University Press}\n}'}
            value={bibtex} onChange={(e) => setBibtex(e.target.value)} />
          <div className="faint" style={{ fontSize: 11.5, margin: '4px 0 10px' }}>…or fill the fields below manually if you don't have a BibTeX entry.</div>
        </>
      )}

      {(isEdit || !bibtex.trim().startsWith('@')) && (
        <div className="grid grid-2" style={{ gap: 10 }}>
          <div><label className="lbl" style={{ marginTop: 0 }}>Citekey</label><input className="field" value={citekey} onChange={(e) => setCitekey(e.target.value)} placeholder="borsley2009" /></div>
          <div><label className="lbl" style={{ marginTop: 0 }}>Year</label><input className="field" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2007" /></div>
          <div><label className="lbl" style={{ marginTop: 0 }}>Author(s)</label><input className="field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Borsley, Tallerman & Willis" /></div>
          <div><label className="lbl" style={{ marginTop: 0 }}>Link (URL/DOI)</label><input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label className="lbl" style={{ marginTop: 0 }}>Title</label><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The Syntax of Welsh" /></div>
        </div>
      )}

      <label className="lbl">Language(s) covered</label>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {langCodes.length === 0 && <span className="faint" style={{ fontSize: 12.5 }}>No language projects yet.</span>}
        {langCodes.map((c) => (
          <button key={c} type="button" className={`btn btn-sm ${langs.includes(c) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleLang(c)}>{langName(c)}</button>
        ))}
      </div>

      <div className="grid grid-2" style={{ gap: 10, marginTop: 4 }}>
        <div>
          <label className="lbl">Contributor (attribution)</label>
          <input className="field" list="contrib-options" value={contributor} onChange={(e) => setContributor(e.target.value)} />
          <datalist id="contrib-options">{contributors.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="lbl">Phenomena (comma-separated)</label>
          <input className="field" value={phen} onChange={(e) => setPhen(e.target.value)} placeholder="agreement, mutation" />
        </div>
      </div>

      {err && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{err}</div>}
      <div className="row" style={{ gap: 8, marginTop: 14 }}>
        <button className="btn btn-primary" onClick={save}>{isEdit ? 'Save changes' : 'Add reference'}</button>
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  )
}
