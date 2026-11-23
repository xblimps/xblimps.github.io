// Shared pieces of the instructions hub. The worked examples and the prompt template are the
// human-written English reference rows for BLiMP `distractor_agree_rc` (the "distractor_agree_rc
// templates" tab of the reference workbook). Keep them identical to the decks and guidelines.

import React from 'react'

/** An item still awaiting Suchir's decision. Rendered visibly so nobody mistakes it for settled. */
export const Confirm = ({ children }: { children: React.ReactNode }) => (
  <span className="confirm" title="Not decided yet">[CONFIRM: {children}]</span>
)

export const Principle = () => (
  <div className="principle">Preserve the template, explore what's possible within it.</div>
)

/** The prompt template: explicit slots with bracketed alternatives (what leads and contributors fill in). */
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

/** Worked examples: exactly three rows of one template, identical columns; only slot content varies. */
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
        Three examples of one template (English BLiMP <span className="mono">distractor_agree_rc</span>), human-written reference rows.
        Same columns in every row; only the content of the slots changes.
      </p>
    </>
  )
}

const DOL: [string, string, string][] = [
  ['Understand the grammatical phenomenon', 'Lead', '—'],
  ['Design the prompt template', 'Lead', '—'],
  ['Decide the variable slots', 'Lead', '—'],
  ['Define grammatical constraints', 'Lead', 'Follow'],
  ['Write completion instructions', 'Lead', '—'],
  ['Fill template slots', '—', 'Lead'],
  ['Generate three examples', '—', 'Lead'],
  ['Check naturalness', 'Review if needed', 'Lead'],
  ['Ambiguities', 'Resolve', 'Identify (flag)'],
  ['Final linguistic validation', 'Lead', 'Assist'],
]

export function DivisionTable() {
  return (
    <div className="t-wrap">
      <table className="t">
        <thead><tr><th>Activity</th><th>Linguist / language lead</th><th>Native speaker</th></tr></thead>
        <tbody>{DOL.map(([a, l, n]) => <tr key={a}><td>{a}</td><td>{l}</td><td>{n}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export function Workflow() {
  return (
    <ol className="steps">
      <li><b>Design.</b> Linguists take the construction inventory and design 2–3 templates each: general enough to capture the construction, not overcomplicated.</li>
      <li><b>Handover.</b> Each template ships with short instructions: what to vary, what stays constant, how to fill the slots.</li>
      <li><b>Completion.</b> Native speakers get the language-specific construction matrix and complete their assigned templates, three examples each.</li>
      <li><b>Quality control.</b> Linguists review flagged cases and a sample for consistency, not every routine row; automatic checks run centrally.</li>
    </ol>
  )
}

export function GroundRules() {
  return (
    <div className="callout rule">
      <b>Ground rules for everyone</b>
      <ul style={{ margin: '6px 0 0' }}>
        <li><b>No AI-written templates or sentences, ever.</b> Every template and every word in a sentence is written by a person. (Using AI to think through template design is fine; the generator on this site never writes words.)</li>
        <li>No sentences copied from elsewhere.</li>
        <li>No offensive content, stereotypes, or real people's names or details.</li>
        <li>Options must not clash: every alternative in a slot has to work with every alternative in the other slots.</li>
        <li>The ✗ sentence is wrong only because of the target phenomenon (for agreement: agreement, not tense).</li>
      </ul>
    </div>
  )
}
