// Shared helpers for the M-Pesa (Safaricom Daraja) Edge Functions.
// All credentials come from Supabase secrets (`supabase secrets set ...`). Switching sandbox → live is a secrets-only change.
import { createClient } from 'npm:@supabase/supabase-js@2'

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

export const env = (name: string): string => {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing secret ${name}`)
  return v
}

export const mpesaConfig = () => ({
  baseUrl: env('MPESA_BASE_URL').replace(/\/+$/, ''),
  shortcode: env('MPESA_SHORTCODE'),
  transactionType: Deno.env.get('MPESA_TRANSACTION_TYPE') || 'CustomerPayBillOnline',
})

/** Which Daraja environment is active, for the admin UI and logs. */
export const mpesaMode = () => ((Deno.env.get('MPESA_ENV') || 'sandbox') === 'production' ? 'live' : 'sandbox')

/* -------------------------------------------------------------------------- */
/* HTTP helpers                                                               */
/* -------------------------------------------------------------------------- */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

/** An error whose message is safe to show to the customer. */
export class UserError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}

/** Structured log line. Callers must never pass secrets, tokens or full phone numbers. */
export const log = (event: string, data: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ event, ...data }))

/** 2547••••149: enough to recognise a number, never the whole thing. */
export const maskPhone = (p: string) => (p.length >= 9 ? `${p.slice(0, 4)}••••${p.slice(-3)}` : '••••')

/* -------------------------------------------------------------------------- */
/* Supabase                                                                   */
/* -------------------------------------------------------------------------- */

// Service-role client: bypasses RLS. Server only. Never expose this key.
export const adminClient = () =>
  createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })

export interface Caller { userId: string | null; isAdmin: boolean }

/**
 * Who is calling? Signed-in shoppers/admins send their session JWT. Guests only send the publishable key
 * (not a JWT), so they resolve to { userId: null }. We verify the JWT ourselves because the new publishable
 * keys cannot pass the platform's built-in JWT check (see README: deploy with --no-verify-jwt).
 */
export async function getCaller(req: Request, db = adminClient()): Promise<Caller> {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (token.split('.').length !== 3) return { userId: null, isAdmin: false }
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return { userId: null, isAdmin: false }
  const { data: row } = await db.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
  return { userId: data.user.id, isAdmin: Boolean(row) && Boolean(data.user.email_confirmed_at) }
}

/* -------------------------------------------------------------------------- */
/* Daraja                                                                     */
/* -------------------------------------------------------------------------- */

let tokenCache: { token: string; expiresAt: number } | null = null

/** OAuth access token, cached in module memory until 60s before it expires. */
export async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token
  const basic = btoa(`${env('MPESA_CONSUMER_KEY')}:${env('MPESA_CONSUMER_SECRET')}`)
  const res = await darajaFetch('/oauth/v1/generate?grant_type=client_credentials', { method: 'GET', headers: { Authorization: `Basic ${basic}` } })
  const token = res.body?.access_token
  if (res.status !== 200 || !token) {
    log('daraja_oauth_failed', { status: res.status })
    throw new Error('Could not authenticate with Safaricom')
  }
  const ttl = Number(res.body.expires_in) || 3599
  tokenCache = { token, expiresAt: Date.now() + Math.max(ttl - 60, 1) * 1000 }
  return token
}

/** Every Daraja call goes through here: 15s timeout, structured logs, never logs bodies or secrets. */
export async function darajaFetch(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  const { baseUrl } = mpesaConfig()
  const started = Date.now()
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 15_000)
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: init.method || 'POST',
      headers: { 'Content-Type': 'application/json', ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: ctl.signal,
    })
    const text = await res.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = { raw: text.slice(0, 300) } }
    log('daraja_call', { path: path.split('?')[0], status: res.status, ms: Date.now() - started })
    return { status: res.status, body }
  } catch (e) {
    log('daraja_call_failed', { path: path.split('?')[0], ms: Date.now() - started, reason: (e as Error).name === 'AbortError' ? 'timeout' : 'network' })
    throw new UserError("We couldn't reach M-Pesa. Please try again in a moment.", 502)
  } finally {
    clearTimeout(timer)
  }
}

/** Authenticated POST to a Daraja API path. */
export async function darajaPost(path: string, body: unknown) {
  const token = await getAccessToken()
  return darajaFetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
}

/** YYYYMMDDHHmmss in Africa/Nairobi time (what Daraja expects). */
export function timestamp(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}${get('month')}${get('day')}${hour}${get('minute')}${get('second')}`
}

/** base64(Shortcode + Passkey + Timestamp) */
export const password = (ts: string) => btoa(`${env('MPESA_SHORTCODE')}${env('MPESA_PASSKEY')}${ts}`)

/** Callback `TransactionDate` (yyyyMMddHHmmss, East Africa Time) → ISO timestamp with offset. */
export function parseMpesaDate(v: number | string | undefined): string | null {
  const s = String(v ?? '')
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+03:00` : null
}

/** Accepts 07…, 01…, 7…, 1…, +2547…, +2541…, 2547…, 2541…  Returns 254XXXXXXXXX. */
export function normalisePhone(input: unknown): string {
  let p = String(input ?? '').replace(/[\s\-().]/g, '')
  if (p.startsWith('+')) p = p.slice(1)
  if (p.startsWith('0')) p = `254${p.slice(1)}`
  else if (/^[71]\d{8}$/.test(p)) p = `254${p}`
  if (!/^254(7|1)\d{8}$/.test(p)) throw new UserError('Enter a valid Safaricom number')
  return p
}

export type PaymentStatus = 'paid' | 'failed' | 'cancelled' | 'timeout'

export function mapResultCode(code: number | string): { status: PaymentStatus; message: string } {
  switch (Number(code)) {
    case 0: return { status: 'paid', message: '' }
    case 1032: return { status: 'cancelled', message: 'You cancelled the payment.' }
    case 1037: return { status: 'timeout', message: "We couldn't reach your phone. Make sure it's on and try again." }
    case 1: return { status: 'failed', message: 'Insufficient M-Pesa balance.' }
    case 2001: return { status: 'failed', message: 'Wrong PIN entered.' }
    default: return { status: 'failed', message: "Payment didn't go through. Please try again." }
  }
}

/* -------------------------------------------------------------------------- */
/* Payment → what the browser may see                                         */
/* -------------------------------------------------------------------------- */

export interface PaymentRow {
  id: string; order_id: string | null; status: string; result_desc: string | null; mpesa_receipt: string | null
  needs_review: boolean; amount: number; created_at: string; checkout_request_id: string | null
}

/** Never includes the phone number or raw Safaricom payloads. */
export function publicStatus(p: PaymentRow) {
  let message = ''
  if (p.status === 'paid') message = 'Payment received. Thank you!'
  else if (p.status === 'pending') message = 'Waiting for you to enter your M-Pesa PIN.'
  else if (p.needs_review) message = 'We received your payment but need to verify it. Please contact us and quote your M-Pesa receipt.'
  else if (p.status === 'timeout') message = "We haven't received confirmation yet."
  else message = p.result_desc || "Payment didn't go through. Please try again."
  return { paymentId: p.id, orderId: p.order_id, status: p.status, message, mpesaReceipt: p.mpesa_receipt, amount: p.amount }
}

/**
 * Push a status change to the checkout modal. Guests have no account, so Postgres-changes Realtime (which needs
 * a row-level read policy) cannot serve them. A broadcast on an unguessable per-payment channel can, and it only
 * carries status, message and receipt. Best effort: the polling fallback covers a missed message.
 */
export async function broadcastPayment(p: PaymentRow) {
  try {
    await fetch(`${env('SUPABASE_URL')}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ messages: [{ topic: `payment:${p.id}`, event: 'status', payload: publicStatus(p), private: false }] }),
    })
  } catch (e) { log('broadcast_failed', { reason: (e as Error).name }) }
}

export const PAYMENT_COLUMNS = 'id, order_id, user_id, phone, status, result_desc, mpesa_receipt, needs_review, amount, created_at, checkout_request_id'
