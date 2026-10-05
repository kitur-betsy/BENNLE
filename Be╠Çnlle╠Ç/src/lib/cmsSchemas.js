import { z } from 'zod'

const text = (min = 1, msg = 'Required') => z.string().trim().min(min, msg)
const optional = z.string().optional()

export const sectionsSchema = z.object({ items: z.array(z.object({ id: z.string(), label: z.string(), visible: z.boolean() })) })

export const heroSchema = z.object({
  eyebrow: optional, alt: optional,
  title: text(2), text: text(5),
  image: text(1, 'Choose an image'),
  primaryLabel: text(), primaryLink: text(), secondaryLabel: text(), secondaryLink: text(),
})

export const manifestoSchema = z.object({ lines: z.array(text()).length(3), images: z.array(text(1, 'Choose an image')).length(3) })

export const collectionsSchema = z.object({ items: z.array(z.object({
  id: optional, title: text(2), blurb: text(2), series: optional, image: text(1, 'Choose an image'), category: text(),
})).min(1, 'Keep at least one collection') })

export const aboutSchema = z.object({
  eyebrow: optional, title: text(2), image: text(1, 'Choose an image'), note: optional,
  text: z.array(text()).min(1, 'Add at least one paragraph'),
  stats: z.array(z.object({ value: text(), label: text() })),
})

export const trustSchema = z.object({ items: z.array(z.object({ icon: text(), title: text(2), text: text(2) })) })

export const testimonialsSchema = z.object({ items: z.array(z.object({
  id: optional, name: text(2), text: text(5), rating: z.coerce.number().int().min(1).max(5),
})) })

export const categoriesSchema = z.object({ items: z.array(z.object({ id: optional, label: text(2) })).min(1, 'Keep at least one category') })

export const settingsSchema = z.object({
  name: text(2), tagline: text(2), description: text(10),
  announcements: z.array(z.string()),
  freeShippingThreshold: z.coerce.number().min(0, 'Cannot be negative'),
  shippingFlat: z.coerce.number().min(0, 'Cannot be negative'),
  contact: z.object({ email: z.string().email('Enter a valid email'), phone: optional }),
})

export const journalSchema = z.object({
  id: optional, title: text(3), slug: optional, category: text(), excerpt: optional,
  image: text(1, 'Choose an image'), date: text(1, 'Pick a date'),
  readTime: z.union([z.literal(''), z.coerce.number().min(1)]).optional(),
  published: z.boolean(),
  body: z.array(z.string()).refine((a) => a.some((p) => p.trim()), 'Write at least one paragraph'),
})

export const adminProductSchema = z.object({
  name: text(2), subtitle: text(2), category: text(),
  price: z.coerce.number().positive('Must be positive'), stock: z.coerce.number().int().min(0, 'Cannot be negative'),
  status: z.enum(['active', 'draft']), featured: z.boolean(),
  badge: optional, size: optional, description: optional, image: optional,
  ingredients: z.array(z.string()),
})

export const routineSchema = z.object({
  eyebrow: optional, title: text(2), text: text(5),
  steps: z.array(z.object({ title: text(2), text: text(5), category: text(), cta: text() })).min(1, 'Keep at least one step').max(5, 'Five steps at most'),
})

const link = z.string().trim().min(1, 'Required').refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Start with / or https://')
export const navigationSchema = z.object({ items: z.array(z.object({ label: text(1), to: link, dropdown: z.boolean().optional() })).min(1, 'Keep at least one link').max(8, 'Eight links at most') })

export const copySchema = z.object({
  collectionsTitle: text(2), collectionsText: optional, featuredTitle: text(2), featuredText: optional,
  journalTitle: text(2), contactTitle: text(2), contactText: optional, newsletterTitle: text(2), newsletterText: optional,
})

export const brandSchema = z.object({ accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit colour like #10b981') })
