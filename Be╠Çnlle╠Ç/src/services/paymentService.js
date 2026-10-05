import { supabase, run } from '../api/supabase'

// Everything that touches M-Pesa payments lives here. Components never call fetch or Edge Functions directly.
// Money rules (prices, shipping, the amount charged) are decided by the stk-push Edge Function, not the browser.

const PENDING_KEY = 'benlle-mpesa-pending'
const PHONE_KEY = 'benlle-mpesa-phone'

/* -------------------------------------------------------------------------- */
/* Phone helpers (UX only; the server validates again)                        */
/* -------------------------------------------------------------------------- */

/** 07…, 01…, 7…, 1…, +2547…, 2547… → 2547XXXXXXXX. Returns null when it is not a Safaricom number. */
export function normalisePhone(input) {
  let p = String(input ?? '').replace(/[\s\-().]/g, '')
  if (p.startsWith('+')) p = p.slice(1)
  if (p.startsWith('0')) p = `254${p.slice(1)}`
  else if (/^[71]\d{8}$/.test(p)) p = `254${p}`
  return /^254(7|1)\d{8}$/.test(p) ? p : null
}

/** 254712345678 → +254 7•• ••• 678 */
export const maskPhone = (p) => (p && p.length === 12 ? `+${p.slice(0, 3)} ${p[3]}•• ••• ${p.slice(-3)}` : '')

export const rememberPhone = (p) => { try { localStorage.setItem(PHONE_KEY, p) } catch { /* storage unavailable */ } }
export const rememberedPhone = () => { try { return localStorage.getItem(PHONE_KEY) || '' } catch { return '' } }

/* -------------------------------------------------------------------------- */
/* Resume after reload                                                        */
/* -------------------------------------------------------------------------- */

// { paymentId, orderId, amount, phone, shipping, startedAt } while a payment is in flight.
export const savePending = (data) => { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(data)) } catch { /* storage unavailable */ } }
export const loadPending = () => { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY)) || null } catch { return null } }
export const clearPending = () => { try { sessionStorage.removeItem(PENDING_KEY) } catch { /* storage unavailable */ } }

/* -------------------------------------------------------------------------- */
/* Edge Functions                                                             */
/* -------------------------------------------------------------------------- */

// Edge Function errors come back as { error: "friendly message" }; surface that message and nothing else.
async function invoke(name, body) {
  if (!supabase) throw new Error('M-Pesa payments need the live store connection. Run the app with Supabase configured.')
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let message = 'We could not reach the payment service. Please try again.'
    try { const j = await error.context?.json?.(); if (j?.error) message = j.error } catch { /* not JSON */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * Prices the cart on the server, creates (or reuses) the order and sends the PIN prompt.
 * Only product ids and quantities are sent: the amount is always computed from the database.
 * Returns { paymentId, orderId, checkoutRequestId, amount, customerMessage }.
 */
export const initiateMpesa = ({ items, phone, shipping, orderId }) =>
  invoke('stk-push', { items: items.map((i) => ({ productId: i.id, qty: i.qty })), phone, shipping, orderId: orderId || undefined })

/** { paymentId, orderId, status: pending|paid|failed|cancelled|timeout, message, mpesaReceipt, amount } */
export const getPaymentStatus = (paymentId) => invoke('payment-status', { paymentId })

/** Admin only: "sandbox" or "live". The browser never sees any M-Pesa key. */
export const getMpesaMode = async () => (await invoke('payment-status', { mode: true })).mode

/**
 * Live updates for one payment. The server broadcasts { status, message, mpesaReceipt } on a per-payment channel
 * (guests have no account, so a row-level-security feed would not reach them). Returns an unsubscribe function.
 */
export function subscribeToPayment(paymentId, onUpdate) {
  if (!supabase) return () => {}
  const channel = supabase.channel(`payment:${paymentId}`)
    .on('broadcast', { event: 'status' }, ({ payload }) => onUpdate(payload))
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/* -------------------------------------------------------------------------- */
/* Admin reads (row-level security: admins only)                              */
/* -------------------------------------------------------------------------- */

export const listPayments = async () => (supabase ? run(supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(2000)) : [])

export const listPaymentEvents = async (paymentId) =>
  (supabase ? run(supabase.from('payment_events').select('*').eq('payment_id', paymentId).order('created_at')) : [])

export const countPendingPayments = async () => {
  if (!supabase) return 0
  const { count, error } = await supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return error ? 0 : count || 0
}
