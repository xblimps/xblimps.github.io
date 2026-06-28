import React, { useEffect, useRef, useState } from 'react'
import { store, ident } from '../../lib/store'
import type { Note } from '../../lib/types'
import { uid } from '../../lib/id'

function exec(cmd: string, val?: string) { document.execCommand(cmd, false, val) }

function Toolbar({ onLink }: { onLink: () => void }) {
  const B = ({ cmd, val, children, title }: { cmd: string; val?: string; children: React.ReactNode; title: string }) => (
    <button className="tb-btn" title={title} onMouseDown={(e) => { e.preventDefault(); exec(cmd, val) }}>{children}</button>
  )
  return (
    <div className="note-toolbar">
      <B cmd="formatBlock" val="<h1>" title="Heading 1"><b>H1</b></B>
      <B cmd="formatBlock" val="<h2>" title="Heading 2"><b>H2</b></B>
      <B cmd="formatBlock" val="<p>" title="Body text">¶</B>
      <span className="tb-sep" />
      <B cmd="bold" title="Bold"><b>B</b></B>
      <B cmd="italic" title="Italic"><i>I</i></B>
      <B cmd="underline" title="Underline"><u>U</u></B>
      <B cmd="strikeThrough" title="Strikethrough"><s>S</s></B>
      <span className="tb-sep" />
      <B cmd="insertUnorderedList" title="Bullet list">•</B>
      <B cmd="insertOrderedList" title="Numbered list">1.</B>
      <B cmd="formatBlock" val="<blockquote>" title="Quote">❝</B>
      <span className="tb-sep" />
      <button className="tb-btn" title="Insert link" onMouseDown={(e) => { e.preventDefault(); onLink() }}>🔗</button>
      <B cmd="removeFormat" title="Clear formatting">⌫</B>
    </div>
  )
}

function Editor({ note }: { note: Note }) {
  const ref = useRef<HTMLDivElement>(null)
  // load html only when switching notes (avoid caret jumps)
  useEffect(() => { if (ref.current && ref.current.innerHTML !== note.html) ref.current.innerHTML = note.html }, [note.row_uid])

  const save = () => { if (ref.current) store.patch('notes', note.row_uid, { html: ref.current.innerHTML }) }

  const link = () => {
    const url = prompt('Link URL'); if (url) exec('createLink', url)
    save()
  }

  return (
    <div>
      <input
        className="field"
        style={{ fontSize: 22, fontWeight: 600, border: 'none', padding: '4px 2px', marginBottom: 8, fontFamily: 'var(--font-serif)' }}
        value={note.title}
        onChange={(e) => store.patch('notes', note.row_uid, { title: e.target.value })}
        placeholder="Untitled"
      />
      <Toolbar onLink={link} />
      <div
        ref={ref}
        className="note-paper"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing…"
        onInput={save}
        onBlur={save}
      />
    </div>
  )
}

export default function Notes({ workspaceId }: { workspaceId: string }) {
  const notes = store.db.notes.filter((n) => n.workspace_id === workspaceId)
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.row_uid ?? null)
  const active = notes.find((n) => n.row_uid === activeId) ?? notes[0]

  const add = () => {
    const n: Note = { ...ident(), id: uid(), workspace_id: workspaceId, section: 'Notes', title: 'New note', html: '', pinned: false }
    store.upsert('notes', n)
    setActiveId(n.row_uid)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 20 }}>
      <div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={add}>+ New note</button>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notes.map((n) => (
            <div key={n.row_uid} className={`note-list-item ${n.row_uid === active?.row_uid ? 'active' : ''}`} onClick={() => setActiveId(n.row_uid)}>
              <div className="between">
                <span style={{ fontWeight: 500, fontSize: 13.5 }}>{n.pinned ? '📌 ' : ''}{n.title || 'Untitled'}</span>
              </div>
              <div className="faint" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: n.html.replace(/<[^>]+>/g, ' ').slice(0, 60) || 'Empty' }} />
            </div>
          ))}
          {notes.length === 0 && <div className="faint" style={{ fontSize: 13, padding: 8 }}>No notes yet.</div>}
        </div>
      </div>
      <div>
        {active ? <Editor key={active.row_uid} note={active} /> : <div className="empty"><div className="big">📝</div>Create your first note.</div>}
      </div>
    </div>
  )
}
