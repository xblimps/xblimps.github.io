#!/usr/bin/env python3
"""Rebuild the SEEDED block of src/site/phenomena.ts from scripts/seed-data/<code>.json (label, family, note)."""
import json, re
from pathlib import Path
root = Path(__file__).resolve().parent.parent
langs = {}
for f in sorted((root / "scripts/seed-data").glob("*.json")):
    d = json.loads(f.read_text())
    langs[f.stem] = [{"label": p["label"], "family": p.get("family", ""), "note": (p.get("note") or "").strip()} for p in d["phenomena"]]
ts = root / "src/site/phenomena.ts"
src = ts.read_text()
block = "export const SEEDED: Record<string, Phenomenon[]> = " + json.dumps(langs, ensure_ascii=False, indent=1) + "\n"
src = re.sub(r"export const SEEDED: Record<string, Phenomenon\[\]> = .*?\n\n", block + "\n", src, flags=re.S)
ts.write_text(src)
print(f"{ts}: {', '.join(f'{k} {len(v)}' for k, v in langs.items())}")
