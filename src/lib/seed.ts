import type {
  DB,
} from './store'
import type {
  Workspace, Phenomenon, Template, MinimalPair, Note, Task,
  CalendarEvent, FileLink, Widget, RosterMember,
} from './types'
import { uid, now } from './id'

const stamp = () => ({ row_uid: uid(), rev: 1, updated_at: now(), updated_by: 'You' })

export const NOTEBOOK_COLOURS = [
  '#185FA5', '#1D9E75', '#BA7517', '#D85A30', '#534AB7',
  '#993C1D', '#0F6E56', '#A23E5C', '#3E6B8F', '#7A5C2E',
]
export const COVERS: Record<string, string> = {
  '#185FA5': 'linear-gradient(120deg,#cfe2f3,#9fc3e6 60%,#7fb0db)',
  '#1D9E75': 'linear-gradient(120deg,#cdeee2,#a6dcc8 60%,#7fcbac)',
  '#BA7517': 'linear-gradient(120deg,#f6e7c8,#ecd29a 60%,#e0bd72)',
  '#D85A30': 'linear-gradient(120deg,#f7d9c9,#efb89c 60%,#e69972)',
  '#534AB7': 'linear-gradient(120deg,#d7d4f0,#b6b0e2 60%,#968fd3)',
  '#993C1D': 'linear-gradient(120deg,#eed3c6,#dcae98 60%,#c98d72)',
  '#0F6E56': 'linear-gradient(120deg,#c7e6dc,#9bcfbf 60%,#74b9a3)',
  '#A23E5C': 'linear-gradient(120deg,#f0d3da,#e0acb9 60%,#cf8597)',
  '#3E6B8F': 'linear-gradient(120deg,#d2e0eb,#aac3d6 60%,#84a6c1)',
  '#7A5C2E': 'linear-gradient(120deg,#ead9bf,#d6bd91 60%,#c2a268)',
}
export const cover = (c: string) => COVERS[c] ?? COVERS['#185FA5']

function defaultWidgets(): Widget[] {
  return [
    { id: uid(), type: 'progress', title: 'Progress' },
    { id: uid(), type: 'tasks', title: 'Tasks' },
    { id: uid(), type: 'notes', title: 'Recent notes' },
    { id: uid(), type: 'keyinfo', title: 'Key information' },
    { id: uid(), type: 'calendar', title: 'Deadlines' },
    { id: uid(), type: 'files', title: 'Files & links' },
  ]
}

interface LangSpec {
  language: string; name: string; icon: string; colour: string;
  tier: 'low' | 'higher'; lead: string; phen: [string, string, string, 'low'|'med'|'high', string, string][]
}

// [id, label, family, complexity, hypothesis, ref]
const LANGS: LangSpec[] = [
  {
    language: 'cy', name: 'Welsh', icon: '🏴', colour: '#1D9E75', tier: 'low', lead: 'Aoife, Lily',
    phen: [
      ['cy.agr.pronoun_only', 'Agreement (pronoun-only)', 'agreement', 'high', 'Agreement holds head↔pronoun, not head↔lexical NP — LMs over-generalise rich agreement.', 'Borsley, Tallerman & Willis (2009)'],
      ['cy.agr.prep_inflect', 'Inflected prepositions', 'agreement', 'med', 'Prepositions inflect for person/number of object.', 'Borsley et al. (2009)'],
      ['cy.mutation', 'Initial consonant mutation', 'morphophonology', 'high', 'Soft/nasal/aspirate mutation triggered by syntactic context.', 'Borsley et al. (2009)'],
      ['cy.clitics', 'Clitic placement', 'clitics', 'med', 'Clitic placement constraints.', 'Borsley et al. (2009)'],
      ['cy.nonfinite', 'Non-finite verbs', 'clause', 'med', 'Infinitival clauses and non-finite verb forms.', 'Borsley et al. (2009)'],
      ['cy.word_order.vso', 'VSO order', 'word-order', 'high', 'Verb-initial order; violations of VSO.', 'Borsley et al. (2009)'],
      ['cy.rel_clause', 'Relative clauses', 'rel-clause', 'med', 'Relative clause formation.', 'Borsley et al. (2009)'],
      ['cy.negation', 'Negation placement', 'negation', 'low', 'Placement of negation.', 'Borsley et al. (2009)'],
    ],
  },
  {
    language: 'fa', name: 'Persian', icon: '🇮🇷', colour: '#534AB7', tier: 'low', lead: 'Yury',
    phen: [
      ['fa.ezafe', 'Ezāfe construction', 'linking', 'high', 'Unstressed enclitic -e/-ye linking head to modifiers/possessor; easy to drop/insert wrongly.', 'Wikipedia: Ezāfe'],
      ['fa.dom', 'Differential object marking', 'case', 'high', 'rā on specific/definite objects only.', 'Urdu BLiMP (DOM)'],
      ['fa.binding.reflexive', 'Reflexive binding', 'binding', 'med', 'xod(-eš) binding domains.', '—'],
      ['fa.clitic_doubling', 'Clitic doubling', 'clitics', 'med', 'Clitic doubling patterns.', '—'],
      ['fa.scrambling', 'Scrambling', 'word-order', 'high', 'Free word-order permutations and their limits.', '—'],
      ['fa.rel_clause', 'Relative clauses', 'rel-clause', 'med', 'Relative clause formation.', '—'],
      ['fa.negation', 'Negation placement', 'negation', 'low', 'Negation placement.', '—'],
      ['fa.agr.sv', 'Subject–verb agreement', 'agreement', 'med', 'SV agreement incl. attractor variants.', '—'],
    ],
  },
  {
    language: 'af', name: 'Afrikaans', icon: '🇿🇦', colour: '#BA7517', tier: 'low', lead: 'Theresa',
    phen: [
      ['af.v2', 'V2 / aux-initial clauses', 'word-order', 'high', 'Verb-second and fronting.', '—'],
      ['af.aux_placement', 'Auxiliary placement', 'word-order', 'med', 'Auxiliary placement.', '—'],
      ['af.neg.double', 'Obligatory double negation', 'negation', 'high', 'nie … nie bracketing negation.', '—'],
      ['af.no_sv_agr', 'No subject–verb agreement', 'agreement', 'high', 'Absence of agreement as the contrast — LMs expect agreement.', '—'],
      ['af.particle_placement', 'Particle placement', 'word-order', 'med', 'Particle placement.', '—'],
      ['af.rel_clause', 'Relative clauses', 'rel-clause', 'med', 'Relative clauses.', '—'],
      ['af.infinitival', 'Infinitival clauses', 'clause', 'med', 'Infinitival clauses.', '—'],
      ['af.comparatives', 'Comparatives', 'comparative', 'low', 'Comparative constructions.', '—'],
      ['af.possessives', 'Possessives', 'possession', 'low', 'Possessive constructions.', '—'],
      ['af.pronoun_case', 'Pronoun case', 'case', 'low', 'Pronoun case.', '—'],
    ],
  },
  {
    language: 'tl', name: 'Tagalog', icon: '🇵🇭', colour: '#D85A30', tier: 'low', lead: 'TBC',
    phen: [
      ['tl.voice_marking', 'Voice marking', 'voice', 'high', 'ang-particle on DP + correlating voice morphology; any argument DP can be subject.', 'Kroeger (1991); Rackowski (2002)'],
      ['tl.case_licensing', 'Case-marker licensing', 'case', 'med', 'Case-marker licensing.', 'Law (2016)'],
      ['tl.actor_voice_agr', 'Actor-voice agreement', 'voice', 'med', 'Actor-voice agreement.', 'Rackowski (2002)'],
      ['tl.extraction', 'Extraction restrictions', 'extraction', 'high', 'Subject-only extraction generalization.', 'Rackowski (2002)'],
      ['tl.pronoun_placement', 'Pronoun placement', 'clitics', 'med', '2nd-position clitics, fixed positions.', 'Kroeger (1991)'],
      ['tl.binding.reflexive', 'Reflexive binding', 'binding', 'med', 'Reflexive binding.', '—'],
      ['tl.aspect_morph', 'Aspect morphology', 'aspect', 'med', 'Aspect morphology.', '—'],
      ['tl.rel_clause', 'Relative clauses', 'rel-clause', 'high', 'Head-initial/final, internally-headed, headless RCs.', 'Law (2016)'],
      ['tl.negation', 'Negation (hindi NegV)', 'negation', 'low', 'hindi precedes verb.', '—'],
    ],
  },
  {
    language: 'ca', name: 'Catalan', icon: '🇪🇸', colour: '#993C1D', tier: 'low', lead: 'Nuria',
    phen: [
      ['ca.agr', 'Agreement (Det–N, adj, SV)', 'agreement', 'med', 'Det–N, adjective and SV agreement.', '—'],
      ['ca.clitics', 'Clitics', 'clitics', 'high', 'Clitic order and placement.', '—'],
      ['ca.subjunctive', 'Subjunctive', 'mood', 'med', 'Mood licensing.', '—'],
      ['ca.article_contraction', 'Article contraction', 'morphophonology', 'low', 'a + el → al etc.', '—'],
    ],
  },
  {
    language: 'fr', name: 'French', icon: '🇫🇷', colour: '#185FA5', tier: 'higher', lead: 'Laura',
    phen: [
      ['fr.agr', 'Agreement (Det–N, adj, SV)', 'agreement', 'med', 'Det–N, adjective and SV agreement.', '—'],
      ['fr.clitic_order', 'Clitic order', 'clitics', 'high', 'Pronominal clitic ordering.', '—'],
      ['fr.subjunctive', 'Subjunctive licensing', 'mood', 'med', 'Subjunctive mood licensing.', '—'],
      ['fr.rel_pronoun', 'Relative pronouns', 'rel-clause', 'med', 'qui/que/dont/où.', '—'],
    ],
  },
  {
    language: 'de', name: 'German', icon: '🇩🇪', colour: '#0F6E56', tier: 'higher', lead: 'TBC',
    phen: [
      ['de.v2', 'V2', 'word-order', 'high', 'Verb-second.', '—'],
      ['de.verb_final_sub', 'Verb-final subordinates', 'word-order', 'high', 'Verb-final order in subordinate clauses.', '—'],
      ['de.case', 'Case marking', 'case', 'med', 'Nom/acc/dat/gen case.', '—'],
      ['de.det_gender', 'Det–N gender', 'agreement', 'med', 'Determiner–noun gender.', '—'],
      ['de.adj_inflection', 'Adjective inflection', 'agreement', 'med', 'Strong/weak adjective inflection.', '—'],
      ['de.prefixes', 'Separable prefixes', 'morphology', 'high', 'Separable verb prefixes.', '—'],
      ['de.aux_selection', 'Auxiliary selection', 'auxiliary', 'med', 'haben/sein selection.', '—'],
      ['de.ldd', 'Long-distance dependencies', 'extraction', 'high', 'Long-distance dependencies.', '—'],
    ],
  },
]

export const ROSTER: RosterMember[] = [
  { name: 'Aoife', role: 'lead', language: 'cy', state: 'active' },
  { name: 'Lily', role: 'lead', language: 'cy', state: 'active' },
  { name: 'Welsh native speaker', role: 'native_speaker', language: 'cy', state: 'invited' },
  { name: 'Yury', role: 'lead', language: 'fa', state: 'active' },
  { name: 'Persian native speaker', role: 'native_speaker', language: 'fa', state: 'invited' },
  { name: 'Theresa', role: 'lead', language: 'af', state: 'active' },
  { name: 'Afrikaans native speaker', role: 'native_speaker', language: 'af', state: 'invited' },
  { name: 'Tagalog lead (TBC)', role: 'lead', language: 'tl', state: 'invited' },
  { name: 'Tagalog native speaker', role: 'native_speaker', language: 'tl', state: 'invited' },
  { name: 'Nuria', role: 'lead', language: 'ca', state: 'active' },
  { name: 'Catalan native speaker', role: 'native_speaker', language: 'ca', state: 'access_granted' },
  { name: 'Laura', role: 'lead', language: 'fr', state: 'active' },
  { name: 'French native speaker', role: 'native_speaker', language: 'fr', state: 'invited' },
]

// a couple of demo minimal pairs (Welsh agreement) with parses + glosses
function demoPairs(phenId: string, lang: string, tplId: string): MinimalPair[] {
  if (lang !== 'cy') return []
  const mk = (good: string, bad: string, ct: string[], pg: string, pb: string, gloss: string, conll: string, feat: Record<string,string>, fc: string, status: any): MinimalPair => ({
    ...stamp(), id: uid(), language: 'cy', phenomenon_id: phenId, template_id: tplId,
    sentence_good: good, sentence_bad: bad, contrast_tokens: ct,
    parse_good: pg, parse_bad: pb, gloss, conll, features: feat, feature_contrast: fc,
    paradigm: fc ? 'featural' : 'lexical',
    perturbation: { type: 'agreement_flip', target: 'nsubj↔root', relation: 'root→nsubj', depth: 0, description: 'φ-feature (Number) on T flipped against subject type' },
    fillers: {}, author: 'Aoife', status,
    notes: '',
  })
  return [
    mk(
      'Cerddon nhw i’r ysgol.', 'Cerddon Aled a Sara i’r ysgol.',
      ['Cerddon nhw', 'Cerddon Aled a Sara'],
      '[TP [T Cerddon-3PL] [vP [DP nhw] [v′ t_V [PP i’r ysgol]]]]',
      '[TP [T Cerddon-3PL] [vP [DP Aled a Sara] …]] ✗ φ-Agree: 3PL on T with lexical conjoined DP',
      'walk.PAST.3PL they to-the school — “They walked to school.”',
      '1\tCerddon\tcerdded\tVERB\t_\tNumber=Plur|Person=3|Tense=Past\t0\troot\n2\tnhw\tnhw\tPRON\t_\tNumber=Plur|Person=3\t1\tnsubj',
      { Number: 'Plur', Person: '3', SubjectType: 'Pronoun' }, 'SubjectType',
      'accepted',
    ),
    mk(
      'Cerddodd Aled a Sara i’r ysgol.', 'Cerddon Aled a Sara i’r ysgol.',
      ['Cerddodd', 'Cerddon'],
      '[TP [T Cerddodd-3SG] [vP [DP Aled a Sara] …]]',
      '[TP [T Cerddon-3PL] [vP [DP Aled a Sara] …]] ✗ default 3SG required with lexical DP',
      'walk.PAST.3SG Aled and Sara to-the school — “Aled and Sara walked to school.”',
      '1\tCerddodd\tcerdded\tVERB\t_\tNumber=Sing|Person=3|Tense=Past\t0\troot\n2\tAled\tAled\tPROPN\t_\t_\t1\tnsubj',
      { Number: 'Sing', Person: '3', SubjectType: 'LexicalNP' }, 'Number',
      'candidate',
    ),
  ]
}

export function buildSeed(): DB {
  const workspaces: Workspace[] = []
  const phenomena: Phenomenon[] = []
  const templates: Template[] = []
  const pairs: MinimalPair[] = []
  const notes: Note[] = []
  const tasks: Task[] = []
  const events: CalendarEvent[] = []
  const files: FileLink[] = []

  for (const L of LANGS) {
    const wsId = 'ws.' + L.language
    const ws: Workspace = {
      ...stamp(), id: wsId, name: L.name, kind: 'language', icon: L.icon, colour: L.colour,
      cover: cover(L.colour), language: L.language, tier: L.tier, lead: L.lead,
      subtitle: `${L.tier === 'low' ? 'Low-resourced' : 'Higher-resourced'} · lead ${L.lead}`,
      sections: ['Dashboard', 'Phenomena', 'Templates', 'Card flow', 'Validation', 'Notes', 'Tasks', 'Files', 'Calendar'],
      dashboard: { widgets: [
        { id: uid(), type: 'progress', title: 'Construction progress' },
        { id: uid(), type: 'phenomena', title: 'Phenomena' },
        { id: uid(), type: 'tasks', title: 'Tasks' },
        { id: uid(), type: 'keyinfo', title: 'Key information' },
        { id: uid(), type: 'notes', title: 'Notes' },
        { id: uid(), type: 'calendar', title: 'Deadlines' },
      ] },
    }
    workspaces.push(ws)

    L.phen.forEach(([id, label, family, complexity, hypothesis, ref], i) => {
      phenomena.push({
        ...stamp(), id, language: L.language, label, family, complexity,
        hypothesis, ref, note: '', target: 100,
        status: i === 0 ? 'active' : 'planned',
      })
    })

    // one starter template + demo pairs on the first phenomenon
    const first = L.phen[0]
    const tpl: Template = {
      ...stamp(), id: 'tpl.' + L.language + '.1', phenomenon_id: first[0], language: L.language,
      name: `${first[1]} — base template`,
      slots: [
        { name: 'VERB', fillers: ['Cerddon', 'Rhedon', 'Canon'] },
        { name: 'SUBJ', fillers: ['nhw', 'Aled a Sara', 'y plant'] },
        { name: 'GOAL', fillers: ['i’r ysgol', 'i’r dref', 'adref'] },
      ],
      grammatical: '{VERB} {SUBJ} {GOAL}.',
      ungrammatical: '{VERB}* {SUBJ} {GOAL}.',
      contrast: 'Verb agreement morphology (3PL vs 3SG) against subject type.',
    }
    templates.push(tpl)
    pairs.push(...demoPairs(first[0], L.language, tpl.id))

    // a starter note
    notes.push({
      ...stamp(), id: uid(), workspace_id: wsId, section: 'Notes',
      title: `${L.name} — kickoff`,
      html: `<h1>${L.name} test suite</h1><p>Lead(s): <b>${L.lead}</b>. Target: <b>8–10 phenomena</b>, ~100 examples per construction.</p><p>First active phenomenon: <i>${first[1]}</i>. Hypothesis: ${first[4]}</p><ul><li>Onboard one native speaker</li><li>Validate templates with consultant</li><li>Run Prolific naturalness sample</li></ul>`,
      pinned: true,
    })
    tasks.push(
      { ...stamp(), id: uid(), workspace_id: wsId, title: 'Onboard native speaker', status: 'todo', priority: 'high', tags: ['onboarding'], due: '' },
      { ...stamp(), id: uid(), workspace_id: wsId, title: `Finalise templates for ${first[1]}`, status: 'doing', priority: 'med', tags: ['templates'], due: '' },
      { ...stamp(), id: uid(), workspace_id: wsId, title: 'Review phenomenon inventory', status: 'done', priority: 'low', tags: [], due: '' },
    )
    events.push({ ...stamp(), id: uid(), workspace_id: wsId, title: 'Prolific batch', date: '2026-07-15', kind: 'deadline' })
    files.push({ ...stamp(), id: uid(), workspace_id: wsId, title: `xBLiMPs — ${L.name} (Sheet)`, url: '#', kind: 'sheet', note: 'Source-of-truth spreadsheet' })
  }

  // a free personal notebook workspace to show the diary feel
  const personal: Workspace = {
    ...stamp(), id: 'ws.lab', name: 'Lab notebook', kind: 'notebook', icon: '📓', colour: '#A23E5C',
    cover: cover('#A23E5C'), subtitle: 'Coordinator workspace',
    sections: ['Dashboard', 'Notes', 'Tasks', 'Files', 'Calendar'],
    dashboard: { widgets: defaultWidgets() },
  }
  workspaces.push(personal)
  notes.push({
    ...stamp(), id: uid(), workspace_id: 'ws.lab', section: 'Notes', title: 'Project overview', pinned: true,
    html: `<h1>xBLiMPs</h1><p>A multilingual grammatical test-suite platform. INCEpTION is the <i>design reference</i>, not the backend.</p><h2>This week</h2><ul><li>Pilot Welsh end-to-end</li><li>Chase Tagalog lead (TBC)</li></ul>`,
  })
  tasks.push(
    { ...stamp(), id: uid(), workspace_id: 'ws.lab', title: 'Send recruitment emails', status: 'doing', priority: 'high', tags: ['onboarding'], due: '2026-07-02' },
    { ...stamp(), id: uid(), workspace_id: 'ws.lab', title: 'Wire benchmarking export', status: 'todo', priority: 'med', tags: ['eng'], due: '' },
  )
  events.push({ ...stamp(), id: uid(), workspace_id: 'ws.lab', title: 'Team sync', date: '2026-07-03', kind: 'session' })

  return {
    workspaces, notes, tasks, files, events, phenomena, templates, pairs,
    ops: [], audit: [],
    session: { user: 'You', email: 'salhananusha@gmail.com', role: 'coordinator' },
  }
}
