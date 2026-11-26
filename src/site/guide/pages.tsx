// The guide: the one place for xBLiMPs instructions for language leads and native-speaker
// contributors, in five pages: Instructions (overview), I'm a Language Lead, I'm a Native Speaker,
// Worked Demo and Advice. Terms, targets and dates follow Suchir's decisions of 23–24 Nov 2026
// (template = the unit that counts; slot pattern = the lead's structure). Items still being
// confirmed are described as pending and never stated as policy.

import React, { useMemo } from 'react'
import { loadIntoGenerator } from '../Generator'
import {
  Principle, PromptTemplateTable, WorkedTable, DivisionTable, Workflow, GroundRules, PROMPT_HEAD,
  Terminology, Targets, Timeline, Sessions, Languages, TemplateRules, LexicalVariety, PendingAdmin, MEET_URL, SheetConventions,
} from './common'
import { analyse, demoTemplate, dedupePairs, expand, splitAlternatives, DEFAULT_OPTIONS, WARN_PER_ROW } from '../../lib/lexgen'

// ---------------------------------------------------------------- Instructions (overview)
export function Instructions() {
  return (
    <div className="prose">
      <div className="eyebrow-s">Instructions</div>
      <h1>Everything you need to write xBLiMPs templates</h1>
      <p className="lede">
        xBLiMPs is a crowd-built, multilingual benchmark of minimal pairs in the style of BLiMP: pairs of sentences that are
        identical except for one place, where one sentence is grammatical (✓) and the other is not (✗). Language leads design
        slot patterns; native speakers write templates under them; the <a href="#/generator">lexical generator</a> turns each template into minimal pairs.
        This site is the one place for the instructions, for every project language.
      </p>

      <div className="roles">
        <a className="role-card" href="#/guide/lead">
          <div className="eyebrow-s">Linguistic expertise</div>
          <h3>I'm a Language Lead</h3>
          <p>Design and validate slot patterns, write the first templates, give contributors instructions and review their templates.</p>
          <div className="go">Lead instructions →</div>
        </a>
        <a className="role-card" href="#/guide/native">
          <div className="eyebrow-s">Native-speaker expertise</div>
          <h3>I'm a Native Speaker</h3>
          <p>Write templates under your lead's slot pattern, 3–4 natural alternatives in every slot, check the generated pairs and flag problems.</p>
          <div className="go">Contributor instructions →</div>
        </a>
      </div>

      <h2>Languages</h2>
      <p>Nine languages, one shared method. The generator and these pages are the same for all of them.</p>
      <Languages />

      <h2>Terms</h2>
      <Terminology />

      <h2>Targets</h2>
      <Targets />

      <h2>How the work flows</h2>
      <Workflow />

      <h2>Who does what</h2>
      <DivisionTable />
      <p className="muted" style={{ fontSize: 14 }}>Never spend linguist time on work that needs fluency but not linguistic judgement. Never ask native speakers to decide grammatical theory, phenomenon boundaries or slot-pattern design.</p>

      <h2>What a finished template looks like</h2>
      <p>A slot pattern with one template's alternatives in brackets:</p>
      <PromptTemplateTable />
      <p>Three templates under that one slot pattern:</p>
      <WorkedTable />
      <p>The <a href="#/guide/demo">Worked Demo</a> follows this example step by step through the generator; the writing rules are in <a href="#/guide/advice">Advice</a>.</p>

      <h2>Timeline</h2>
      <Timeline />

      <h2>Sessions (UK time)</h2>
      <Sessions />

      <GroundRules />
      <p>Questions? See <a href="#/guide/advice">Advice</a> (including the FAQ), or ask your language lead.</p>
    </div>
  )
}

// ---------------------------------------------------------------- language leads
export function Lead() {
  return (
    <div className="prose">
      <div className="eyebrow-s">I'm a Language Lead</div>
      <h1>Language lead instructions</h1>
      <p className="lede">
        You maximise the quality of the scaffold: linguistically validated slot patterns, clear instructions that let native speakers write templates
        without a linguistics background, and a review that keeps quality consistent.
      </p>
      <div className="callout">
        <b>Your target:</b> ~1,000 templates for your language by <b>11 Dec</b>: 10 macrophenomena × 100 templates, with at most 3 subphenomena per macro
        (2 → 50 each; 3 → at least 33 each). Your own templates count, at the same quality bar.
      </div>

      <h2>1. Linguistic analysis</h2>
      <ul>
        <li>Choose 10 macrophenomena covering nominal, verbal and longer-distance phenomena (BLiMP categories are examples, not prescriptive). Start from clear-cut phenomena.</li>
        <li>Decide which dimensions can vary in your language and which must stay fixed for the contrast to hold.</li>
        <li>Anything that needs linguistic judgement is yours to resolve, not the contributor's.</li>
      </ul>

      <h2>2. Slot-pattern design</h2>
      <ol>
        <li><b>Write the header row.</b> One plain label per slot (for example <span className="mono">{PROMPT_HEAD.slice(0, 4).join(' ')}</span>), then the ✓ slot and its ✗ partner: <span className="mono">{PROMPT_HEAD[4]}</span> and <span className="mono">{PROMPT_HEAD[5]}</span>.</li>
        <li><b>One slot carries the contrast,</b> and the ungrammaticality targets the phenomenon only.</li>
        <li><b>Gender and number:</b> one general slot pattern with gender or number varying between rows (each row internally consistent), or separate slot patterns per configuration. Both are fine; choose what fits the grammar.</li>
        <li><b>Write the first templates yourself,</b> with 3–4 alternatives in every varying slot, and run them through the <a href="#/generator">lexical generator</a>. Read every pair.</li>
        <li><b>Validate the slot pattern</b> before contributors use it.</li>
      </ol>
      <PromptTemplateTable />

      <h2>3. Completion instructions</h2>
      <p>Each slot pattern ships with short instructions a native speaker with no linguistics training can follow:</p>
      <div className="t-wrap">
        <table className="t">
          <tbody>
            <tr><td><b>What to vary</b></td><td>Which slots the contributor fills, and what kind of word or phrase belongs there, in plain words.</td></tr>
            <tr><td><b>What stays constant</b></td><td>The structure, word order and anything that carries the contrast.</td></tr>
            <tr><td><b>How to fill the slots</b></td><td>3–4 alternatives per slot, how to write the ✗ version, what to do with optional slots, gender/number consistency within the row.</td></tr>
            <tr><td><b>A worked example</b></td><td>Three rows of the slot pattern, identical columns, like the one in the <a href="#/guide/demo">Worked Demo</a>.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>4. Validation responsibilities</h2>
      <ul>
        <li>Review <b>flagged templates</b> and a <b>sample</b> of each contributor's templates. Automatic checks, deduplication and filtering run centrally.</li>
        <li>Check each sampled template: semantically coherent, every combination natural, ✗ wrong only for the phenomenon, row-internal gender/number consistency, no new structure, varied vocabulary, nothing offensive, copied or AI-generated.</li>
        <li>Decide on contributors' ideas for new structures. If a slot pattern is impossible to complete in your language, fix the slot pattern, not the templates.</li>
        <li>Use the <a href="#/generator">sheet check</a> on each tab: it counts templates against the targets and lists words repeated across many templates.</li>
        <li>Do the <b>final linguistic validation</b> before 11 Dec.</li>
      </ul>

      <h2>5. Documentation</h2>
      <p>Each macrophenomenon (ideally each subphenomenon) gets a 1–3 sentence description for the paper's appendix, plus one ✓ and one starred ✗ example.</p>

      <h2>6. Handover to contributors</h2>
      <p>A good packet means contributors can start without questions; a good return means you only review what needs judgement.</p>
      <h3>What you send</h3>
      <HandoverPacket />
      <h3>What comes back</h3>
      <ContributorReturn />
      <h3>Closing the loop</h3>
      <ClosingLoop />

      <h2>Working together</h2>
      <ul>
        <li>Methodological questions are settled together in the Wednesday session and in <span className="mono">#cls-xblimps</span>, the single source of truth, rather than in separate direct messages.</li>
        <li>Messages to leads go out in reasonable working hours.</li>
      </ul>
      <GroundRules />
    </div>
  )
}

// ---------------------------------------------------------------- native-speaker contributors
export function Native() {
  return (
    <div className="prose">
      <div className="eyebrow-s">I'm a Native Speaker</div>
      <h1>Contributor instructions</h1>
      <p className="lede">
        You bring what no linguist can provide alone: a native speaker's sense of what sounds natural. Your language lead gives you a validated slot pattern
        and short instructions; you write templates under it.
      </p>
      <Principle />

      <h2>What you do</h2>
      <ol className="steps">
        <li><b>Read the information sheet.</b> Your language lead will tell you if you need to fill in any paperwork.</li>
        <li><b>Get your sheet and slot pattern</b> from your language lead, with their instructions.</li>
        <li><b>Write templates.</b> Each template is one row with 3–4 alternatives in every varying slot, including the ✓ / ✗ slot. A batch is 25 templates (about an hour).</li>
        <li><b>Check them in the <a href="#/generator">generator</a>.</b> Read every generated pair; each one must sound natural to you.</li>
        <li><b>Flag problems</b> instead of working around them (see below).</li>
        <li><b>Put your name next to your templates</b> in the sheet, so your work is credited.</li>
      </ol>

      <h2>How to write a template</h2>
      <TemplateRules />
      <SheetConventions />
      <p>See it done step by step in the <a href="#/guide/demo">Worked Demo</a>; more tips and common mistakes are in <a href="#/guide/advice">Advice</a>.</p>

      <h2>Naturalness</h2>
      <ul>
        <li>Read each ✓ sentence aloud. Would you or people around you say or write it? If you hesitate, change it.</li>
        <li>The ✗ sentence should be wrong in exactly one way: the target phenomenon. If it is also wrong for another reason, fix it.</li>
        <li>Never force variation: if a slot has fewer natural options, tell your lead rather than adding awkward ones.</li>
      </ul>
      <LexicalVariety />

      <h2>Before you hand back</h2>
      <ContributorReturn />

      <h2>When and how to flag</h2>
      <p>Flag a slot pattern to your language lead when it is <b>confusing</b>, <b>unnatural</b> in your language, or <b>impossible to complete</b>
        without changing the structure. Note which slot pattern, which row, and in a sentence what the problem is. Do not invent a new structure yourself:
        propose it to your lead, who decides.</p>

      <h2>Credit and payment</h2>
      <ul>
        <li>Paid batches of 25 templates at £15.50 (about an hour), for paid languages only, paid in vouchers via the department.</li>
        <li>One batch or more: acknowledged by name in the paper.</li>
        <li>Co-authorship: about 300 templates, agreed with the team in advance, plus an OpenReview account before 11 Dec. Paid contributors cannot be authors.</li>
      </ul>
      <PendingAdmin />
      <p>Questions? Your language lead is your first port of call; the <a href="#/guide">sessions</a> (UK time) are open to every language.</p>
      <GroundRules />
    </div>
  )
}

// ---------------------------------------------------------------- handover checklists (Lead + Native)
export function HandoverPacket() {
  return (
    <ul>
      <li>☐ The validated slot pattern: header row with plain slot labels and the ✓ / ✗ slots.</li>
      <li>☐ Completion instructions: what to vary, what stays constant, how to fill the slots.</li>
      <li>☐ A worked example: three templates of the slot pattern, identical columns.</li>
      <li>☐ Which slot patterns this contributor is assigned, and how many templates.</li>
      <li>☐ Where to write (which sheet and tab) and the reminder to put their name next to their templates.</li>
      <li>☐ How to flag problems, and the date the templates are due.</li>
      <li>☐ For paid languages: whether any paperwork is needed before they start.</li>
    </ul>
  )
}

export function ContributorReturn() {
  return (
    <ul>
      <li>☐ Templates under the assigned slot patterns, 3–4 alternatives in every varying slot, structure and ✓ / ✗ contrast unchanged.</li>
      <li>☐ Every generated pair read for naturalness (the <a href="#/generator">generator</a> lists them).</li>
      <li>☐ Varied vocabulary across templates.</li>
      <li>☐ Flags for anything confusing, unnatural or impossible, with the row and a one-line reason.</li>
      <li>☐ Name next to each template.</li>
    </ul>
  )
}

export function ClosingLoop() {
  return (
    <ol className="steps">
      <li>Resolve the flags: fix the slot pattern if it is the problem, or explain how to fill it.</li>
      <li>Review a sample of templates for consistency (not every routine row), and run the <a href="#/generator">sheet check</a> on the tab.</li>
      <li>Record contributors and batches in the project's contributor spreadsheet.</li>
      <li>Final linguistic validation before 11 Dec.</li>
    </ol>
  )
}

// ---------------------------------------------------------------- Worked Demo
// An end-to-end walk-through computed live from the human-written English reference template
// (src/lib/lexgen.ts DEMO_TEMPLATE_TEXT), with the same code the generator page runs.
export function Demo() {
  const t = useMemo(() => demoTemplate(), [])
  const a = useMemo(() => analyse(t), [t])
  const all = useMemo(() => Array.from(expand(t, DEFAULT_OPTIONS, a)), [t, a])
  const unique = useMemo(() => dedupePairs(all), [all])
  const first = all.slice(0, 8)
  const alts = t.columns.map((c, ci) => ({ c, v: splitAlternatives(t.rows[0][ci], c.role) }))
  const shared = alts.filter(({ c }) => c.role === 'shared')
  const good = alts.find(({ c }) => c.role === 'good')
  const bad = alts.find(({ c }) => c.role === 'bad')
  const nPairs = Math.min(good?.v.length ?? 0, bad?.v.length ?? 0)
  const formula = [...shared.map(({ v }) => String(v.length)), `${nPairs} ✓/✗ pairs`].join(' × ')
  const ex = all[0]
  const roleCls = (r: string) => (r === 'good' ? 'good' : r === 'bad' ? 'bad' : '')
  const roleMark = (r: string) => (r === 'good' ? ' ✓' : r === 'bad' ? ' ✗' : '')

  return (
    <div className="prose" style={{ maxWidth: 900 }}>
      <div className="eyebrow-s">Worked Demo</div>
      <h1>What happens to a template, step by step</h1>
      <p className="lede">
        One slot pattern followed from the lead's design, through one template, through the generator, to the minimal pairs a native speaker checks.
        The example is the human-written English reference row for BLiMP <span className="mono">distractor_agree_rc</span> (subject–verb agreement
        across a relative clause with a plural “distractor” noun). Every number on this page is computed live by the same code as
        the <a href="#/generator">generator</a>. The steps are identical in every project language; only the words change.
      </p>

      <h2>Step 1 · The lead designs the slot pattern</h2>
      <p>The lead identifies the phenomenon (the verb agrees with the singular subject, not with the nearer plural object), fixes the structure
        (singular subject + relative clause containing a plural object + main verb phrase) and names the slots. The header row is the <b>slot pattern</b>:</p>
      <div className="t-wrap"><table className="t"><thead><tr>{PROMPT_HEAD.map((h, i) => <th key={h} className={`mono ${i === 4 ? 'good' : i === 5 ? 'bad' : ''}`}>{h}</th>)}</tr></thead></table></div>
      <ul>
        <li><b>Ordinary slots</b> (<span className="mono">{shared.map(({ c }) => c.label).join(' ')}</span>) are shared: the ✓ and the ✗ sentence use the same words there.</li>
        <li><b>One slot carries the contrast.</b> <span className="mono">{good?.c.label}</span> is the ✓ (grammatical) version and <span className="mono">{bad?.c.label}</span>, starred, is its ✗ partner. They differ only in agreement.</li>
      </ul>
      <p>The completion instructions say: <i>vary</i> the singular subject, the verb, the plural object and the main verb phrase; <i>keep</i> the singular subject,
        the relative clause and the plural object between subject and verb; <i>write</i> the ✗ by changing only the agreement on the main verb.</p>

      <h2>Step 2 · A contributor writes one template</h2>
      <p>A <b>template</b> is one row under the slot pattern with several alternatives in every varying slot (the rule is 3–4). Every alternative must make sense
        with every alternative in the other slots, because the generator will combine them all. This is the reference row, one template:</p>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Slot</th><th>Alternatives in this template</th><th>Count</th></tr></thead>
        <tbody>{alts.map(({ c, v }) => (
          <tr key={c.label}><td className={`mono ${roleCls(c.role)}`}>{c.label}{roleMark(c.role)}</td><td>{v.join(' · ')}</td><td>{v.length}</td></tr>
        ))}</tbody>
      </table></div>
      <p>In the sheet it is written as one row, alternatives in brackets and separated by commas:</p>
      <PromptTemplateTable />
      <p className="muted" style={{ fontSize: 14 }}>The ✓ and ✗ alternatives are matched by position: the 1st ✓ goes with the 1st ✗, the 2nd with the 2nd. The relativiser has a single option (<i>that</i>), so it is the same in every sentence.</p>

      <h2>Step 3 · How the generator combines them</h2>
      <p>The generator takes <b>one alternative from every slot</b>, in every possible combination, and builds a ✓ sentence and its ✗ partner from the same choices.
        It does not write or change any word: it only joins what is in the row.</p>
      {ex && (
        <div className="t-wrap"><table className="t">
          <thead><tr>{t.columns.map((c, i) => <th key={i} className={`mono ${roleCls(c.role)}`}>{c.label}{roleMark(c.role)}</th>)}</tr></thead>
          <tbody><tr>{ex.fillers.map((f, i) => <td key={i} className={roleCls(t.columns[i].role)}>{f}</td>)}</tr></tbody>
        </table></div>
      )}
      {ex && (
        <ul>
          <li>✓ <b>{ex.good}</b> (the shared slots + the ✓ slot)</li>
          <li>✗ <b className="pair-bad">{ex.bad}</b> (the same shared slots + the matching ✗ slot)</li>
        </ul>
      )}
      <p>The slots are joined with a space, the first letter is capitalised and a full stop is added (for scripts written without spaces, set “Join slots with” to
        “nothing”). The number of pairs is the product of the counts: <b>{formula} = {a.total} minimal pairs</b>, from one template.</p>

      <h2>Step 4 · Repeats removed, then filtered</h2>
      <ul>
        <li><b>Deduplication.</b> Pairs with the same ✓ and ✗ sentence are removed before you read or download anything, so nobody reviews the same pair twice.
          Here: {a.total} generated, {unique.removed} repeated, <b>{unique.pairs.length} unique</b>. Repeats appear when an alternative is listed twice or two rows overlap.</li>
        <li><b>Size check.</b> More than {WARN_PER_ROW} pairs from one row is flagged: it usually means some alternatives do not combine naturally, and nobody can read that many.</li>
        <li><b>Filtering before review.</b> Generated pairs are deduplicated and filtered centrally before native-speaker review. The target of ~10 generated
          sentences per template is an <b>average after filtering, not a maximum</b>: this template produces {a.total} before filtering.</li>
      </ul>

      <h2>Step 5 · The resulting minimal pairs</h2>
      <p>Each line is one minimal pair: the two sentences are identical except in the contrast slot. The first {first.length} of {unique.pairs.length}:</p>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>#</th><th className="good">✓ grammatical</th><th className="bad">✗ ungrammatical</th></tr></thead>
        <tbody>{first.map((p) => <tr key={p.index}><td className="faint">{p.index}</td><td>{p.good}</td><td className="pair-bad">{p.bad}</td></tr>)}</tbody>
      </table></div>
      <p className="muted" style={{ fontSize: 14 }}>The downloaded CSV / TSV has one row per pair: the ✓ sentence, the ✗ sentence, the template it came from and the filler used in every slot, ready to paste back into the sheet.</p>

      <h2>Step 6 · Checking them</h2>
      <ol className="steps">
        <li><b>Read every pair.</b> “The display case that holds the baked goods randomly shuts off” must be as natural as “The refrigerator that stores all the cakes runs too cold”.</li>
        <li><b>The ✗ is wrong for one reason only:</b> agreement. Not tense, not word choice.</li>
        <li><b>If one combination fails,</b> remove that alternative, or move it to its own row. Do not change the structure.</li>
        <li><b>If the slot pattern itself does not work in your language,</b> flag it to your lead, who decides.</li>
        <li><b>The lead reviews</b> the flags and a sample of templates, then validates.</li>
      </ol>

      <h2>Step 7 · More templates under the same slot pattern</h2>
      <p>The next templates find their own subjects, verbs and objects (the third uses <i>who</i> because its subject is a person). Each row is one more template toward the target:</p>
      <WorkedTable />

      <h2>Try it yourself</h2>
      <p>Load this template into the generator, change an alternative and watch the count and the pairs update. For your own language, paste your lead's header row and your template rows instead.</p>
      <p><button className="btn btn-primary" onClick={() => loadIntoGenerator(demoTemplate())}>Open this template in the generator 🪄</button></p>
    </div>
  )
}

// ---------------------------------------------------------------- Advice
const MISTAKES: [string, string][] = [
  ['Changing the structure (new word order, an extra clause, a different case)', 'Keep the slot pattern; vary only the slot content. If the structure does not work in your language, flag it to your lead.'],
  ['The ✗ sentence is wrong for two reasons (agreement and tense, say)', 'Change only the phenomenon in the ✗ slot; everything else is identical to the ✓.'],
  ['Alternatives that clash (a verb that cannot take one of the objects)', 'Every alternative must make sense with every alternative in the other slots. Remove the clashing one or give it its own row.'],
  ['Mixing genders or numbers inside one row', 'Keep each row internally consistent; put the other gender or number in its own row (or its own slot pattern).'],
  ['The same word in template after template (the French pilot\'s “fatiguée”)', 'Vary the vocabulary across templates. The sheet check lists the most repeated words.'],
  ['Counting generated sentences or alternatives', 'Only templates (rows) count. 27 generated pairs from one row is one template.'],
  ['Forcing variation where the language offers none', 'Never force it. Tell your lead if a slot cannot take 3–4 natural alternatives.'],
  ['Inventing a new structure', 'Contributors write under the lead\'s slot pattern. Propose new structures to the lead, who decides.'],
  ['Too many alternatives, so the combinations explode', 'Fewer, well-chosen alternatives that all combine naturally. The generator warns above 500 pairs per row.'],
  ['Different numbers of ✓ and ✗ alternatives', 'They are paired by position: the 1st ✓ with the 1st ✗. Give both the same number.'],
  ['Sentences from AI tools, the web or textbooks', 'Not allowed. Every word is written by a person, from their own knowledge of the language.'],
  ['Real people\'s names or details, offensive content, stereotypes', 'Use ordinary, neutral content.'],
]

const FAQ: [string, React.ReactNode][] = [
  ['What counts toward the target?', <>Templates. A template is one row under a slot pattern, with 3–4 human-written alternatives in every varying slot, including the ✓ / ✗ contrast slot.</>],
  ['What was a "seed sentence"?', <>The same thing: a template (previously called a seed sentence). The site and the guidelines now say "template" only.</>],
  ['Do the generated sentences count?', <>No. 3 subjects × 3 verbs × 3 prepositions is 27 realisations, and it is still one template.</>],
  ['How many templates per language?', <>~1,000 templates (10 macrophenomena × 100), which the generator turns into ~10,000 generated sentences (about 10 per template on average after filtering; not a maximum). Subphenomena are optional, at most 3 per macro: none → 100; 2 → 50 each; 3 → at least 33 each.</>],
  ['What is the difference between a slot pattern and a template?', <>The slot pattern is the structure the lead designs (slot labels, which slot carries the contrast, constraints). A template is one row of alternatives written under it.</>],
  ['Do leads\' own templates count?', <>Yes, provided they meet the same quality criteria.</>],
  ['One slot pattern for all genders and numbers, or one per configuration?', <>Both are fine. With one general slot pattern, each row must be internally consistent for gender, number and so on. Choose what fits the grammar.</>],
  ['Can a contributor add a new structure?', <>No. Contributors write templates under the lead's slot pattern. An idea for a new structure goes to the lead, who decides.</>],
  ['How many alternatives per slot?', <>3–4 in every varying slot, including the ✓ / ✗ slot. Every alternative must make sense with every other alternative in its row, because the generator combines them.</>],
  ['Does the generator work for my language?', <>Yes, for all nine project languages. It only recombines what you write, so it needs no language data. Persian lists can use <b>،</b> as the separator; for scripts written without spaces, set “Join slots with” to “nothing”.</>],
  ['Why avoid reusing the same word?', <>Repeated vocabulary (the French pilot leaned on <i>fatiguée</i>) tires native-speaker reviewers. Vary your words across templates. The sheet check lists the most repeated words, and generator output is deduplicated and filtered before review.</>],
  ['Can I use AI tools?', <>No AI-generated templates, words or sentences, ever. No copied sentences, offensive content or real people either.</>],
  ['Is the 11 Dec deadline moving?', <>No. 11 Dec stays the project target, with full datasets for every language. Paper draft 18 Dec; ACL submission 4 Jan 2027.</>],
  ['How are contributors paid and credited?', <>Paid batches of 25 templates at £15.50, for paid languages only, in vouchers via the department. One batch or more: acknowledged by name. Co-authorship: about 300 templates agreed in advance, plus an OpenReview account before 11 Dec. Paid contributors cannot be authors.</>],
  ['Do I need a consent form? Can I be paid from my country?', <>These details are still being confirmed. Your language lead will tell you what applies to you, and the answer will be announced in <span className="mono">#cls-xblimps</span>.</>],
  ['Where do I ask questions?', <>Your language lead first. Methodological questions are settled together in the Wednesday session and in <span className="mono">#cls-xblimps</span>. Sessions are on <a href={MEET_URL} target="_blank" rel="noreferrer">Google Meet</a>; times (UK time) are on the <a href="#/guide">Instructions</a> page.</>],
]

export function Advice() {
  return (
    <div className="prose" style={{ maxWidth: 900 }}>
      <div className="eyebrow-s">Advice</div>
      <h1>Writing good templates</h1>
      <p className="lede">The writing rules, how to keep vocabulary varied, the mistakes we see most, what to do with unclear cases, who to ask, and the FAQ.</p>
      <Principle />

      <h2>Writing rules</h2>
      <TemplateRules />
      <SheetConventions />

      <h2>Lexical variety</h2>
      <LexicalVariety />

      <h2>Heuristics</h2>
      <ul>
        <li>Look at each slot and ask what else could go there.</li>
        <li>Vary words, expressions, people, objects or situations, within a template and across templates.</li>
        <li>Explore more than one kind of variation where the slot pattern allows it.</li>
        <li>Never force variation.</li>
        <li>Coverage across templates beats generalisation within one.</li>
      </ul>

      <h2>Common mistakes</h2>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Mistake</th><th>What to do instead</th></tr></thead>
        <tbody>{MISTAKES.map(([m, f]) => <tr key={m}><td>{m}</td><td>{f}</td></tr>)}</tbody>
      </table></div>

      <h2>Ambiguous cases</h2>
      <ul>
        <li><b>I am not sure the ✗ is ungrammatical, or only odd.</b> Flag it; the lead decides.</li>
        <li><b>Speakers disagree, or it depends on region or register.</b> Flag it with a note; do not choose a variety on your own.</li>
        <li><b>The slot pattern is impossible in my language.</b> Flag it to your lead with the reason; do not rewrite it.</li>
        <li><b>I can only think of one or two natural options for a slot.</b> Tell your lead; the slot pattern may need adjusting.</li>
        <li><b>I keep reaching for the same words.</b> Change the people, objects or situation of the next template, and check the repeated-words list in the sheet check.</li>
      </ul>

      <h2>Troubleshooting the generator</h2>
      <div className="t-wrap"><table className="t">
        <thead><tr><th>Problem</th><th>Fix</th></tr></thead>
        <tbody>
          <tr><td>“Mark one slot as ✓” or “as ✗”</td><td>Set the role of the grammatical slot to ✓ and its ungrammatical partner to ✗ in the slot header (or put ✓ / ✗ in the header text before pasting).</td></tr>
          <tr><td>My pasted sheet arrived as one column</td><td>Select the cells in the sheet and copy them (they paste as tab-separated). Or paste CSV or a Markdown table.</td></tr>
          <tr><td>An alternative contains a comma</td><td>Separate that cell's alternatives with <span className="mono">;</span> (or <span className="mono">|</span>) instead of commas. Also understood: a doubled comma (<span className="mono">Segons la meva mare,, Em van dir que</span>), a single alternative ending with it (<span className="mono">(partir,)</span>) or wrapped in square brackets (<span className="mono">[fatiguée, elle se réveille très tôt]</span>), and a sheet note saying commas are not a delimiter in a named {'{slot}'}.</td></tr>
          <tr><td>My sheet has many slot patterns in one tab</td><td>Paste the whole tab into “Check a whole language sheet” on the generator page: it finds every slot pattern, counts templates against the targets, lists repeated words, gives three sample pairs per slot pattern and downloads all the pairs at once.</td></tr>
          <tr><td>The download has fewer pairs than the count</td><td>Repeated pairs (the same ✓ and ✗ sentence twice) and pairs whose ✓ and ✗ sentences are identical are removed before download; the page says how many. A sentence labelled ✓ in one pair and ✗ in another is kept but flagged: check the ✓ and ✗ lists.</td></tr>
          <tr><td>“✓ / ✗ were read from the slot names”</td><td>The headers have no ✓ / ✗ marks, so the generator guessed from names like <span className="mono">_mismatch</span>. Check the first pairs; then mark the headers ✓ and ✗ in the sheet. If the names are ambiguous (e.g. <span className="mono">{'{PTCP_nonagr}'}</span> before <span className="mono">{'{PTCP_agr}'}</span>), nothing is generated until you mark them.</td></tr>
          <tr><td>“… is to the right of the last {'{slot}'}”</td><td>A header without braces after the last slot is left out of the sentences (e.g. an author column). If the words belong in the sentence, put the header in {'{braces}'}.</td></tr>
          <tr><td>I want a slot to be sometimes empty</td><td>Add <span className="mono">∅</span> as one of its alternatives.</td></tr>
          <tr><td>My language is written without spaces</td><td>Set “Join slots with” to “nothing”, and adjust capitalisation and the final punctuation.</td></tr>
          <tr><td>The CSV shows strange characters in Excel</td><td>The CSV is UTF-8 (with a byte-order mark). If it still looks wrong, download the TSV, or import the file as UTF-8.</td></tr>
          <tr><td>The count is bigger than I expected</td><td>The count is the product of the number of alternatives in each slot. Check the formula at the end of each row.</td></tr>
          <tr><td>The highlighted word in a pair is wrong</td><td>The highlight is only a reading aid (first match of the ✓ / ✗ filler). The downloaded file is unaffected.</td></tr>
          <tr><td>I closed the page</td><td>Your templates are kept in this browser only. Use “Copy templates” to keep a copy in your sheet.</td></tr>
        </tbody>
      </table></div>

      <h2>Who to ask</h2>
      <ul>
        <li><b>Contributors:</b> your language lead first, for anything about your slot patterns, your sheet or your templates.</li>
        <li><b>Leads:</b> bring open questions to the Wednesday session or <span className="mono">#cls-xblimps</span>, the single source of truth for decisions, rather than separate direct messages.</li>
        <li>Session times (UK time) and the Meet link are on the <a href="#/guide">Instructions</a> page.</li>
      </ul>

      <h2>FAQ</h2>
      <dl className="faq">
        {FAQ.map(([q, a]) => (
          <div key={q}><dt>{q}</dt><dd>{a}</dd></div>
        ))}
      </dl>
      <GroundRules />
    </div>
  )
}
