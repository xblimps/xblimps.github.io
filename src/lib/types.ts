// xBLiMPs — data model (single source of truth).
// Every persisted record carries row_uid + rev for the zero-loss sync core.

export type Role = 'coordinator' | 'lead' | 'native_speaker' | 'reviewer'

export interface Identified {
  row_uid: string
  rev: number
  updated_at: string
  updated_by: string
  owner?: string | null    // auth user id when the record is personal; null/undefined = shared
}

export type WorkspaceKind = 'language' | 'notebook'

export interface Workspace extends Identified {
  id: string
  name: string
  kind: WorkspaceKind
  icon: string
  colour: string          // notebook hue (hex)
  cover: string           // gradient / cover css
  language?: string       // ISO 639 for language workspaces
  tier?: 'low' | 'higher'
  lead?: string
  subtitle?: string
  sections: string[]      // page/section names
  dashboard: { widgets: Widget[] }
}

export type WidgetType =
  | 'notes' | 'tasks' | 'files' | 'calendar' | 'keyinfo'
  | 'links' | 'image' | 'progress' | 'phenomena'

export interface Widget {
  id: string
  type: WidgetType
  title: string
  config?: Record<string, any>
}

export interface Note extends Identified {
  id: string
  workspace_id: string
  section: string
  title: string
  html: string            // rich text
  pinned?: boolean
}

export type TaskStatus = 'todo' | 'doing' | 'done'
export interface Task extends Identified {
  id: string
  workspace_id: string
  title: string
  status: TaskStatus
  due?: string
  priority: 'low' | 'med' | 'high'
  tags: string[]
}

export interface FileLink extends Identified {
  id: string
  workspace_id: string
  title: string
  url: string
  kind: 'doc' | 'sheet' | 'transcript' | 'pdf' | 'link' | 'image'
  note?: string
}

export interface CalendarEvent extends Identified {
  id: string
  workspace_id: string
  title: string
  date: string            // YYYY-MM-DD
  kind: 'deadline' | 'session' | 'milestone' | 'note'
}

// ---- xBLiMPs domain ----

export interface Phenomenon extends Identified {
  id: string
  language: string
  label: string
  family: string          // cross-linguistic family (agreement, binding, ...)
  complexity: 'low' | 'med' | 'high'
  hypothesis: string      // why hard for LMs
  ref: string
  note: string
  status: 'planned' | 'active' | 'complete'
  target: number          // examples target
}

export interface Slot {
  name: string
  fillers: string[]
  // In the Forge the annotator fills each slot freely (seeded from the first filler), primed by a
  // length-varied corpus sample (lib/wordbank.ts) shown for lexical/topic diversity — the sample
  // is inspiration, not a filler source. `pos` is an optional authoring hint shown next to the
  // slot; `band` is retained for reference-grammar metadata.
  pos?: string                          // UPOS tag hint, e.g. 'NOUN' | 'PROPN' | 'VERB' | 'ADJ'
  band?: 'high' | 'mid' | 'any'         // frequency band hint (default: any)
  sample?: boolean                      // legacy flag (no longer drives sampling); kept for data compat
}

// ---- reference grammars (porting the syntactic literature in) ----
// A reusable, BibTeX-backed bibliography entry. The same grammar (e.g. Borsley,
// Tallerman & Willis 2009) is entered once and cited from many templates.
export interface Source extends Identified {
  id: string
  citekey: string          // BibTeX key, e.g. "borsley2009"
  entry_type: string       // book | article | incollection | misc | ...
  author: string
  year: string
  title: string
  publisher?: string
  journal?: string
  url?: string
  doi?: string
  bibtex: string           // raw entry — round-trips via lib/bibtex.ts
  languages: string[]      // ISO 639 codes this grammar covers
  phenomena: string[]      // phenomenon families / ids it documents
  note?: string
}

// A template's *use* of a source: which page / example number / quoted judgment.
export interface Citation {
  source_id: string
  page?: string
  example?: string         // example number in the grammar, e.g. "4a"
  quote?: string           // the quoted datum / judgment
}

// The fine-grained Minimalist analysis authored ONCE on a template. Slot-keyed
// schemas ({SLOT} placeholders) are substituted per instantiation by lib/derive.ts
// to auto-derive each pair's parse, CoNLL-U, gloss, and featural contrast.
export interface TemplateAnalysis {
  parse_good: string        // "[TP [T {VERB}] [vP [DP {SUBJ}] …]]"
  parse_bad: string         // failed-derivation schema for the ungrammatical alternant
  perturbation: Perturbation // invariant per template — how bad is derived from good
  paradigm: 'lexical' | 'featural'
  feature_schema: Record<string, string>  // e.g. {Number:'{NUM}', Person:'3'}
  feature_contrast: string                 // the single feature that flips good→bad
  conll_schema: string      // CoNLL-U skeleton; FORM column uses {SLOT} placeholders
  gloss_schema: string      // interlinear gloss with {SLOT} placeholders
}

export type TemplateStatus = 'draft' | 'in_review' | 'validated' | 'flagged'
export interface TemplateComment { user: string; ts: string; text: string }
export interface TemplateValidation {
  status: TemplateStatus
  validated_by?: string
  typology_note?: string
  comments: TemplateComment[]
}

export interface Template extends Identified {
  id: string
  phenomenon_id: string
  language: string
  name: string
  slots: Slot[]
  grammatical: string     // pattern w/ {slot}
  ungrammatical: string
  contrast: string        // contrast spec description
  citations: Citation[]   // reference-grammar provenance
  analysis: TemplateAnalysis  // fine-grained Minimalist analysis (authored once)
  validation: TemplateValidation
}

// Fine-grained syntactic perturbation (dependency/Minimalist-grounded), in the spirit of
// structural-sensitivity probing (ACL 2024, 2024.acl-long.785): a typed minimal edit on a
// specified syntactic target, with a measured depth, that derives the ungrammatical alternant.
export interface Perturbation {
  type: string          // see PERTURBATION_TYPES (lib/perturbations.ts)
  target: string        // the dependency relation / tree node it applies to, e.g. "nsubj", "T", "vP"
  relation: string      // affected dependency edge (head→dep) if any
  depth: number         // embedding depth of the target (0 = matrix clause)
  description: string    // human-readable note on the edit
}

export type PairStatus = 'candidate' | 'accepted' | 'edited' | 'rejected' | 'validated'
export interface MinimalPair extends Identified {
  id: string
  language: string
  phenomenon_id: string
  template_id: string
  sentence_good: string
  sentence_bad: string
  contrast_tokens: string[]
  parse_good: string          // Minimalist-style parse (Merge/X-bar bracketing) of good alternant
  parse_bad: string           // Minimalist-style parse of bad alternant
  gloss: string               // interlinear gloss (annotation quality)
  conll: string               // CoNLL-U dependency annotation of the good alternant
  features: Record<string, string>  // feature bundle, e.g. {Number: 'PL', Definite: 'Yes'}
  feature_contrast: string    // the single feature that differs (featural minimal pair, for SAE / learning dynamics)
  paradigm: 'lexical' | 'featural'  // lexical minimal pair vs single-feature contrast
  perturbation: Perturbation  // fine-grained syntactic perturbation that derives bad from good
  fillers: Record<string, string>
  // The analysis fields above are a DERIVED snapshot, auto-filled from the template's
  // TemplateAnalysis by lib/derive.ts at construction time. `overrides` records the
  // field names an annotator hand-edited so re-derivation won't clobber them.
  overrides?: string[]
  author: string
  status: PairStatus
  prolific_score?: number
  naturalness_score?: number
  notes: string
}

// ---- CHILDES module (access-gated; hidden from xBLiMPs-only users by RLS) ----
export interface ChildesDocument extends Identified {
  id: string
  title: string
  language: string
  child: string          // target child / corpus
  age: string            // e.g. 2;06
  text: string           // transcript text (offsets index into this)
  source: string
}
export interface ChildesAnnotation extends Identified {
  id: string
  document_id: string
  char_start: number
  char_end: number
  text_span: string
  layer: 'code_switch' | 'l2_error' | 'developmental' | 'mwu' | 'other'
  features: Record<string, string>
  annotator: string
  note: string
}

// ---- roster ----
export interface RosterMember {
  name: string
  role: Role
  language: string
  state: 'invited' | 'access_granted' | 'trained' | 'active' | 'complete'
}

// ---- zero-loss ledger ----
export interface Op {
  op_id: string
  entity: string
  row_uid: string
  field: string
  value: any
  ts: string
  flushed: boolean
}
export interface AuditEntry {
  op_id: string
  entity: string
  row_uid: string
  field: string
  old: any
  new: any
  user: string
  ts: string
}

export type SyncState = 'synced' | 'syncing' | 'offline'

export interface Session {
  user: string
  email: string
  role: Role
  uid?: string    // auth user id of the signed-in user; stamps `owner` on personal records
}
