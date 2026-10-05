import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../api/supabase'

// UI mirror of the Supabase session. The real tokens are held (and refreshed) by supabase-js; `token` is the
// current access token. Authorization is enforced by the database (row-level security), not by this store.
export const useAuth = create(persist((set) => ({
  user: null,
  token: null,
  expired: false, // true when a session ended on its own (refresh failed or token revoked)
  setSession: ({ user, token }) => set({ user, token, expired: false }),
  setToken: (token) => set({ token }),
  expire: () => set({ user: null, token: null, expired: true }),
  clearExpired: () => set({ expired: false }),
  logout: () => { supabase?.auth.signOut().catch(() => {}); set({ user: null, token: null, expired: false }) },
}), { name: 'aure-auth', partialize: (s) => ({ user: s.user, token: s.token }) }))
