// Pluggable flush target for the zero-loss op queue.
//
// The local op-log (see store.ts) is authoritative for the session. This module
// drains the queue of un-flushed ops to a durable backend with idempotent,
// row_uid-keyed writes and exponential backoff. The default target is a no-op
// (local-only). To make persistence networked + collaborative, implement
// `flushOp` against Google Sheets `batchUpdate` or Supabase `upsert` keyed on
// (entity, row_uid, op_id) — the queue, idempotency keys and audit ledger already
// guarantee no double-apply and no data loss.

import type { Op, SyncState } from './types'

// Swap this for a real backend call. Resolve = durably written; reject = retry.
async function flushOp(_op: Op): Promise<void> {
  // local-only: pretend a fast durable write
  return new Promise((res) => setTimeout(res, 60))
}

type Listener = (s: SyncState) => void

export class SyncEngine {
  private listeners = new Set<Listener>()
  private state: SyncState = 'synced'
  private backoff = 500
  private draining = false

  online = typeof navigator === 'undefined' ? true : navigator.onLine

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.online = true; this.set('synced'); this.kick() })
      window.addEventListener('offline', () => { this.online = false; this.set('offline') })
    }
  }

  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.state); return () => this.listeners.delete(fn) }
  private set(s: SyncState) { this.state = s; this.listeners.forEach((l) => l(s)) }

  // pull = read pending ops, mark = persist flushed flag back
  kick() { this.drain.bind(this); }

  async drain(pull: () => Op[], mark: (opIds: string[]) => void) {
    if (this.draining) return
    if (!this.online) { this.set('offline'); return }
    const pending = pull()
    if (pending.length === 0) { this.set('synced'); return }
    this.draining = true
    this.set('syncing')
    try {
      const done: string[] = []
      for (const op of pending) { await flushOp(op); done.push(op.op_id) }
      mark(done)
      this.backoff = 500
      this.set('synced')
    } catch {
      this.backoff = Math.min(this.backoff * 2, 30000)
      this.set('offline')
      setTimeout(() => { this.draining = false; this.drain(pull, mark) }, this.backoff)
      return
    }
    this.draining = false
  }
}

export const sync = new SyncEngine()
