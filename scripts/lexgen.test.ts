// Tests for the deterministic lexical generator (src/lib/lexgen.ts). Run: npm test
import assert from 'node:assert/strict'
import {
  analyse, demoTemplate, expandAll, pairsToDelimited, parseCSV, splitAlternatives,
  templateFromText, templateToTSV, DEFAULT_OPTIONS, HARD_CAP,
  sheetToTemplates, samplePairs, parseTSV, manyToDelimited, dedupePairs, repeatedWords, findContradictions,
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


test('dedupePairs drops repeated pairs and keeps order', () => {
  const t = templateFromText('{a}\t{b} ✓\t*{c} ✗\n(x, x, y)\t(p)\t(q)')
  const all = expandAll(t)
  assert.equal(all.length, 3)
  const d = dedupePairs(all)
  assert.equal(d.removed, 1)
  assert.deepEqual(d.pairs.map((p) => p.good), ['X p.', 'Y p.'])
})

test('repeatedWords counts words across templates, skipping fixed slots', () => {
  const t = templateFromText([
    '{subj}\t{rel}\t{adj} ✓\t*{adj_bad} ✗',
    '(la fille, la femme)\tqui\t(fatiguée, contente)\t(fatigué, content)',
    '(la voisine, la mère)\tqui\t(fatiguée, ravie)\t(fatigué, ravi)',
    '(la sœur, la tante)\tqui\t(fatiguée, prête)\t(fatigué, prêt)',
  ].join('\n'), 'P1')
  const r = repeatedWords([t])
  assert.equal(r[0].templates, 3)
  assert.ok(r.some((x) => x.word === 'fatiguée' && x.templates === 3))
  assert.ok(!r.some((x) => x.word === 'qui'), 'fixed slot skipped')
  assert.ok(r.some((x) => x.word === 'fatigué' && x.templates === 3))
})

// ---------- regressions from the Generator QA report (24 Nov, Phase2/Generator-QA.md §4) ----------

test('G1: mood selection takes the embedded verb next to ✗ as ✓, not the same-named matrix verb', () => {
  const t = templateFromText("{subj}\t{V_indicatif}\t{conj}\t{subj_2sg}\t{V_subjonctif}\t{V_indicatif_mismatch}\t{context}\nIl\t(faut, est important)\tque\ttu\tsois\tes\t(content, triste, sympa)")
  assert.deepEqual(t.columns.map((c) => c.role), ['shared', 'shared', 'shared', 'shared', 'good', 'bad', 'shared'])
  const [p] = expandAll(t)
  assert.equal(p.good, 'Il faut que tu sois content.')
  assert.equal(p.bad, 'Il faut que tu es content.')
  assert.equal(expandAll(t).length, 6)
  // roles from names only: the page says so
  assert.ok(analyse(t).issues.some((i) => i.level === 'warning' && /read from the slot names/.test(i.message)))
  // 2.2: {V_indicatif} twice; the nearest one to the left of ✗ is the contrast slot
  const t2 = templateFromText("{subj_sg}\t{V_indicatif}\t{conj}\t{subj_3sg}\t{V_indicatif}\t{V_indicatif_mismatch}\t{context}\nJe\t(pense, crois)\tqu'\til\tvient\tvienne\t(aujourd'hui, ce soir, demain)")
  assert.deepEqual(t2.columns.map((c) => c.role), ['shared', 'shared', 'shared', 'shared', 'good', 'bad', 'shared'])
  assert.deepEqual([expandAll(t2)[0].good, expandAll(t2)[0].bad], ["Je pense qu'il vient aujourd'hui.", "Je pense qu'il vienne aujourd'hui."])
  // explicit marks still win over every name rule
  const t3 = templateFromText("{subj}\t{V_indicatif} ✓\t{conj}\t{V_subjonctif}\t{V_indicatif_mismatch} ✗\nIl\tfaut\tque\tsois\tes")
  assert.deepEqual(t3.columns.map((c) => c.role), ['shared', 'good', 'shared', 'shared', 'bad'])
  // word order is unchanged: a different category next to ✗, so the same-stem slot elsewhere is ✓
  const wo = templateFromText('{subj_3esg}\t{cod_mistmatch}\t{coi}\t{cod}\t{V_3esg}\n(Elle)\t(le)\t(lui)\t(le)\t(donne)')
  assert.deepEqual(wo.columns.map((c) => c.role), ['shared', 'bad', 'shared', 'good', 'shared'])
})

test('G2: _nonagr before _agr is ambiguous: no roles guessed, a clear message, no pairs', () => {
  const c = templateFromText('{SUBJ}\t{AUX}\t{PTCP_nonagr}\t{PTCP_agr}\n(les veïnes, les meves germanes, la Maria i la Júlia)\than\t(marxat, sortit, arribat)\t(marxades, sortides, arribades)')
  assert.ok(!c.columns.some((x) => x.role === 'good' || x.role === 'bad'))
  const a = analyse(c)
  assert.equal(a.ok, false)
  assert.match(a.issues[0].message, /do not say which one is grammatical.*Mark the grammatical header with ✓/s)
  assert.deepEqual(expandAll(c), [])
  // explicit marks give the intended pairs
  const m = templateFromText('{SUBJ}\t{AUX}\t{PTCP_nonagr} ✓\t{PTCP_agr} ✗\n(les veïnes)\than\t(marxat, sortit, arribat)\t(marxades, sortides, arribades)')
  assert.deepEqual([expandAll(m)[0].good, expandAll(m)[0].bad], ['Les veïnes han marxat.', 'Les veïnes han marxades.'])
  // the usual order {VP_agr} {VP_nonagr} still works, with the "check the roles" warning
  const ca = templateFromText('{SUBJ}\t{VP_agr}\t{VP_nonagr}\n(els nens)\t(mengen)\t(menja)')
  assert.deepEqual(ca.columns.map((x) => x.role), ['shared', 'good', 'bad'])
  assert.ok(analyse(ca).issues.some((i) => i.level === 'warning' && /read from the slot names/.test(i.message)))
  // ✗ marked explicitly with *: no name warning
  const fr = templateFromText('{subj}\t{pp_fem_sg}\t*{pp_fem_sg_mismatch}\n(la fille)\t(mangée)\t(mangé)')
  assert.ok(!analyse(fr).issues.some((i) => i.level === 'warning'))
})

test('G3: a header row without "Templates:" in a tab that uses the marker is a header, not a template row', () => {
  const tab = 'M\tS\tTemplates:\t{a}\t{b_ok}\t*{b_mismatch}\n\t\t1\t(x, y, z)\t(p, q, r)\t(P, Q, R)\n\t\t\t{c}\t{d_ok}\t*{d_mismatch}\n\t\t2\t(u, v, w)\t(k, l, m)\t(K, L, M)'
  const ts = sheetToTemplates(tab)
  assert.equal(ts.length, 2)
  assert.deepEqual(ts.map((s) => s.template.rows.length), [1, 1])
  assert.equal(ts[1].template.columns[0].label, '{c}')
  assert.deepEqual(ts.map((s) => s.dataRows), [[2], [4]])
  for (const s of ts) for (const p of expandAll(s.template)) assert.ok(!/[{}]/.test(p.good + p.bad))
})

test('G4: the French comma note wording and [square brackets] keep the comma', () => {
  const fr = "Macro\tSub\tTemplates:\t{loc}\t{subj}\t{V_subjonctif}\t{V_subjonctif_mismatch}\t{context}\n\tNote: the comma in the {context} cell is not a delimiter, but indeed part of the sentence.\t1\tBien qu'\telle\tsoit\test\t[fatiguée, elle se réveille très tôt]"
  const [s] = sheetToTemplates(fr)
  assert.deepEqual(expandAll(s.template).map((p) => p.good), ["Bien qu'elle soit fatiguée, elle se réveille très tôt."])
  // the note alone (round brackets) makes the column literal
  const [s2] = sheetToTemplates(fr.replace('[fatiguée, elle se réveille très tôt]', '(fatiguée, elle se réveille très tôt)'))
  assert.equal(s2.template.columns[4].literal, true)
  assert.deepEqual(splitAlternatives('[fatiguée, elle se réveille très tôt]'), ['fatiguée, elle se réveille très tôt'])
  assert.deepEqual(splitAlternatives('[partir,]'), ['partir,'])
  assert.deepEqual(splitAlternatives('[a, b; c, d]'), ['a, b', 'c, d'])
})

test('G5: a header after the last {slot} is kept: used when its cells are lists, otherwise off and reported', () => {
  const ez = '{subj_EZ_match}\t{subj_EZ_mismatch}\t{subj_modifier}\tvery\t{modifier}\tbe\n(خانه‌ی، مدرسه‌ی، صدای)\t(خانه‌، مدرسه‌، صدا)\t(تو، او، من)\t(خیلی، بسیار)\t(قشنگ، خوب، عجیب)\t(است، بود)'
  const [s] = sheetToTemplates(ez)
  assert.equal(s.template.columns.length, 6)
  assert.equal(s.template.columns[5].role, 'shared')
  const [p] = expandAll(s.template)
  assert.ok(p.good.endsWith('است.'), p.good)
  assert.ok(analyse(s.template).issues.some((i) => /“be” has no \{braces\}/.test(i.message)))
  // an author column is left out of the sentences, but shown and reported
  const [e] = sheetToTemplates('{subj}\t{V} ✓\t*{V_bad} ✗\tauthor\n(the cat, the dog, the bird)\tsleeps\tsleep\tAB')
  assert.equal(e.template.columns[3].role, 'off')
  assert.equal(expandAll(e.template)[0].good, 'The cat sleeps.')
  assert.ok(analyse(e.template).issues.some((i) => i.level === 'warning' && /“author” is to the right of the last \{slot\}/.test(i.message)))
})

test('G6: subphenomenon title rows inside the slot range are labels, not template rows', () => {
  const tab = 'Subject verb\t\t\n{SUBJ}\t{VERB_agr}\t{VERB_nonagr}\n(els nens, les veïnes, aquells músics)\t(mengen, canten, treballen)\t(menja, canta, treballa)\n\t\t\nPredicative adjective\t\t\n{SUBJ}\t{ADJ_agr}\t{ADJ_nonagr}\n(la noia, la germana, la dona)\t(contenta, cansada, nerviosa)\t(content, cansat, nerviós)'
  const ts = sheetToTemplates(tab)
  assert.equal(ts.length, 2)
  assert.deepEqual(ts.map((s) => s.template.rows.length), [1, 1])
  assert.deepEqual(ts.map((s) => s.template.sub), ['Subject verb', 'Predicative adjective'])
  assert.ok(ts.every((s) => analyse(s.template).ok))
  // a title beside a stray {slot} cell is a label too
  const t2 = sheetToTemplates('{SUBJ}\t{V_agr}\t{V_nonagr}\t{Suffix}\n(a, b, c)\t(d, e, f)\t(g, h, i)\t(j, k, l)\nPassives\t\t\t{Suffix}\n{SUBJ}\t{X_agr}\t{X_nonagr}\n(a, b, c)\t(m, n, o)\t(p, q, r)')
  assert.deepEqual(t2.map((s) => s.template.rows.length), [1, 1])
  assert.equal(t2[1].template.sub, 'Passives')
})

test('G7: no "identical partner" warning for word-order templates; still warned for in-place contrasts', () => {
  const wo = templateFromText('{det}\t{ord_num}\t{noun}\t*{ord_num_mismatch}\n(le, ce, un)\t(premier, dernier, deuxième)\t(jour)\t(premier, dernier, deuxième)')
  assert.ok(!analyse(wo).issues.some((i) => /identical/.test(i.message)))
  assert.equal(expandAll(wo)[0].bad, 'Le jour premier.')
  const inPlace = templateFromText('{subj}\t{pp} ✓\t*{pp_x} ✗\n(il)\t(mangé, dévorée)\t(mangée, dévorée)')
  assert.ok(analyse(inPlace).issues.some((i) => /identical/.test(i.message)))
})

test('G8: the template count leaves out rows that fail the 3+ rule or have no usable contrast', () => {
  const t = templateFromText([
    '{subj}\t{V} ✓\t*{V_bad} ✗\t{obj}',
    '(the cat, the dog, the bird)\t(sees, likes, finds)\t(see, like, find)\t(it, them, him)',  // counts
    '(the cat, the dog)\t(sees, likes, finds)\t(see, like, find)\t(it, them, him)',          // 2 alternatives
    '(the cat, the dog, the bird)\t(sees, likes, finds)\t(see, like)\t(it, them, him)',      // ✓/✗ do not pair up
    '(the cat, the dog, the bird)\tsees\tsee\t(it, them, him)',                               // single contrast pair: fine
  ].join('\n'))
  const a = analyse(t)
  assert.equal(a.plans.length, 4)
  assert.deepEqual(a.plans.map((p) => p.meetsRule), [true, false, false, true])
  assert.equal(a.templates, 2)
})

test('G9: identical ✓ = ✗ pairs are dropped from the output; contradictions are reported', () => {
  const t = templateFromText('{subj}\t{pp} ✓\t*{pp_x} ✗\n(il, elle, on)\t(mangé, dévorée)\t(mangée, dévorée)')
  const all = expandAll(t)
  assert.equal(all.length, 6)
  const d = dedupePairs(all)
  assert.equal(d.identical, 3)
  assert.equal(d.repeated, 0)
  assert.equal(d.removed, 3)
  assert.ok(d.pairs.every((p) => p.good !== p.bad))
  const c = findContradictions([{ good: 'A b.', bad: 'A c.' }, { good: 'A c.', bad: 'A b.' }, { good: 'X y.', bad: 'X z.' }])
  assert.deepEqual(c.map((x) => x.sentence), ['A c.', 'A b.'])
  assert.equal(dedupePairs([{ good: 'A b.', bad: 'A c.' }, { good: 'A c.', bad: 'A d.' }]).contradictions.length, 1)
})

test('G10: zero-width non-joiners at word / sentence edges are trimmed, never inside words', () => {
  const zw = '‌'
  const t = templateFromText(`{n} ✓\t*{n_x} ✗\t{m}\n(خانه${zw}ی)\t(خانه${zw})\t(تو${zw})`)
  const [p] = expandAll(t)
  assert.equal(p.good, `خانه${zw}ی تو.`)      // inside the word: kept
  assert.equal(p.bad, 'خانه تو.')               // at the end of a word and of the sentence: trimmed
  assert.ok(!/‌(\s|\.|$)/.test(p.good + ' ' + p.bad))
})

console.log(`
${n} tests passed`)
