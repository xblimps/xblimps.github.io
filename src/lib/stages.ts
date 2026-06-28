// The xBLiMPs language-project pipeline as a guided, gated sequence.
//
// A language project walks the linguist through four working stages plus a holistic
// Overview. Each stage unlocks only once the prior stage has produced output, so the
// rail can hand-hold without the old 9-tab overload. This is the single source of
// truth for both the rail (App.tsx) and the locked-section guard (Workspace.tsx).

import { store } from './store'

export type StageKey = 'Overview' | 'Phenomena' | 'Template Studio' | 'Card flow' | 'Export'

export interface Stage {
  key: StageKey
  label: string
  icon: string   // numbered glyph (or clock for Overview)
  blurb: string  // one-line explainer, used on the Home "how it works" cards
}

// ordered — the rail renders them top-to-bottom in this sequence
export const STAGES: Stage[] = [
  { key: 'Overview', label: 'Overview', icon: '◷', blurb: 'A holistic notebook view of the project — progress, notes, tasks and deadlines.' },
  { key: 'Phenomena', label: 'Phenomena', icon: '①', blurb: 'Catalogue the grammatical phenomena to probe, with hypotheses and complexity.' },
  { key: 'Template Studio', label: 'Template Studio', icon: '②', blurb: 'Author slot-based templates with the Minimalist analysis and reference-grammar citations.' },
  { key: 'Card flow', label: 'Card flow', icon: '③', blurb: 'Construct minimal-pair cards from templates — judge A/E/R and naturalness.' },
  { key: 'Export', label: 'Export', icon: '④', blurb: 'Validate coverage and export CSV / CoNLL-U / JSON / a Prolific batch.' },
]

// accepted-equivalent pair statuses — mirrors the filter in CardFlow.tsx / Validation.tsx
const ACCEPTED = ['accepted', 'edited', 'validated']

export interface StageState {
  phenCount: number
  tplCount: number
  pairCount: number          // accepted-equivalent pairs
  unlocked: Record<StageKey, boolean>
  lockHint: Record<StageKey, string>
}

export function stageState(language: string): StageState {
  const phenCount = store.db.phenomena.filter((p) => p.language === language).length
  const tplCount = store.db.templates.filter((t) => t.language === language).length
  const pairCount = store.db.pairs.filter((p) => p.language === language && ACCEPTED.includes(p.status)).length

  return {
    phenCount,
    tplCount,
    pairCount,
    unlocked: {
      Overview: true,
      Phenomena: true,
      'Template Studio': phenCount > 0,
      'Card flow': tplCount > 0,
      Export: pairCount > 0,
    },
    lockHint: {
      Overview: '',
      Phenomena: '',
      'Template Studio': 'Add a phenomenon first',
      'Card flow': 'Build a template first',
      Export: 'Accept some cards first',
    },
  }
}

// per-stage count badge for the rail (empty string → no badge)
export function stageCount(s: StageState, key: StageKey): string {
  switch (key) {
    case 'Phenomena': return s.phenCount ? String(s.phenCount) : ''
    case 'Template Studio': return s.tplCount ? String(s.tplCount) : ''
    case 'Card flow': return s.pairCount ? String(s.pairCount) : ''
    default: return ''
  }
}

// furthest unlocked working stage — used to redirect away from a locked/stale section
export function furthestUnlocked(s: StageState): StageKey {
  return s.unlocked.Export ? 'Export'
    : s.unlocked['Card flow'] ? 'Card flow'
    : s.unlocked['Template Studio'] ? 'Template Studio'
    : 'Phenomena'
}
