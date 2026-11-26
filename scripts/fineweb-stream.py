#!/usr/bin/env python3
"""
fineweb-stream.py: fallback for scripts/fineweb-sample.mjs when the Hugging Face datasets API is too busy for a subset
(it often is for the largest, e.g. Spanish). It streams documents directly from the dataset's parquet files with a
shuffle buffer, applies the same sentence filters, and writes the same public/fineweb/<code>.json format. Then run
scripts/translate-pools.py as usual.

  pip install datasets
  python3 scripts/fineweb-stream.py es tl cy fa --n 1500
"""
from __future__ import annotations
import json, re, sys, datetime
from pathlib import Path

SOURCES = {"af": ("HuggingFaceFW/fineweb-2", "afr_Latn"), "eu": ("HuggingFaceFW/fineweb-2", "eus_Latn"),
           "ca": ("HuggingFaceFW/fineweb-2", "cat_Latn"), "en": ("HuggingFaceFW/fineweb", "sample-10BT"),
           "fr": ("HuggingFaceFW/fineweb-2", "fra_Latn"), "fa": ("HuggingFaceFW/fineweb-2", "pes_Arab"),
           "es": ("HuggingFaceFW/fineweb-2", "spa_Latn"), "tl": ("HuggingFaceFW/fineweb-2", "fil_Latn"),
           "cy": ("HuggingFaceFW/fineweb-2", "cym_Latn")}

# identical to fineweb-sample.mjs
SPLIT = re.compile(r"(?<=[.!?؟।])\s+(?=[A-ZÀ-ÖØ-ÞĀ-Ž؀-ۿ\"«“¿¡])")
SPAM = re.compile(r"\b(dating|casino|porn|sex|xxx|escort|viagra|cialis|loan|bitcoin|crypto|forex|betting|bet365|slot machine|onlyfans|webcam|18\+|cbd)\b", re.I)


def sentences(text: str):
    for para in re.split(r"\n+", text):
        for s in SPLIT.split(para):
            yield re.sub(r"\s+", " ", s.strip())


def keep(s: str) -> bool:
    words = s.split(" ")
    if s[:1].islower() or SPAM.search(s):
        return False
    if len(words) < 5 or len(words) > 28:
        return False
    if re.search(r"https?:|www\.|@|\d{4,}|\|", s):
        return False
    letters = sum(ch.isalpha() for ch in s)
    return letters / max(1, len(s)) >= 0.7 and s[-1:] in ".!?؟"


def build(code: str, n: int) -> None:
    from datasets import load_dataset
    dataset, config = SOURCES[code]
    ds = load_dataset(dataset, name=config, split="train", streaming=True).shuffle(seed=26, buffer_size=5000)
    out, seen = [], set()
    for doc in ds:
        per_page = 0
        for s in sentences(doc["text"]):
            if per_page >= 3 or s in seen or not keep(s):
                continue
            seen.add(s)
            out.append({"s": s, "url": doc.get("url", "")})
            per_page += 1
        print(f"  {code}: {len(out)}/{n}", end="\r", flush=True)
        if len(out) >= n:
            break
    p = Path(__file__).resolve().parent.parent / f"public/fineweb/{code}.json"
    p.write_text(json.dumps({"code": code, "dataset": dataset, "config": config, "licence": "ODC-By 1.0",
                             "built": datetime.date.today().isoformat(), "method": "stream+shuffle(buffer=5000)",
                             "sentences": out[:n]}, ensure_ascii=False))
    print(f"{p}: {min(len(out), n)} sentences")


if __name__ == "__main__":
    a = sys.argv[1:]
    n = int(a[a.index("--n") + 1]) if "--n" in a else 1500
    for c in [x for i, x in enumerate(a) if not x.startswith("--") and (i == 0 or a[i - 1] != "--n")]:
        build(c, n)
