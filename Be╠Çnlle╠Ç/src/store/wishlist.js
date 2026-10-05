import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { activityApi } from '../api/services'

export const useWishlist = create(persist((set, get) => ({
  ids: [],
  has: (id) => get().ids.includes(id),
  toggle: (id) => {
    activityApi.track(get().ids.includes(id) ? 'wishlist_remove' : 'wishlist_add', id)
    set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] }))
  },
}), { name: 'aure-wishlist' }))
