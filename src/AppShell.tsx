// The annotation platform (sign-in + modules), loaded on demand from main.tsx so the public
// generator / instructions pages do not pull in Firebase.
import React from 'react'
import App from './App'
import { AppProvider } from './state/AppContext'

export default function AppShell() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
