# xBLiMPs: contributor recruitment and template-writing site (https://xblimps.github.io/)

**Home (`#/`)** is the mission and recruitment page: "Does AI really understand your language? Help us find out." It
covers who can contribute, how it works, three ways to join (lead, build or contribute to a language), the four layers
of each language (lead, native-speaker coordinator, core team of 3–8, open community), the project at a glance
(targets only: live counts appear once submissions are connected), recognition, languages, team, sessions and research.

**Contribute (`#/contribute`, `#/contribute/<code>`)** is the contributor workflow. We give you words; you write the
grammar.
1. Choose your language.
2. Choose the grammatical construction. The list comes from the linguists' notes (`src/site/phenomena.ts`, built from
   `scripts/seed-data/` by `scripts/build-phenomena.py`), or the BLiMP-style examples from the lead deck. The language
   lead confirms the assignment.
3. Get vocabulary inspiration: a random sentence from real text in that language (FineWeb-2; FineWeb for English) with
   a precomputed English machine translation and "words you could reuse". There are buttons for another sentence and
   skip, and the session avoids repeats. Use the words, not the sentence.
4. Write your own template: a ✓ sentence, a ✗ version that differs only in the target feature, and optional other
   words that also work. The checks cover missing parts, ✓ identical to ✗, too many differences, and a ✓ that follows
   the sample too closely. They never judge grammaticality.
5. Work through a 30-template assignment (about 3 in each of 10 areas), tracked in this browser. Copy the templates
   for the language sheet or download a CSV, and share an invitation link.

There is no backend: drafts, saved templates and progress stay in the contributor's browser.

**Vocabulary pools** (`public/fineweb/<code>.json`, about 400 sentences per language) are built offline:
`node scripts/fineweb-sample.mjs` (the datasets API) or `python3 scripts/fineweb-stream.py` (streaming fallback for busy
subsets), then `python3 scripts/translate-pools.py` (Helsinki-NLP opus-mt, Apache-2.0; Persian uses opus-mt-mul-en).
Untranslatable sentences are dropped, so the site never shows a sentence without its translation.

**The lexical generator was removed from the site on 26 Nov 2026.** Its engine is kept for the central team, which
generates sentences from the templates after 11 Dec: `scripts/lexgen/lexgen.ts`, tests in
`scripts/lexgen/lexgen.test.ts` (`npm test`). Old links (`#/generator`, `#/check`, `#/lang/<code>`, `#/guide/demo`)
open the page that replaced them.

Terms (Suchir, 23–24 Nov 2026): a **template** is the unit that counts (one sheet row, formerly
"seed sentence"); a **slot pattern** is the lead's structure; **generated sentences** do not count.

Canonical site: **https://xblimps.github.io/** (GitHub Pages, deployed from `main` by
`.github/workflows/deploy.yml`). The Vercel deployment is retired; do not link to it.

Public navigation is deliberately minimal: **Home** (`#/`), **Contribute** (`#/contribute`),
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
