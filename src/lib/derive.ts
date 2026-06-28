// Derivation engine — the "convert a Minimalist analysis to other formalisms" core.
//
// A Template carries its analysis ONCE as slot-keyed schemas ({SLOT} placeholders). Given a
// concrete filler assignment, these pure functions substitute the fillers to produce a fully
// derived minimal pair: surface sentences, Minimalist parse, CoNLL-U, gloss, feature bundle,
// and the single-feature (featural) contrast used for controlled interpretability analysis.

import type { Template, MinimalPair, Perturbation } from './types'

export interface Expansion {
  fillers: Record<string, string>
  good: string
  bad: string
  tokens: string[]
}

// Substitute {SLOT} placeholders in a pattern from a filler map.
export function fill(pattern: string, fillers: Record<string, string>): string {
  return pattern.replace(/\{(\w+)\}/g, (_, k) => (fillers[k] ?? `{${k}}`))
}

// Deterministically pick one filler per slot (modulo `pick`) and expand the surface patterns.
export function expandTemplate(tpl: Template, pick: number): Expansion {
  const fillers: Record<string, string> = {}
  tpl.slots.forEach((s) => { fillers[s.name] = s.fillers[pick % s.fillers.length] || s.fillers[0] || s.name })
  const good = fill(tpl.grammatical, fillers)
  const bad = fill(tpl.ungrammatical, fillers).replace('*', '')
  // contrast tokens: the realised forms of the first two slots (where the edit usually lands)
  const tokens = tpl.slots.slice(0, 2).map((s) => fillers[s.name]).filter(Boolean)
  return { fillers, good, bad, tokens }
}

// Substitute fillers through every analysis schema → the derived feature bundle.
export function deriveFeatures(tpl: Template, fillers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(tpl.analysis.feature_schema || {})) out[k] = fill(v, fillers)
  return out
}

export interface DerivedAnalysis {
  parse_good: string
  parse_bad: string
  conll: string
  gloss: string
  features: Record<string, string>
  feature_contrast: string
  paradigm: 'lexical' | 'featural'
  perturbation: Perturbation
}

// Derive a pair's full analysis from the template's authored schemas + a filler assignment.
export function deriveAnalysis(tpl: Template, fillers: Record<string, string>): DerivedAnalysis {
  const a = tpl.analysis
  return {
    parse_good: fill(a.parse_good, fillers),
    parse_bad: fill(a.parse_bad, fillers),
    conll: fill(a.conll_schema, fillers),
    gloss: fill(a.gloss_schema, fillers),
    features: deriveFeatures(tpl, fillers),
    feature_contrast: a.feature_contrast,
    paradigm: a.paradigm,
    perturbation: { ...a.perturbation },
  }
}

// The single-feature contrast view (for SAE / learning-dynamics probes).
export interface FeaturalView {
  contrast: string            // the feature name that flips
  value_good: string          // its value in the grammatical alternant (if encoded)
  bundle: Record<string, string>
}
export function deriveFeatural(tpl: Template, fillers: Record<string, string>): FeaturalView {
  const bundle = deriveFeatures(tpl, fillers)
  const contrast = tpl.analysis.feature_contrast
  return { contrast, value_good: bundle[contrast] ?? '', bundle }
}

// Build a complete derived MinimalPair shell (minus identity/status) for the card flow.
export function derivePair(
  tpl: Template,
  exp: Expansion,
): Pick<MinimalPair,
  'sentence_good' | 'sentence_bad' | 'contrast_tokens' | 'parse_good' | 'parse_bad' |
  'gloss' | 'conll' | 'features' | 'feature_contrast' | 'paradigm' | 'perturbation' | 'fillers'
> {
  const d = deriveAnalysis(tpl, exp.fillers)
  return {
    sentence_good: exp.good, sentence_bad: exp.bad, contrast_tokens: exp.tokens,
    parse_good: d.parse_good, parse_bad: d.parse_bad, gloss: d.gloss, conll: d.conll,
    features: d.features, feature_contrast: d.feature_contrast, paradigm: d.paradigm,
    perturbation: d.perturbation, fillers: exp.fillers,
  }
}
