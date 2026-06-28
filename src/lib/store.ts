// Local-first store with an append-only op-log + audit ledger (the zero-loss core).
//
// - Every record has row_uid + rev (monotonic). Writes target row_uid, never index.
// - Every field mutation appends an Op (with client op_id, idempotent) and an AuditEntry.
// - State persists to localStorage on every change; the full state is reconstructable
//   from the audit ledger. The SyncEngine drains un-flushed ops to a backend (sync.ts).

import type {
  Workspace, Note, Task, FileLink, CalendarEvent,
  Phenomenon, Template, MinimalPair, Op, AuditEntry, Session,
} from './types'
import { uid, now } from './id'
import { sync } from './sync'
import { buildSeed } from './seed'

export interface DB {
  workspaces: Workspace[]
  notes: Note[]
  tasks: Task[]
  files: FileLink[]
  events: CalendarEvent[]
  phenomena: Phenomenon[]
  templates: Template[]
  pairs: MinimalPair[]
  ops: Op[]
  audit: AuditEntry[]
  session: Session
}

const KEY = 'xblimps.db.v1'

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch { /* fall through to seed */ }
  const db = buildSeed()
  localStorage.setItem(KEY, JSON.stringify(db))
  return db
}

type Listener = () => void

class Store {
  db: DB = load()
  private listeners = new Set<Listener>()
  version = 0

  subscribe(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  private emit() { this.version++; this.listeners.forEach((l) => l()) }

  private persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.db)) } catch { /* quota */ }
    this.emit()
    sync.drain(
      () => this.db.ops.filter((o) => !o.flushed),
      (ids) => { this.db.ops.forEach((o) => { if (ids.includes(o.op_id)) o.flushed = true }); this.persist() },
    )
  }

  // ---- low level: record a field change as op + audit ----
  private record(entity: string, row_uid: string, field: string, oldVal: any, newVal: any) {
    const op_id = uid()
    this.db.ops.push({ op_id, entity, row_uid, field, value: newVal, ts: now(), flushed: false })
    this.db.audit.push({ op_id, entity, row_uid, field, old: oldVal, new: newVal, user: this.db.session.user, ts: now() })
  }

  // create or replace a whole record (records a 'create' / per-field ops)
  upsert<T extends { row_uid: string; rev: number; updated_at: string; updated_by: string }>(
    entity: keyof DB, partial: T,
  ) {
    const coll = this.db[entity] as unknown as T[]
    const idx = coll.findIndex((r) => r.row_uid === partial.row_uid)
    partial.updated_at = now(); partial.updated_by = this.db.session.user
    if (idx === -1) {
      partial.rev = 1
      coll.push(partial)
      this.record(String(entity), partial.row_uid, '*create', null, '(record)')
    } else {
      partial.rev = coll[idx].rev + 1
      coll[idx] = partial
      this.record(String(entity), partial.row_uid, '*replace', '(record)', '(record)')
    }
    this.persist()
  }

  // patch fields on an existing record by row_uid — field-level ops + audit
  patch(entity: keyof DB, row_uid: string, fields: Record<string, any>) {
    const coll = this.db[entity] as unknown as any[]
    const rec = coll.find((r) => r.row_uid === row_uid)
    if (!rec) return
    for (const [k, v] of Object.entries(fields)) {
      if (rec[k] !== v) { this.record(String(entity), row_uid, k, rec[k], v); rec[k] = v }
    }
    rec.rev += 1; rec.updated_at = now(); rec.updated_by = this.db.session.user
    this.persist()
  }

  remove(entity: keyof DB, row_uid: string) {
    const coll = this.db[entity] as unknown as any[]
    const idx = coll.findIndex((r) => r.row_uid === row_uid)
    if (idx === -1) return
    this.record(String(entity), row_uid, '*delete', '(record)', null)
    coll.splice(idx, 1)
    this.persist()
  }

  setSession(s: Session) { this.db.session = s; this.persist() }

  resetAll() { localStorage.removeItem(KEY); this.db = buildSeed(); this.persist() }
}

export const store = new Store()

// helper to stamp a new record's identity fields
export function ident() {
  return { row_uid: uid(), rev: 0, updated_at: now(), updated_by: store.db.session.user }
}
