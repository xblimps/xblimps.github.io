// HuggingFace Hub token resolution + uploader (server-side only — NEVER import from src/, or the
// token would be bundled into the public SPA and exposed to every visitor).
//
// The token is read from the environment only (HF_TOKEN, or HUGGINGFACE_TOKEN). Never hardcode a
// token here — it would be committed to git history and exposed. Set HF_TOKEN in your shell and in
// the Vercel project env. Create/rotate tokens at https://huggingface.co/settings/tokens.

import { createRepo, uploadFiles, whoAmI } from '@huggingface/hub'

export function resolveToken() {
  return process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || ''
}

export function resolveOrg() {
  return process.env.HF_ORG || 'xBLiMPs'
}

const toBlob = (content) =>
  content instanceof Blob ? content : new Blob([typeof content === 'string' ? content : JSON.stringify(content)])

// Push one dataset repo: create it private if missing, then upload every file (overwrites).
async function pushRepo(name, files, accessToken) {
  const repo = { type: 'dataset', name }
  try {
    await createRepo({ repo, accessToken, private: true })
  } catch (err) {
    const msg = String(err?.message || err)
    // Already exists → fine, we'll just upload into it. Anything else is fatal.
    if (!/already (created|exists)|conflict|409/i.test(msg)) throw err
  }
  const payload = Object.entries(files).map(([path, content]) => ({ path, content: toBlob(content) }))
  await uploadFiles({ repo, accessToken, files: payload, commitTitle: 'xBLiMPs sync — zero-loss backup' })
  return { name, files: payload.length }
}

// Push every artifact repo. Returns a per-repo result summary. Throws on the first hard failure so
// callers surface it (a silent partial backup would defeat the no-loss guarantee).
export async function pushArtifacts(artifacts, { accessToken } = {}) {
  const token = accessToken || resolveToken()
  let who = null
  try { who = await whoAmI({ accessToken: token }) } catch { /* surfaced below if uploads fail */ }
  const results = []
  for (const [name, { files }] of Object.entries(artifacts)) {
    results.push(await pushRepo(name, files, token))
  }
  return { user: who?.name || null, results }
}
