// Mock persistence: a tiny localStorage-backed key/value store used only when VITE_USE_MOCK is on.
// A real backend replaces every call site in services.js, so nothing else depends on this file.
const PREFIX = 'aure-cms-'

export const load = (key, seed) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? structuredClone(seed) : JSON.parse(raw)
  } catch { return structuredClone(seed) }
}

export const save = (key, value) => {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) }
  catch { throw new Error('Browser storage is full. Remove some uploaded images and try again.') }
  return value
}
