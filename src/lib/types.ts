// xBLiMPs — data model (single source of truth).
// Every persisted record carries row_uid + rev for the zero-loss sync core.

export type Role = 'coordinator' | 'lead' | 'native_speaker' | 'reviewer'

export interface Identified {
  row_uid: string
  rev: number
  updated_at: string
  updated_by: string
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
  author: string
  status: PairStatus
  prolific_score?: number
  naturalness_score?: number
  notes: string
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
}
