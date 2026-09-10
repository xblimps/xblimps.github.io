// Firebase client. The app runs in one of two modes:
//   - cloud: VITE_FIREBASE_* env are set → real Firebase Auth + Firestore.
//   - demo:  no env → local-first seed in localStorage (preview without a backend).
//
// This replaces the former Supabase client. The web config values below are NOT secret
// (Firebase intends them to ship in the client bundle); access is gated by Firestore
// security rules + Firebase Auth, not by hiding these keys.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const isCloud = Boolean(cfg.apiKey && cfg.projectId)

const app: FirebaseApp | null = isCloud ? initializeApp(cfg as Record<string, string>) : null
export const auth: Auth | null = app ? getAuth(app) : null
// ignoreUndefinedProperties: our record blobs carry optional fields that may be undefined;
// Firestore rejects undefined by default, so drop them silently (mirrors jsonb's tolerance).
export const fdb: Firestore | null = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null

// Absolute URL for the HF-backup endpoint. Firebase Cloud Functions require the paid Blaze
// plan, so the HF token (a server-only secret) lives in a separate free serverless function
// (e.g. a Cloudflare Worker) whose URL is provided here. Unset → backup is disabled.
export const hfSyncUrl = (import.meta.env.VITE_HF_SYNC_URL as string | undefined) || ''
