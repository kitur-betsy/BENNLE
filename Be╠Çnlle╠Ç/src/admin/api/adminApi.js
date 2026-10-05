// Admin data layer. Every admin page talks to this file only.
//
// It adapts the admin's data shapes onto the storefront's services (api/services.js), so a product,
// order, journal post or setting edited here is the same record the storefront reads. Switching to a
// real backend is handled in services.js (VITE_USE_MOCK=false), not here.

import {
  activityApi, authApi, cmsApi, journalApi, messagesApi, ordersApi, payoutsApi, productsApi,
} from '../../api/services'
import { countPendingPayments, getMpesaMode, getPaymentStatus, listPaymentEvents, listPayments } from '../../services/paymentService'
import { useSettings } from '../../store/settings'
import { settingsDefaults } from '../../data/settings'
import { sections, hero, about, collections, trust, testimonials, manifesto } from '../../data/content'

const clone = (v) => structuredClone(v)

/* --------------------------------- products -------------------------------- */

const toProduct = (p) => ({ badge: '', size: '', featured: false, ...p, ingredients: (p.ingredients || []).join(', ') })
const fromProduct = ({ ingredients, ...p }) => ({
  ...p,
  ...(p.price !== undefined && { price: Number(p.price) }),
  ...(p.stock !== undefined && { stock: Number(p.stock) }),
  ...(typeof ingredients === 'string' ? { ingredients: ingredients.split(',').map((x) => x.trim()).filter(Boolean) } : {}),
})

const products = {
  list: async () => (await productsApi.list({ includeDrafts: true })).map(toProduct),
  create: async (data) => toProduct(await productsApi.save(fromProduct(data))),
  update: async (id, patch) => toProduct(await productsApi.save({ ...fromProduct(patch), id })),
  remove: (id) => productsApi.remove(id),
}

const categories = {
  list: async () => (await productsApi.categories()).map((c) => ({ id: c.id, slug: c.id, name: c.label })),
}

/* ---------------------------------- orders --------------------------------- */

const normalizeOrder = (o, byId) => {
  const c = typeof o.customer === 'string' ? { name: o.customer } : o.customer || {}
  const addr = o.shippingAddress || c
  const items = Array.isArray(o.items) ? o.items.map((i) => {
    const p = byId[i.id ?? i.productId]
    return { productId: i.id ?? i.productId, name: i.name || p?.name || 'Removed product', image: i.image || p?.image, price: i.price, qty: i.qty }
  }) : []
  const email = o.email || c.email || ''
  return {
    id: o.id,
    customerId: email || c.name,
    customer: { name: c.name || 'Guest', email },
    address: { line1: addr.address || addr.line1 || '', city: addr.city || '', zip: addr.zip || '', country: addr.country || '' },
    items,
    itemCount: o.itemCount ?? items.reduce((n, i) => n + i.qty, 0),
    subtotal: o.subtotal ?? o.total,
    shipping: o.shipping ?? 0,
    total: o.total,
    status: o.status,
    // Orders from before payments existed (and offline demo orders) carry no payment fields: treat them as paid.
    paymentMethod: o.paymentMethod || null,
    paymentStatus: o.paymentStatus ?? 'paid',
    paidAt: o.paidAt || null,
    mpesaReceipt: o.mpesaReceipt || null,
    date: o.date.length === 10 ? `${o.date}T12:00:00.000Z` : o.date,
  }
}

const loadOrders = async () => {
  const [raw, prods] = await Promise.all([ordersApi.list(), productsApi.list({ includeDrafts: true })])
  const byId = Object.fromEntries(prods.map((p) => [p.id, p]))
  return { orders: raw.map((o) => normalizeOrder(o, byId)), products: prods }
}

const orders = {
  list: async () => (await loadOrders()).orders,
  setStatus: (id, status) => ordersApi.setStatus(id, status),
}

const customers = {
  list: async () => {
    const { orders: all } = await loadOrders()
    const map = new Map()
    // Oldest first so the latest order's address wins and `joined` is the first order.
    for (const o of [...all].reverse()) {
      const c = map.get(o.customerId) || { id: o.customerId, name: o.customer.name, email: o.customer.email, phone: '', joined: o.date, orders: 0, spent: 0, lastOrder: null }
      c.address = o.address
      if (o.status !== 'cancelled' && o.paymentStatus === 'paid') { c.orders += 1; c.spent += o.total; c.lastOrder = o.date }
      map.set(o.customerId, c)
    }
    return [...map.values()]
  },
  orders: async (id) => (await loadOrders()).orders.filter((o) => o.customerId === id),
}

/* ---------------------------------- journal -------------------------------- */

const toPost = ({ image, ...p }) => ({ ...p, cover: image })
const fromPost = ({ cover, ...p }) => ({ ...p, ...(cover !== undefined ? { image: cover } : {}) })

const posts = {
  list: async () => (await journalApi.list({ all: true })).map(toPost),
  create: async (data) => toPost(await journalApi.save(fromPost(data))),
  update: async (id, patch) => {
    const current = (await journalApi.list({ all: true })).find((j) => j.id === id)
    return toPost(await journalApi.save({ ...current, ...fromPost(patch), id }))
  },
  remove: (id) => journalApi.remove(id),
}

/* --------------------------------- messages -------------------------------- */

const messages = {
  list: () => messagesApi.list(),
  update: async (id, patch) => { await messagesApi.setRead(id, patch.read); return { id, ...patch } },
  remove: (id) => messagesApi.remove(id),
}

const subscribers = {
  list: async () => (await messagesApi.subscribers()).map((s) => ({ active: true, ...s, id: s.email })),
  update: async (id, patch) => { await messagesApi.setSubscriberActive(id, patch.active); return { id, ...patch } },
}

/* --------------------------------- settings -------------------------------- */

// The storefront stores settings as { name, shippingFlat, contact: { email, phone } }; the form is flat.
const toSettings = (s) => ({ lowStockThreshold: 10, ...s, storeName: s.name, flatShippingRate: s.shippingFlat, email: s.contact?.email || '', phone: s.contact?.phone || '' })
const fromSettings = ({ storeName, flatShippingRate, email, phone, ...s }) => ({ ...s, name: storeName, shippingFlat: flatShippingRate, contact: { email, phone } })

const settings = {
  get: async () => toSettings({ ...settingsDefaults, ...(await cmsApi.get('settings')) }),
  save: async (value) => {
    const saved = await cmsApi.set('settings', fromSettings(value))
    useSettings.getState().apply(saved)
    return toSettings(saved)
  },
}

/* -------------------------------- dashboard -------------------------------- */

const DAY = 86400000

async function buildDashboard(days) {
  const [{ orders: all, products: prods }, cats, cfg, msgs] = await Promise.all([
    loadOrders(), categories.list(), settings.get(), messagesApi.list(),
  ])
  const end = Date.now()
  const start = end - days * DAY
  const prevStart = start - days * DAY
  // Revenue counts only orders that are actually paid.
  const valid = all.filter((o) => o.status !== 'cancelled' && o.paymentStatus === 'paid')
  const inRange = (o, a, b) => { const t = new Date(o.date).getTime(); return t >= a && t < b }
  const cur = valid.filter((o) => inRange(o, start, end))
  const prev = valid.filter((o) => inRange(o, prevStart, start))

  const sum = (list) => list.reduce((s, o) => s + o.total, 0)
  const uniq = (list) => new Set(list.map((o) => o.customerId)).size
  const change = (a, b) => (b === 0 ? null : ((a - b) / b) * 100)
  const avg = (list) => (list.length ? sum(list) / list.length : 0)

  const kpis = [
    { id: 'revenue', label: 'Total revenue', value: sum(cur), format: 'money', change: change(sum(cur), sum(prev)) },
    { id: 'orders', label: 'Orders', value: cur.length, format: 'number', change: change(cur.length, prev.length) },
    { id: 'customers', label: 'Customers', value: uniq(cur), format: 'number', change: change(uniq(cur), uniq(prev)) },
    { id: 'aov', label: 'Avg. order', value: avg(cur), format: 'money', change: change(avg(cur), avg(prev)) },
  ]

  // One point per day, or per week for 90 days
  const bucket = days > 30 ? 7 : 1
  const revenue = []
  for (let t = start; t < end; t += bucket * DAY) {
    const list = cur.filter((o) => inRange(o, t, t + bucket * DAY))
    revenue.push({ date: new Date(t).toISOString(), revenue: sum(list), orders: list.length })
  }

  const byCategory = cats.map((c) => {
    const ids = new Set(prods.filter((p) => p.category === c.slug).map((p) => p.id))
    const value = cur.reduce((s, o) => s + o.items.filter((i) => ids.has(i.productId)).reduce((a, i) => a + i.price * i.qty, 0), 0)
    return { name: c.name, value }
  }).sort((a, b) => b.value - a.value)

  const tally = {}
  cur.forEach((o) => o.items.forEach((i) => {
    tally[i.productId] ??= { units: 0, revenue: 0 }
    tally[i.productId].units += i.qty
    tally[i.productId].revenue += i.qty * i.price
  }))
  const topProducts = Object.entries(tally)
    .map(([id, t]) => ({ ...prods.find((p) => p.id === id), ...t }))
    .filter((p) => p.name)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const lowStock = prods.filter((p) => p.status === 'active' && p.stock <= cfg.lowStockThreshold).sort((a, b) => a.stock - b.stock).map(toProduct)

  return {
    kpis, revenue, byCategory, topProducts, lowStock,
    recentOrders: all.slice(0, 5),
    pendingCount: all.filter((o) => o.status === 'pending').length,
    pendingPayments: await countPendingPayments(),
    unreadMessages: msgs.filter((m) => !m.read).length,
  }
}

/* --------------------------------- payments -------------------------------- */

// Joins each payment to its order so the table can show order number and customer name.
const payments = {
  list: async () => {
    const [rows, { orders: all }] = await Promise.all([listPayments(), loadOrders()])
    const byOrder = Object.fromEntries(all.map((o) => [o.id, o]))
    return rows.map((p) => ({
      id: p.id, orderId: p.order_id, status: p.status, phone: p.phone, amount: p.amount, receipt: p.mpesa_receipt,
      resultCode: p.result_code, resultDesc: p.result_desc, needsReview: p.needs_review, date: p.created_at, transactionDate: p.transaction_date,
      checkoutRequestId: p.checkout_request_id, rawCallback: p.raw_callback,
      customer: byOrder[p.order_id]?.customer || { name: 'Guest', email: '' },
    }))
  },
  events: (id) => listPaymentEvents(id),
  recheck: (id) => getPaymentStatus(id),
  mode: () => getMpesaMode(),
}

/* ---------------------------------- payouts -------------------------------- */

const payouts = {
  list: () => payoutsApi.list(),
  save: (data) => payoutsApi.save(data),
  remove: (id) => payoutsApi.remove(id),
  setDefault: (id) => payoutsApi.setDefault(id),
  setEnabled: (id, enabled) => payoutsApi.setEnabled(id, enabled),
}

/* ------------------------------ shopper interest --------------------------- */

const interest = {
  get: async () => {
    const [activity, { orders: all, products: prods }] = await Promise.all([activityApi.list(), loadOrders()])
    const byId = Object.fromEntries(prods.map((p) => [p.id, p]))
    const tally = {}
    const row = (id) => (tally[id] ??= { id, name: byId[id]?.name || 'Removed product', image: byId[id]?.image, carted: 0, saved: 0, ordered: 0 })
    activity.forEach((a) => {
      const r = row(a.productId)
      if (a.kind === 'add_to_cart') r.carted += a.qty
      if (a.kind === 'wishlist_add') r.saved += 1
      if (a.kind === 'wishlist_remove') r.saved = Math.max(0, r.saved - 1)
    })
    all.filter((o) => o.status !== 'cancelled' && o.paymentStatus === 'paid').forEach((o) => o.items.forEach((i) => { if (tally[i.productId]) tally[i.productId].ordered += i.qty }))
    const products = Object.values(tally).sort((a, b) => (b.carted + b.saved) - (a.carted + a.saved))
    return {
      products,
      recent: activity.slice(0, 60).map((a) => ({ ...a, name: byId[a.productId]?.name || 'Removed product', image: byId[a.productId]?.image })),
      totals: {
        carted: products.reduce((s, r) => s + r.carted, 0),
        saved: products.reduce((s, r) => s + r.saved, 0),
        shoppers: new Set(activity.map((a) => a.userId || a.sessionId)).size,
      },
    }
  },
}

/* ---------------------------------- website -------------------------------- */

// Homepage content is edited with the spec-driven form on the Website page; these are its defaults.
const websiteDefaults = { sections, hero, manifesto, collections, about, trust, testimonials }

export const adminApi = {
  auth: { login: (email, password) => authApi.login({ email, password }) },
  products,
  categories,
  orders,
  customers,
  posts,
  messages,
  subscribers,
  settings,
  payouts,
  payments,
  interest,
  dashboard: { get: (days = 30) => buildDashboard(days) },
  website: { defaults: (key) => clone(websiteDefaults[key]) },
}
