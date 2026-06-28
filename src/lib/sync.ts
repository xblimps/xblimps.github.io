// Sync state machine for the zero-loss op queue.
//
// The local op-log (store.ts) is authoritative for the session. This engine drains
// un-flushed ops to a pluggable flush function with exponential backoff. In demo mode the
// flush is a no-op (local only); in cloud mode store.ts installs a flush that upserts/deletes
// rows in Postgres keyed on row_uid (idempotent — safe to replay).

import type { Op, SyncState } from './types'

type Listener = (s: SyncState) => void
type FlushFn = (ops: Op[]) => Promise<void>

export class SyncEngine {
  private listeners = new Set<Listener>()
  private state: SyncState = 'synced'
  private backoff = 500
  private draining = false
  private flushFn: FlushFn = async () => {}

  online = typeof navigator === 'undefined' ? true : navigator.onLine

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.online = true; this.set('synced') })
      window.addEventListener('offline', () => { this.online = false; this.set('offline') })
    }
  }

  configure(fn: FlushFn) { this.flushFn = fn }

  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.state); return () => { this.listeners.delete(fn) } }
  private set(s: SyncState) { this.state = s; this.listeners.forEach((l) => l(s)) }

  async drain(pull: () => Op[], mark: (opIds: string[]) => void) {
    if (this.draining) return
    if (!this.online) { this.set('offline'); return }
    const pending = pull()
    if (pending.length === 0) { this.set('synced'); return }
    this.draining = true
    this.set('syncing')
    try {
      await this.flushFn(pending)
      mark(pending.map((o) => o.op_id))
      this.backoff = 500
      this.draining = false
      this.set('synced')
    } catch {
      this.backoff = Math.min(this.backoff * 2, 30000)
      this.draining = false
      this.set('offline')
      setTimeout(() => this.drain(pull, mark), this.backoff)
    }
  }
}

export const sync = new SyncEngine()
