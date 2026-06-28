// Language-specific corpus pools + the priming sampler that gives native-speaker annotators
// lexical and topic *relief*: instead of staring at one template, they are shown a small,
// length-varied sample of real corpus sentences. These sentences are NOT slot fillers and need
// not share the phenomenon's construction — they exist purely to prime vocabulary and topics so
// the minimal pairs an annotator authors stay lexically and thematically diverse.
//
// The bank JSON is the artifact an offline corpus-extraction pipeline emits
// (CC100 / mC4 / OSCAR / CulturaX → a flat list of sentences). The committed files are small
// illustrative SEEDS; replace them with real pipeline output per language. Sampling is a pure,
// synchronous, offline function over bundled JSON — so a reroll is instant and works with the
// local-first store, no network round-trip.

import cy from '../data/wordbanks/cy.json'
import fa from '../data/wordbanks/fa.json'
import af from '../data/wordbanks/af.json'
import tl from '../data/wordbanks/tl.json'

// one corpus sentence shown to the annotator as priming material
export interface PrimingSentence {
  text: string
  length?: number   // token count (derived at runtime if absent) — drives length-varied sampling
  source?: string   // optional per-sentence provenance (corpus / doc id)
}

export interface WordBank {
  language: string
  source: string
  sentences: PrimingSentence[]
}

// languages with a corpus pool available for priming (CC100/mC4/OSCAR/CulturaX)
export const BANKS: Record<string, WordBank> = {
  cy: cy as WordBank,
  fa: fa as WordBank,
  af: af as WordBank,
  tl: tl as WordBank,
}

export const hasBank = (language: string): boolean => !!BANKS[language]
export const bankLanguages = (): string[] => Object.keys(BANKS)

const tokenCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length
export const sentenceLength = (s: PrimingSentence): number => s.length ?? tokenCount(s.text)

function randItem<T>(arr: T[]): T | undefined {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Draw `n` priming sentences spanning the pool's length range. We sort by length and split into
// `n` equal strata, then pick one random sentence per stratum — so the annotator always sees a
// spread of short-to-long sentences rather than a clump of one length. Falls back to a plain
// shuffle when the pool is too small to stratify.
export function primingSample(language: string, n = 10): PrimingSentence[] {
  const bank = BANKS[language]
  if (!bank) return []
  const all = bank.sentences
  if (all.length <= n) return shuffle(all)

  const sorted = [...all].sort((a, b) => sentenceLength(a) - sentenceLength(b))
  const out: PrimingSentence[] = []
  for (let i = 0; i < n; i++) {
    const lo = Math.floor((i * sorted.length) / n)
    const hi = Math.floor(((i + 1) * sorted.length) / n)
    const stratum = sorted.slice(lo, Math.max(hi, lo + 1))
    const pick = randItem(stratum)
    if (pick) out.push(pick)
  }
  return shuffle(out)
}
