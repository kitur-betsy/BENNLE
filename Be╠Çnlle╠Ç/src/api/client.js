import { site } from '../config/site'
import { isMissingSchema } from './supabase'
import { useDb } from '../store/db'

// Mock transport: resolves after a short delay (offline demo mode).
export const mock = (data, ms = 350) => new Promise((res) => setTimeout(() => res(structuredClone(data)), ms))

// Services call `request(real, fallback)`. `real` talks to Supabase; `fallback` is the offline demo path.
// If the database tables have not been created yet, the demo path is used and the admin shows a banner.
export const request = async (real, fallback) => {
  if (site.api.useMock) return fallback()
  try { return await real() } catch (e) {
    if (isMissingSchema(e)) { useDb.getState().setMissing(); return fallback() }
    throw e
  }
}
