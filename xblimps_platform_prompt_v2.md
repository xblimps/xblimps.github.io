# Design Prompt: The xBLiMPs Platform (v2)
### A Collaborative IDE for Multilingual Linguistic Test Suites

> Build specification + design brief for a login-gated, versioned, web-based platform for the **xBLiMPs** project, hosted at `https://suchirsalhan.github.io/xblimps`. This revision (v2) re-frames the system from an *annotation website* into a *collaborative integrated development environment for multilingual linguistic test suites*, on the basis of an architectural review. The shift drives every major decision below: entities not rows, version control not spreadsheets, a rules-based validation engine, immutable exports, and dataset diagnostics.

---

## 0. One-paragraph brief (paste this to a builder/LLM)

Build a login-gated, versioned, single-page web application called **xBLiMPs**, served statically from a GitHub Pages user site (`https://suchirsalhan.github.io/xblimps`), that functions as a **collaborative IDE for authoring, expanding, validating, and releasing featural minimal-pair test suites** across typologically diverse languages. Every linguistic object — Language, Phenomenon, Feature, Template, Expansion, Candidate, Validation, Export — is a **first-class, version-controlled entity** with full provenance (created_at, created_by, parent_version, change_reason), not a cell in one flat table. The platform implements the project's **featural-first, dual-projection methodology**: a linguist authors one *structured* featural template (base/counterfactual over a single two-valued feature, both grammatical, with a localizable target), and the system derives the *behavioural* BLiMP-style artefact where the phenomenon **class (1/2/3)** permits. A **rules-based validation engine** (each rule → PASS/WARNING/FAIL) replaces procedural checks; a **non-linear state machine with loops** (regenerate, supersede, freeze, archive) replaces a linear pipeline; a card-based **accept/edit/reject + request-changes/flag** flow minimises native-speaker load; **immutable, semantically-versioned corpus exports** feed a *separate* benchmarking pipeline so every benchmark knows exactly which export produced it. Role-aware dashboards expose both **project metrics** (progress, dynamically-computed budget) and **research quality metrics** (edit distance, rejection rate, IAA heatmap, feature/class/tier balance). An internal API layer abstracts all operations for later automation.

---

## 1. Conceptual frame: this is an IDE, not a form

The single most important reframing from the review. Treat xBLiMPs as a **collaborative IDE for multilingual linguistic test suites**, not "forms and dashboards." Concretely this means the system is built around:

- **structured linguistic objects** (templates are parsed structures, not strings),
- **version control** (Git-like, not spreadsheet-like),
- **provenance graphs** (every candidate knows its full lineage),
- **a validation engine** (composable rules, not procedural steps),
- **search** across thousands of objects,
- **diagnostics** (corpus health, not just counts),
- **immutable exports** (releases, not CSV dumps),
- **an internal API** (so automation and plugins are possible later).

Every section below follows from this frame.

---

## 2. Entity model (replaces the flat schema)

The flat `language | phenomenon | … | sentence_good | sentence_bad | …` row is **abandoned**. It works for one paper but breaks under versioning, auditing, reuse, new generators, and multiple template revisions. Model **true entities** with relationships:

```
Language
  └── Phenomenon            (class 1/2/3, controlled vocab)
        └── Feature          (two-valued F = {value_A, value_B})
              └── Template    (STRUCTURED object — §3)
                    └── Expansion        (one run of the slot expander)
                          └── Candidate  (one base/counterfactual pair)
                                └── Validation   (rule results + IAA)
                                      └── PublishedExample → Export (§9)
```

Lineage, not a megarow:

```
Template → Expansion → Candidate → Validation → Published Example → Export
```

Each arrow is a real foreign-key relationship that the provenance graph (§5) and search (§7) traverse. A Candidate is *derived from* an Expansion *of* a Template *of* a Feature — never a self-contained row.

**Methodology fields preserved, now distributed across entities:**
- *Phenomenon*: `class (1/2/3)`, controlled-vocab name.
- *Feature*: `name`, `value_A`, `value_B`.
- *Template*: structured slots, `contrast_location`, `target_position`, `base_target`, `counterfactual_target`, `tier (1/2)`, `dependencies`.
- *Candidate*: `base_sentence`, `counterfactual_sentence`, derived `sentence_good`/`sentence_bad` (class-gated), `contrast_tokens`, `token_length_delta` (per target tokenizer), `cost_minutes`.
- *Validation*: rule outcomes (§6), `iaa_naturalness`, `iaa_feature_consistency`, `derivation_valid`, `prolific_n`.

`class` + `derivation_valid` **jointly** determine which artefacts (causal / behavioural) a candidate populates — unchanged from the methodology, now enforced at the Validation→PublishedExample boundary.

---

## 3. Templates are structured objects, not text

A Template is a **linguistic structure**, parsed and queryable:

```
Template {
  slots: [ {name, fillers[], role} ]
  feature: ref → Feature
  agreement_target | morphological_target
  contrast_location          # where the minimal contrast sits
  target_position            # where the licensed token is scored
  dependencies               # inter-slot constraints
  tier: 1 | 2
}
```

Representing templates structurally (rather than as a template string) means the platform can *later* support syntax trees, dependency graphs, feature inheritance, and automatic consistency checks **without a redesign**. Build the structure now even if the first UI renders it simply.

**Worked-example scaffold** (baked into editor help), Welsh verb agreement: `feature subject_type = {pronoun_3pl, lexical_NP_coord}`; base `Cerddon ___ → nhw`, counterfactual `Cerddodd ___ → Aled a Sara`; derived behavioural `Cerddodd Aled a Sara adre.` (good) vs `*Cerddon Aled a Sara adre.` (bad).

---

## 4. Version control (the biggest omission in v1)

Treat the corpus like **Git, not spreadsheets**. Every entity carries:

```
version | created_at | created_by | parent_version | change_reason
```

This resolves the questions v1 could not answer: if a linguist renames `agreement → default agreement`, do generated sentences update? Are prior exports preserved? Was a benchmark run on v1 or v2? With versioning: templates are immutable once frozen; edits create a new version with a `parent_version` link and `change_reason`; downstream candidates reference the specific template version they came from; **prior exports are never mutated** (§9). Provide a diff view between template versions.

States that versioning enables (see §8): `Frozen`, `Superseded`, `Archived`.

---

## 5. Provenance graph (full lineage per candidate)

The v1 provenance field (`grammar / journal / linguist / LLM`) is insufficient. Every **Candidate** records its complete graph:

```
origin_template (version) · origin_expansion
editor_history[]   (who edited, when, what)
validation_history[]
llm_prompt          (if tier 2 — verbatim, for contamination audit)
accepted_by · rejected_by · modified_by[]
publication_status
```

This is what makes the paper writable: reviewers ask "where did this item come from," and the answer is a traversable graph, not a guess. The **Tier-2 LLM prompt is stored verbatim** so contamination risk (data generated by a model later evaluated) is auditable. Enforce the methodology constraint in code and UI: *the LLM may realise a contrast but never select it.*

---

## 6. Validation engine (rules, not procedure)

Replace procedural validation with a **composable rule engine**. Each rule returns **PASS / WARNING / FAIL**; rules are independently extensible.

Core rule set:
1. Both sentences grammatical (featural pair is genuinely both-grammatical).
2. Only one feature changed (true minimal pair).
3. Target token changed (feature deterministically selects the target).
4. No lexical leakage (contrast doesn't smuggle other differences).
5. No accidental ambiguity.
6. **Derived behavioural valid** — for Class 1, the feature-flipped behavioural variant is *genuinely* ungrammatical, not merely flipped. Failures → candidate marked **single-view**, not dual.
7. Duplicate check (§ smaller items) — string / token / feature / template similarity below threshold.

Validation also ingests **Prolific** results: ≥20 raters, 2–3 phenomena per language (fixed design so IAA is comparable across languages), reporting **per-phenomenon** agreement against anchors (BLiMP-NL 94–96%, ZhoBLiMP 94.6%, UrBLiMP 96.1%) — never a single aggregate.

Each rule outcome is stored on the Validation entity, so a "show every FAIL on derivation integrity" query (§7) is trivial.

---

## 7. Search (essential past a few thousand items)

Once the corpus holds thousands of examples, search is not optional. Support structured queries over the entity/provenance graph:

- every agreement template; every failed derivation; every *ezafe* example;
- only Tier-2 French; templates edited by Laura; duplicated sentences;
- by class, by feature, by validation outcome, by version, by author.

Search runs over entities and their provenance, returning Templates / Candidates / Validations as appropriate.

---

## 8. Workflow as a non-linear state machine

Real annotation loops; a linear `Selected → Template → Generation → Validation` is wrong. Model an explicit state machine **with loops and lifecycle states**:

```
PHENOMENON_SELECTED → TEMPLATE_READY → GENERATION_IN_PROGRESS
  → GENERATION_COMPLETE → VALIDATION_QUEUED
      → VALIDATED
      → NEEDS_REVALIDATION ┐
      → NEEDS_REGENERATION ┘→ (loops back to TEMPLATE_READY / GENERATION)
Lifecycle (orthogonal): NEEDS_REVIEW · NEEDS_LINGUISTIC_APPROVAL
                        FROZEN · SUPERSEDED · ARCHIVED
```

Re-validation/regeneration loops back with the **failing check named** (failed-IAA vs failed-derivation). Transitions are role-gated.

---

## 9. Immutable, versioned exports

Exports are **releases, not CSV dumps**. An Export is an immutable, semantically-versioned snapshot:

```
Corpus v0.1 → v0.2 → v1.0 → EMNLP release → camera-ready → ICLR benchmark
```

Each export pins the **exact entity versions** it contains; once created it is never mutated. Every benchmark run records **which export version generated it**. Formats: CSV / JSON / Parquet. This is the only surface the benchmarking pipeline (§12) reads.

---

## 10. Dashboards: project metrics **and** research quality metrics

v1's dashboards counted things (examples complete, budget, progress). Keep those, but add **quality metrics that become paper figures**, plus a **corpus health** view.

**(a) PI / global (Suchir).**
- `language × phenomenon × class` matrix coloured by state.
- Progress: phenomena selected (n/10), constructions per state, examples vs target (~100/construction), % dual-view vs single-view.
- **Budget (dynamic, §13):** spend vs plan and **£-per-validated-paradigm**, computed from rates × `cost_minutes` — *not* hardcoded.

**(b) Research quality metrics.**
- average edit distance, rejection rate, validation failure rate, generation success rate, feature imbalance, template productivity, average review time, native disagreement rate, Class-1 ratio, coverage per feature.

**(c) Corpus health / dataset diagnostics.**
- coverage; languages complete; feature / class / tier / source balance; sentence-length and lexical / morphological diversity; **IAA heatmap**; validation-failure map; export readiness.

**(d) Linguist (per language)** and **(e) Native speaker** dashboards as in v1 — the native view stays deliberately minimal with one "next card" CTA.

---

## 11. Generation UI & review semantics (load reduction)

## 11. Generation UI & review semantics (load reduction)

- **Card-based accept / edit / reject**, never blank-text entry; base & counterfactual side by side, `contrast_tokens` highlighted, `target_position` marked; Class-1 derived behavioural pair previewed for derivation-integrity confirmation.
- Keyboard-first (accept ↵, reject ⌫, edit e); progress bar to 100; records `author` and accrues `cost_minutes` per row.
- **Richer review actions** beyond accept/edit/reject (so discussion doesn't migrate to Slack): **request changes, flag ambiguity, needs linguist, duplicate, possible bug, needs discussion** — each attached to the candidate with a comment thread.

### Additional cognitive-load reductions

- **One-click bulk actions.** Apply the same decision or edit to a selected batch of highly similar candidates (e.g. identical template differing only in lexical fillers), with automatic preview of affected rows.

- **Progressive disclosure.** Hide advanced metadata (tier, provenance, validation history, token statistics) by default and expose it only when requested, keeping the annotation interface visually simple.

- **Inline guideline reminders.** Hover tooltips and compact examples for each phenomenon and feature, avoiding the need to consult external documentation.

- **Automatic consistency checking.** Warn when an edit introduces multiple feature changes, alters the marked `target_position`, or violates template constraints before submission.

- **Decision memory.** Learn repeated editing patterns (e.g. preferred lexical substitutions or punctuation fixes) and suggest them automatically for future cards.

- **Pre-filled edit suggestions.** When the system detects common issues (agreement mismatch, lexical duplication, spacing, punctuation), propose edits that the linguist can accept or modify rather than editing from scratch.

- **Similarity-aware review ordering.** Group candidates from the same template together to minimise context switching and repeated re-reading of annotation guidelines.

- **Adaptive queue scheduling.** Present easier, high-confidence candidates first and defer uncertain or complex examples until the reviewer has established the construction in memory.

- **Focus mode.** Display only the minimal information required for the current decision, with optional expansion panels for provenance, source references, validation history, and comments.

- **Persistent context panel.** Keep the feature definition, construction description, worked example, and annotation checklist visible while reviewing all candidates from the same template.

- **Real-time quality indicators.** Show lightweight indicators (e.g. "multiple edits required", "low agreement with previous reviewers", "possible duplicate") before opening a card so reviewers can prioritise attention.

- **Review rationale shortcuts.** Instead of repeatedly typing comments, provide common structured reasons ("unnatural wording", "feature not isolated", "lexical oddity", "dialectal variation", "template bug"), with optional free-text elaboration.

- **Automatic duplicate detection.** Flag near-identical sentences or previously validated examples before review, preventing unnecessary effort.

- **Template-level issue reporting.** Allow reviewers to escalate a problem to the template itself rather than annotating dozens of individual candidates affected by the same underlying issue.

- **Confidence scoring.** Reviewers can optionally indicate confidence (high/medium/low); low-confidence items are automatically routed for secondary review rather than forcing immediate resolution.

- **Smart stopping.** If repeated edits reveal a systematic template error (e.g. several consecutive candidates require the same correction), pause generation and recommend returning to the template instead of continuing inefficient review.

- **Reviewer analytics.** Track edit rates, common correction types, and average review time per template to identify constructions that are intrinsically difficult and should be redesigned.

- **Side-by-side history.** When revisiting a candidate after requested changes, highlight exactly what changed since the previous review to avoid re-reading the entire example.

- **Integrated discussion.** Threaded comments remain attached to the candidate or template, with mentions and resolution status, eliminating the need for external communication channels.

- **Session continuity.** Save reviewer position, open comments, filters, and collapsed panels so reviewers can resume exactly where they left off after interruptions.

---

## 12. Hard boundary: platform ≠ benchmarking pipeline

The annotation IDE **writes** versioned corpus exports; the benchmarking / LLM-evaluation pipeline **only reads** them. No model-running, scoring, or DAS/patching code lives in the web app. Downstream scoring (behavioural: MLP / SLLN-LP with `token_length_delta`; causal: DAS / activation patching on a worked language–phenomenon) consumes an immutable export and records the export version it used.

---

## 13. Dynamic budget model (not hardcoded numbers)

Do **not** bake `£3,000 / £1,200 / £300` into the platform — every grant would require a code edit. Instead model:

```
budget_categories[]      (consultants, validation, re-validation, compute, …)
hourly_rates[]           (per consultant / per category)
cost_models[]            (how cost_minutes → £)
```

and compute totals dynamically. The £5,000 plan and its split become *seed data*, not constants.

---

## 14. Internal API layer

Define an internal API even if only the web app calls it initially, so automation and plugins are possible later:

```
CreateTemplate · ExpandTemplate · ValidateCandidate · ApproveCandidate
ExportCorpus · ComputeStatistics · SearchEntities · DiffTemplateVersions
```

---

## 15. Hosting, auth & roles (DECIDED: Vercel + Supabase)

**Hosting decision (2026-06-18):** static frontend deploys to a **free Vercel subdomain `https://xblimps.vercel.app`** (its own Vercel project, fully isolated from the professional site `suchirsalhan.com`); **Supabase** is the backend at its own managed `*.supabase.co` URL. No custom domain is purchased. The earlier GitHub-Pages target and its hash-routing constraint are **superseded** — Vercel SPA rewrites allow clean browser routing.

Architecture:
- **Front end:** static SPA (React/Vite + TS) at `https://xblimps.vercel.app`, **clean-routed** (`/welsh/agreement`) via Vercel SPA rewrites. Supabase keys injected as Vercel env vars; per-branch preview deploys used during parallel agent build.
- **Auth + versioned data store:** **Supabase (Postgres + Auth + RLS)** for real multi-user concurrency, per-entity provenance, and the relational entity model above. Postgres also makes versioning, search, and diagnostics natural.
- **Login-gated:** the app loads no data pre-auth.

**Roles (RLS-enforced):**

| Role | Who | Scope |
|---|---|---|
| **PI / Admin** | Suchir | All languages/states/metrics; assign leads & consultants; configure budget & controlled vocab; create exports; view audit log |
| **Linguist (lead)** | Aoife & Lily (Welsh), Yury (Persian), Theresa (Afrikaans), Nuria (Catalan), Laura (French), Tagalog TBC | Own language(s): select phenomena, set class, author structured templates, mark alternants, version & approve |
| **Native speaker / consultant** | per language (e.g. Rowena Garcia pending, Welsh) | Assigned constructions only: accept/edit/reject + review flags; cannot alter class or schema |
| **Reviewer** | 1–2 per language (TBC) | Second-pass review; raise derivation-integrity / ambiguity flags |

---

## 16. Smaller refinements (from the review)

- **Autosave + draft states** so work is never lost.
- **Optimistic locking / conflict resolution** for simultaneous template edits.
- **Notifications panel** ("5 items returned from validation").
- **Attachments** (grammar excerpts, screenshots) linked to templates.
- **Configurable controlled vocabularies** (phenomena, feature names, classes) — not hardcoded.
- **Admin-visible audit log** for reproducibility and debugging.

---

## 17. Pre-seeded state (start immediately)

Seed from the ownership table:

| Language | Tier | Lead(s) | Native consultant | Reviewers |
|---|---|---|---|---|
| Welsh | Low-resourced | Aoife, Lily | Rowena Garcia (pending) | TBC |
| Persian | Low-resourced | Yury | TBC | TBC |
| Afrikaans | Low-resourced | Theresa | TBC | TBC |
| Tagalog | Low-resourced | TBC | TBC | TBC |
| Catalan | Low-resourced | Nuria | TBC | TBC |
| French | Higher-resourced | Laura | TBC | TBC |

Seed phenomenon inventories + classes:
- **Welsh:** verb agreement, preposition inflection, soft mutation after feminine singular, possessive clitics → **Class 1**; infinitival clauses → **Class 3**.
- **Persian:** ezafe, reflexive binding → **Class 1**; DOM-by-specificity, scrambling → **Class 2**.
- **Tagalog:** voice marking, case-marker licensing, aspect → **Class 1**; voice-conditioned extraction → **Class 3**.
- **Catalan / French:** agreement, clitics, relativizer choice, mood licensing → mostly **Class 1**, optional-mood / clitic-order shading to **Class 2/3**.

Defaults: **8–10 phenomena/language**, **~100 validated examples/construction**.

---

## 18. Acceptance criteria

- [ ] Static SPA at `suchirsalhan.github.io/xblimps`, hash-routed, login-gated (no pre-auth data).
- [ ] Four RLS-enforced roles (PI, linguist, native speaker, reviewer).
- [ ] **Entity model** (Language→Phenomenon→Feature→Template→Expansion→Candidate→Validation→Export), not a flat table.
- [ ] **Versioning** on every entity (version, created_at, created_by, parent_version, change_reason) + template diff view.
- [ ] **Provenance graph** per candidate incl. verbatim Tier-2 LLM prompts.
- [ ] **Structured templates** (slots, feature, targets, contrast location, dependencies).
- [ ] **Rule-based validation engine** (PASS/WARNING/FAIL), incl. derivation integrity + duplicate detection.
- [ ] **Non-linear state machine** with regenerate/revalidate loops + Frozen/Superseded/Archived.
- [ ] Class-gated dual projection (Class 1 dual; 2 causal-only; 3 behavioural-only).
- [ ] Card-based accept/edit/reject **plus** request-changes/flag actions with comment threads.
- [ ] Tier-2 LLM-draft mode, flagged, contamination-auditable.
- [ ] Prolific export + per-phenomenon IAA re-ingest.
- [ ] **Search** across entities/provenance.
- [ ] Dashboards: PI global + **research quality metrics** + **corpus health diagnostics** + linguist + native.
- [ ] **Immutable, semantically-versioned exports**; benchmarks pin export version.
- [ ] **Dynamic budget model** (categories/rates/cost-models; no hardcoded £).
- [ ] **Internal API** (CreateTemplate, ExpandTemplate, ValidateCandidate, ApproveCandidate, ExportCorpus, ComputeStatistics, SearchEntities, DiffTemplateVersions).
- [ ] Autosave/drafts, optimistic locking, notifications, attachments, configurable vocab, admin audit log.
- [ ] Annotation IDE decoupled from benchmarking pipeline (export is the only shared surface).
- [ ] Pre-seeded with ownership table + phenomenon/class inventories.
