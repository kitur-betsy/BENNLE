import { create } from 'zustand'

// Flips to `missing` the first time a request finds the Supabase tables absent (setup.sql not run yet).
export const useDb = create((set) => ({ missing: false, setMissing: () => set({ missing: true }) }))
