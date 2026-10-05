// Supabase credentials come from .env.local (VITE_* or NEXT_PUBLIC_* names are both accepted).
const env = import.meta.env
export const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey)
