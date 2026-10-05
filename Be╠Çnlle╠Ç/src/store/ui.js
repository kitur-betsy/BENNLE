import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let id = 0
export const useUI = create(persist((set) => ({
  theme: null, // null = follow system
  cartOpen: false,
  mobileNavOpen: false,
  searchOpen: false,
  toasts: [],
  toggleTheme: () => set(() => {
    const dark = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', dark)
    return { theme: dark ? 'dark' : 'light' }
  }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  notify: (message, type = 'success') => {
    const t = { id: ++id, message, type }
    set((s) => ({ toasts: [...s.toasts, t] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) })), 3000)
  },
  dismiss: (tid) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== tid) })),
}), { name: 'aure-ui', partialize: (s) => ({ theme: s.theme }) }))
