// The grammatical phenomena contributors pick before they see any vocabulary ("phenomenon first").
//
// Languages with linguists' notes use the phenomena from scripts/seed-data/<code>.json (September 2026 notes):
// a draft list, labelled as such on the page. The language lead confirms each contributor's assignment, and the
// final 10 macrophenomena live in the language sheet. Languages without notes show the BLiMP-style examples from the
// language-lead deck ("examples of macro-phenomena you could incorporate"), also labelled as examples.
// Regenerate the seeded part with scripts/build-phenomena.py when the notes change.

export interface Phenomenon { label: string; family: string; note: string }

export const SEEDED: Record<string, Phenomenon[]> = {
 "ca": [
  {
   "label": "Agreement",
   "family": "agreement",
   "note": "Covers verbal (person/number), adjectival (gender/number), determiner-noun (incl. gender), and participial (gender/number) agreement. Open question: for determiner-noun, whether to hold gender constant and test sg vs pl."
  },
  {
   "label": "Clitic Climbing",
   "family": "clitics",
   "note": "Some pairs are equivalently grammatical with preferences; the non-restructuring climbing case is ungrammatical. Issue: full list of restructuring verbs still to be fixed. No literal example pairs given in notes."
  },
  {
   "label": "Subjunctive",
   "family": "mood",
   "note": "Three sub-triggers: desire (voler), directive (demanar), doubt (dubtar)."
  },
  {
   "label": "Islands",
   "family": "extraction",
   "note": "Complex NP, weak island, CED (adjunct/sentential-subject), and CSC violations. Stored as island-violation examples; no grammatical non-island control provided in the notes, so bad-only entries recorded with note."
  },
  {
   "label": "Negative Concord",
   "family": "negation",
   "note": "Preverbal 'no' is OPTIONAL: 'Ningú vindrà' and 'Ningú no vindrà' are BOTH grammatical, as are 'Ningú ha llegit res' / 'Ningú no ha llegit res'. Only the postverbal case gives a good/bad pair."
  },
  {
   "label": "Ellipsis",
   "family": "ellipsis",
   "note": "TP ellipsis with 'també' and with polarity 'no'."
  },
  {
   "label": "Control/Raising",
   "family": "control",
   "note": "Diagnostics: expletive/weather, idiom preservation, derived-subject agreement, and experiencer 'seem'. 'El cantant em sembla estar cansat' is ungrammatical in Catalan (cf. grammatical English 'The singer seems to me to be tired')."
  },
  {
   "label": "Determiners/Possessives",
   "family": "determiner",
   "note": "Article obligatory with prenominal possessive; personal article (El/En, La) obligatory with proper names."
  },
  {
   "label": "Clitic Combinations",
   "family": "clitics",
   "note": "Tier 2 stub; pairs optional, none provided in notes."
  },
  {
   "label": "Person-Case Constraint (PCC)",
   "family": "clitics",
   "note": "Tier 2 stub; distinguish weak vs strong PCC. Pairs optional, none provided in notes."
  },
  {
   "label": "Differential Object Marking",
   "family": "case",
   "note": "Tier 2 stub; pairs optional, none provided in notes."
  },
  {
   "label": "Null Subjects",
   "family": "agreement",
   "note": "Tier 2 stub; pairs optional, none provided in notes."
  }
 ],
 "cy": [
  {
   "label": "Coordinate Structure Constraint — embedded negative na(d)",
   "family": "negation",
   "note": "The embedded negative declarative na(d) must be repeated in every conjunct of a coordinate structure."
  },
  {
   "label": "Anti-agreement effect",
   "family": "agreement",
   "note": "In subject wh-questions the verb stays 3rd sg with no agreement for the extracted plural subject."
  },
  {
   "label": "Possessor extraction ban (pied-piping)",
   "family": "extraction",
   "note": "A possessor cannot be extracted from a DP; the whole DP must pied-pipe."
  },
  {
   "label": "Superiority in multiple wh-questions",
   "family": "extraction",
   "note": "With multiple wh-words the subject wh fronts and the object wh stays in situ (subject > object)."
  },
  {
   "label": "Resumptive pronoun ban in subject/object position",
   "family": "extraction",
   "note": "Overt resumptive pronouns are impossible in subject and direct-object positions; the gap strategy is used instead."
  },
  {
   "label": "Relative clause subject gap",
   "family": "rel-clause",
   "note": "In relative clauses an overt pronoun is excluded at the subject relativisation site."
  },
  {
   "label": "Preposition agreement in object-of-preposition relatives",
   "family": "rel-clause",
   "note": "Relatives on the object of a preposition require agreement on the preposition; pied-piping the PP is impossible."
  },
  {
   "label": "Overt wh in non-restrictive adjunct relatives",
   "family": "rel-clause",
   "note": "Non-restrictive adjunct relatives require an overt wh-word."
  },
  {
   "label": "Propositional adverbs in focus position",
   "family": "word-order",
   "note": "Propositional adverbs such as hwyrach 'probably' sit in focus position and cannot co-occur with affirmative particles fe/mi."
  },
  {
   "label": "No agreement with focused pronominal subject",
   "family": "agreement",
   "note": "With a focused pronominal subject the verb stays default 3rd sg with no agreement."
  },
  {
   "label": "VSO default agreement",
   "family": "agreement",
   "note": "Gwelodd (3sg) vs Gwelon (3pl) with plural lexical subject y bechgyn"
  },
  {
   "label": "Embedded bod-clauses",
   "family": "clause",
   "note": "bod = non-finite be; mae = present indicative, ungrammatical in complement"
  },
  {
   "label": "Aspectual particle order",
   "family": "aspect",
   "note": "wedi = perfect, yn = progressive"
  },
  {
   "label": "No fronting of aspectual yn",
   "family": "word-order",
   "note": "fronted verb-noun appears bare, without yn"
  },
  {
   "label": "Gwneud clause fronting",
   "family": "clause",
   "note": "gwneud = do; complement must be fronted"
  },
  {
   "label": "Negative pronoun object",
   "family": "negation",
   "note": "neb = anyone/no one"
  },
  {
   "label": "Adverb placement",
   "family": "word-order",
   "note": "wastad/yfory = adverbs; definite Emrys blocks intervention"
  },
  {
   "label": "Reflexive binding (Principle A)",
   "family": "binding",
   "note": "ei hun = himself"
  },
  {
   "label": "Expletive hi extraposition",
   "family": "clause",
   "note": "hi = expletive it; clausal subject extraposed"
  },
  {
   "label": "Expletive yna distribution",
   "family": "clause",
   "note": "yna = existential expletive there"
  },
  {
   "label": "Adjective agreement in numeral phrases",
   "family": "agreement",
   "note": "ifainc/eraill are plural forms; singular ifanc/arall required after numerals"
  },
  {
   "label": "Standalone adjective requires pronominal head un",
   "family": "determiner",
   "note": "glas blue needs un as nominal head under the article"
  },
  {
   "label": "Definiteness in possessor chains",
   "family": "determiner",
   "note": "no article on non-final nouns; whole phrase is definite via final y"
  },
  {
   "label": "Agreement with pronominal vs lexical subjects",
   "family": "agreement",
   "note": "plural pronoun nhw triggers plural gwelon; lexical DP takes 3sg gwelodd"
  },
  {
   "label": "No agreement with coordinate subjects",
   "family": "agreement",
   "note": "coordinated ti a fi takes 2sg default gwelaist, not plural gwelon"
  },
  {
   "label": "Negative Dependent Constraint",
   "family": "negation",
   "note": "negative n-word dim licensed by ddim"
  },
  {
   "label": "dim versus ddim after negatives",
   "family": "negation",
   "note": "ddim is barred after the negative subject neb"
  },
  {
   "label": "mo before definite objects in negatives",
   "family": "negation",
   "note": "mo = contraction of ddim + o before a definite object"
  },
  {
   "label": "N-words in imperatives require paid/peidiwch",
   "family": "negation",
   "note": "neb needs negative auxiliary paid in imperatives"
  },
  {
   "label": "Obligatory agreement clitic in passives",
   "family": "clause",
   "note": "ei clitic required before the non-finite verb daro"
  },
  {
   "label": "No pronoun after passive non-finite verb",
   "family": "clause",
   "note": "resumptive pronoun o barred after ei daro"
  },
  {
   "label": "Allomorphy of the conjunction and",
   "family": "morphophonology",
   "note": "ac pre-vocalic, a pre-consonantal"
  }
 ],
 "fa": [
  {
   "label": "Differential Object Marking (=rā)",
   "family": "case",
   "note": "Specificity/definiteness-driven, not animacy. =o is the colloquial form of =rā. Names, pronouns, and possessive contexts trigger obligatory =rā."
  },
  {
   "label": "Ezāfe construction (=e / =ye)",
   "family": "linking",
   "note": "Stacking possible: 'ketāb=e jāleb=e Maryam'. Can create ambiguity, e.g. 'ketāb=e še'r=e dur=o derāz'."
  },
  {
   "label": "Subject–verb agreement",
   "family": "agreement",
   "note": "Plural verb with plural inanimate subject is prescriptively marked/variable — a gradience case, not a clean violation."
  },
  {
   "label": "Subjunctive mood",
   "family": "mood",
   "note": "Some predicates allow a bare stem with impersonal reading ('bāyad raft'); compound verbs often drop be-."
  },
  {
   "label": "Null subjects (pro-drop)",
   "family": "agreement",
   "note": "Gradience phenomenon requiring discourse context; pairs omitted."
  },
  {
   "label": "Compound / light-verb constructions",
   "family": "linking",
   "note": "Lexically listed; pairs optional/omitted."
  },
  {
   "label": "Relative clauses / resumptive pronouns",
   "family": "rel-clause",
   "note": "Resumptive distribution varies by position; pairs optional/omitted."
  }
 ],
 "fr": [
  {
   "label": "Past participle agreement with subject",
   "family": "agreement",
   "note": "être triggers subject agreement (Elle est arrivée); avoir does not agree with the subject (Elle a mangé, not *mangée)."
  },
  {
   "label": "Binding (Principles A, B, C)",
   "family": "binding",
   "note": "Principle A requires local reflexive se for coreference; Principle B forbids reflexive across a clause boundary for intended cross-clause coreference; Principle C concerns R-expression distribution (C'est Léon vs *Il est Léon)."
  },
  {
   "label": "Control vs Raising",
   "family": "control",
   "note": "In subject-control 'Marie a promis à Paul de rester seule', the infinitival subject is Marie (feminine), so the adjective must be feminine (seule), not masculine (*seul)."
  },
  {
   "label": "Past participle agreement with preposed object (COD vs COI)",
   "family": "agreement",
   "note": "COD triggers agreement (La pomme que Max a mangée); COI does not (L'amie à qui Max a téléphoné, not *téléphonée)."
  },
  {
   "label": "Subjunctive mood selection",
   "family": "mood",
   "note": "il faut que requires subjunctive (pleuve); espérer que requires indicative (vient). Some forms are homophonous between subjunctive and indicative for je/tu/il, distinct only for nous/vous."
  },
  {
   "label": "Adjective position (prenominal vs postnominal)",
   "family": "word-order",
   "note": "Numerals and certain short adjectives (belle, vieux, vieil) are prenominal; most descriptive adjectives (verte, française) are postnominal. Some adjectives change meaning by position (une seule femme 'only' vs une femme seule 'alone'; ma propre maison 'own' vs ma maison propre 'clean') and may need longer context."
  },
  {
   "label": "Subject extraction (que vs qui)",
   "family": "extraction",
   "note": "Subject extraction across an embedded clause selects qui, not que."
  }
 ],
 "tl": [
  {
   "label": "Voice marking and single pivot",
   "family": "voice",
   "note": "Includes the constraint that a pronominal theme forces object (patient) voice."
  },
  {
   "label": "Wh-extraction and relativization restricted to pivots",
   "family": "extraction",
   "note": "Covers wh-questions, local relativization, and long-distance relativization."
  },
  {
   "label": "Pivot-verb number agreement",
   "family": "agreement",
   "note": "Matalino vs *Matatalino with singular si Armand."
  },
  {
   "label": "Second-position pronominal clitics",
   "family": "clitics",
   "note": "Hindi ko nakita vs *Hindi nakita ko."
  },
  {
   "label": "Reflexive must be direct object",
   "family": "binding",
   "note": "Ban on reflexive Actors."
  },
  {
   "label": "Negative imperative huwag selects non-finite verb",
   "family": "negation",
   "note": "Huwag mong basahin vs *Huwag mong binasa."
  }
 ]
}

/** From the language-lead deck (slide "Step 1a: Phenomena Selection"): examples, not a prescribed list. */
export const DECK_EXAMPLES: Phenomenon[] = [
  'Case and agreement', 'Negation and polarity', 'Determiners', 'Quantifiers', 'Argument structure', 'Binding and anaphora',
  'Control and raising', 'Filler-gap dependencies and movement', 'Islands', 'Ellipsis', 'Morphology', 'Word order',
].map((label) => ({ label, family: '', note: '' }))

export function phenomenaFor(code: string): { list: Phenomenon[]; source: 'notes' | 'deck' } {
  return SEEDED[code] ? { list: SEEDED[code], source: 'notes' } : { list: DECK_EXAMPLES, source: 'deck' }
}
