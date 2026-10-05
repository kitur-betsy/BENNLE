import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cmsApi } from '../api/services'
import { settingsDefaults } from '../data/settings'

// Site-wide settings editable from the admin. `config/site.js` provides the defaults.
export const useSettings = create(persist((set) => ({
  ...settingsDefaults,
  apply: (values) => set(values),
  load: async () => { try { set(await cmsApi.get('settings')) } catch { /* keep cached values */ } },
}), { name: 'aure-settings' }))
