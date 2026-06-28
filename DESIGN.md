# xBLiMPs Annotation Platform — System Design & Build Notes

A collaborative annotation platform for building multilingual linguistic test suites
(minimal-pair generation + document annotation), built with INCEpTION's interaction
model as the *design reference*, re-expressed in a modern, warm, notebook-style UI.

One site, one login, a module/workspace switcher. Each annotation task and each
linguist's working space is a **workspace** (a notebook) — a declarative configuration
over one shared core.

---

## Stack as built (vs. the target plan)

The original plan specifies a **Svelte SPA + Google Sheets/Drive** as the zero-loss
persistence layer. This repository already carried a **React + Vite + TypeScript**
scaffold (with live Supabase credentials), and the priority was a working system *now*.

So this build:

- Uses **React + Vite + TypeScript** (the existing toolchain) instead of Svelte. The
  data model, the zero-loss op-log/audit model, the role model, and the entire UX are
  identical to the plan — only the view library differs.
- Persists **local-first** to `localStorage` with an **append-only op-log + audit
  ledger** and `row_uid` / `rev` row identity — exactly the zero-loss core described in
  §2 of the plan, minus the network flush. The Google Sheets / Supabase flush is a
  pluggable sync target (`src/lib/sync.ts`) that drains the same op queue; wiring a real
  backend is a drop-in, because the queue and idempotency keys already exist.
- Ships the **warm, diary/notebook visual treatment** requested: each workspace has its
  own icon, colour, cover, dashboard, notes, tasks, files, and calendar.

The Svelte/Sheets architecture below remains the documented target; nothing here blocks
migrating the persistence flush to it later.

---

## 1. Architecture

```
React SPA (static, Vite build)
  Shell: login · switcher · workspace rail · context rail · sync indicator
    ├─ xBLiMPs module     (generative: phenomenon → template → card flow → validation)
    └─ Workspaces         (notebook: dashboard · notes · tasks · files · calendar · pages)
  State: AppContext (session, active view, workspaces, sync state machine)
  Store: local-first op-log → localStorage (zero-loss) → pluggable flush (Sheets/Supabase)
```

### Zero-loss core (as implemented)

1. **Optimistic local write.** Every mutation applies to in-memory state immediately and
   is appended to a durable op-log in `localStorage`.
2. **Row identity.** Every record has an immutable `row_uid` (UUID) and a monotonic
   `rev`; writes target `row_uid`, never array position.
3. **Idempotent ops.** Each op carries a client `op_id`; the flush is a no-op on replay.
4. **Append-only audit.** `audit` records `{op_id, entity, row_uid, field, old, new,
   user, ts}` for every mutation — full state is reconstructable from the ledger.
5. **Pluggable flush.** `sync.ts` exposes a queue drainer with exponential backoff; the
   default target is a no-op (local only). Swap in Sheets `batchUpdate` or Supabase
   `upsert` keyed on `row_uid` + `op_id` and the same queue becomes durable + collaborative.
6. **Conflict surface.** Field-level three-way merge + a `_conflicts` surface is the
   documented resolution path once a networked flush is enabled.

---

## 2. Data model

`src/lib/types.ts` is the single source of truth. Key entities:

- **Workspace** — `{id, name, kind, icon, colour, cover, sections[], dashboard{widgets[]}}`.
  `kind` is `notebook` (free workspace) or `language` (a language project).
- **Note** — rich-text (HTML) document inside a workspace section.
- **Task** — `{title, status, due, priority, tags}`.
- **FileLink** — linked document / asset `{title, url, kind}`.
- **CalendarEvent** — `{title, date, kind}`.
- **Phenomenon** — `{id, label, language, family, complexity, hypothesis, ref, status}`.
- **Template** — slot schema `{slots[], grammatical, ungrammatical, contrast}`.
- **MinimalPair** — `{sentence_good, sentence_bad, contrast_tokens, fillers, status, ...}`.
- **Op / AuditEntry** — the zero-loss ledger records.

Roles: `coordinator · lead · native_speaker · reviewer`, per-workspace, gated in the shell.

---

## 3. Design system

Warm, quiet research instrument — a digital diary made of many notebooks.

| Token | Light | Role |
|---|---|---|
| `--canvas` | `#FBFAF7` | warm off-white page |
| `--surface` | `#FFFFFF` | cards, editor panes |
| `--ink` | `#1C1B19` | primary text |
| `--ink-soft`| `#5C5A54` | secondary text |
| `--hair` | `#E6E3DC` | hairline borders |
| `--good` | `#1D9E75` | grammatical / accept |
| `--bad` | `#D85A30` | ungrammatical / reject |
| `--contrast`| `#BA7517` | amber contrast tokens |
| `--accent` | `#185FA5` | interactive / focus |

Each workspace owns one hue (its notebook colour) carried into its dashboard and rail.
Layer hues (`--layer-cs`, `--layer-err`, `--layer-dev`) are reserved for document modules.

- Typography: humanist sans UI (system/Inter stack), serif accents for the notebook
  feel, mono for slot names / `row_uid`s / the audit log.
- Three-pane workspace, hairline borders, 8–12px radii, functional focus rings only.
- **Signature element**: the minimal-pair card — good/bad stacked, amber contrast tokens,
  keyboard-driven **A / E / R**, progress ring to 100.

---

## 4. Modules & workspaces

- **xBLiMPs** (generative): phenomenon dashboard → template editor → card flow → validation.
- **Workspaces** (notebook): per-language or free; dashboard widgets, rich-text notes,
  tasks, files, calendar, sections/pages. Customisable icon/colour/cover.

Adding a new task is a new config block over the same core; a new *interaction paradigm*
(as generative pairs were vs. span annotation) is a deliberate platform decision.

---

## 5. Roster & phenomena

Seeded in `src/lib/seed.ts`: per-language leads + native-speaker slots, and 8–10
phenomena per language (Welsh, Persian, Afrikaans, Tagalog, Catalan, French, German)
drawn from the plan's inventory. Each phenomenon carries a stable id, family, complexity
flag, hypothesis, and reference.

---

## 6. Build sequencing (status)

1. Local-first store + op-log/audit + row identity — **done**.
2. Shell + switcher + role gating — **done**.
3. xBLiMPs end to end (dashboard → template → card flow → validation export) — **done**.
4. Phenomenon inventory + roster seed — **done**.
5. Rich workspaces (dashboard widgets, rich-text notes, tasks, files, calendar) — **done**.
6. Document modules (CHILDES/L2/code-switching) — configuration, **future**.
7. Provenance bridge + benchmarking export — **future**.

### To make persistence networked

Implement `flushOp` in `src/lib/sync.ts` against Sheets `batchUpdate` (or Supabase
`upsert`) keyed on `row_uid` + `op_id`. The op-log, idempotency keys, and audit ledger
are already in place, so this is additive and cannot lose local data.
