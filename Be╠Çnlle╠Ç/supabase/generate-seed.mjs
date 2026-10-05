// Generates supabase/seed.sql + supabase/setup.sql from the app's default data (src/data/*).
import { createServer } from 'vite'
import fs from 'fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const load = (p) => server.ssrLoadModule(p)
const content = await load('/src/data/content.js')
const { products, categories } = await load('/src/data/products.js')
const { settingsDefaults } = await load('/src/data/settings.js')
const { images } = await load('/src/data/images.js')

const q = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`
const j = (v) => `${q(JSON.stringify(v))}::jsonb`
const out = ['-- Seed data generated from src/data/*. Safe to re-run: existing rows are left untouched.\n']

out.push('insert into public.categories (id, label, position) values\n' + categories.map((c, i) => `  (${q(c.id)}, ${q(c.label)}, ${i})`).join(',\n') + '\non conflict (id) do nothing;\n')
out.push('insert into public.products (id, slug, name, subtitle, category, price, badge, rating, reviews, stock, image, gallery, status, featured, description, ingredients, size) values\n' +
  products.map((p) => `  (${q(p.id)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.subtitle)}, ${q(p.category)}, ${p.price}, ${q(p.badge || '')}, ${p.rating ?? 0}, ${p.reviews ?? 0}, ${p.stock ?? 0}, ${q(p.image)}, ${j(p.gallery || [p.image])}, ${q(p.status || 'active')}, ${!!p.featured}, ${q(p.description || '')}, ${j(p.ingredients || [])}, ${q(p.size || '')})`).join(',\n') +
  '\non conflict (id) do nothing;\n')

const docs = { sections: content.sections, hero: content.hero, manifesto: content.manifesto, collections: content.collections, menu: content.menu, about: content.about, routine: content.routine, navigation: content.navigation, copy: content.copy, brand: content.brand, trust: content.trust, testimonials: content.testimonials, settings: settingsDefaults }
out.push('insert into public.cms_documents (key, value) values\n' + Object.entries(docs).map(([k, v]) => `  (${q(k)}, ${j(v)})`).join(',\n') + '\non conflict (key) do nothing;\n')

out.push('insert into public.journal_posts (id, slug, title, excerpt, category, image, date, read_time, published, body) values\n' +
  content.journal.map((p) => `  (${q(p.id)}, ${q(p.slug)}, ${q(p.title)}, ${q(p.excerpt)}, ${q(p.category)}, ${q(p.image)}, ${q(p.date)}, ${p.readTime || 1}, true, ${j(p.body)})`).join(',\n') + '\non conflict (id) do nothing;\n')

const urls = [...new Set(Object.values(images))]
out.push('insert into public.media_assets (url) values\n' + urls.map((u) => `  (${q(u)})`).join(',\n') + '\non conflict (url) do nothing;\n')

fs.writeFileSync('supabase/seed.sql', out.join('\n'))
fs.writeFileSync('supabase/setup.sql', fs.readFileSync('supabase/schema.sql', 'utf8') + '\n' + out.join('\n'))
await server.close()
console.log('wrote supabase/seed.sql and supabase/setup.sql')
