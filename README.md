# xBLiMPs: lexical generator, instructions and annotation platform

The site opens on the **lexical generator** (`#/`), the central tool. Two entry points sit side by
side: paste a slot pattern (slot headers, one ✓ and one ✗ slot) with one or more **templates** (rows
of 3–4 alternatives per slot), or paste a whole language-sheet tab into the **sheet check**. The
generator expands every combination into minimal pairs (deterministic Cartesian product, ✓/✗ paired
by position), removes repeated pairs, and offers a count, preview, warnings when combinations
explode, and CSV/TSV download. The sheet check finds every slot pattern in a tab, counts templates
against the targets (10 macrophenomena × 100 = ~1,000 templates per language; ≤3 subphenomena,
2 → 50, 3 → ≥33 each) and lists words repeated across many templates (review-fatigue check). It
never calls a model and never writes words: every token comes from the human-written alternatives
(`src/lib/lexgen.ts`, tests in `scripts/lexgen.test.ts`, `npm test`).

Terms (Suchir, 23–24 Nov 2026): a **template** is the unit that counts (one sheet row, formerly
"seed sentence"); a **slot pattern** is the lead's structure; **generated sentences** do not count.

The **guide** (`#/guide`) is the one place for instructions: overview with languages, terms,
targets, timeline and sessions (`#/guide`), how to write a template with the worked example
(`#/guide/write`), language leads (`#/guide/lead`), native-speaker contributors (`#/guide/native`),
FAQ (`#/guide/faq`), a full worked demonstration (`#/guide/demo`), heuristics and troubleshooting
(`#/guide/help`) and the handover checklist (`#/guide/handover`). Source: `src/site/`.

The earlier **annotation platform** is unchanged and lives at `#/app` (sign-in); links that carry
its own parameters (`?demo=`, `?go=`, `?lang=`, email sign-in links) still open it directly.

---

## Annotation platform

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
