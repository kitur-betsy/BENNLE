import { mock, request } from './client'
import { load, save } from './persist'
import { supabase, run } from './supabase'
import { products as seedProducts, categories as seedCategories } from '../data/products'
import { hero, menu, about, collections, journal as seedJournal, testimonials, trust, manifesto, sections, routine, navigation, copy, brand } from '../data/content'
import { settingsDefaults } from '../data/settings'
import { orders, adminUser, seedMessages, seedSubscribers } from '../data/admin'

// Every function below has two paths: `request(real, fallback)`.
//  - real:     Supabase (the database, auth and storage configured in .env.local)
//  - fallback: offline demo data in localStorage, used when Supabase is not configured or setup.sql has not been run
// Pages never see the difference; the returned shapes are identical.

const readProducts = () => load('products', seedProducts)
const readCategories = () => load('categories', seedCategories)
const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const origin = () => (typeof window === 'undefined' ? '' : window.location.origin)

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

const productColumns = ['name', 'subtitle', 'category', 'price', 'stock', 'status', 'featured', 'badge', 'size', 'description', 'image', 'ingredients', 'gallery', 'rating', 'reviews']
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]))
const cleanSearch = (s) => s.replace(/[,()%*\\]/g, ' ').trim()

export const productsApi = {
  list: (params = {}) => request(async () => {
    let q = supabase.from('products').select('*')
    if (!params.includeDrafts) q = q.eq('status', 'active')
    if (params.category) q = q.eq('category', params.category)
    const s = params.q ? cleanSearch(params.q) : ''
    if (s) q = q.or(`name.ilike.%${s}%,subtitle.ilike.%${s}%`)
    if (params.sort === 'price-asc') q = q.order('price', { ascending: true })
    if (params.sort === 'price-desc') q = q.order('price', { ascending: false })
    if (params.sort === 'rating') q = q.order('rating', { ascending: false })
    // Chosen sort first, then the catalogue order as a stable tie-breaker.
    return run(q.order('position'))
  }, () => {
    let r = readProducts().filter((p) => params.includeDrafts || p.status === 'active')
    if (params.category) r = r.filter((p) => p.category === params.category)
    if (params.q) r = r.filter((p) => `${p.name} ${p.subtitle}`.toLowerCase().includes(params.q.toLowerCase()))
    const sorts = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating }
    if (sorts[params.sort]) r.sort(sorts[params.sort])
    return mock(r)
  }),
  bySlug: (slug) => request(async () => {
    const p = await run(supabase.from('products').select('*').eq('slug', slug).maybeSingle())
    if (!p) throw new Error('Product not found')
    return p
  }, () => {
    const p = readProducts().find((x) => x.slug === slug)
    return p ? mock(p) : Promise.reject(new Error('Product not found'))
  }),
  categories: () => request(
    () => run(supabase.from('categories').select('id,label').order('position')),
    () => mock(readCategories(), 0),
  ),
  saveCategories: (list) => request(async () => {
    const rows = list.map((c, position) => ({ id: c.id || slugify(c.label), label: c.label, position }))
    const existing = await run(supabase.from('categories').select('id'))
    const gone = existing.map((c) => c.id).filter((id) => !rows.some((r) => r.id === id))
    if (gone.length) await run(supabase.from('categories').delete().in('id', gone))
    await run(supabase.from('categories').upsert(rows))
    return rows.map(({ id, label }) => ({ id, label }))
  }, () => mock(save('categories', list.map((c) => ({ id: c.id || slugify(c.label), label: c.label }))), 100)),
  save: (data) => request(async () => {
    if (data.id) {
      const patch = pick(data, productColumns)
      if (data.image) {
        const cur = await run(supabase.from('products').select('gallery').eq('id', data.id).single())
        patch.gallery = [data.image, ...(cur.gallery || []).slice(1)]
      }
      return run(supabase.from('products').update(patch).eq('id', data.id).select().single())
    }
    const base = slugify(data.name)
    const taken = (await run(supabase.from('products').select('slug').like('slug', `${base}%`))).map((r) => r.slug)
    let slug = base
    for (let n = 2; taken.includes(slug); n += 1) slug = `${base}-${n}`
    const first = data.image || (await run(supabase.from('products').select('image').order('position').limit(1)))[0]?.image || ''
    const row = { rating: 0, reviews: 0, ingredients: [], description: '', size: '', ...pick(data, productColumns), image: first, gallery: [first], id: `p${Date.now()}`, slug }
    return run(supabase.from('products').insert(row).select().single())
  }, () => {
    const list = readProducts()
    const i = list.findIndex((p) => p.id === data.id)
    if (i >= 0) {
      const gallery = data.image && list[i].gallery ? [data.image, ...list[i].gallery.slice(1)] : list[i].gallery
      list[i] = { ...list[i], ...data, gallery }
      save('products', list)
      return mock(list[i])
    }
    const image = data.image || list[0]?.image
    const created = { rating: 0, reviews: 0, ingredients: [], description: '', size: '', ...data, image, gallery: [image], id: `p${Date.now()}`, slug: slugify(data.name) }
    save('products', [...list, created])
    return mock(created)
  }),
  remove: (id) => request(async () => { await run(supabase.from('products').delete().eq('id', id)); return { id } }, () => {
    save('products', readProducts().filter((p) => p.id !== id))
    return mock({ id })
  }),
}

/* -------------------------------------------------------------------------- */
/* Website content (homepage sections, hero, collections, settings …)         */
/* -------------------------------------------------------------------------- */

// Editable website content. Each key is one JSON document in the cms_documents table.
const cmsSeeds = { sections, hero, menu, about, collections, trust, testimonials, manifesto, routine, navigation, copy, brand, settings: settingsDefaults }

// Homepage content is read on every page (header, footer, home). Share one fetch for a few seconds; any edit clears it.
let homeCache = null
const bustHome = () => { homeCache = null }

// Saved section lists predate newly added sections. Append any default section the saved list lacks,
// placed after its default predecessor, so admins can show/hide/reorder it without resetting.
const withDefaultSections = (saved) => {
  if (!Array.isArray(saved)) return saved
  const list = [...saved]
  sections.forEach((d, i) => {
    if (list.some((s) => s.id === d.id)) return
    const prev = list.findIndex((s) => s.id === sections[i - 1]?.id)
    list.splice(prev >= 0 ? prev + 1 : list.length, 0, d)
  })
  return list
}
const readCms = (key) => (key === 'sections' ? withDefaultSections(load('cms-sections', cmsSeeds.sections)) : load(`cms-${key}`, cmsSeeds[key]))
const fromDb = (key, value) => structuredClone(key === 'sections' ? withDefaultSections(value ?? cmsSeeds.sections) : value ?? cmsSeeds[key])

export const cmsApi = {
  get: (key) => request(async () => {
    const row = await run(supabase.from('cms_documents').select('value').eq('key', key).maybeSingle())
    return fromDb(key, row?.value)
  }, () => mock(readCms(key), 60)),
  set: (key, value) => request(async () => {
    await run(supabase.from('cms_documents').upsert({ key, value, updated_at: new Date().toISOString() }))
    bustHome()
    return value
  }, () => { bustHome(); return mock(save(`cms-${key}`, value), 200) }),
  reset: (key) => request(async () => {
    await run(supabase.from('cms_documents').delete().eq('key', key))
    bustHome()
    return structuredClone(cmsSeeds[key])
  }, () => { bustHome(); localStorage.removeItem(`aure-cms-cms-${key}`); return mock(cmsSeeds[key], 60) }),
}

/* -------------------------------------------------------------------------- */
/* Journal                                                                    */
/* -------------------------------------------------------------------------- */

const readJournal = () => load('journal', seedJournal)
const toPost = (r) => ({ id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, image: r.image, date: r.date, readTime: r.read_time, published: r.published, body: r.body })

export const journalApi = {
  list: ({ all = false } = {}) => request(async () => {
    let q = supabase.from('journal_posts').select('*').order('date', { ascending: false })
    if (!all) q = q.eq('published', true)
    return (await run(q)).map(toPost)
  }, () => mock(readJournal().filter((j) => all || j.published !== false).sort((a, b) => b.date.localeCompare(a.date)))),
  bySlug: (slug) => request(async () => {
    const r = await run(supabase.from('journal_posts').select('*').eq('slug', slug).eq('published', true).maybeSingle())
    if (!r) throw new Error('Article not found')
    return toPost(r)
  }, () => {
    const j = readJournal().find((x) => x.slug === slug && x.published !== false)
    return j ? mock(j) : Promise.reject(new Error('Article not found'))
  }),
  save: (data) => request(async () => {
    const slug = slugify(data.slug || data.title)
    const clash = await run(supabase.from('journal_posts').select('id').eq('slug', slug).limit(1))
    if (clash.some((c) => c.id !== data.id)) throw new Error('Another article already uses that URL slug')
    const body = (data.body || []).filter((p) => p.trim())
    const row = {
      id: data.id || `j${Date.now()}`, slug, title: data.title, excerpt: data.excerpt || '', category: data.category || 'Journal',
      image: data.image || '', date: data.date, published: data.published ?? true, body,
      read_time: Number(data.readTime) || Math.max(1, Math.round(body.join(' ').split(/\s+/).length / 200)),
    }
    bustHome()
    return toPost(await run(supabase.from('journal_posts').upsert(row).select().single()))
  }, () => {
    bustHome()
    const list = readJournal()
    const slug = slugify(data.slug || data.title)
    if (list.some((j) => j.slug === slug && j.id !== data.id)) return Promise.reject(new Error('Another article already uses that URL slug'))
    const body = (data.body || []).filter((p) => p.trim())
    const article = { excerpt: '', category: 'Journal', published: true, ...data, slug, body, readTime: data.readTime || Math.max(1, Math.round(body.join(' ').split(/\s+/).length / 200)) }
    const i = list.findIndex((j) => j.id === data.id)
    if (i >= 0) list[i] = article; else list.unshift({ ...article, id: `j${Date.now()}` })
    save('journal', list)
    return mock(article)
  }),
  remove: (id) => request(async () => { await run(supabase.from('journal_posts').delete().eq('id', id)); bustHome(); return { id } },
    () => { bustHome(); save('journal', readJournal().filter((j) => j.id !== id)); return mock({ id }) }),
}

const loadHome = () => request(async () => {
    const [docs, posts] = await Promise.all([run(supabase.from('cms_documents').select('key,value').neq('key', 'settings')), journalApi.list()])
    const byKey = Object.fromEntries(docs.map((d) => [d.key, d.value]))
    const out = Object.fromEntries(Object.keys(cmsSeeds).filter((k) => k !== 'settings').map((k) => [k, fromDb(k, byKey[k])]))
    return { ...out, journal: posts.slice(0, 3) }
  }, () => mock({
    ...Object.fromEntries(Object.keys(cmsSeeds).filter((k) => k !== 'settings').map((k) => [k, readCms(k)])),
    journal: readJournal().filter((j) => j.published !== false).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
  }, 150))

export const contentApi = {
  home: () => {
    if (homeCache && Date.now() - homeCache.at < 15000) return homeCache.promise
    const promise = loadHome().catch((e) => { homeCache = null; throw e })
    homeCache = { at: Date.now(), promise }
    return promise
  },
}

/* -------------------------------------------------------------------------- */
/* Auth (Supabase Auth: sessions, access + refresh tokens)                    */
/* -------------------------------------------------------------------------- */

const authMessage = (e) => {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the confirmation link.'
  if (e?.status === 429 || m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.'
  if (m.includes('already registered') || m.includes('already exists')) return 'An account with this email already exists. Try signing in.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Cannot reach the server. Check your connection and try again.'
  if (m.includes('same password')) return 'Choose a password different from your current one.'
  return e?.message || 'Something went wrong. Please try again.'
}
const authFail = (e) => { throw Object.assign(new Error(authMessage(e)), { code: e?.code }) }

// Role comes from the admins table (readable only for your own row), never from user-editable metadata.
export async function toUser(u) {
  let isAdmin = false
  try { const { data } = await supabase.from('admins').select('user_id').eq('user_id', u.id).maybeSingle(); isAdmin = Boolean(data) } catch { /* table not created yet */ }
  return { id: u.id, name: u.user_metadata?.name || u.email.split('@')[0].replace(/^./, (c) => c.toUpperCase()), email: u.email, role: isAdmin ? 'admin' : 'customer' }
}

export const authApi = {
  login: ({ email, password }) => request(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) authFail(error)
    return { user: await toUser(data.user), token: data.session.access_token }
  }, () => {
    if (adminUser.password && email.trim().toLowerCase() === adminUser.email.toLowerCase() && password === adminUser.password) {
      const { password: _p, ...user } = adminUser
      return mock({ user, token: 'mock-token' })
    }
    return Promise.reject(new Error('Incorrect email or password.'))
  }),
  requestReset: (email) => request(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin()}/admin/reset-password` })
    if (error) authFail(error)
    return { ok: true }
  }, () => mock({ ok: true }, 400)),
  updatePassword: (next) => request(async () => {
    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) authFail(error)
    await supabase.auth.signOut()
    return { ok: true }
  }, () => mock({ ok: true }, 300)),
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

const ORDERS_KEY = 'aure-mock-orders'
const readOrders = () => { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || orders } catch { return orders } }
const writeOrders = (list) => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)) } catch { /* ignore */ } }

const toOrder = (r) => ({
  id: r.id, customer: r.customer, email: r.email, status: r.status, date: r.date, items: r.items,
  subtotal: Number(r.subtotal), shipping: Number(r.shipping), total: Number(r.total), itemCount: r.item_count, shippingAddress: r.shipping_address,
  paymentMethod: r.payment_method, paymentStatus: r.payment_status, paidAt: r.paid_at, mpesaReceipt: r.mpesa_receipt,
})

export const ordersApi = {
  // Prices, stock and shipping are recomputed by the place_order database function; the browser only sends ids and quantities.
  create: (payload) => request(
    async () => toOrder(await run(supabase.rpc('place_order', { p_customer: payload.customer, p_items: payload.items.map(({ id, qty }) => ({ id, qty })) }))),
    () => {
      const order = { ...payload, id: `AU-${Math.floor(Math.random() * 9000 + 2000)}`, status: 'pending', date: new Date().toISOString().slice(0, 10), customer: payload.customer.name, email: payload.customer.email, shippingAddress: payload.customer, itemCount: payload.items.reduce((n, i) => n + i.qty, 0) }
      writeOrders([order, ...readOrders()])
      return mock(order, 700)
    },
  ),
  list: () => request(
    async () => (await run(supabase.from('orders').select('*').order('date', { ascending: false }).limit(2000))).map(toOrder),
    () => mock(readOrders()),
  ),
  byId: (id) => request(async () => toOrder(await run(supabase.rpc('get_order', { p_id: id }))), () => {
    const o = readOrders().find((x) => x.id === id)
    return o ? mock(o) : Promise.reject(new Error('Order not found'))
  }),
  setStatus: (id, status) => request(async () => { await run(supabase.from('orders').update({ status }).eq('id', id)); return { id, status } }, () => {
    const list = readOrders().map((o) => (o.id === id ? { ...o, status } : o))
    writeOrders(list)
    return mock({ id, status }, 150)
  }),
}

/* -------------------------------------------------------------------------- */
/* Messages and newsletter                                                    */
/* -------------------------------------------------------------------------- */

const toMessage = (r) => ({ id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.message, read: r.read, date: r.created_at })
const toSubscriber = (r) => ({ email: r.email, active: r.active, date: r.created_at })

export const messagesApi = {
  contact: (data) => request(async () => {
    await run(supabase.from('messages').insert({ name: data.name, email: data.email, subject: data.subject || '', message: data.message }))
    return { ok: true }
  }, () => {
    save('messages', [{ ...data, id: `m${Date.now()}`, date: new Date().toISOString(), read: false }, ...load('messages', seedMessages)])
    return mock({ ok: true }, 600)
  }),
  list: () => request(
    async () => (await run(supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(1000))).map(toMessage),
    () => mock(load('messages', seedMessages), 100),
  ),
  setRead: (id, read) => request(async () => { await run(supabase.from('messages').update({ read }).eq('id', id)); return { id, read } }, () => {
    save('messages', load('messages', seedMessages).map((m) => (m.id === id ? { ...m, read } : m))); return mock({ id, read }, 50)
  }),
  remove: (id) => request(async () => { await run(supabase.from('messages').delete().eq('id', id)); return { id } },
    () => { save('messages', load('messages', seedMessages).filter((m) => m.id !== id)); return mock({ id }, 50) }),
  subscribe: (email) => request(async () => { await run(supabase.rpc('subscribe', { p_email: email })); return { ok: true } }, () => {
    const list = load('subscribers', seedSubscribers)
    if (!list.some((s) => s.email === email)) save('subscribers', [{ email, date: new Date().toISOString(), active: true }, ...list])
    return mock({ ok: true }, 500)
  }),
  subscribers: () => request(
    async () => (await run(supabase.from('subscribers').select('*').order('created_at', { ascending: false }).limit(5000))).map(toSubscriber),
    () => mock(load('subscribers', seedSubscribers), 100),
  ),
  setSubscriberActive: (email, active) => request(async () => { await run(supabase.from('subscribers').update({ active }).eq('email', email)); return { email, active } }, () => {
    save('subscribers', load('subscribers', seedSubscribers).map((s) => (s.email === email ? { ...s, active } : s))); return mock({ email, active }, 50)
  }),
  unsubscribe: (email) => request(async () => { await run(supabase.from('subscribers').delete().eq('email', email)); return { email } },
    () => { save('subscribers', load('subscribers', seedSubscribers).filter((s) => s.email !== email)); return mock({ email }, 50) }),
}

/* -------------------------------------------------------------------------- */
/* Shopper interest (what visitors added to carts / wishlists)                */
/* -------------------------------------------------------------------------- */

const sessionId = () => {
  try {
    let s = localStorage.getItem('aure-sid')
    if (!s) { s = crypto.randomUUID(); localStorage.setItem('aure-sid', s) }
    return s
  } catch { return 'anon' }
}
const toActivity = (r) => ({ id: r.id, sessionId: r.session_id, userId: r.user_id, email: r.user_email, kind: r.kind, productId: r.product_id, qty: r.qty, date: r.created_at })

export const activityApi = {
  // Fire-and-forget: tracking must never slow down or break shopping.
  track: (kind, productId, qty = 1) => {
    request(
      () => run(supabase.from('shopper_activity').insert({ session_id: sessionId(), kind, product_id: productId, qty })),
      () => {
        const list = load('activity', [])
        list.unshift({ id: Date.now(), session_id: sessionId(), user_email: null, kind, product_id: productId, qty, created_at: new Date().toISOString() })
        save('activity', list.slice(0, 500))
      },
    ).catch(() => {})
  },
  list: () => request(
    async () => (await run(supabase.from('shopper_activity').select('*').order('created_at', { ascending: false }).limit(3000))).map(toActivity),
    () => mock(load('activity', []).map(toActivity), 100),
  ),
}

/* -------------------------------------------------------------------------- */
/* Payout methods (admin only)                                                */
/* -------------------------------------------------------------------------- */

const toPayout = (r) => ({ id: r.id, type: r.type, label: r.label, details: r.details || {}, enabled: r.enabled, isDefault: r.is_default, createdAt: r.created_at })
const readPayouts = () => load('payouts', [])
const normalizeDefault = (list) => (list.length && !list.some((a) => a.isDefault) ? list.map((a, i) => ({ ...a, isDefault: i === 0 })) : list)

async function settlePayoutDefault(preferId) {
  const rows = (await run(supabase.from('payout_methods').select('*').order('created_at'))).map(toPayout)
  const target = preferId || rows.find((p) => p.isDefault)?.id || rows[0]?.id
  if (!target) return []
  if (rows.some((p) => p.isDefault && p.id !== target)) await run(supabase.from('payout_methods').update({ is_default: false }).neq('id', target))
  if (!rows.find((p) => p.id === target)?.isDefault) await run(supabase.from('payout_methods').update({ is_default: true }).eq('id', target))
  return (await run(supabase.from('payout_methods').select('*').order('created_at'))).map(toPayout)
}

export const payoutsApi = {
  list: () => request(
    async () => (await run(supabase.from('payout_methods').select('*').order('created_at'))).map(toPayout),
    () => mock(readPayouts(), 100),
  ),
  save: (data) => request(async () => {
    const row = { type: data.type, label: data.label, details: data.details || {}, enabled: data.enabled ?? true }
    const saved = data.id
      ? await run(supabase.from('payout_methods').update(row).eq('id', data.id).select().single())
      : await run(supabase.from('payout_methods').insert(row).select().single())
    return settlePayoutDefault(data.isDefault ? saved.id : undefined)
  }, () => {
    let list = readPayouts()
    const id = data.id || `pm${Date.now()}`
    const entry = { ...data, id, enabled: data.enabled ?? true, createdAt: data.createdAt || new Date().toISOString() }
    list = list.some((p) => p.id === id) ? list.map((p) => (p.id === id ? { ...p, ...entry } : p)) : [...list, entry]
    if (entry.isDefault) list = list.map((p) => ({ ...p, isDefault: p.id === id }))
    return mock(save('payouts', normalizeDefault(list)), 150)
  }),
  remove: (id) => request(async () => { await run(supabase.from('payout_methods').delete().eq('id', id)); return settlePayoutDefault() },
    () => mock(save('payouts', normalizeDefault(readPayouts().filter((p) => p.id !== id))), 100)),
  setDefault: (id) => request(() => settlePayoutDefault(id),
    () => mock(save('payouts', readPayouts().map((p) => ({ ...p, isDefault: p.id === id }))), 100)),
  setEnabled: (id, enabled) => request(async () => { await run(supabase.from('payout_methods').update({ enabled }).eq('id', id)); return { id, enabled } },
    () => mock(save('payouts', readPayouts().map((p) => (p.id === id ? { ...p, enabled } : p))).find((p) => p.id === id), 50)),
}

/* -------------------------------------------------------------------------- */
/* Image uploads (Supabase Storage bucket "images")                           */
/* -------------------------------------------------------------------------- */

// Resizes in the browser before upload so pages stay fast.
function resize(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'))
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c)
    }
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = url
  })
}

export const uploadApi = {
  image: (file) => request(async () => {
    const canvas = await resize(file)
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82))
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await supabase.storage.from('images').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
    if (error) throw new Error(/bucket not found/i.test(error.message) ? 'Image storage is not set up yet. Run supabase/setup.sql.' : error.message)
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    await supabase.from('media_assets').insert({ url: data.publicUrl, path })
    return data.publicUrl
  }, async () => (await resize(file)).toDataURL('image/jpeg', 0.8)),
}
