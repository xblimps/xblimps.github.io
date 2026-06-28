export const uid = (): string =>
  (crypto.randomUUID?.() ??
    'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36))

export const now = (): string => new Date().toISOString()
