import { products } from './products'
import { site } from '../config/site'

// Deterministic demo data so the dashboard looks the same on every load.
// Orders are stored in the same shape the storefront checkout creates, so both sides read one format.
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const rand = rng(42)
const pick = (list) => list[Math.floor(rand() * list.length)]

const first = ['Amara', 'Lena', 'Mateo', 'Priya', 'Jonas', 'Sofia', 'Kenji', 'Tara', 'Noah', 'Aisha', 'Liam', 'Chloe', 'Imani', 'Ethan', 'Grace', 'Daniel', 'Mercy', 'Leah']
const last = ['Okafor', 'Kowalski', 'Ruiz', 'Nair', 'Berg', 'Rossi', 'Mori', 'Wills', 'Hassan', 'Smith', 'Mwangi', 'Ndungu', 'Barasa', 'Lopez']
const places = [['New York', 'United States', '10001'], ['Austin', 'United States', '73301'], ['London', 'United Kingdom', 'SW1A 1AA'], ['Berlin', 'Germany', '10115'], ['Toronto', 'Canada', 'M5V 2T6'], ['Lisbon', 'Portugal', '1100-148']]
const streets = ['Maple Street', 'Riverside Drive', 'Kings Road', 'Elm Avenue', 'Park Lane']

const DAY = 86400000
const now = Date.now()

const people = Array.from({ length: 30 }, (_, i) => {
  const name = `${first[i % first.length]} ${pick(last)}`
  const [city, country, zip] = pick(places)
  return { name, email: `${name.split(' ')[0].toLowerCase()}${i}@example.com`, address: `${Math.floor(1 + rand() * 200)} ${pick(streets)}`, city, zip, country }
})

const buyable = products.filter((p) => p.status === 'active')
const statuses = ['shipped', 'delivered', 'delivered', 'delivered', 'delivered', 'cancelled']

export const orders = Array.from({ length: 150 }, (_, i) => {
  const daysAgo = Math.floor(Math.pow(rand(), 1.3) * 110)
  const date = new Date(now - daysAgo * DAY - Math.floor(rand() * DAY)).toISOString()
  const customer = pick(people)
  const items = []
  for (let l = 1 + Math.floor(rand() * 3); l > 0; l--) {
    const p = pick(buyable)
    if (!items.some((x) => x.id === p.id)) items.push({ id: p.id, qty: 1 + Math.floor(rand() * 2), price: p.price })
  }
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0)
  const shipping = subtotal >= site.freeShippingThreshold ? 0 : site.shippingFlat
  const status = daysAgo < 2 ? pick(['pending', 'processing']) : daysAgo < 6 ? pick(['processing', 'shipped']) : pick(statuses)
  return {
    id: `AU-${2000 + i}`, customer, email: customer.email, status, date, items, subtotal, shipping, total: subtotal + shipping,
    itemCount: items.reduce((n, x) => n + x.qty, 0),
  }
}).sort((a, b) => b.date.localeCompare(a.date))

// Offline demo admin only. The password exists in development builds and is stripped from production bundles;
// real deployments sign in through Supabase Auth.
export const adminUser = { id: 'u1', name: 'Betsy', email: 'Betsykitur@gmail.com', password: import.meta.env.DEV ? '2020' : null, role: 'admin' }

export const seedMessages = [
  ['Achieng Odhiambo', 'Order delivery', 'Hi, my order shows shipped but I have not received a tracking number yet. Could you share it?'],
  ['Brian Kariuki', 'Wholesale enquiry', 'We run a spa and would love to stock Benlle. Do you have a wholesale price list?'],
  ['Sofia Hassan', 'Sensitive skin question', 'Is the Radiance Treatment Serum suitable for someone with rosacea? I want to be careful before trying it.'],
  ['Daniel Mutua', 'Collaboration', 'I create skincare content (40k followers) and would love to collaborate on the Barrier Repair Serum.'],
  ['Grace Wambui', 'Refill program', 'Do you offer refills for the Cloud Cleanser? I want to cut down on packaging.'],
  ['Noah Smith', 'Thank you!', 'Just wanted to say the Dew Moisture Cream has completely changed my winter skin. Thank you.'],
].map(([name, subject, message], i) => ({
  id: `m-seed-${i + 1}`, name, subject, message, email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  date: new Date(now - (i * 0.8 + 0.1) * DAY).toISOString(), read: i > 2,
}))

export const seedSubscribers = Array.from({ length: 24 }, (_, i) => ({
  email: `${people[i].email.split('@')[0]}+news@example.com`,
  date: new Date(now - Math.floor(rand() * 200) * DAY).toISOString(),
  active: rand() > 0.12,
})).sort((a, b) => b.date.localeCompare(a.date))
