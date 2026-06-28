# xBLiMPs — annotation platform

A collaborative annotation platform for building multilingual linguistic test suites:
minimal-pair generation + document annotation, with INCEpTION as the *design reference*,
re-expressed as a warm, notebook-style web app.

One site, one login, a workspace/module switcher. Each language project and each
linguist's working space is a **workspace** (a notebook) over one shared core.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## What's inside

- **Workspaces (notebooks)** — per-language or free. Each has a customisable dashboard of
  widgets, rich-text notes (notebook feel), tasks, files/links, a calendar, and its own
  icon / colour / cover.
- **xBLiMPs module** — phenomenon dashboard → template editor (slot grid + live preview) →
  **card flow** (the signature minimal-pair card, keyboard-driven A/E/R, amber contrast
  tokens, progress ring) → validation & export.
- **Rich annotation** — pastel colour-coded panels for:
  - **Lexical & featural minimal pairs** — single-feature contrasts for SAE / learning-dynamics.
  - **Fine-grained syntactic perturbations** — a typed taxonomy (agreement flip, movement,
    deletion, case/marker, embedding depth, …) grounded in dependency/Minimalist syntax,
    in the spirit of structural-sensitivity probing (ACL 2024, 2024.acl-long.785).
  - **Minimalist-style parses** (Merge / X-bar), **interlinear gloss**, **CoNLL-U** dependency
    annotation — for grammar induction & computational models of acquisition.
- **Exports** — minimal-pair CSV, CoNLL-U (with Minimalist parse + features + perturbation in
  comments), rich JSON, and a stratified Prolific batch.
- **Team & onboarding** — the roster matrix (invited → access granted → trained → active →
  complete) and per-language progress.
- **Zero-loss persistence** — local-first op-log + append-only audit ledger, immutable
  `row_uid` + monotonic `rev` per record; a pluggable flush target (`src/lib/sync.ts`) makes
  it networked/collaborative without changing the app.

See [DESIGN.md](DESIGN.md) for the full system design and build notes.
