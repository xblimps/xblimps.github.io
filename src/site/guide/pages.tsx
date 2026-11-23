// The instructions hub: one place for every xBLiMPs participant instruction. Wording follows the
// project's division-of-labour and worked-examples references (v3 participant instructions,
// 23 Nov 2026). Anything not yet decided is shown with <Confirm>.

import React, { useMemo } from 'react'
import { Confirm, Principle, PromptTemplateTable, WorkedTable, DivisionTable, Workflow, GroundRules, PROMPT_HEAD } from './common'
import { analyse, demoTemplate, expand, splitAlternatives } from '../../lib/lexgen'

const ThirtyThree = () => <Confirm>33 templates per language, or one shared set of 33 across languages?</Confirm>
const Voucher = () => <Confirm>voucher type, Amazon or Tremendous</Confirm>

// ---------------------------------------------------------------- hub
export function Hub() {
  return (
    <div className="prose">
      <div className="eyebrow-s">Instructions</div>
      <h1>Everything you need to write xBLiMPs templates and examples</h1>
      <p className="lede">
        xBLiMPs is a crowd-built, multilingual benchmark of minimal pairs in the style of BLiMP: pairs of sentences that are
        identical except for one place, where one sentence is grammatical (✓) and the other is not (✗). Language leads design
        the templates; native speakers fill them with natural language. This page is where both find their instructions.
      </p>

      <div className="roles">
        <a className="role-card" href="#/guide/lead">
          <div className="eyebrow-s">Linguistic expertise</div>
          <h3>I'm a language lead</h3>
          <p>Analyse the construction, design 2–3 templates, write the filling instructions, check quality and hand over to native speakers.</p>
          <div className="go">Lead instructions →</div>
        </a>
        <a className="role-card" href="#/guide/native">
          <div className="eyebrow-s">Native-speaker expertise</div>
          <h3>I'm a native speaker</h3>
          <p>Take a validated template, write three natural examples of it, keep the ✓ / ✗ contrast, and flag anything that does not work.</p>
          <div className="go">Native-speaker instructions →</div>
        </a>
      </div>

      <h2>The one principle</h2>
      <Principle />
      <ul>
        <li><b>Across templates:</b> maximise coverage of the language–construction matrix.</li>
        <li><b>Within a template:</b> explore the naturally available dimensions of variation; the three examples need not differ along the same dimension.</li>
        <li><b>Within each example:</b> preserve grammaticality and the intended phenomenon.</li>
      </ul>
      <p>There is no universal variation rule (not “vary singular/plural”, not “add modifiers”). Each language–construction pair has its own template, and some allow far more dimensions of variation than others.</p>

      <h2>How the work flows</h2>
      <Workflow />
      <p>The <b>33 templates are the shared inventory</b>: no new templates, no broadening of the task. <ThirtyThree /></p>

      <h2>Who does what</h2>
      <DivisionTable />
      <p className="muted" style={{ fontSize: 14 }}>Never spend linguist time on work that needs fluency but not linguistic judgement. Never ask native speakers to decide grammatical theory, construction boundaries or template design.</p>

      <h2>What a finished template looks like</h2>
      <p>The prompt template shows its slots, with the alternatives in brackets:</p>
      <PromptTemplateTable />
      <p>Three worked examples of that one template:</p>
      <WorkedTable />
      <p>See the <a href="#/guide/demo">complete workflow demonstration</a> to follow this template from design to generated pairs, or open it in the <a href="#/">lexical generator</a>.</p>

      <h2>Dates</h2>
      <div className="t-wrap">
        <table className="t">
          <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
          <tbody>
            <tr><td>Wed 25 Nov</td><td>leads</td><td>First language-lead session</td></tr>
            <tr><td>End of November (30 Nov)</td><td>leads</td><td>Phenomena final, sheet in slot format, lead rows written, contributors writing</td></tr>
            <tr><td>1–11 Dec</td><td>native speakers + leads</td><td>Template completion, checks and fixes</td></tr>
            <tr><td><b>11 Dec</b></td><td>leads</td><td><b>Dataset complete</b> (~1,000 rows per language), quality-checked; author list final; OpenReview accounts</td></tr>
          </tbody>
        </table>
      </div>

      <GroundRules />
    </div>
  )
}

// ---------------------------------------------------------------- language leads
export function Lead() {
  return (
    <div className="prose">
      <div className="eyebrow-s">For language leads and linguists</div>
      <h1>Language lead instructions</h1>
      <p className="lede">
        Your job is to maximise the quality of the scaffold. You design a few linguistically validated, reusable templates and
        the instructions that let native speakers fill them without a linguistics background.
      </p>
      <div className="callout">
        <b>Your load:</b> about <b>2–3 templates per linguist</b>, drawn from the shared inventory of 33 templates. <ThirtyThree /><br />
        <b>Your deliverable:</b> validated templates, each with short completion instructions and a filled example, ready for native speakers.
      </div>

      <h2>1. Linguistic analysis</h2>
      <ul>
        <li>Review the construction and its phenomenon in your language. Start from clear-cut (Tier 1) phenomena.</li>
        <li>Decide which dimensions can vary in your language and which must stay fixed for the contrast to hold.</li>
        <li>Choose the slots to expose. A slot is a position a native speaker will fill with words.</li>
        <li>Make sure the template carries the intended grammatical contrast. <b>One slot</b> carries the ✓ / ✗ alternation, and the
          ungrammaticality targets the phenomenon only (for subject–verb agreement, vary agreement, not tense).</li>
        <li>Anything that needs linguistic judgement is yours to resolve, not the native speaker's.</li>
      </ul>

      <h2>2. Template design</h2>
      <ol>
        <li><b>Write the header row.</b> One plain label per slot (for example <span className="mono">{PROMPT_HEAD.slice(0, 4).join(' ')}</span>), then the ✓ slot and its ✗ partner: <span className="mono">{PROMPT_HEAD[4]}</span> and <span className="mono">{PROMPT_HEAD[5]}</span>.</li>
        <li><b>Write a first row yourself,</b> with 3–4 lexical alternatives in every varying slot, including the ✓ and ✗ slots. The ✓ and ✗ alternatives are matched by position.</li>
        <li><b>Keep it general enough</b> to capture the construction, not overcomplicated. Templates need not be equally general or share the same optional slots.</li>
        <li><b>Optional slots</b> are welcome where natural; keep them simple.</li>
        <li><b>Run it through the <a href="#/">lexical generator</a>.</b> Read every generated pair. If any combination is unnatural or the ✗ is wrong for the wrong reason, change the alternatives or split the row.</li>
      </ol>
      <PromptTemplateTable />
      <p className="muted" style={{ fontSize: 14 }}>
        Scope per language: 10 macrophenomena covering nominal, verbal and longer-distance phenomena (BLiMP categories are examples,
        not prescriptive), at most 3 subphenomena per macro, about 100 rows per macro: ~1,000 rows per language by 11 Dec.
        Alternatives do not count toward the total; the rows do.
      </p>

      <h2>3. Completion instructions</h2>
      <p>Each template ships with short instructions a native speaker with no linguistics training can follow. Cover:</p>
      <div className="t-wrap">
        <table className="t">
          <tbody>
            <tr><td><b>What to vary</b></td><td>Which slots the speaker fills, and what kind of word or phrase belongs there, in plain words.</td></tr>
            <tr><td><b>What stays constant</b></td><td>The construction, word order and anything that carries the contrast.</td></tr>
            <tr><td><b>How to fill the slots</b></td><td>How many alternatives per slot, how to write the ✗ version, what to do with optional slots.</td></tr>
            <tr><td><b>A filled example</b></td><td>One complete row, like the worked examples below.</td></tr>
          </tbody>
        </table>
      </div>
      <p>An optional one-line written prompt, in your own words, can help speakers think of content.</p>

      <h2>4. Quality control</h2>
      <ul>
        <li>Review <b>flagged cases</b> and a <b>sample</b> of rows for consistency. You do not need to review every routine row; automatic checks run centrally.</li>
        <li>Check each sampled row: the template is unchanged, the ✗ is wrong only for the phenomenon, all combinations are natural, nothing clashes, nothing is offensive or names real people, nothing is copied or AI-written.</li>
        <li>Resolve ambiguities the speakers raise. If a template is impossible to complete in your language, fix the template, not the examples.</li>
        <li>Do the <b>final linguistic validation</b> before the 11 Dec deadline.</li>
      </ul>

      <h2>5. Documentation</h2>
      <p>Each macrophenomenon (ideally each subphenomenon) gets a 1–3 sentence description for the paper's appendix, plus one ✓ and one starred ✗ example.</p>

      <h2>6. Handover</h2>
      <p>See <a href="#/guide/handover">handover between leads and native speakers</a> for the checklist of what to send and what comes back.</p>

      <h2>Worked examples to show your speakers</h2>
      <WorkedTable />
      <p className="muted" style={{ fontSize: 14 }}>For a language-specific version, take three rows of one template from your language's final templates and keep the six column labels identical across rows.</p>

      <h2>Allocation rule</h2>
      <ul>
        <li>Never spend linguist time on work that needs fluency but not linguistic judgement.</li>
        <li>Never ask native speakers to decide grammatical theory, construction boundaries or template design.</li>
      </ul>
      <GroundRules />
    </div>
  )
}

// ---------------------------------------------------------------- native speakers
export function Native() {
  return (
    <div className="prose">
      <div className="eyebrow-s">For native speakers</div>
      <h1>Native-speaker instructions</h1>
      <p className="lede">
        You bring what no linguist can provide alone: a native speaker's sense of what sounds natural. Your language lead gives you a
        validated template and short instructions; you fill its slots with natural language.
      </p>
      <Principle />

      <h2>What you do</h2>
      <ol className="steps">
        <li><b>Read the information sheet.</b> Your language lead will tell you if you need to fill in any paperwork.</li>
        <li><b>Get your sheet and template</b> from your language lead, with their instructions.</li>
        <li><b>Write three examples per template.</b> Keep the structure and the ✓ / ✗ contrast unchanged; change only what goes in the slots.</li>
        <li><b>Judge naturalness.</b> Every example must sound natural to you as a native speaker.</li>
        <li><b>Flag problems</b> instead of working around them (see below).</li>
        <li><b>Put your name next to your rows</b> in the sheet, so your work is credited.</li>
      </ol>

      <h2>The six rules</h2>
      <ol>
        <li>The existing template is the starting point: keep the construction and wording substantially unchanged.</li>
        <li>Explore what can naturally fill each slot in your language.</li>
        <li>Use your judgement about what can vary: templates differ.</li>
        <li>Optional slots are welcome where natural, kept simple.</li>
        <li>No new cases or constructions.</li>
        <li>All three examples must be natural to a native speaker.</li>
      </ol>

      <h2>Three examples, one template</h2>
      <p>Here is what three examples of one template look like. The columns never change; only the words in the slots do.</p>
      <WorkedTable />
      <p>Notice that the rows do not all vary in the same way: each finds its own subject, verb and object, and the third uses <i>who</i> because its subject is a person. That is the point: explore what the template allows.</p>

      <h2>Naturalness</h2>
      <ul>
        <li>Read each ✓ sentence aloud. Would you or people around you say or write it? If you hesitate, change it.</li>
        <li>The ✗ sentence should be wrong in exactly one way: the target phenomenon. If it is also wrong for another reason, fix it.</li>
        <li>Every alternative in a slot must work with every alternative in the other slots, because the <a href="#/">generator</a> combines all of them.</li>
        <li>Never force variation. If a slot really has only one natural filler, that is fine.</li>
      </ul>

      <h2>When and how to flag</h2>
      <p>Flag a template to your language lead when it is <b>confusing</b>, <b>unnatural</b> in your language, or <b>impossible to complete</b>
        without changing the construction. Note which template, which row, and in a sentence what the problem is. Do not redesign the
        template yourself: deciding that is the lead's job.</p>

      <h2>Using the generator</h2>
      <p>The <a href="#/">lexical generator</a> takes your row (slot headers plus your alternatives) and lists every ✓ / ✗ pair it makes. Use it to
        read every combination and catch the ones that do not work. It only combines your words; it never adds any.</p>

      <h2>Credit and payment</h2>
      <ul>
        <li>Paid batches of 25 rows at £15.50 (about an hour), for paid languages only, paid in vouchers through the department. <Voucher /></li>
        <li>One batch or more: acknowledged by name in the paper.</li>
        <li>Co-authorship: about 300 seed sentences, agreed with the team in advance, plus an OpenReview account before 11 Dec. Paid contributors cannot be authors.</li>
      </ul>
      <p className="muted" style={{ fontSize: 14 }}>
        How the “three examples per template” relate to the sheet convention of 3–4 alternatives in every varying slot:{' '}
        <Confirm>does each of the three examples carry 3–4 alternatives per slot, or one filler per slot as in the worked table?</Confirm>
      </p>
      <p>Questions? Your language lead is your first port of call; the open Q&amp;A and template-writing sessions are for every language.</p>
      <GroundRules />
    </div>
  )
}

// ---------------------------------------------------------------- full workflow demo
export function Demo() {
  const t = useMemo(() => demoTemplate(), [])
  const a = useMemo(() => analyse(t), [t])
  const first = useMemo(() => { const out = []; for (const p of expand(t)) { out.push(p); if (out.length >= 6) break } return out }, [t])
  const alts = t.columns.map((c, ci) => ({ c, v: splitAlternatives(t.rows[0][ci], c.role) }))
  return (
    <div className="prose" style={{ maxWidth: 900 }}>
      <div className="eyebrow-s">Worked demonstration</div>
      <h1>The whole workflow, start to finish</h1>
      <p className="lede">One English template (BLiMP <span className="mono">distractor_agree_rc</span>: subject–verb agreement across a relative clause with a plural “distractor” noun), followed from the lead's design to the generated pairs.</p>

      <h2>Step 1 · The lead designs the template</h2>
      <p>The lead identifies the phenomenon (the verb agrees with the singular subject, not with the nearer plural object), fixes the construction
        (singular subject + relative clause containing a plural object + main verb phrase) and exposes the slots:</p>
      <div className="t-wrap"><table className="t"><thead><tr>{PROMPT_HEAD.map((h, i) => <th key={h} className={`mono ${i === 4 ? 'good' : i === 5 ? 'bad' : ''}`}>{h}</th>)}</tr></thead></table></div>
      <p>The completion instructions say: <i>vary</i> the singular subject, the verb and the plural object, and the main verb phrase; <i>keep</i> the singular subject, the relative clause and the plural object between subject and verb; <i>write</i> the ✗ by changing only the agreement on the main verb.</p>

      <h2>Step 2 · One row</h2>
      <p>The first example, one filler per slot:</p>
      <div className="t-wrap"><table className="t"><tbody><tr>
        <td>The refrigerator</td><td>that</td><td>stores</td><td>all the cakes</td><td className="good">runs too cold.</td><td className="bad">*run too cold.</td>
      </tr></tbody></table></div>

      <h2>Step 3 · Options in every slot</h2>
      <p>The speaker explores what else could naturally go in each slot, keeping every option compatible with every other:</p>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Slot</th><th>Alternatives</th><th>Count</th></tr></thead>
        <tbody>{alts.map(({ c, v }) => (
          <tr key={c.label}><td className={`mono ${c.role === 'good' ? 'good' : c.role === 'bad' ? 'bad' : ''}`}>{c.label} {c.role === 'good' ? '✓' : c.role === 'bad' ? '✗' : ''}</td><td>{v.join(' · ')}</td><td>{v.length}</td></tr>
        ))}</tbody>
      </table></div>
      <PromptTemplateTable />

      <h2>Step 4 · Generated pairs</h2>
      <p>The <a href="#/">lexical generator</a> combines them: 3 subjects × 1 relativiser × 3 verbs × 3 objects × 2 ✓/✗ endings = <b>{a.total} minimal pairs</b>. The first few:</p>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>#</th><th className="good">✓</th><th className="bad">✗</th></tr></thead>
        <tbody>{first.map((p) => <tr key={p.index}><td className="faint">{p.index}</td><td>{p.good}</td><td className="pair-bad">{p.bad}</td></tr>)}</tbody>
      </table></div>
      <p><a className="btn" href="#/">Open this template in the generator →</a></p>

      <h2>Step 5 · Check and hand back</h2>
      <ul>
        <li>The speaker reads every pair: “the display case that holds the baked goods randomly shuts off” must be as natural as the first row. Anything that is not gets removed or moved to its own row.</li>
        <li>Problems with the template itself are flagged to the lead.</li>
        <li>The lead reviews the flags and a sample, then validates.</li>
      </ul>

      <h2>The result: three examples of one template</h2>
      <WorkedTable />
    </div>
  )
}

// ---------------------------------------------------------------- heuristics, mistakes, troubleshooting
const MISTAKES: [string, string][] = [
  ['Changing the construction (new word order, an extra clause, a different case)', 'Keep the template\'s construction; vary only the slot content. If the construction does not work in your language, flag it.'],
  ['The ✗ sentence is wrong for two reasons (agreement and tense, say)', 'Change only the phenomenon in the ✗ slot; everything else is identical to the ✓.'],
  ['Alternatives that clash (a verb that cannot take one of the objects)', 'Every alternative must work with every alternative in the other slots. Remove the clashing one or give it its own row.'],
  ['Forcing variation where the language offers none', 'Never force it. One natural filler is better than three awkward ones.'],
  ['Applying one variation rule everywhere (“always vary number”, “always add an adjective”)', 'There is no universal rule. Explore what this template allows in this language.'],
  ['Adding new templates, cases or constructions', 'The 33 templates are the shared inventory: no new templates, no broadening.'],
  ['Too many alternatives, so the combinations explode', 'Fewer, well-chosen alternatives that all combine naturally. The generator warns above 500 pairs per row.'],
  ['Different numbers of ✓ and ✗ alternatives', 'They are paired by position: the 1st ✓ with the 1st ✗. Give both the same number.'],
  ['Sentences from AI tools, the web or textbooks', 'Not allowed. Every sentence is written by a person, from their own knowledge of the language.'],
  ['Real people\'s names or details, offensive content, stereotypes', 'Use ordinary, neutral content.'],
]

export function Help() {
  return (
    <div className="prose" style={{ maxWidth: 900 }}>
      <div className="eyebrow-s">Heuristics · mistakes · troubleshooting</div>
      <h1>Getting it right</h1>

      <h2>Heuristics</h2>
      <ul>
        <li>Look at each slot and ask what else could go there.</li>
        <li>Vary words, expressions, people, objects or situations where appropriate.</li>
        <li>Explore more than one kind of variation where the template allows it.</li>
        <li>Never force variation.</li>
        <li>Templates need not be equally general or share the same optional slots.</li>
        <li>Coverage across templates beats generalisation within one.</li>
      </ul>
      <div className="callout">
        <b>“Should templates be broader?”</b> Only within what that template naturally allows. Keep the construction fixed; coverage across templates beats generalisation within one.
      </div>

      <h2>Common mistakes</h2>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Mistake</th><th>What to do instead</th></tr></thead>
        <tbody>{MISTAKES.map(([m, f]) => <tr key={m}><td>{m}</td><td>{f}</td></tr>)}</tbody>
      </table></div>

      <h2>Troubleshooting the generator</h2>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Problem</th><th>Fix</th></tr></thead>
        <tbody>
          <tr><td>“Mark one slot as ✓” or “as ✗”</td><td>Set the role of the grammatical slot to ✓ and its ungrammatical partner to ✗ in the slot header (or put ✓ / ✗ in the header text before pasting).</td></tr>
          <tr><td>My pasted sheet arrived as one column</td><td>Select the cells in the sheet and copy them (they paste as tab-separated). Or paste CSV or a Markdown table.</td></tr>
          <tr><td>An alternative contains a comma</td><td>Double it (<span className="mono">Segons la meva mare,, Em van dir que</span>), or end a single alternative with it (<span className="mono">(partir,)</span>), or separate that cell's alternatives with <span className="mono">|</span> or <span className="mono">;</span> instead. A sheet note “commas are not a delimiter in the X cell” is also understood.</td></tr>
          <tr><td>My sheet has many templates in one tab</td><td>Copy the whole tab into “Check a whole sheet tab” on the generator page: it finds every template, counts seed rows against the targets, gives three examples per template for sign-off and downloads all the pairs at once.</td></tr>
          <tr><td>I want a slot to be sometimes empty</td><td>Add <span className="mono">∅</span> as one of its alternatives.</td></tr>
          <tr><td>My language is written without spaces</td><td>Set “Join slots with” to “nothing”, and adjust capitalisation and the final punctuation.</td></tr>
          <tr><td>The CSV shows strange characters in Excel</td><td>The CSV is UTF-8 (with a byte-order mark). If it still looks wrong, download the TSV, or import the file as UTF-8.</td></tr>
          <tr><td>The count is bigger than I expected</td><td>The count is the product of the number of alternatives in each slot. Check the formula at the end of each row.</td></tr>
          <tr><td>The highlighted word in a pair is wrong</td><td>The highlight is only a reading aid (first match of the ✓ / ✗ filler). The downloaded file is unaffected.</td></tr>
          <tr><td>I closed the page</td><td>Your template is kept in this browser only. Use “Copy template” to keep a copy in your sheet.</td></tr>
        </tbody>
      </table></div>

      <h2>Troubleshooting the task</h2>
      <ul>
        <li><b>The template is impossible in my language.</b> Flag it to your lead with the reason; do not rewrite it.</li>
        <li><b>I can only think of one natural option for a slot.</b> That is fine; leave it fixed and explore other slots.</li>
        <li><b>My three examples all vary the same thing.</b> They may, but look for other naturally available dimensions first.</li>
        <li><b>I am not sure the ✗ is ungrammatical, or only odd.</b> Flag it; the lead decides.</li>
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- handover
export function Handover() {
  return (
    <div className="prose">
      <div className="eyebrow-s">Handover</div>
      <h1>Handover between leads and native speakers</h1>
      <p className="lede">The handover is where linguistic expertise turns into volume. A good packet means native speakers can start without questions; a good return means leads only review what needs judgement.</p>

      <h2>Lead → native speaker: the packet</h2>
      <ul>
        <li>☐ The validated template: header row with plain slot labels and the ✓ / ✗ slots.</li>
        <li>☐ Completion instructions: what to vary, what stays constant, how to fill the slots.</li>
        <li>☐ One filled example row (and the three-row worked table).</li>
        <li>☐ The language-specific construction matrix and which templates this speaker is assigned.</li>
        <li>☐ Where to write (which sheet and tab) and the reminder to put their name next to their rows.</li>
        <li>☐ How to flag problems, and the date the rows are due.</li>
        <li>☐ For paid languages: whether any paperwork is needed before they start.</li>
      </ul>

      <h2>Native speaker → lead: the return</h2>
      <ul>
        <li>☐ Three examples per assigned template, structure and ✓ / ✗ contrast unchanged.</li>
        <li>☐ Every combination checked for naturalness (the generator lists them).</li>
        <li>☐ Flags for anything confusing, unnatural or impossible, with the row and a one-line reason.</li>
        <li>☐ Name next to each row.</li>
      </ul>

      <h2>Lead: closing the loop</h2>
      <ol className="steps">
        <li>Resolve the flags: fix the template if it is the problem, or explain how to fill it.</li>
        <li>Review a sample of rows for consistency (not every routine row).</li>
        <li>Record contributors and batches in the project's contributor spreadsheet.</li>
        <li>Final linguistic validation before 11 Dec.</li>
      </ol>

      <h2>Who to ask</h2>
      <p>Native speakers ask their language lead first. Leads bring open questions to the Q&amp;A and template-writing sessions or the project channel.</p>
      <DivisionTable />
    </div>
  )
}
