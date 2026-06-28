# Native-speaker Forge — slot-typed corpus sampling as cognitive relief

## Problem

Native-speaker annotators building minimal pairs from templates are doing a *menial,
repetitive* task. Two cognitive jobs are fused in it:

1. **Structural judgment** (high value, only they can do it) — is the frame grammatical,
   where does the contrast bite.
2. **Lexical selection** (low value, expensive) — *"what content word do I put in this slot?"*
   This is the tyranny of the blank slot and the main source of fatigue.

**Goal:** turn the annotator from a *generator* into a *judge*. Corpus sampling supplies the
content words (with example sentences for context) so their attention stays on the contrast.

## HCI principles the design holds to

| Principle | Realised as |
| --- | --- |
| Recognition over recall | Words are *presented*; the annotator only accepts / rerolls |
| Constrained randomness | Sampling is **slot-typed** (POS + frequency band) so output is usable, not noise |
| One decision at a time | Forge strips parses/CoNLL/feature panels — those stay in the lead/reviewer Card flow |
| Free reversibility | Reroll is instant and costless → low commitment anxiety |
| Rhythm + visible progress | Keyboard-driven reels + progress ring; menial work gains cadence |
| Escape hatch | Manual override on every slot — the native speaker is the authority |
| Context as relief | Each sampled word shows a **corpus example sentence** ("as in: …") |

## Division of labour (matches existing roles)

- **Lead** authors the *template* — the structure, the slots, and (new) each slot's POS +
  frequency band. Done once.
- **Native speaker** lexicalises + judges in the **Forge**, a separate, distraction-free
  workspace. Never touches structural annotation.
- **Reviewer / lead** later enriches accepted pairs with parses/perturbation in the existing
  Card flow.

## Scope of this slice (ship sampling first)

> *Plain slot-typed sampling is a quick vertical slice; paradigm-aware generation is the
> bigger prize but needs morphological data per language. Ship sampling first, designed so
> generation slots in later.*

Corpora confirmed available (CC100 / mC4 / OSCAR / CulturaX) and sampled **with sentences
shown to users** for: **Welsh (cy), Persian (fa), Afrikaans (af), Tagalog (tl)**.

### In scope

1. **Word-bank data layer** — per-language JSON banks keyed by POS, each entry
   `{ form, lemma, band, gloss?, examples[] }`. These are the artifact an offline
   corpus-extraction script emits; the committed files are small **illustrative seeds** to be
   replaced by the real pipeline output.
2. **Slot typing** — `Slot` gains optional `pos`, `band`, `sample` (backwards compatible).
3. **Sampler** — pure client-side `rollFiller(lang, slot)` over the banks (instant, offline,
   fits the local-first store). Falls back to manual `fillers` when a slot isn't sampled.
4. **Forge view** — role-gated focus workspace: contrast statement, reel-based slots
   (reroll / lock / manual override + example sentence), big serif good/bad preview reusing
   the signature minimal-pair card, progress ring. Keyboard: `Space` reroll all unlocked,
   `1–9` reroll slot N, `Enter` accept, `R` reject.
5. **Role gating** — `native_speaker` users land directly in the Forge and see *only* it;
   coordinators/leads keep the full app and can open the Forge to test.

### Designed-for-later (generation)

- `Generator` interface stub in `lib/wordbank.ts`: `inflect(lemma, features) -> form`.
- Morphology-bearing slots (e.g. the agreeing verb) will swap `rollFiller` for a generator
  that produces the agreeing **and** clashing surface forms, so the perturbation itself is
  produced automatically and feeds the existing perturbation taxonomy.

## Files

| File | Change |
| --- | --- |
| `src/data/wordbanks/{cy,fa,af,tl}.json` | new — seed word banks (POS → entries w/ examples) |
| `src/lib/wordbank.ts` | new — typed loader, `rollFiller` sampler, `Generator` stub |
| `src/modules/xblimps/Forge.tsx` | new — the native-speaker focus workspace |
| `src/lib/types.ts` | `Slot` += `pos? band? sample?` |
| `src/lib/seed.ts` | tag the Welsh demo template's subject slot as sampled (live demo) |
| `src/state/AppContext.tsx` | `Nav.view` += `'forge'`; route `native_speaker` to it on boot |
| `src/App.tsx` | spine entry + render path + role gating |
| `src/styles/theme.css` | `.forge` / `.reel` styles |

## Data quality note

The committed banks are placeholder seeds (the author is not a native speaker of these
languages). They exist to make the interaction real end-to-end; the offline corpus pipeline
(CC100/OSCAR/etc.) replaces them, and the annotator's manual override is always the authority.
