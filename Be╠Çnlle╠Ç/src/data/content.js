import { images } from './images'

export const collections = [
  { id: 'hydrate', title: 'Hydrate & Restore', blurb: 'Moisture-rich serums with hyaluronic acid', series: 'Essential Hydration Collection', image: images.hydrate, category: 'serums' },
  { id: 'cleanse', title: 'Cleanse & Purify', blurb: 'pH-balanced cleansers for sensitive skin', series: 'Gentle Care Collection', image: images.cleanse, category: 'cleansers' },
  { id: 'renew', title: 'Renew & Repair', blurb: 'Anti-aging actives with botanical support', series: 'Advanced Renewal Series', image: images.renew, category: 'serums' },
  { id: 'botanical', title: 'Botanical Blend', blurb: 'Nature-inspired actives for healthy glow', series: 'Natural Radiance Collection', image: images.botanical, category: 'oils' },
  { id: 'nourish', title: 'Nourish & Protect', blurb: 'Rich moisturizers with barrier protection', series: 'Barrier Repair Collection', image: images.nourish, category: 'moisturizers' },
]

export const menu = [
  { id: 'cleansers', title: 'Refresh: Cleansers', blurb: 'pH-balanced, non‑stripping', image: images.cleanser, category: 'cleansers' },
  { id: 'serums', title: 'Treat: Serums', blurb: 'Actives that respect your barrier', image: images.serum, category: 'serums' },
  { id: 'moisturizers', title: 'Nourish: Moisturizers', blurb: 'Ceramide-rich hydration', image: images.cream, category: 'moisturizers' },
]

export const manifesto = {
  lines: ['Refresh your skin,', 'love yourself,', 'renew your glow.'],
  images: [images.modelSerum, images.modelMask, images.leaf],
}

export const trust = [
  { icon: 'Leaf', title: 'Clinically proven botanicals', text: 'Every active is backed by independent clinical data.' },
  { icon: 'Recycle', title: 'Sustainably packaged', text: 'Recyclable glass and refillable pumps.' },
  { icon: 'ShieldCheck', title: 'Dermatologist tested', text: 'Gentle on even the most sensitive skin.' },
  { icon: 'Truck', title: 'Free shipping over KES 7,740', text: 'Carbon-neutral delivery worldwide.' },
]

export const journal = [
  { id: 'j1', slug: 'rebuild-a-stressed-skin-barrier', title: 'How to rebuild a stressed skin barrier', excerpt: 'Redness, tightness and stinging are often barrier signals, not skin types.', date: '2026-09-12', readTime: 6, category: 'Skin science', image: images.journalBarrier,
    body: ['Your skin barrier is a thin layer of lipids and cells that keeps moisture in and irritants out. When it is compromised, skin feels tight, looks red and reacts to products it used to tolerate.',
      'Start by simplifying. Pause exfoliating acids and strong actives for two weeks, and use a pH-balanced cleanser that does not leave skin squeaky.',
      'Then rebuild. Ceramides, cholesterol and fatty acids replace what is missing, while niacinamide supports the skin\'s own lipid production. Layer a serum under a rich moisturizer morning and night.',
      'Most people see calmer, more comfortable skin in about two weeks. Reintroduce actives one at a time, slowly.'] },
  { id: 'j2', slug: 'niacinamide-explained', title: 'Niacinamide, explained simply', excerpt: 'One of the most studied ingredients in skincare, and what it actually does.', date: '2026-08-28', readTime: 4, category: 'Ingredients', image: images.journalNiacinamide,
    body: ['Niacinamide is a form of vitamin B3. It is well tolerated, works for nearly every skin type and has clinical data behind it.',
      'At around 5% it helps regulate oil, soften the look of pores, calm redness and support the skin barrier.',
      'It pairs well with almost everything, including vitamin C, ceramides and hyaluronic acid. Use it once or twice daily after cleansing.'] },
  { id: 'j3', slug: 'slower-morning-routine', title: 'A slower morning routine in three steps', excerpt: 'Cleanse, treat, protect. Nothing more is needed.', date: '2026-08-05', readTime: 5, category: 'Routine', image: images.journalRoutine,
    body: ['A good routine is one you will actually do. Three steps are enough: cleanse, treat, nourish.',
      'Cleanse with lukewarm water and a gentle gel. Treat with a serum matched to your main concern. Finish with a moisturizer and sunscreen.',
      'Give it a month before judging results. Skin renews roughly every 28 days, so patience is part of the routine.'] },
]

export const testimonials = [
  { id: 't1', name: 'Amara O.', text: 'My skin has never felt calmer. The barrier serum is a staple.', rating: 5 },
  { id: 't2', name: 'Lena K.', text: 'Cloud Cleanser is the first cleanser that does not leave me tight.', rating: 5 },
  { id: 't3', name: 'Mateo R.', text: 'Simple, effective, and the packaging is gorgeous.', rating: 4 },
]

export const sections = [
  { id: 'hero', label: 'Hero banner', visible: true },
  { id: 'manifesto', label: 'Statement strip', visible: true },
  { id: 'collections', label: 'Collections', visible: true },
  { id: 'featured', label: 'Featured products', visible: true },
  { id: 'about', label: 'About / our story', visible: true },
  { id: 'routine', label: 'Routine steps', visible: true },
  { id: 'trust', label: 'Trust highlights', visible: true },
  { id: 'testimonials', label: 'Testimonials', visible: true },
  { id: 'journal', label: 'Journal preview', visible: true },
  { id: 'contact', label: 'Contact form', visible: true },
]

export const hero = {
  eyebrow: '',
  primaryLabel: 'Shop Now',
  primaryLink: '/shop',
  secondaryLabel: 'Learn More',
  secondaryLink: '/#about',
  image: images.hero,
  alt: 'Skincare model with dewy skin',
  title: 'Natural Skincare',
  text: 'Awaken your skin with gentle actives and nourishing oils. Formulated to restore barrier health and glow naturally.',
}

export const about = {
  eyebrow: 'Our story',
  title: 'Skincare that respects your skin',
  text: ['Benlle began with a simple question: why do effective formulas have to be harsh? We pair clinically proven botanicals with barrier-friendly actives, so skin gets stronger, calmer and clearer.',
    'Every formula is dermatologist tested, vegan, and packaged in recyclable glass.'],
  image: images.about,
  stats: [{ value: '98%', label: 'felt calmer skin in 2 weeks*' }, { value: '12', label: 'clinical studies' }, { value: '100%', label: 'recyclable packaging' }],
  note: '*Consumer study, 112 participants, 14 days.',
}

export const routine = {
  eyebrow: 'The routine',
  title: 'Three steps. Nothing more.',
  text: 'A good routine is one you will actually do. Skin renews roughly every 28 days, so give it a month.',
  steps: [
    { title: 'Cleanse', text: 'Lukewarm water and a gentle, pH-balanced gel. Skin should feel soft, never squeaky.', category: 'cleansers', cta: 'Shop cleansers' },
    { title: 'Treat', text: 'A serum matched to your main concern, whether that is barrier, hydration or glow.', category: 'serums', cta: 'Shop serums' },
    { title: 'Nourish', text: 'Finish with a rich moisturizer to seal everything in, and sunscreen by day.', category: 'moisturizers', cta: 'Shop moisturizers' },
  ],
}

// Editable from Admin → Homepage → Navigation / Headings / Brand.
export const navigation = [
  { label: 'Shop', to: '/shop', dropdown: false },
  { label: 'About', to: '/#about', dropdown: false },
  { label: 'Contact', to: '/#contact', dropdown: false },
  { label: 'Collections', to: '/#collections', dropdown: true },
  { label: 'Journal', to: '/journal', dropdown: false },
]

export const copy = {
  collectionsTitle: 'Explore collections',
  collectionsText: 'Targeted routines for every skin goal.',
  featuredTitle: 'Featured products',
  featuredText: 'Thoughtful formulas, consciously packaged.',
  journalTitle: 'From the journal',
  contactTitle: 'Get in touch',
  contactText: 'Questions about a product or your routine? Our skin advisors reply within a day.',
  newsletterTitle: 'Stay in the glow',
  newsletterText: 'Routines, launches and 10% off your first order.',
}

export const brand = { accent: '#10b981' }
