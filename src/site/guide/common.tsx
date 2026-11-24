// Shared pieces of the guide. Terms, targets, dates and rules follow Suchir's decisions of
// 23–24 Nov 2026 (template = the unit that counts; slot pattern = the lead's structure; generated
// sentences do not count). The worked examples and the prompt row are the human-written English
// reference rows for BLiMP `distractor_agree_rc` (the "distractor_agree_rc templates" tab of the
// reference workbook). Keep them identical to the decks and guidelines; never invent example sentences.

import React from 'react'

/** An item still awaiting a decision. Rendered visibly so nobody mistakes it for settled. */
export const Confirm = ({ children }: { children: React.ReactNode }) => (
  <span className="confirm" title="Not decided yet">[CONFIRM: {children}]</span>
)

export const Principle = () => (
  <div className="principle">Preserve the slot pattern, explore what's possible within it.</div>
)

/** The project languages (ACL 2027 dataset), alphabetical. */
export const LANGUAGES = ['Afrikaans', 'Basque', 'Catalan', 'English', 'French', 'Persian', 'Spanish', 'Tagalog', 'Welsh']

export function Languages() {
  return (
    <ul className="lang-list" aria-label="Project languages">
      {LANGUAGES.map((l) => <li key={l}>{l}</li>)}
    </ul>
  )
}

export const MEET_URL = 'https://meet.google.com/dft-eudu-prg'

/** The three terms, used word for word everywhere on the site. */
export function Terminology() {
  return (
    <dl className="terms">
      <div>
        <dt>Slot pattern</dt>
        <dd>
          The structure a language lead designs for a subphenomenon: the slot labels (for example <span className="mono">{'{subj_sg} {rel} {V_trans} {obj_pl}'}</span>),
          which slot carries the ✓ / ✗ contrast, and any constraints. Leads design and validate slot patterns.
        </dd>
      </div>
      <div>
        <dt>Template</dt>
        <dd>
          <b>The unit that counts.</b> One row of the sheet under a slot pattern, with <b>3–4 human-written alternatives in every varying slot</b>,
          including the ✓ / ✗ contrast slot. (A template was previously called a <i>seed sentence</i>.)
        </dd>
      </div>
      <div>
        <dt>Generated sentence</dt>
        <dd>
          One ✓ / ✗ minimal pair the generator builds from a template by taking one alternative per slot. One template gives many of them
          (3 subjects × 3 verbs × 3 objects is 27), and they are deduplicated and filtered before review. <b>Generated sentences do not count</b> toward
          the target: that is still one template.
        </dd>
      </div>
    </dl>
  )
}

export function Targets() {
  return (
    <div className="t-wrap">
      <table className="t">
        <tbody>
          <tr><td><b>Per language</b></td><td><b>~1,000 templates</b> → ~10,000 generated sentences (about 10 per template on average after filtering; not a maximum)</td></tr>
          <tr><td>Macrophenomena</td><td>10 per language, <b>100 templates each</b> (10 × 100 = 1,000)</td></tr>
          <tr><td>Subphenomena</td><td>Optional, at most 3 per macrophenomenon: none → 100 templates; 2 → 50 each; 3 → at least 33 each</td></tr>
          <tr><td>What counts</td><td>Templates (rows) only. Lexical alternatives and generated sentences do not count; leads' own templates do, at the same quality bar.</td></tr>
          <tr><td>Deadline</td><td><b>11 Dec 2026</b>, full datasets for every language</td></tr>
        </tbody>
      </table>
    </div>
  )
}

export function Timeline() {
  return (
    <div className="t-wrap">
      <table className="t">
        <thead><tr><th>When</th><th>What</th></tr></thead>
        <tbody>
          <tr><td><b>11 Dec 2026</b></td><td><b>Dataset complete</b>: ~1,000 templates per language, quality-checked; subphenomena documented; author list final; OpenReview accounts</td></tr>
          <tr><td>18 Dec 2026</td><td>Full paper draft (each language writes its appendix subsection)</td></tr>
          <tr><td>4 Jan 2027</td><td>ACL submission</td></tr>
        </tbody>
      </table>
    </div>
  )
}

export function Sessions() {
  return (
    <>
      <div className="t-wrap">
        <table className="t">
          <thead><tr><th>When (UK time)</th><th>Session</th></tr></thead>
          <tbody>
            <tr><td><b>Wed 25 Nov</b>, 09:00–11:00</td><td>Language-lead session</td></tr>
            <tr><td><b>Fri 27 Nov</b>, 10:00–11:00</td><td>Q&amp;A and template-writing session</td></tr>
          </tbody>
        </table>
      </div>
      <p>Both on Google Meet: <a href={MEET_URL} target="_blank" rel="noreferrer">meet.google.com/dft-eudu-prg</a>. Methodological questions are settled together in the Wednesday
        session and in <span className="mono">#cls-xblimps</span>, which is the single source of truth for decisions.</p>
    </>
  )
}

/** The prompt row: a slot pattern's headers with one template's bracketed alternatives. */
export const PROMPT_HEAD = ['{subj_sg}', '{rel}', '{V_trans}', '{obj_pl}', '{VP_sg} ✓', '*{VP_pl} ✗']
export const PROMPT_ROW = [
  '(the refrigerator, the display case, the freezer)',
  'that',
  '(stores, contains, holds)',
  '(all the cakes, all the desserts, the baked goods)',
  '(runs too cold, randomly shuts off)',
  '(run too cold, randomly shut off)',
]

export function PromptTemplateTable() {
  return (
    <div className="t-wrap">
      <table className="t">
        <thead><tr>{PROMPT_HEAD.map((h, i) => <th key={h} className={`mono ${i === 4 ? 'good' : i === 5 ? 'bad' : ''}`}>{h}</th>)}</tr></thead>
        <tbody><tr>{PROMPT_ROW.map((c, i) => <td key={i} className={i === 4 ? 'good' : i === 5 ? 'bad' : ''}>{c}</td>)}</tr></tbody>
      </table>
    </div>
  )
}

/** Worked example: exactly three rows of one slot pattern, identical columns; only slot content varies. */
export const WORKED_HEAD = ['Subject', 'Relativiser', 'Verb', 'Distractor object', '✓ Correct ending', '✗ Incorrect ending']
export const WORKED_ROWS = [
  ['The refrigerator', 'that', 'stores', 'all the cakes', 'runs too cold.', '*run too cold.'],
  ['The cafe', 'that', 'sells', 'matcha drinks', 'opens this Friday.', '*open this Friday.'],
  ['My neighbour', 'who', 'lost', 'her keys', 'lives down the hall.', '*live down the hall.'],
]

export function WorkedTable() {
  return (
    <>
      <div className="t-wrap">
        <table className="t">
          <thead><tr>{WORKED_HEAD.map((h, i) => <th key={h} className={i === 4 ? 'good' : i === 5 ? 'bad' : ''}>{h}</th>)}</tr></thead>
          <tbody>
            {WORKED_ROWS.map((r, ri) => (
              <tr key={ri}>{r.map((c, i) => <td key={i} className={i === 4 ? 'good' : i === 5 ? 'bad' : ''}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>
        Three templates under one slot pattern (English BLiMP <span className="mono">distractor_agree_rc</span>), human-written reference rows, each shown with
        one alternative per slot. Same columns in every row; only the content of the slots changes. In the sheet, each of these rows carries 3–4 alternatives per slot, like the prompt row.
      </p>
    </>
  )
}

const DOL: [string, string, string][] = [
  ['Understand the grammatical phenomenon', 'Yes', '—'],
  ['Design the slot pattern (slot labels, ✓ / ✗ slot, constraints)', 'Yes', '—'],
  ['Decide on a new structure', 'Decides', 'Proposes it to the lead'],
  ['Write completion instructions', 'Yes', '—'],
  ['Write templates (3–4 alternatives per slot)', 'Yes (counts toward the target)', 'Main task'],
  ['Read every generated pair of own templates in the generator', 'Yes', 'Yes'],
  ['Ambiguities', 'Resolves', 'Flags'],
  ['Validate slot patterns before contributors use them', 'Yes', '—'],
  ['Review contributors\' templates (flags + a sample)', 'Yes', '—'],
  ['Final linguistic validation before 11 Dec', 'Yes', 'Assists'],
]

export function DivisionTable() {
  return (
    <div className="t-wrap">
      <table className="t">
        <thead><tr><th>Activity</th><th>Language lead</th><th>Native-speaker contributor</th></tr></thead>
        <tbody>{DOL.map(([a, l, n]) => <tr key={a}><td>{a}</td><td>{l}</td><td>{n}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export function Workflow() {
  return (
    <ol className="steps">
      <li><b>Design.</b> The language lead designs a slot pattern for each subphenomenon, writes the first templates under it and validates it.</li>
      <li><b>Handover.</b> Each slot pattern ships with short instructions: what to vary, what stays constant, how to fill the slots.</li>
      <li><b>Writing.</b> Native-speaker contributors write templates under the lead's slot patterns, 3–4 alternatives in every varying slot, and read the generated pairs.</li>
      <li><b>Validation.</b> The lead reviews flagged templates and a sample for consistency; automatic checks, deduplication and filtering run centrally.</li>
    </ol>
  )
}

/** How to write a template: the quality rules (brief §B). */
export function TemplateRules() {
  return (
    <ol>
      <li><b>3–4 alternatives in every varying slot</b>, including the ✓ / ✗ contrast slot. The ✓ and ✗ alternatives are matched by position (1st ✓ with 1st ✗).</li>
      <li><b>Semantically coherent rows.</b> The generator combines every alternative with every other alternative in its row, so each one must make sense with all the others.</li>
      <li><b>One slot carries the ✓ / ✗ contrast</b>, and the ungrammaticality targets the phenomenon only (for subject–verb agreement, vary agreement, not tense or word choice).</li>
      <li><b>Each row internally consistent</b> for gender, number and similar features. One general slot pattern with gender or number changing between rows is fine, and so are separate slot patterns per configuration: choose what fits the grammar.</li>
      <li><b>Vary your words across templates.</b> Avoid reusing the same word in template after template (see lexical variety below).</li>
      <li><b>Contributors do not invent new structures.</b> Write templates under your lead's slot pattern; an idea for a new structure goes to the lead, who decides.</li>
    </ol>
  )
}

export function LexicalVariety() {
  return (
    <div className="callout">
      <b>Lexical variety</b>
      <p style={{ margin: '6px 0 0' }}>
        Avoid reusing the same word across templates. The French pilot leaned heavily on <i>fatiguée</i>, and reading the same word in pair after pair tires native-speaker
        reviewers and weakens the dataset. Vary the people, objects, verbs and situations from one template to the next. The <a href="#/">sheet check</a> lists the words that
        appear in the most templates of a tab, and the generator removes repeated pairs before you download them.
      </p>
    </div>
  )
}

export function GroundRules() {
  return (
    <div className="callout rule">
      <b>Ground rules for everyone</b>
      <ul style={{ margin: '6px 0 0' }}>
        <li><b>No AI-generated templates, words or sentences, ever.</b> Every template and every word in it is written by a person. (Using AI to think through slot-pattern design is fine; the generator on this site never writes words.)</li>
        <li>No sentences copied from elsewhere.</li>
        <li>No offensive content, stereotypes, or real people's names or details.</li>
        <li>Quality over mechanically filling a spreadsheet.</li>
      </ul>
    </div>
  )
}

/** Admin points still being confirmed: say so, never state a policy. */
export function PendingAdmin() {
  return (
    <p className="muted" style={{ fontSize: 14 }}>
      Some admin details are still being confirmed, including consent paperwork for volunteer contributors and payment routes in some countries.
      Your language lead will tell you what applies to you, and decisions will be announced in <span className="mono">#cls-xblimps</span>.
    </p>
  )
}
