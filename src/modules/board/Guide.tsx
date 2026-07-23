// Team guide — a self-contained onboarding page that walks a brand-new annotator through the
// entire syntactic-annotation workflow end to end, so they can start contributing without asking
// for clarification. Pastel colour-coded info cards, collapsible stage sections, a workflow
// timeline, and interactive deliverables checklists. Rendered as the "Guide" tab of the board.

import React, { useState } from 'react'

type Tone = 'blue' | 'green' | 'yellow' | 'pink' | 'purple'

/** Pastel colour-coded information box. Tone maps to the palette:
 *  blue → context · green → deliverables · yellow → notes · pink → warnings · purple → collaboration */
function Info({ tone, icon, title, children }: { tone: Tone; icon: string; title?: string; children: React.ReactNode }) {
  return (
    <div className={`info info-${tone}`}>
      {title && <div className="info-head"><span className="i-ico">{icon}</span>{title}</div>}
      {children}
    </div>
  )
}

/** Collapsible disclosure with an optional numbered/lettered step badge. Open by default so nothing is hidden. */
function Collapse({ step, title, defaultOpen = true, children }: { step?: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="g-collapse" open={defaultOpen}>
      <summary>
        {step && <span className="g-step">{step}</span>}
        {title}
        <span className="g-chev">▶</span>
      </summary>
      <div className="g-collapse-body">{children}</div>
    </details>
  )
}

/** Interactive deliverables checklist — ticking is local to this session (a reading aid, not saved state). */
function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set())
  const toggle = (i: number) => setDone((prev) => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })
  return (
    <div>
      <div className="between" style={{ marginBottom: 8 }}>
        <span className="check-progress">{done.size} / {items.length} complete</span>
      </div>
      <div className="check-list">
        {items.map((label, i) => (
          <button key={i} type="button" className={`check-item ${done.has(i) ? 'done' : ''}`} onClick={() => toggle(i)}>
            <span className="check-box">{done.has(i) ? '✓' : ''}</span>
            <span className="check-lbl">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const PHENOMENA = [
  'Control', 'Raising', 'Negation', 'Wh-questions', 'Island constraints', 'Binding', 'Ellipsis', 'Determiners',
  'Quantifiers', 'Argument structure', 'Agreement', 'Case marking', 'Relative clauses', 'Passive constructions',
  'Long-distance dependencies', 'Scrambling', 'Focus constructions', 'Coordination',
]

// per-phenomenon structure for the Google Doc
const DOC_FIELDS: [string, string][] = [
  ['🏷️', 'Phenomenon'], ['📚', 'References'], ['📝', 'Explanation'], ['💬', 'Example sentences'],
  ['🔤', 'Gloss'], ['🌍', 'Translation'], ['🗒️', 'Notes'], ['🌳', 'Syntax tree'],
]

// three-group collaboration model
const GROUPS: { icon: string; title: string; items: string[] }[] = [
  { icon: '📖', title: 'Linguists', items: ['identify phenomena', 'read grammars', 'prepare documentation', 'create templates'] },
  { icon: '🌳', title: 'Syntacticians', items: ['review analyses', 'construct syntax trees', 'answer theoretical questions'] },
  { icon: '🗣️', title: 'Native speakers', items: ['validate examples', 'review templates', 'expand lexical coverage', 'ensure naturalness'] },
]

export default function Guide() {
  return (
    <div className="guide" style={{ marginTop: 18 }}>

      {/* ─────────────── Welcome ─────────────── */}
      <Info tone="blue" icon="👋" title="Welcome to the syntactic annotation project">
        <p>This board tracks the progress of every language from the initial literature review through to a completed,
          validated benchmark. The project is <strong>collaborative</strong>, so don't worry if you aren't a native
          speaker of a language — your primary role is to <strong>consolidate linguistic knowledge from the published
          literature</strong> and work with syntacticians and native speakers throughout the process.</p>
      </Info>

      <Info tone="yellow" icon="🎯" title="Overall goal">
        <p style={{ marginBottom: 0 }}>Create a high-quality, <strong>literature-grounded</strong> collection of syntactic
          minimal pairs that can be scaled across many languages while maintaining linguistic accuracy.</p>
      </Info>

      {/* ─────────────── Overview rail ─────────────── */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Project workflow — each language progresses through three stages</div>
        <div className="stage-rail">
          <div className="stage-node info-blue">
            <div className="stage-ico">📚</div>
            <div className="stage-kicker">Stage 1</div>
            <div className="stage-title">Literature review &amp; documentation</div>
            <div className="stage-blurb">Build a comprehensive reference document for your language.</div>
          </div>
          <div className="stage-arrow">→</div>
          <div className="stage-node info-purple">
            <div className="stage-ico">📝</div>
            <div className="stage-kicker">Stage 2</div>
            <div className="stage-title">Template design</div>
            <div className="stage-blurb">Convert documented phenomena into reusable minimal-pair templates.</div>
          </div>
          <div className="stage-arrow">→</div>
          <div className="stage-node info-green">
            <div className="stage-ico">🌍</div>
            <div className="stage-kicker">Stage 3</div>
            <div className="stage-title">Validation &amp; scaling</div>
            <div className="stage-blurb">Native speakers validate and expand templates into a large benchmark.</div>
          </div>
        </div>
      </div>

      {/* ═══════════════ STAGE 1 ═══════════════ */}
      <section className="stage-sec info-blue">
        <div className="stage-hd">
          <span className="stage-hd-ico">📚</span>
          <div>
            <div className="stage-kicker">Stage 1</div>
            <h2>Literature review &amp; syntactic documentation</h2>
          </div>
        </div>
        <div className="stage-body">
          <Info tone="blue" icon="📌" title="Your goal">
            <p>The first stage is <strong>not</strong> to invent examples or create datasets. Instead, your goal is to
              consolidate the existing linguistic literature into a <strong>structured reference document</strong> that
              will later be used to construct minimal-pair templates.</p>
            <p style={{ marginBottom: 0 }}>Think of yourself as building the <strong>"knowledge base"</strong> for the language.</p>
          </Info>

          <Collapse step="1" title="Read the syntactic literature">
            <p>Before writing any examples, spend time reading:</p>
            <ul>
              <li>descriptive grammars</li>
              <li>reference grammars</li>
              <li>syntax textbooks</li>
              <li>journal articles</li>
              <li>dissertations</li>
              <li>language-specific syntax papers</li>
            </ul>
            <Info tone="pink" icon="⚠️" title="Common mistake">
              <p style={{ marginBottom: 0 }}>Where possible, use examples <strong>directly from the published
                literature</strong> rather than inventing your own.</p>
            </Info>
          </Collapse>

          <Collapse step="2" title="Select approximately 8–10 core syntactic phenomena">
            <p>Choose phenomena that are both <strong>linguistically important</strong> and <strong>suitable for creating
              minimal pairs</strong>. Suggested phenomena include:</p>
            <div className="chip-wrap">
              {PHENOMENA.map((p) => <span key={p} className="phen-chip">{p}</span>)}
            </div>
            <p style={{ marginTop: 10, marginBottom: 0 }}>You may also include <strong>language-specific phenomena</strong>
              that are particularly interesting or well described in the literature.</p>
          </Collapse>

          <Collapse step="3" title="Create the Google Document">
            <p>Each language should have a <strong>dedicated Google Doc</strong>. For every phenomenon include:</p>
            <div className="field-grid">
              {DOC_FIELDS.map(([ico, label]) => (
                <div key={label} className="field-pill"><span className="fp-ico">{ico}</span>{label}</div>
              ))}
            </div>
            <ul style={{ marginTop: 12 }}>
              <li><strong>Phenomenon</strong> — a short description.</li>
              <li><strong>References</strong> — complete references and page numbers wherever possible.</li>
              <li><strong>Explanation</strong> — explain the construction in simple language.</li>
              <li><strong>Example sentences</strong> — use published examples whenever possible, with the original
                sentence, a gloss and a translation.</li>
              <li><strong>Notes</strong> — any interesting properties, restrictions, or dialectal variation.</li>
              <li><strong>Syntax tree</strong> — include one if available; otherwise leave a note and work with a
                project syntactician to construct one.</li>
            </ul>
          </Collapse>

          <Collapse step="4" title="References matter — keep everything traceable">
            <Info tone="green" icon="🔗" title="Every example should be traceable back to the literature">
              <p>Please record:</p>
              <ul style={{ marginBottom: 8 }}>
                <li>grammar</li>
                <li>author</li>
                <li>year</li>
                <li>page number</li>
                <li>DOI or URL where appropriate</li>
              </ul>
              <p style={{ marginBottom: 0 }}>The more detailed the references, the easier it becomes to verify examples later.</p>
            </Info>
          </Collapse>

          <Info tone="green" icon="✅" title="If you're not a native speaker">
            <p>You do <strong>not</strong> need to be a native speaker to make a valuable contribution. Your role is to:</p>
            <ul>
              <li>organise the literature</li>
              <li>identify important syntactic phenomena</li>
              <li>extract published examples</li>
              <li>document references</li>
              <li>prepare materials for later validation</li>
            </ul>
            <p style={{ marginBottom: 0 }}>Language-specific judgments will be reviewed <strong>collaboratively</strong>
              with native speakers and project syntacticians.</p>
          </Info>
        </div>
      </section>

      {/* Connector — keeps the Doc → Templates workflow feeling continuous */}
      <div className="stage-arrow" style={{ textAlign: 'center', fontSize: 22, transform: 'rotate(90deg)' }}>→</div>

      {/* ═══════════════ STAGE 2 ═══════════════ */}
      <section className="stage-sec info-purple">
        <div className="stage-hd">
          <span className="stage-hd-ico">📝</span>
          <div>
            <div className="stage-kicker">Stage 2</div>
            <h2>Template design</h2>
          </div>
        </div>
        <div className="stage-body">
          <Info tone="blue" icon="➡️" title="Once the reference document is complete">
            <p style={{ marginBottom: 0 }}>Begin designing <strong>reusable templates</strong>. The objective is to turn
              individual examples into <strong>patterns</strong> that can generate many minimal pairs.</p>
          </Info>

          <Collapse step="A" title="Gold-standard examples">
            <p>For every phenomenon, first construct a small number of carefully verified
              <strong> "gold-standard" minimal pairs</strong>. These should be:</p>
            <ul style={{ marginBottom: 0 }}>
              <li>linguistically accurate</li>
              <li>literature grounded</li>
              <li>easy to understand</li>
              <li>suitable for later expansion</li>
            </ul>
          </Collapse>

          <Collapse step="B" title="Creating templates">
            <p>Using the <strong>Templates page</strong>, convert each phenomenon into reusable templates. Each template
              should capture:</p>
            <ul>
              <li>the underlying syntactic contrast</li>
              <li>the variables that can change</li>
              <li>constraints on lexical substitutions</li>
            </ul>
            <Info tone="pink" icon="⚠️" title="Avoid over-generalising">
              <p style={{ marginBottom: 0 }}>Templates should <strong>only generate grammatical sentences</strong>.</p>
            </Info>
          </Collapse>

          <Collapse step="C" title="Implement templates">
            <p>Enter the templates into the annotation interface. For every template include:</p>
            <ul style={{ marginBottom: 0 }}>
              <li>description</li>
              <li>associated phenomenon</li>
              <li>example minimal pairs</li>
              <li>notes for annotators</li>
              <li>references back to the literature</li>
            </ul>
          </Collapse>
        </div>
      </section>

      {/* Connector */}
      <div className="stage-arrow" style={{ textAlign: 'center', fontSize: 22, transform: 'rotate(90deg)' }}>→</div>

      {/* ═══════════════ STAGE 3 ═══════════════ */}
      <section className="stage-sec info-green">
        <div className="stage-hd">
          <span className="stage-hd-ico">🌍</span>
          <div>
            <div className="stage-kicker">Stage 3</div>
            <h2>Native-speaker validation &amp; scaling</h2>
          </div>
        </div>
        <div className="stage-body">
          <Info tone="blue" icon="🤝" title="Handing templates over">
            <p style={{ marginBottom: 0 }}>Once templates have been created, they are handed over to <strong>native
              speakers</strong> for validation and expansion.</p>
          </Info>

          <Info tone="purple" icon="🗣️" title="Native speakers (ideally 2–3 per language)">
            <p>They will:</p>
            <ul style={{ marginBottom: 8 }}>
              <li>review existing examples</li>
              <li>verify grammaticality</li>
              <li>identify unnatural wording</li>
              <li>suggest better lexical choices</li>
              <li>validate generated minimal pairs</li>
              <li>identify dialectal variation where relevant</li>
            </ul>
            <p style={{ marginBottom: 0 }}>Native speakers are <strong>reviewers and validators</strong>, not expected to
              design templates from scratch.</p>
          </Info>

          <Collapse step="1" title="Scaling the dataset" defaultOpen={false}>
            <p>The annotation interface allows native speakers to expand the gold-standard templates. Rather than inventing
              entirely new constructions, they should create <strong>lexical variations of the same syntactic pattern</strong>.
              For example:</p>
            <ul>
              <li>substitute nouns</li>
              <li>substitute verbs</li>
              <li>substitute adjectives</li>
              <li>substitute proper names</li>
            </ul>
            <p style={{ marginBottom: 0 }}>…while <strong>preserving the intended syntactic contrast</strong>.</p>
          </Collapse>

          <Info tone="yellow" icon="📊" title="Target coverage">
            <p>As a rough target, each language should aim for:</p>
            <ul style={{ marginBottom: 8 }}>
              <li>approximately <strong>100 reusable templates</strong></li>
              <li>multiple lexical variations for every template</li>
              <li>broad coverage across all selected phenomena</li>
            </ul>
            <p style={{ marginBottom: 0 }}><strong>Quality is always more important than quantity.</strong></p>
          </Info>
        </div>
      </section>

      {/* ═══════════════ Collaboration ═══════════════ */}
      <section>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Collaboration</div>
        <Info tone="purple" icon="🤝" title="This project relies on collaboration between three groups">
          <p style={{ marginBottom: 14 }}>No single person is expected to complete every part of the workflow independently.</p>
          <div className="grid grid-3">
            {GROUPS.map((g) => (
              <div key={g.title} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 22 }}>{g.icon}</div>
                <div style={{ fontWeight: 650, fontSize: 14, margin: '4px 0 6px' }}>{g.title}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
                  {g.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Info>
      </section>

      {/* ═══════════════ Deliverables checklists ═══════════════ */}
      <section>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Deliverables checklist</div>
        <Info tone="green" icon="📚" title="Stage 1 — literature review & documentation">
          <p style={{ marginBottom: 12 }}>Tick items off as you go — this is a personal reading aid, so it resets each visit.</p>
          <Checklist items={[
            'Google Doc created',
            'Literature reviewed',
            '8–10 syntactic phenomena selected',
            'References added',
            'Example sentences documented',
            'Glosses included',
            'Syntax trees added or requested',
          ]} />
        </Info>
      </section>

      <section>
        <Info tone="green" icon="📝" title="Stage 2 — template design">
          <Checklist items={[
            'Gold-standard minimal pairs created',
            'Templates designed',
            'Templates implemented in the annotation interface',
            'References linked to each template',
          ]} />
        </Info>
      </section>

      <section>
        <Info tone="green" icon="🌍" title="Stage 3 — validation & scaling">
          <Checklist items={[
            '2–3 native speakers recruited',
            'Templates reviewed',
            'Lexical variations created',
            'Native-speaker validation completed',
            'Final quality assurance completed',
            'Language marked as complete',
          ]} />
        </Info>
      </section>

      {/* ═══════════════ Remember ═══════════════ */}
      <Info tone="purple" icon="💜" title="Remember">
        <p style={{ marginBottom: 0 }}>The success of this project depends on <strong>careful documentation,
          reproducibility, and collaboration</strong>. Start with the literature, build accurate templates from published
          analyses, and work closely with syntacticians and native speakers to ensure that every minimal pair is both
          <strong> theoretically sound and natural</strong> in the target language.</p>
      </Info>
    </div>
  )
}
