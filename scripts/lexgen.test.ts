// Tests for the deterministic lexical generator (src/lib/lexgen.ts). Run: npm test
import assert from 'node:assert/strict'
import {
  analyse, demoTemplate, expandAll, pairsToDelimited, parseCSV, splitAlternatives,
  templateFromText, templateToTSV, DEFAULT_OPTIONS, HARD_CAP,
} from '../src/lib/lexgen'

let n = 0
const test = (name: string, fn: () => void) => { fn(); n++; console.log(`ok ${n} - ${name}`) }

test('demo template: headers and roles', () => {
  const t = demoTemplate()
  assert.deepEqual(t.columns.map((c) => c.role), ['shared', 'shared', 'shared', 'shared', 'good', 'bad'])
  assert.equal(t.columns[4].label, '{VP_sg}')
  assert.equal(t.columns[5].label, '{VP_pl}')
})

test('demo template: 3 × 1 × 3 × 3 × 2 = 54 pairs', () => {
  const t = demoTemplate()
  const a = analyse(t)
  assert.equal(a.ok, true)
  assert.equal(a.total, 54)
  assert.equal(expandAll(t).length, 54)
})

test('first pair is the deck example; ✗ replaces ✓ in place', () => {
  const [p] = expandAll(demoTemplate())
  assert.equal(p.good, 'The refrigerator that stores all the cakes runs too cold.')
  assert.equal(p.bad, 'The refrigerator that stores all the cakes run too cold.')
})

test('deterministic: same input gives identical output', () => {
  const a = expandAll(demoTemplate()).map((p) => p.good + '|' + p.bad)
  const b = expandAll(demoTemplate()).map((p) => p.good + '|' + p.bad)
  assert.deepEqual(a, b)
  assert.equal(new Set(a).size, a.length, 'no duplicates')
})

test('every output word comes from the typed alternatives', () => {
  const t = demoTemplate()
  const vocab = new Set(t.rows.flat().join(' ').replace(/[(),]/g, ' ').toLowerCase().split(/\s+/).filter(Boolean))
  for (const p of expandAll(t)) {
    for (const w of (p.good + ' ' + p.bad).replace(/\./g, '').toLowerCase().split(' ')) assert.ok(vocab.has(w), w)
  }
})

test('splitAlternatives: brackets, separators, ∅, leading *', () => {
  assert.deepEqual(splitAlternatives('(a, b, c)'), ['a', 'b', 'c'])
  assert.deepEqual(splitAlternatives('x, y | z'), ['x, y', 'z'])
  assert.deepEqual(splitAlternatives('(very; ∅)'), ['very', ''])
  assert.deepEqual(splitAlternatives('*(run, *shut off)', 'bad'), ['run', 'shut off'])
  assert.deepEqual(splitAlternatives('a, b,'), ['a', 'b'])
})

test('mismatched ✓/✗ counts is an error', () => {
  const t = templateFromText('{a}\t{b} ✓\t*{c} ✗\nx\t(p, q)\t(r, s, u)')
  assert.equal(analyse(t).ok, false)
})

test('single ✗ alternative is broadcast to every ✓', () => {
  const t = templateFromText('{a}\t{b} ✓\t*{c} ✗\nx\t(p, q)\tr')
  assert.deepEqual(expandAll(t).map((p) => p.bad), ['X r.', 'X r.'])
})

test('missing ✓ or ✗ column is an error', () => {
  assert.equal(analyse(templateFromText('{a}\t{b}\nx\ty')).ok, false)
})

test('optional ∅ slot drops cleanly', () => {
  const t = templateFromText('{a}\t{adv}\t{v} ✓\t*{v2} ✗\nthe dog\t(often, ∅)\tbarks\tbark')
  assert.deepEqual(expandAll(t).map((p) => p.good), ['The dog often barks.', 'The dog barks.'])
})

test('no-space joiner and no capitalisation', () => {
  const t = templateFromText('{a}\t{b} ✓\t*{c} ✗\n猫が\t鳴く\t鳴かせ', 'ja')
  const [p] = expandAll(t, { joiner: '', capitalise: false, endPunct: '。' })
  assert.equal(p.good, '猫が鳴く。')
})

test('combination explosion is flagged; hard cap refuses', () => {
  const many = Array.from({ length: 30 }, (_, i) => `w${i}`).join(', ')
  const t = templateFromText(`{a}\t{b}\t{c}\t{d} ✓\t*{e} ✗\n${many}\t${many}\t${many}\tok\tko`)
  const a = analyse(t)
  assert.equal(a.total, 27000)
  assert.equal(a.explode, true)
  assert.ok(a.total < HARD_CAP && a.ok)
  const big = templateFromText(`{a}\t{b}\t{c}\t{x}\t{d} ✓\t*{e} ✗\n${many}\t${many}\t${many}\t${many}\tok\tko`)
  assert.equal(analyse(big).overCap, true)
  assert.equal(analyse(big).ok, false)
})

test('markdown table and CSV import', () => {
  const md = '| {s} | {v} ✓ | *{v2} ✗ |\n|---|---|---|\n| (the cat, the dog) | sleeps | sleep |'
  assert.equal(expandAll(templateFromText(md)).length, 2)
  assert.deepEqual(parseCSV('a,"b, c","d ""e"""\n'), [['a', 'b, c', 'd "e"']])
})

test('CSV export quotes, TSV round-trip keeps roles', () => {
  const t = demoTemplate()
  const csv = pairsToDelimited(t, expandAll(t, DEFAULT_OPTIONS), ',')
  assert.equal(csv.trim().split('\n').length, 55)
  assert.ok(csv.startsWith('template,row,pair,sentence_good,sentence_bad'))
  const again = templateFromText(templateToTSV(t), t.name)
  assert.deepEqual(again.columns, t.columns)
  assert.equal(analyse(again).total, 54)
})

console.log(`\n${n} tests passed`)
