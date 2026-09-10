// One-shot admin provisioning of the expert accounts.
//
// Institutional (@cam.ac.uk) mail servers routinely quarantine Firebase's default magic-link
// emails, so instead of relying on email delivery we create password accounts centrally and
// hand the experts a temporary password (they log in via the password field on the login page).
//
// Uses the Firebase CLI's OAuth token (cloud-platform scope) against the Identity Toolkit + the
// Firestore REST APIs, so no service-account key file is needed. Run once:
//   node scripts/provision-experts.mjs
// Idempotent: re-running resets the password + profile for existing users rather than erroring.

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const PROJECT_ID = 'xblimps-cd802'
const TOKEN_FILE = join(homedir(), '.config', 'configstore', 'firebase-tools.json')
const TOKEN = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')).tokens?.access_token
if (!TOKEN) { console.error('No Firebase CLI access token — run `npx firebase-tools login`.'); process.exit(1) }

const IDTK = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${url.split('/').pop()} ${r.status}: ${JSON.stringify(j)}`)
  return j
}

async function lookupUid(email) {
  const j = await post(`${IDTK}/accounts:lookup`, { email: [email] })
  return j.users?.[0]?.localId ?? null
}

async function upsertUser(email, password) {
  const uid = await lookupUid(email)
  if (uid) {
    await post(`${IDTK}/accounts:update`, { localId: uid, password, emailVerified: true })
    return { uid, created: false }
  }
  const j = await post(`${IDTK}/accounts`, { email, password, emailVerified: true, displayName: email.split('@')[0] })
  return { uid: j.localId, created: true }
}

// PATCH replaces the profile doc with these typed fields.
async function setProfile(uid, { email, name, role, apps }) {
  const body = {
    fields: {
      email: { stringValue: email },
      name: { stringValue: name },
      role: { stringValue: role },
      languages: { arrayValue: { values: [] } },
      apps: { arrayValue: { values: apps.map((a) => ({ stringValue: a })) } },
      state: { stringValue: 'active' },
      created_at: { stringValue: new Date().toISOString() },
    },
  }
  const r = await fetch(`${FS}/profiles/${uid}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`profiles/${uid} ${r.status}: ${await r.text()}`)
}

// sas245 is an admin email → coordinator with CHILDES; the rest are xBLiMPs leads.
const EXPERTS = [
  { email: 'sas245@cam.ac.uk', role: 'coordinator', apps: ['xblimps', 'childes'] },
  { email: 'apc38@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'pjb48@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'samtb23@gmail.com', role: 'lead', apps: ['xblimps'] },
  { email: 'nb611@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'im562@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'ac2630@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'catherine.arnett@gmail.com', role: 'lead', apps: ['xblimps'] },
  { email: 'lg684@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'ao514@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
  { email: 'lgb35@cam.ac.uk', role: 'lead', apps: ['xblimps'] },
]

const tempPassword = () => `xBLiMPs-${randomBytes(3).toString('hex')}`

const results = []
for (const { email, role, apps } of EXPERTS) {
  const addr = email.trim().toLowerCase()
  const password = tempPassword()
  try {
    const { uid, created } = await upsertUser(addr, password)
    await setProfile(uid, { email: addr, name: addr.split('@')[0], role, apps })
    results.push({ email: addr, role, apps: apps.join('+'), password, status: created ? 'created' : 'updated' })
  } catch (e) {
    results.push({ email: addr, role, apps: apps.join('+'), password: '—', status: `ERROR: ${e.message}` })
  }
}

console.log('\n  email                            role         access          temp password    status')
console.log('  ' + '-'.repeat(96))
for (const r of results) {
  console.log(`  ${r.email.padEnd(32)} ${r.role.padEnd(12)} ${r.apps.padEnd(15)} ${r.password.padEnd(16)} ${r.status}`)
}
console.log(`\n  ${results.filter((r) => !r.status.startsWith('ERROR')).length}/${results.length} provisioned. Share each temp password with its owner; they sign in via the`)
console.log('  password field at https://xblimps.github.io/ (email delivery not required).\n')
