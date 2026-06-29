// Local-first store with an append-only op-log + audit ledger (the zero-loss core),
// backed by Postgres in cloud mode.
//
// - Every record has row_uid + rev (monotonic). Writes target row_uid, never index.
// - Every field mutation appends an Op (client op_id, idempotent) and an AuditEntry.
// - In demo mode (no backend) state persists to localStorage from a local seed.
// - In cloud mode state is hydrated from Postgres after login and every change is flushed
//   to a single `records` table (jsonb payload) keyed on row_uid; RLS scopes rows by app.

import type {
  Workspace, Note, Task, FileLink, CalendarEvent,
  Phenomenon, Template, MinimalPair, Source, ChildesDocument, ChildesAnnotation,
  Op, AuditEntry, Session,
} from './types'
import { uid, now } from './id'
import { sync } from './sync'
import { buildSeed } from './seed'
import { supabase, isCloud } from './supabase'

export interface DB {
  workspaces: Workspace[]
  notes: Note[]
  tasks: Task[]
  files: FileLink[]
  events: CalendarEvent[]
  phenomena: Phenomenon[]
  templates: Template[]
  pairs: MinimalPair[]
  sources: Source[]
  childes_docs: ChildesDocument[]
  childes_anns: ChildesAnnotation[]
  ops: Op[]
  audit: AuditEntry[]
  session: Session
}

// entity (collection) keys that hold persisted records
export const ENTITY_KEYS: (keyof DB)[] = [
  'workspaces', 'notes', 'tasks', 'files', 'events',
  'phenomena', 'templates', 'pairs', 'sources', 'childes_docs', 'childes_anns',
]

// which app owns an entity — drives RLS scoping in the `records` table
export const appOf = (entity: string): 'xblimps' | 'childes' =>
  entity.startsWith('childes_') ? 'childes' : 'xblimps'

const KEY = 'xblimps.db.v4'

function emptyDB(): DB {
  return {
    workspaces: [], notes: [], tasks: [], files: [], events: [],
    phenomena: [], templates: [], pairs: [], sources: [], childes_docs: [], childes_anns: [],
    ops: [], audit: [], session: { user: 'You', email: '', role: 'coordinator' },
  }
}

function loadLocal(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyDB(), ...JSON.parse(raw) }
  } catch { /* fall through */ }
  const db = buildSeed() as DB
  localStorage.setItem(KEY, JSON.stringify(db))
  return db
}

type Listener = () => void

class Store {
  db: DB = isCloud ? emptyDB() : loadLocal()
  cloud = isCloud
  hydrated = !isCloud
  private listeners = new Set<Listener>()
  version = 0

  constructor() {
    if (isCloud) sync.configure((ops) => this.flushToCloud(ops))
  }

  subscribe(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private emit() { this.version++; this.listeners.forEach((l) => l()) }

  private persist() {
    if (!this.cloud) { try { localStorage.setItem(KEY, JSON.stringify(this.db)) } catch { /* quota */ } }
    this.emit()
    if (this.cloud) {
      sync.drain(
        () => this.db.ops.filter((o) => !o.flushed),
        (ids) => { this.db.ops.forEach((o) => { if (ids.includes(o.op_id)) o.flushed = true }) },
      )
    }
  }

  // ---- cloud hydrate ----
  async hydrate(profile: { id: string; email: string; name: string; role: any; apps?: string[] }) {
    this.db = emptyDB()
    this.db.session = { user: profile.name || profile.email, email: profile.email, role: profile.role, uid: profile.id }
    this.myUid = profile.id
    this.myApps = profile.apps ?? ['xblimps']
    if (supabase) {
      const { data, error } = await supabase.from('records').select('entity,data')
      if (!error && data) {
        for (const row of data as { entity: keyof DB; data: any }[]) {
          const coll = this.db[row.entity] as unknown as any[]
          if (Array.isArray(coll)) coll.push(row.data)
        }
      }
    }
    this.hydrated = true
    this.emit()
    this.startRealtime()
  }

  // ---- realtime: live-merge other clients' record changes ----
  private channel: any = null
  private myUid: string | null = null
  private myApps: string[] = []

  private startRealtime() {
    if (!supabase) return
    this.disconnect()
    this.channel = supabase
      .channel('records-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (p: any) => this.onRealtime(p))
      .subscribe()
  }

  disconnect() {
    if (this.channel && supabase) { supabase.removeChannel(this.channel); this.channel = null }
  }

  // Switch the live (cloud) app into a local, seeded demo session — used by the "default
  // logins" on the Login page so anyone can try the app as a given persona on the deployed
  // site without a magic link. Writes go to localStorage only; nothing touches the backend.
  enterDemoMode() {
    this.disconnect()
    this.cloud = false
    this.db = loadLocal()
    this.hydrated = true
    this.emit()
  }

  private onRealtime(payload: any) {
    if (payload.eventType === 'DELETE') { this.removeInbound(payload.old?.row_uid); return }
    const nw = payload.new
    if (!nw) return
    // defence in depth on top of RLS: never apply another user's personal row or a foreign app
    if (nw.app && this.myApps.length && !this.myApps.includes(nw.app)) return
    if (nw.owner && nw.owner !== this.myUid) return
    this.applyInbound(nw.entity as keyof DB, nw.data, nw.rev)
  }

  // adopt an inbound row only when it is strictly newer — so our own echoed writes
  // (equal rev) and any locally-newer edits are left untouched. No ops are recorded.
  private applyInbound(entity: keyof DB, data: any, rev: number) {
    const coll = this.db[entity] as unknown as any[]
    if (!Array.isArray(coll) || !data?.row_uid) return
    const idx = coll.findIndex((r) => r.row_uid === data.row_uid)
    if (idx === -1) { coll.push(data); this.emit(); return }
    if (rev > coll[idx].rev) { coll[idx] = data; this.emit() }
  }

  private removeInbound(row_uid?: string) {
    if (!row_uid) return
    for (const key of ENTITY_KEYS) {
      const coll = this.db[key] as unknown as any[]
      const idx = coll.findIndex((r) => r.row_uid === row_uid)
      if (idx !== -1) { coll.splice(idx, 1); this.emit(); return }
    }
  }

  // ownership scope for a record: personal notebooks (and their notes/tasks/files/events)
  // are owned by their creator; everything else (language projects, phenomena, templates,
  // pairs, sources, CHILDES) is shared. Mirrors the per-user RLS in supabase/schema.sql.
  private ownerOf(entity: string, rec: any): string | null {
    const me = this.db.session.uid ?? null
    if (entity === 'workspaces') return rec.kind === 'notebook' ? (rec.owner ?? me) : null
    if (rec.workspace_id && ['notes', 'tasks', 'files', 'events'].includes(entity)) {
      const ws = this.db.workspaces.find((w) => w.id === rec.workspace_id)
      return ws && ws.kind === 'notebook' ? (ws.owner ?? rec.owner ?? me) : null
    }
    return null
  }

  private recordRow(entity: string, rec: any) {
    const owner = this.ownerOf(entity, rec)
    rec.owner = owner // mirror into the data blob so ownership is stable across re-hydrate
    return {
      row_uid: rec.row_uid, entity, app: appOf(entity), owner,
      language: rec.language ?? null, workspace_id: rec.workspace_id ?? null,
      rev: rec.rev ?? 1, data: rec, updated_at: rec.updated_at ?? now(), updated_by: rec.updated_by ?? this.db.session.user,
    }
  }

  // flush pending ops: upsert touched records, delete removed ones
  private async flushToCloud(ops: Op[]) {
    if (!supabase) return
    const touched = new Map<string, string>() // row_uid -> entity
    ops.forEach((o) => touched.set(o.row_uid, o.entity))
    const upserts: any[] = []
    const deletes: string[] = []
    for (const [row_uid, entity] of touched) {
      const coll = this.db[entity as keyof DB] as unknown as any[]
      const rec = Array.isArray(coll) ? coll.find((r) => r.row_uid === row_uid) : null
      if (rec) upserts.push(this.recordRow(entity, rec))
      else deletes.push(row_uid)
    }
    if (upserts.length) {
      // rev-guarded conditional upsert; returns the authoritative state of each touched row
      const { data, error } = await supabase.rpc('apply_records', { _rows: upserts })
      if (error) throw error
      if (Array.isArray(data)) for (const row of data as any[]) this.reconcile(row.entity as keyof DB, row.data, row.rev)
    }
    if (deletes.length) {
      const { error } = await supabase.from('records').delete().in('row_uid', deletes)
      if (error) throw error
    }
  }

  // adopt the server's authoritative row after a flush when our write lost the rev race.
  // Newer (rev > local) always wins; an equal-rev row is adopted only when its data differs
  // and we have no fresher unflushed edit queued for that row (which would re-flush and win).
  private reconcile(entity: keyof DB, data: any, rev: number) {
    const coll = this.db[entity] as unknown as any[]
    if (!Array.isArray(coll) || !data?.row_uid) return
    const idx = coll.findIndex((r) => r.row_uid === data.row_uid)
    if (idx === -1) { coll.push(data); this.emit(); return }
    const local = coll[idx]
    const pending = this.db.ops.some((o) => o.row_uid === data.row_uid && !o.flushed)
    if (rev > local.rev || (rev === local.rev && !pending && JSON.stringify(local) !== JSON.stringify(data))) {
      coll[idx] = data
      this.emit()
    }
  }

  // ---- low level: record a field change as op + audit ----
  private record(entity: string, row_uid: string, field: string, oldVal: any, newVal: any) {
    const op_id = uid()
    this.db.ops.push({ op_id, entity, row_uid, field, value: newVal, ts: now(), flushed: false })
    this.db.audit.push({ op_id, entity, row_uid, field, old: oldVal, new: newVal, user: this.db.session.user, ts: now() })
    if (this.db.audit.length > 1000) this.db.audit.splice(0, this.db.audit.length - 1000)
    if (this.db.ops.length > 2000) this.db.ops = this.db.ops.filter((o) => !o.flushed)
  }

  upsert<T extends { row_uid: string; rev: number; updated_at: string; updated_by: string }>(entity: keyof DB, partial: T) {
    const coll = this.db[entity] as unknown as T[]
    const idx = coll.findIndex((r) => r.row_uid === partial.row_uid)
    partial.updated_at = now(); partial.updated_by = this.db.session.user
    if (idx === -1) { partial.rev = 1; coll.push(partial); this.record(String(entity), partial.row_uid, '*create', null, '(record)') }
    else { partial.rev = coll[idx].rev + 1; coll[idx] = partial; this.record(String(entity), partial.row_uid, '*replace', '(record)', '(record)') }
    this.persist()
  }

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
  resetAll() { if (!this.cloud) { localStorage.removeItem(KEY); this.db = buildSeed() as DB; this.persist() } }

  // coordinator one-time: push the starter inventory into a fresh Postgres DB
  async seedCloud(apps: string[]) {
    if (!supabase) return
    const seed = buildSeed() as DB
    const rows: any[] = []
    for (const key of ENTITY_KEYS) {
      if (!apps.includes(appOf(String(key)))) continue   // respect RLS / access
      for (const rec of (seed[key] as any[])) rows.push(this.recordRow(String(key), rec))
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from('records').upsert(rows.slice(i, i + 200), { onConflict: 'row_uid' })
      if (error) throw error
    }
    await this.hydrate({ id: '', email: this.db.session.email, name: this.db.session.user, role: this.db.session.role })
  }
}

export const store = new Store()

export function ident() {
  return { row_uid: uid(), rev: 0, updated_at: now(), updated_by: store.db.session.user }
}
