// One record per project language: the data behind the language cards and each language's contribution workspace
// lexical-generator page (#/generator/<code>), where it recruits people in every role ("You can be…"). Leads and the central team update this file (and only this file) when a
// lead, a channel or a status changes; the pages render from it.
//
// Lead names and contact routes are published only once the lead has agreed. Until then `lead` is null and the
// page shows a visible [CONFIRM] marker, the site's convention for anything not yet settled. Never put personal
// e-mail addresses here without the person's agreement; the default route is Slack (#cls-xblimps) or the
// central team.

export type LangStatus = 'active' | 'phase-2'

export interface Lead {
  name: string
  role?: string            // e.g. "Language lead", "Co-lead"
  contact?: string         // what the lead agreed to publish: a Slack channel, a project address, a form
}

export interface Language {
  code: string             // ISO 639-1, also the file name of the inspiration pool (public/fineweb/<code>.json)
  name: string
  native: string           // the language's own name, as its speakers write it
  flag: string             // public/flags/<flag>.svg (flag-icons, MIT): a visual cue only; a language is not a country
  script: 'Latin' | 'Arabic'
  dir?: 'rtl'
  status: LangStatus
  leads: Lead[] | null     // Layer 1, scientific owner(s); null = not confirmed for publication yet
  coordinator?: Lead | null // Layer 2, native-speaker community coordinator; absent = recruiting
  channel?: string         // per-language Slack channel, when one exists
  notes?: string[]         // language-specific guidance from the lead (short, plain language)
}

export const LANGUAGE_DATA: Language[] = [
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', flag: 'za', script: 'Latin', status: 'active', leads: null, channel: '#xblimps-afrikaans' },
  { code: 'eu', name: 'Basque', native: 'Euskara', flag: 'es-pv', script: 'Latin', status: 'phase-2', leads: null,
    notes: ['Basque joins in phase 2 of the project. If you would like to lead or contribute, get in touch with the central team.'] },
  { code: 'ca', name: 'Catalan', native: 'Català', flag: 'es-ct', script: 'Latin', status: 'active', leads: null },
  { code: 'en', name: 'English', native: 'English', flag: 'gb', script: 'Latin', status: 'active', leads: null },
  { code: 'fr', name: 'French', native: 'Français', flag: 'fr', script: 'Latin', status: 'active', leads: null,
    notes: ['Do not type a full stop at the end of a sentence: the generator adds it to every ✓ / ✗ sentence.'] },
  { code: 'fa', name: 'Persian', native: 'فارسی', flag: 'ir', script: 'Arabic', dir: 'rtl', status: 'active', leads: null },
  { code: 'es', name: 'Spanish', native: 'Español', flag: 'es', script: 'Latin', status: 'active', leads: null },
  { code: 'tl', name: 'Tagalog', native: 'Tagalog', flag: 'ph', script: 'Latin', status: 'active', leads: null },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg', flag: 'gb-wls', script: 'Latin', status: 'active', leads: null },
]

export const byCode = (code: string) => LANGUAGE_DATA.find((l) => l.code === code)

/** Where every contributor can always ask: the project channel and the central team (published in the lead deck). */
export const CENTRAL_CONTACT = { slack: '#cls-xblimps', email: 'sas245@cam.ac.uk', team: 'Suchir Salhan, Catherine Arnett, Lily Goulder, Aoife O’Driscoll (University of Cambridge)' }
