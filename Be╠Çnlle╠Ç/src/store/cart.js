import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSettings } from './settings'
import { activityApi } from '../api/services'

export const useCart = create(persist((set, get) => ({
  items: [], // { id, slug, name, price, image, qty }
  add: (p, qty = 1) => { activityApi.track('add_to_cart', p.id, Math.min(Math.max(1, qty), 99)); return set((s) => {
    const found = s.items.find((i) => i.id === p.id)
    const stock = p.stock ?? Infinity
    if (found) return { items: s.items.map((i) => (i.id === p.id ? { ...i, qty: Math.min(i.qty + qty, stock) } : i)) }
    return { items: [...s.items, { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, stock, qty: Math.min(qty, stock) }] }
  }) },
  setQty: (id, qty) => set((s) => ({ items: qty <= 0 ? s.items.filter((i) => i.id !== id) : s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, i.stock ?? Infinity) } : i)) })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((n, i) => n + i.qty, 0),
  subtotal: () => get().items.reduce((n, i) => n + i.qty * i.price, 0),
  shipping: () => {
    const { freeShippingThreshold, shippingFlat } = useSettings.getState()
    const sub = get().subtotal()
    return sub === 0 || sub >= freeShippingThreshold ? 0 : shippingFlat
  },
  total: () => get().subtotal() + get().shipping(),
}), { name: 'aure-cart' }))
