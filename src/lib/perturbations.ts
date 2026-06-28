// Fine-grained syntactic perturbation taxonomy.
//
// Grounded in dependency/Minimalist syntax and the structural-sensitivity probing line of
// work (e.g. ACL 2024, 2024.acl-long.785), where models are tested on minimal, typed edits
// to syntactic structure rather than coarse good/bad pairs. Each perturbation names the kind
// of edit, the syntactic target it applies to, and how to read its effect — enabling very
// fine-grained perturbations with rich syntactic analysis for grammar induction, learning
// dynamics, and acquisition modelling.

import type { Perturbation } from './types'

export interface PerturbationType {
  id: string
  label: string
  hue: string
  note: string
  defaultTarget: string
}

export const PERTURBATION_TYPES: PerturbationType[] = [
  { id: 'agreement_flip',   label: 'Agreement flip',      hue: '#1D9E75', note: 'Flip a φ-feature (number/person/gender) on an agreeing head', defaultTarget: 'nsubj↔root' },
  { id: 'feature_change',   label: 'Feature change',      hue: '#0F6E56', note: 'Change one morphosyntactic feature (tense, definiteness, case)', defaultTarget: 'feat' },
  { id: 'reorder_local',    label: 'Local reordering',    hue: '#BA7517', note: 'Swap two adjacent dependents under the same head', defaultTarget: 'head-dependents' },
  { id: 'movement',         label: 'Movement',            hue: '#534AB7', note: 'Wh-/topic/scrambling displacement; landing-site violation', defaultTarget: 'Spec-CP' },
  { id: 'deletion',         label: 'Deletion',            hue: '#D85A30', note: 'Drop an obligatory function word / argument', defaultTarget: 'det / case / nsubj' },
  { id: 'insertion',        label: 'Insertion',           hue: '#993C1D', note: 'Insert an illicit element (extra det, doubled marker)', defaultTarget: 'spurious node' },
  { id: 'substitution',     label: 'Substitution',        hue: '#185FA5', note: 'Replace a head/dependent with a category-mismatched item', defaultTarget: 'lexical node' },
  { id: 'case_marker',      label: 'Case / marker',       hue: '#A23E5C', note: 'Add/remove/alter case or DOM marker (e.g. rā, ang)', defaultTarget: 'case' },
  { id: 'clitic_reorder',   label: 'Clitic reordering',   hue: '#7A5C2E', note: 'Violate clitic ordering / 2nd-position placement', defaultTarget: 'clitic cluster' },
  { id: 'negation',         label: 'Negation placement',  hue: '#3E6B8F', note: 'Misplace / drop a negation bracket (e.g. nie…nie)', defaultTarget: 'NegP' },
  { id: 'mutation',         label: 'Mutation / morphophon.', hue: '#5C5A54', note: 'Wrong initial mutation / morphophonological context', defaultTarget: 'phon-context' },
  { id: 'embedding_depth',  label: 'Embedding depth',     hue: '#1C1B19', note: 'Vary depth of the violation (matrix vs deeply embedded)', defaultTarget: 'clause' },
]

export const emptyPerturbation = (): Perturbation => ({
  type: 'agreement_flip', target: 'nsubj↔root', relation: '', depth: 0, description: '',
})

export const perturbationHue = (id: string) =>
  PERTURBATION_TYPES.find((t) => t.id === id)?.hue ?? '#5C5A54'

export const perturbationLabel = (id: string) =>
  PERTURBATION_TYPES.find((t) => t.id === id)?.label ?? id
