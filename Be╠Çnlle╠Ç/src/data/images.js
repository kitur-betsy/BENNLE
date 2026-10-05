// Self-hosted photos live in /public/images. Swap for a CDN base URL once assets move.
const path = (name) => `/images/${name}.jpg`

export const images = {
  hero: 'https://images.unsplash.com/photo-1543366749-4dad497ea0a0?w=1471&q=80',
  serum: path('serum'),
  cleanser: path('cleanser'),
  cream: path('cream'),
  radiance: path('radiance'),
  essence: path('essence'),
  oil: path('oil'),
  night: path('night'),
  hydrate: path('hydrate'),
  cleanse: path('cleanse'),
  renew: path('renew'),
  botanical: path('botanical'),
  nourish: path('nourish'),
  modelSerum: path('model-serum'),
  modelMask: path('model-mask'),
  leaf: path('leaf'),
  journalBarrier: path('journal-barrier'),
  journalNiacinamide: path('journal-niacinamide'),
  journalRoutine: path('journal-routine'),
  lifestyle1: path('lifestyle-1'),
  lifestyle2: path('lifestyle-2'),
  about: path('about'),
}
