import { createClient } from '@supabase/supabase-js'
import { supabaseConfigured, supabaseKey, supabaseUrl } from '../config/env'

// One shared client (absent in offline demo mode). Sessions (access + refresh tokens) are stored by supabase-js and refreshed automatically.
export const supabase = supabaseConfigured && import.meta.env.VITE_USE_MOCK !== 'true'
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'aure-supabase-session' } })
  : null

// Table / function not created yet (setup.sql not run).
export const isMissingSchema = (e) => ['PGRST205', 'PGRST202', '42P01', '42883'].includes(e?.code)

const friendly = {
  '42501': 'You do not have permission to do that. Please sign in again.',
  PGRST301: 'Your session has expired. Please sign in again.',
  '23505': 'That already exists.',
  '23514': 'Some of the values are not allowed.',
}

// Throws a plain Error (with .code) so UI code only ever deals with messages.
export async function run(query) {
  const { data, error } = await query
  if (error) throw Object.assign(new Error(friendly[error.code] || error.message || 'Something went wrong'), { code: error.code })
  return data
}
