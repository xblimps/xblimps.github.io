# xBLiMPs: recruitment site and lexical generator (https://xblimps.github.io/)

**Home (`#/`)** is the marketing and recruitment page: "Does AI really understand your language?". It has a 30-second
"spot the mistake" quiz built from real human-written pairs, then why it matters, how it works, what you get, who we
need, "You can be…" roles (contributor, core team, coordinator, language lead, start a new language), and the phases
band. xBLiMPs is built in phases, language by language, towards 182 BLiMPs, so the site shows no deadline
countdowns. The language grid is recruiting for every language ("a few sentences or hundreds"), with an Add your
language card. It ends with an FAQ, sessions, team and share links. There are no invented numbers, testimonials or
model results.

**Lexical generator (`#/generator`, `#/generator/<code>`)** is all the public site does for contributors. Pick a
language and get a random real sentence (FineWeb-2; FineWeb for English) with a precomputed English machine
translation and words to reuse, with another, copy-words and skip buttons. Sentences don't repeat within a session.
We give you words; you write the grammar. **Template writing is private:** it happens in each language's sheet with
its lead, so there are no construction lists, assignments or writing forms on the public site. Each language page also
recruits for every role.

**Vocabulary pools** (`public/fineweb/<code>.json`, about 400 sentences per language) are built offline:
`node scripts/fineweb-sample.mjs` (the datasets API) or `python3 scripts/fineweb-stream.py` (streaming fallback for busy
subsets), then `python3 scripts/translate-pools.py` (Helsinki-NLP opus-mt, Apache-2.0; Persian and Welsh use Meta NLLB-200,
CC-BY-NC 4.0, because the opus-mt models hallucinate on them).
Untranslatable sentences are dropped, so the site never shows a sentence without its translation.

**The lexical generator was removed from the site on 26 Nov 2026.** Its engine is kept for the central team, which
generates sentences from the templates after 11 Dec: `scripts/lexgen/lexgen.ts`, tests in
`scripts/lexgen/lexgen.test.ts` (`npm test`). Old links (`#/contribute`, `#/check`, `#/lang/<code>`, `#/guide/demo`)
open the page that replaced them.

Terms (Suchir, 23–24 Nov 2026): a **template** is the unit that counts (one sheet row, formerly
"seed sentence"); a **slot pattern** is the lead's structure; **generated sentences** do not count.

Canonical site: **https://xblimps.github.io/** (GitHub Pages, deployed from `main` by
`.github/workflows/deploy.yml`). The Vercel deployment is retired; do not link to it.

Public navigation is deliberately minimal: **Home** (`#/`), **Lexical generator** (`#/generator`),
**Instructions** (`#/guide`: languages, terms, targets, workflow, timeline, sessions in UK time),
**I'm a Language Lead** (`#/guide/lead`, including the handover checklists), **I'm a Native
Speaker** (`#/guide/native`) and **Advice** (`#/guide/advice`: writing rules, lexical variety, common
mistakes, ambiguous cases, who to ask, FAQ). Older routes still resolve to the page that holds their
content. Source: `src/site/`.

The **annotation platform** (`#/app`, sign-in) is **admin-only**: `App.tsx` renders its modules
only when `isAdmin(profile)`; any other signed-in user sees just the wand, linking to the
Contribute page. Links that carry its own parameters (`?demo=`, `?go=`, `?lang=`, email sign-in links)
still open it directly; demo logins appear only in local (no-backend) builds.

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
