#!/usr/bin/env python3
"""
translate-pools.py: the second build step for the contribution page's vocabulary pools (after fineweb-sample.mjs).

For each public/fineweb/<code>.json it keeps N sentences, adds a precomputed English machine translation and the
"words you could reuse" chips, and drops any sentence that could not be translated. The site therefore never shows an
untranslated sentence and never waits on a live translation call.

  pip install transformers torch sentencepiece sacremoses        (CPU is enough: ~400 short sentences per language)
  python3 scripts/translate-pools.py                  # every pool, 400 sentences each
  python3 scripts/translate-pools.py cy fr --n 200

Models: Helsinki-NLP opus-mt-<src>-en (Apache-2.0). Persian has no dedicated model, so it uses opus-mt-mul-en. English
pools need no translation. Each pool records the model it used, and the site labels translations "machine translation".
Vocabulary chips are a transparent heuristic, not a tagger: the longest distinct words (≥4 letters, ≥3 for Persian)
that are not on a short per-language function-word list
and are not capitalised mid-sentence (names). They are suggestions for reuse, never a sentence to copy.
"""
from __future__ import annotations
import json, re, sys, random
from pathlib import Path

MODELS = {"af": "opus-mt-af-en", "eu": "opus-mt-eu-en", "ca": "opus-mt-ca-en", "fr": "opus-mt-fr-en",
          "es": "opus-mt-es-en", "tl": "opus-mt-tl-en", "cy": "opus-mt-cy-en", "fa": "opus-mt-mul-en"}

# Short function-word lists (articles, pronouns, auxiliaries, prepositions, conjunctions). Content words remain.
STOP = {
    "af": "die een van en in is wat met vir op nie het was sal ook om te dat by aan hulle ons sy hy jy ek baie meer kan word maar uit oor deur",
    "eu": "eta da ere bat ez du dira dute hau hori zen baina edo izan egin behar beste oso gure bere zuen dela",
    "ca": "el la els les un una uns unes de del dels i a al als en per amb que com però més molt és són ha han hi ho se es seu seva aquest aquesta també quan",
    "en": "the a an of and in on at to for with from by that this these those is are was were be been being have has had it its they them their there which who what when where also more most very than into about would could should will can",
    "fr": "le la les un une des de du et à au aux en pour avec par que qui dans sur est sont été être avoir ont plus pas ne se ce cette ces son sa ses leur leurs mais comme aussi très",
    "es": "el la los las un una unos unas de del y a al en por para con que como pero más muy es son ha han se su sus este esta estos estas también cuando donde",
    "tl": "ang ng sa mga na at ay si ni kay para kung hindi may mayroon ito iyon siya sila kami tayo din rin lang lamang pa ba nang",
    "cy": "y yr a ac i o yn ar am gan gyda mae oedd bod fod ei eu ein hyn hynny hefyd ond neu fel wedi bydd sydd roedd",
    "fa": "و در به از که را با این آن است بود برای تا یا هم نیز هر یک های می شود شد کرد کند دارد",
}
WORD = re.compile(r"[\w’'-]+", re.U)


def vocab(code: str, sentence: str, k: int = 5) -> list[str]:
    stop = set(STOP.get(code, "").split())
    minlen = 3 if code == "fa" else 4
    seen, out = set(), []
    for i, w in enumerate(WORD.findall(sentence)):
        if i > 0 and w[:1].isupper():                     # a capital mid-sentence is usually a name: not reusable
            continue
        lw = w.lower().strip("'’-")
        if len(lw) < minlen or lw in stop or lw.isdigit() or lw in seen:
            continue
        seen.add(lw)
        out.append(w.strip("'’-"))
    return sorted(out, key=len, reverse=True)[:k]


def same_text(src: str, en: str) -> bool:
    """True when the 'translation' mostly repeats the source: the sentence was not in the target language."""
    a, b = [w.lower() for w in WORD.findall(src)], set(w.lower() for w in WORD.findall(en))
    return bool(a) and sum(w in b for w in a) / len(a) >= 0.6


def translate(code: str, sents: list[str], batch: int = 16) -> list[str]:
    from transformers import MarianMTModel, MarianTokenizer
    name = f"Helsinki-NLP/{MODELS[code]}"
    tok = MarianTokenizer.from_pretrained(name)
    model = MarianMTModel.from_pretrained(name)
    out = []
    for i in range(0, len(sents), batch):
        enc = tok(sents[i:i + batch], return_tensors="pt", padding=True, truncation=True, max_length=128)
        gen = model.generate(**enc, max_new_tokens=128, num_beams=2)
        out += tok.batch_decode(gen, skip_special_tokens=True)
        print(f"  {code}: {len(out)}/{len(sents)}", end="\r", flush=True)
    return out


def main() -> int:
    args = sys.argv[1:]
    n = int(args[args.index("--n") + 1]) if "--n" in args else 400
    codes = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] != "--n")]
    root = Path(__file__).resolve().parent.parent / "public/fineweb"
    for p in sorted(root.glob("*.json")):
        code = p.stem
        if codes and code not in codes:
            continue
        d = json.loads(p.read_text())
        rnd = random.Random(f"xblimps-{code}")             # a stable subset: rebuilding gives the same sentences
        pool = d["sentences"][:]
        rnd.shuffle(pool)
        pool = pool[:n]
        if code == "en":
            trans, model = [x["s"] for x in pool], None
        else:
            trans, model = translate(code, [x["s"] for x in pool]), f"Helsinki-NLP/{MODELS[code]}"
        kept = []
        for x, t in zip(pool, trans):
            t = (t or "").strip()
            chips = vocab(code, x["s"])
            if not t or len(chips) < 2:                      # untranslatable or too little vocabulary: drop it
                continue
            if code != "en" and same_text(x["s"], t):         # already English (FineWeb-2 subsets contain some): drop
                continue
            kept.append({"s": x["s"], "en": t if code != "en" else None, "vocab": chips, "url": x["url"]})
        d.update({"sentences": kept, "translation_model": model, "translated": code != "en"})
        p.write_text(json.dumps(d, ensure_ascii=False))
        print(f"{p}: {len(kept)} sentences with translation and vocabulary ({model or 'English, no translation'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
