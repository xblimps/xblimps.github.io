// HuggingFace Hub uploader for the Deno edge runtime (mirrors scripts/hf/hub.mjs).
//
// The token is read from the function's environment only (HF_TOKEN / HUGGINGFACE_TOKEN) — set it
// with `supabase secrets set HF_TOKEN=...`. Never hardcode it here.
import { createRepo, uploadFiles, whoAmI } from 'npm:@huggingface/hub@^1.1.2'

export function resolveToken(): string {
  return Deno.env.get('HF_TOKEN') || Deno.env.get('HUGGINGFACE_TOKEN') || ''
}

export function resolveOrg(): string {
  return Deno.env.get('HF_ORG') || 'xBLiMPs'
}

const toBlob = (content: unknown): Blob =>
  content instanceof Blob
    ? content
    : new Blob([typeof content === 'string' ? content : JSON.stringify(content)])

async function pushRepo(name: string, files: Record<string, unknown>, accessToken: string) {
  const repo = { type: 'dataset' as const, name }
  try {
    await createRepo({ repo, accessToken, private: true })
  } catch (err) {
    const msg = String((err as Error)?.message || err)
    if (!/already (created|exists)|conflict|409/i.test(msg)) throw err
  }
  const payload = Object.entries(files).map(([path, content]) => ({ path, content: toBlob(content) }))
  await uploadFiles({ repo, accessToken, files: payload, commitTitle: 'xBLiMPs sync — zero-loss backup' })
  return { name, files: payload.length }
}

export async function pushArtifacts(
  artifacts: Record<string, { files: Record<string, unknown> }>,
  { accessToken }: { accessToken?: string } = {},
) {
  const token = accessToken || resolveToken()
  let who: { name?: string } | null = null
  try { who = await whoAmI({ accessToken: token }) } catch { /* surfaced below if uploads fail */ }
  const results = []
  for (const [name, { files }] of Object.entries(artifacts)) {
    results.push(await pushRepo(name, files, token))
  }
  return { user: who?.name || null, results }
}
