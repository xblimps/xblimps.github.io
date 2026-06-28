# HuggingFace backup (zero information loss)

Mirrors the whole xBLiMPs dataset — every language's templates, minimal pairs, phenomena,
sources, workspaces/notes/tasks, and the append-only audit ledger — to **private** datasets
under the [xBLiMPs org](https://huggingface.co/xBLiMPs). Nothing is dropped: the snapshot repo
carries every entity verbatim; the other two are convenience views.

| Dataset | Contents |
| --- | --- |
| `xBLiMPs/xblimps-snapshot` | `snapshot.json` (everything) + one `<entity>.jsonl` per collection, incl. `ops`/`audit` ledgers |
| `xBLiMPs/xblimps-templates` | `templates.jsonl` |
| `xBLiMPs/xblimps-minimal-pairs` | `minimal_pairs.jsonl` |

## Two ways to run it

**1. In-app button — captures live, browser-only edits.**
Open any language workspace → **Export** tab → **Back up everything to HuggingFace → Back up now**.
The browser posts the full in-memory DB to `/api/hf-sync`, which holds the token server-side and
pushes. This is the only path that captures demo-mode data (which lives only in `localStorage`).

**2. CLI — headless / CI.**
```bash
npm run hf:sync            # source data automatically, push private datasets
npm run hf:sync -- --dry   # build + report, push nothing
npm run hf:sync -- --file snapshot.json   # push an exported snapshot
```
Data source precedence: `--file` → Supabase (`SUPABASE_URL` + a key) → the local seed inventory.

## Token & security

Precedence: **`HF_TOKEN` env var**, then a hardcoded fallback in [`scripts/hf/hub.mjs`](../scripts/hf/hub.mjs).
The token is server-only — it is **never** imported into `src/`, so it is not in the public SPA bundle.

> ⚠ The hardcoded fallback token is a liability (it sits in source/git history). Set `HF_TOKEN`
> in the environment (Vercel env var + local `.env`) and **rotate** the fallback at
> <https://huggingface.co/settings/tokens>.

## Files

- [`scripts/hf/payload.mjs`](../scripts/hf/payload.mjs) — pure DB → file-set builder (the no-loss mapping; one source of truth)
- [`scripts/hf/hub.mjs`](../scripts/hf/hub.mjs) — token resolution + uploader (`@huggingface/hub`, all repos `private: true`)
- [`scripts/hf-sync.ts`](../scripts/hf-sync.ts) — CLI
- [`api/hf-sync.ts`](../api/hf-sync.ts) — serverless endpoint (holds the token)
- [`src/lib/hf.ts`](../src/lib/hf.ts) — client trigger (no token)
