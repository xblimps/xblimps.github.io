// Cloudflare Worker: back up a posted DB snapshot to private HuggingFace datasets.
//
// This is the free-tier home for the HF backup that used to be a Vercel serverless function
// (Firebase Cloud Functions require the paid Blaze plan). The HF write token lives here as a
// Worker secret — never in the SPA bundle. A signed-in Firebase user is required: we verify
// the caller's Firebase ID token before writing to the org.
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { createRepo, uploadFiles, whoAmI } from '@huggingface/hub'
// @ts-ignore — pure plain-JS payload builder shared with the CLI (scripts/hf-sync.ts)
import { buildArtifacts } from '../../scripts/hf/payload.mjs'

interface Env {
  HF_TOKEN: string
  HF_ORG?: string
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGIN?: string
}

// Firebase ID tokens are RS256, signed by Google's securetoken service. This JWKS endpoint
// serves the rotating public keys; jose caches them across requests.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

const cors = (env: Env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

const json = (body: unknown, status: number, env: Env) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(env), 'Content-Type': 'application/json' },
  })

const toBlob = (content: unknown): Blob =>
  content instanceof Blob ? content : new Blob([typeof content === 'string' ? content : JSON.stringify(content)])

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

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(env) })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, env)
    if (!env.HF_TOKEN) return json({ error: 'Server not configured (missing HF_TOKEN)' }, 500, env)

    // require a valid signed-in Firebase user
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Not authenticated' }, 401, env)
    try {
      await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
        audience: env.FIREBASE_PROJECT_ID,
      })
    } catch {
      return json({ error: 'Invalid session' }, 401, env)
    }

    const body: any = await req.json().catch(() => ({}))
    const db = body.db ?? body
    if (!db || typeof db !== 'object') return json({ error: 'Missing db snapshot' }, 400, env)

    try {
      const stamp = new Date().toISOString()
      const org = env.HF_ORG || 'xBLiMPs'
      const { artifacts, counts } = buildArtifacts(db, { stamp, org })
      let who: { name?: string } | null = null
      try { who = await whoAmI({ accessToken: env.HF_TOKEN }) } catch { /* surfaced if uploads fail */ }
      const results = []
      for (const [name, { files }] of Object.entries(artifacts) as [string, { files: Record<string, unknown> }][]) {
        results.push(await pushRepo(name, files, env.HF_TOKEN))
      }
      return json(
        { ok: true, user: who?.name || null, counts, datasets: results.map((r) => r.name), generated_at: stamp },
        200, env,
      )
    } catch (err) {
      return json({ error: (err as Error)?.message || String(err) }, 500, env)
    }
  },
}
