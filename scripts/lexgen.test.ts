// Tests for the deterministic lexical generator (src/lib/lexgen.ts). Run: npm test
import assert from 'node:assert/strict'
import {
  analyse, demoTemplate, expandAll, pairsToDelimited, parseCSV, splitAlternatives,
  templateFromText, templateToTSV, DEFAULT_OPTIONS, HARD_CAP,
  sheetToTemplates, samplePairs, parseTSV, manyToDelimited,
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

// ---------- the language sheets' own conventions (generation fix, 23 Nov) ----------

test('real commas: doubled comma and single trailing comma are text', () => {
  assert.deepEqual(splitAlternatives('(Segons la meva mare,, Em van dir que, Sembla que)'), ['Segons la meva mare,', 'Em van dir que', 'Sembla que'])
  assert.deepEqual(splitAlternatives('(partir,)'), ['partir,'])
  assert.deepEqual(splitAlternatives('(fatiguée, elle se réveille très tôt)', 'shared', true), ['fatiguée, elle se réveille très tôt'])
})

test('Persian / full-width commas separate alternatives', () => {
  assert.deepEqual(splitAlternatives('(برود، بخوابد، بخندد)'), ['برود', 'بخوابد', 'بخندد'])
  assert.deepEqual(splitAlternatives('(甲，乙、丙)'), ['甲', '乙', '丙'])
})

test('mismatched and curly brackets are stripped in seed rows', () => {
  assert.deepEqual(splitAlternatives('{mangée, achetée, goûtée)'), ['mangée', 'achetée', 'goûtée'])
  assert.deepEqual(splitAlternatives('{ils}'), ['ils'])
})

test('✗ named _mismatch / _nonagr; ✓ inferred from its twin or left neighbour', () => {
  const fr = templateFromText('{subj}\t{pp_fem_sg}\t*{pp_fem_sg_mismatch}\n(la fille)\t(mangée)\t(mangé)')
  assert.deepEqual(fr.columns.map((c) => c.role), ['shared', 'good', 'bad'])
  const ca = templateFromText('{SUBJ}\t{VP_agr}\t{VP_nonagr}\n(els nens)\t(mengen)\t(menja)')
  assert.deepEqual(ca.columns.map((c) => c.role), ['shared', 'good', 'bad'])
})

test('word order: ✗ slot elsewhere moves the word instead of replacing in place', () => {
  const t = templateFromText('{det}\t{ord_num}\t{noun}\t*{ord_num_mismatch}\n(le)\t(premier)\t(jour)\t(premier)')
  assert.deepEqual(t.columns.map((c) => c.role), ['shared', 'good', 'shared', 'bad'])
  const [p] = expandAll(t)
  assert.equal(p.good, 'Le premier jour.')
  assert.equal(p.bad, 'Le jour premier.')
})

test('(optional) slot also generates without it; {Ø} slot may be empty; off columns are left out', () => {
  const t = templateFromText('{SUBJ} (optional)\t{V} ✓\t*{V_bad} ✗\tnotes\n(la Marta)\t(veu)\t(veuen)\tignore me')
  assert.equal(t.columns[0].optional, true)
  t.columns[3].role = 'off'
  assert.deepEqual(expandAll(t).map((p) => p.good), ['La Marta veu.', 'Veu.'])
  const z = templateFromText('{DEF} ✓\t{Ø} ✗\t{N}\n(la)\t\t(casa)')
  assert.deepEqual(expandAll(z).map((p) => [p.good, p.bad]), [['La casa.', 'Casa.']])
})

test('French elision: no space after qu\' / l\' / j\' slots', () => {
  const t = templateFromText("{conj} ✓\t*{conj_x} ✗\t{subj}\t{V}\n(qu')\t(que)\t(elle)\t(parte)")
  assert.equal(expandAll(t, { ...DEFAULT_OPTIONS, capitalise: false })[0].good, "qu'elle parte.")
})

test('whole tab: stacked templates, macro / sub labels, comma notes, sheet row numbers', () => {
  const tab = [
    'Macrophenomenon\tSubphenomenon\tTemplates:',
    '1. Agreement\tA. det-noun\tTemplates:\t{det}\t*{det_mismatch}\t{noun}',
    '\t\t1.0\t(le, ce)\t(la, cette)\t(chien, chat)',
    '\t\t2.0\t(un)\t(une)\t(livre)',
    '',
    '\tB. context\tTemplates:\t{subj}\t{V}\t{V_mismatch}\t{context}',
    '\tNote: commas are not a delimiter in the {context} cell\t1.0\t(elle)\t(soit)\t(est)\t(fatiguée, elle dort)',
    '\t\tTemplates:\t{subj}\t{V}\t*{V_mismatch}',
    '\t\t1.0\t(il)\t(dort)\t(dorment)',
  ].join('\n')
  const ts = sheetToTemplates(tab)
  assert.equal(ts.length, 3)
  assert.equal(ts[0].template.macro, '1. Agreement')
  assert.equal(ts[0].template.sub, 'A. det-noun')
  assert.equal(ts[0].headerRow, 2)
  assert.deepEqual(ts[0].dataRows, [3, 4])
  assert.equal(analyse(ts[0].template).total, 5)
  assert.equal(ts[1].template.sub, 'B. context')
  assert.equal(ts[1].template.columns[3].literal, true)
  assert.equal(expandAll(ts[1].template)[0].good, 'Elle soit fatiguée, elle dort.')
  assert.equal(ts[2].template.sub, 'B. context', 'sub carried down')
  const csv = manyToDelimited(ts.map((s) => ({ t: s.template, pairs: expandAll(s.template) })), ',')
  assert.ok(csv.startsWith('macrophenomenon,subphenomenon,template'))
  assert.equal(csv.trim().split('\n').length, 1 + 5 + 1 + 1)
})

test('tab without "Templates:" markers (Catalan layout) is still split', () => {
  const tab = [
    'Macro-phenomenon\tSub-phenonenon\tTemplate',
    '1. Agreement\tSubject-verb\t{Prefix}\t{SUBJ}\t{VP_agr}\t{VP_nonagr}',
    '\t\t(Crec que,, Sembla que)\t(els nens)\t(mengen)\t(menja)',
    '\tGender\t{DET}\t{NOUN}\t{ADJ_agr}\t{ADJ_nonagr}',
    '\t\t(la)\t(casa)\t(blanca)\t(blanc)',
  ].join('\n')
  const ts = sheetToTemplates(tab)
  assert.equal(ts.length, 2)
  assert.equal(ts[1].template.macro, '1. Agreement')
  assert.equal(ts[1].template.sub, 'Gender')
  assert.equal(expandAll(ts[0].template)[0].good, 'Crec que, els nens mengen.')
})

test('Google Sheets TSV: quoted cells with line breaks stay one cell', () => {
  assert.deepEqual(parseTSV('a\t"{adjunct}\noptional"\tc\nd\te\tf'), [['a', '{adjunct}\noptional', 'c'], ['d', 'e', 'f']])
})

test('three-example sample is spread, distinct and deterministic', () => {
  const s1 = samplePairs(demoTemplate(), 3).map((p) => p.good)
  assert.equal(new Set(s1).size, 3)
  assert.deepEqual(s1, samplePairs(demoTemplate(), 3).map((p) => p.good))
  assert.equal(s1[0], 'The refrigerator that stores all the cakes runs too cold.')
})

console.log(`\n${n} tests passed`)
