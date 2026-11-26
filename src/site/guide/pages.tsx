// The guide: the one place for xBLiMPs instructions for language leads and native-speaker
// contributors, in four pages: Instructions (overview), I'm a Language Lead, I'm a Native Speaker and
// Advice. Contributors write on the Contribute page (#/contribute); there is no generator on the site. Terms, targets and dates follow Suchir's decisions of 23–24 Nov 2026
// (template = the unit that counts; slot pattern = the lead's structure). Items still being
// confirmed are described as pending and never stated as policy.

import React from 'react'
import {
  Principle, PromptTemplateTable, WorkedTable, DivisionTable, Workflow, GroundRules, PROMPT_HEAD,
  Terminology, Targets, Timeline, Sessions, Languages, TemplateRules, LexicalVariety, PendingAdmin, MEET_URL, SheetConventions,
} from './common'

// ---------------------------------------------------------------- Instructions (overview)
export function Instructions() {
  return (
    <div className="prose">
      <div className="eyebrow-s">Instructions</div>
      <h1>Everything you need to write xBLiMPs templates</h1>
      <p className="lede">
        xBLiMPs is a crowd-built, multilingual benchmark of minimal pairs in the style of BLiMP: pairs of sentences that are
        identical except for one place, where one sentence is grammatical (✓) and the other is not (✗). Language leads design
        slot patterns; native speakers write templates, using vocabulary from real sentences in their language on the <a href="#/contribute">Contribute</a> page.
        We give you words. You write the grammar.
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
          <p>Pick your language, get vocabulary from real sentences, write grammatical (✓) and ungrammatical (✗) examples for your phenomenon, and flag problems.</p>
          <div className="go">Contributor instructions →</div>
        </a>
      </div>

      <h2>Languages</h2>
      <p>Nine languages, one shared method. The Contribute page and these instructions are the same for all of them.</p>
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
      <p>The writing rules are in <a href="#/guide/advice">Advice</a>.</p>

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
        <li><b>Write the first templates yourself,</b> with 3–4 alternatives in every varying slot. Read every combination aloud: each ✓ natural, each ✗ wrong only for the phenomenon.</li>
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
            <tr><td><b>A worked example</b></td><td>Three rows of the slot pattern, identical columns, like the example on the <a href="#/guide">Instructions</a> page.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>4. Validation responsibilities</h2>
      <ul>
        <li>Review <b>flagged templates</b> and a <b>sample</b> of each contributor's templates. Automatic checks, deduplication and filtering run centrally.</li>
        <li>Check each sampled template: semantically coherent, every combination natural, ✗ wrong only for the phenomenon, row-internal gender/number consistency, no new structure, varied vocabulary, nothing offensive, copied or AI-generated.</li>
        <li>Decide on contributors' ideas for new structures. If a slot pattern is impossible to complete in your language, fix the slot pattern, not the templates.</li>
        <li>Contributions from the <a href="#/contribute">Contribute</a> page arrive as a ✓ / ✗ example with the phenomenon, notes on other words that work, and the contributor's name. Fold them into your slot pattern in the sheet, or ask the contributor to write the row directly.</li>
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
        <li><b>Open the <a href="#/contribute">Contribute</a> page and choose your language.</b> Your lead tells you which grammatical phenomenon to work on.</li>
        <li><b>Take the words, not the sentence.</b> We show you a real sentence from your language with an English translation and some words you could reuse. Build your own new sentences with them.</li>
        <li><b>Write a template:</b> a grammatical (✓) version and an ungrammatical (✗) version that differ only in the target feature, plus other words that would also work. If your lead gave you a sheet and slot pattern, write the row there with 3–4 alternatives in every varying slot. A batch is 25 templates (about an hour).</li>
        <li><b>Read each one aloud.</b> The ✓ must sound natural to you; the ✗ must be wrong in exactly one way.</li>
        <li><b>Flag problems</b> instead of working around them (see below).</li>
        <li><b>Put your name next to your templates</b> in the sheet, so your work is credited.</li>
      </ol>

      <h2>How to write a template</h2>
      <TemplateRules />
      <SheetConventions />
      <p>More tips and common mistakes are in <a href="#/guide/advice">Advice</a>.</p>

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
      <li>☐ Every template read aloud: ✓ natural, ✗ wrong only for the phenomenon, every alternative combining with every other.</li>
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
      <li>Review a sample of templates for consistency (not every routine row), and check that vocabulary varies across the tab.</li>
      <li>Record contributors and batches in the project's contributor spreadsheet.</li>
      <li>Final linguistic validation before 11 Dec.</li>
    </ol>
  )
}

// ---------------------------------------------------------------- Advice
const MISTAKES: [string, string][] = [
  ['Changing the structure (new word order, an extra clause, a different case)', 'Keep the slot pattern; vary only the slot content. If the structure does not work in your language, flag it to your lead.'],
  ['The ✗ sentence is wrong for two reasons (agreement and tense, say)', 'Change only the phenomenon in the ✗ slot; everything else is identical to the ✓.'],
  ['Alternatives that clash (a verb that cannot take one of the objects)', 'Every alternative must make sense with every alternative in the other slots. Remove the clashing one or give it its own row.'],
  ['Mixing genders or numbers inside one row', 'Keep each row internally consistent; put the other gender or number in its own row (or its own slot pattern).'],
  ['The same word in template after template (the French pilot\'s “fatiguée”)', 'Vary the vocabulary across templates. Ask the Contribute page for another sentence to get fresh words.'],
  ['Counting generated sentences or alternatives', 'Only templates (rows) count. 27 generated pairs from one row is one template.'],
  ['Forcing variation where the language offers none', 'Never force it. Tell your lead if a slot cannot take 3–4 natural alternatives.'],
  ['Inventing a new structure', 'Contributors write under the lead\'s slot pattern. Propose new structures to the lead, who decides.'],
  ['Copying, translating or paraphrasing the sample sentence', 'Use the words, not the sentence. Build a new sentence that tests your phenomenon; change the structure freely.'],
  ['Too many alternatives, so the combinations explode', 'Fewer, well-chosen alternatives that all combine naturally: 3–4 per slot.'],
  ['Different numbers of ✓ and ✗ alternatives', 'They are paired by position: the 1st ✓ with the 1st ✗. Give both the same number.'],
  ['Sentences from AI tools, the web or textbooks', 'Not allowed. Every word is written by a person, from their own knowledge of the language.'],
  ['Real people\'s names or details, offensive content, stereotypes', 'Use ordinary, neutral content.'],
]

const FAQ: [string, React.ReactNode][] = [
  ['What counts toward the target?', <>Templates. A template is one row under a slot pattern, with 3–4 human-written alternatives in every varying slot, including the ✓ / ✗ contrast slot.</>],
  ['What was a "seed sentence"?', <>The same thing: a template (previously called a seed sentence). The site and the guidelines now say "template" only.</>],
  ['Do the generated sentences count?', <>No. 3 subjects × 3 verbs × 3 prepositions is 27 realisations, and it is still one template.</>],
  ['How many templates per language?', <>~1,000 human-written templates (10 macrophenomena × 100); the central team later turns them into ~10,000 generated sentences. Subphenomena are optional, at most 3 per macro: none → 100; 2 → 50 each; 3 → at least 33 each.</>],
  ['What is the difference between a slot pattern and a template?', <>The slot pattern is the structure the lead designs (slot labels, which slot carries the contrast, constraints). A template is one row of alternatives written under it.</>],
  ['Do leads\' own templates count?', <>Yes, provided they meet the same quality criteria.</>],
  ['One slot pattern for all genders and numbers, or one per configuration?', <>Both are fine. With one general slot pattern, each row must be internally consistent for gender, number and so on. Choose what fits the grammar.</>],
  ['Can a contributor add a new structure?', <>No. Contributors write templates under the lead's slot pattern. An idea for a new structure goes to the lead, who decides.</>],
  ['How many alternatives per slot?', <>3–4 in every varying slot, including the ✓ / ✗ slot. Every alternative must make sense with every other alternative in its row, because they are combined later.</>],
  ['Where do the sample sentences come from?', <>From FineWeb-2, a large public collection of web text in many languages (FineWeb for English), with an English machine translation underneath. They are there for vocabulary only: you write the grammar.</>],
  ['Why avoid reusing the same word?', <>Repeated vocabulary (the French pilot leaned on <i>fatiguée</i>) tires native-speaker reviewers. Vary your words across templates; the Contribute page gives you fresh vocabulary each time.</>],
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
        <li><b>I keep reaching for the same words.</b> Change the people, objects or situation of the next template, or ask the Contribute page for another sentence.</li>
      </ul>

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
