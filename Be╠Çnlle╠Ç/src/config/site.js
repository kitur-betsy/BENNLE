import { supabaseConfigured } from './env'

// Brand + store settings. Swap these to rebrand the whole app.
export const site = {
  name: 'Benlle',
  tagline: 'Botanical · Clinical · Kind',
  description: 'Natural skincare crafted with clinically proven botanicals. Gentle, effective, and sustainable.',
  currency: { code: 'KES', locale: 'en-KE' },
  freeShippingThreshold: 7740,
  shippingFlat: 774,
  announcements: ['Free shipping on orders over KES 7,740', 'New: Barrier Repair Serum 2.0 is here'],
  nav: [
    { label: 'Shop', to: '/shop' },
    { label: 'About', to: '/#about' },
    { label: 'Contact', to: '/#contact' },
    { label: 'Collections', to: '/#collections', dropdown: true },
    { label: 'Journal', to: '/journal' },
  ],
  contact: { email: 'hello@benlle.example', phone: '+1 (555) 010-2030' },
  // Data comes from Supabase when configured; otherwise the app runs on offline demo data.
  api: { useMock: !supabaseConfigured || import.meta.env.VITE_USE_MOCK === 'true' },
}
