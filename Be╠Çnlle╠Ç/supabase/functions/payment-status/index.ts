// POST /functions/v1/payment-status   body: { paymentId }
// Fallback when the callback is slow or lost: asks Safaricom (STK Query) what happened and applies the same rules.
// Callable by the payment's owner (guest payments are keyed by their unguessable id) or by an admin.
// Deploy with: supabase functions deploy payment-status --no-verify-jwt   (auth is checked in getCaller; see README)
import {
  PAYMENT_COLUMNS, UserError, adminClient, broadcastPayment, corsHeaders, darajaPost, getCaller, json, log, mapResultCode,
  mpesaConfig, mpesaMode, password, publicStatus, timestamp, type PaymentRow,
} from '../_shared/daraja.ts'

const QUERY_AFTER_SECONDS = 20
const TIMEOUT_AFTER_SECONDS = 180

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => null)
    const db = adminClient()
    const caller = await getCaller(req, db)

    // Admin Settings page: which Daraja environment is active. Reports "sandbox" or "live" only, never any key.
    if (body?.mode === true) {
      if (!caller.isAdmin) throw new UserError('Not allowed', 403)
      return json({ mode: mpesaMode() })
    }

    const paymentId = body?.paymentId
    if (typeof paymentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(paymentId)) throw new UserError('Invalid payment')

    const load = async () => (await db.from('payments').select(PAYMENT_COLUMNS).eq('id', paymentId).maybeSingle()).data as (PaymentRow & { user_id: string | null }) | null

    let pay = await load()
    if (!pay) throw new UserError('Payment not found', 404)
    // Owned payments: only the owner or an admin. Guest payments (no user_id): the unguessable id is the key.
    if (pay.user_id && pay.user_id !== caller.userId && !caller.isAdmin) throw new UserError('Payment not found', 404)

    const ageSeconds = (Date.now() - new Date(pay.created_at).getTime()) / 1000
    // 'timeout' is re-checkable: "I've paid, check again" must be able to find a late payment.
    const open = pay.status === 'pending' || pay.status === 'timeout'

    if (open && pay.checkout_request_id && (pay.status === 'timeout' || ageSeconds > QUERY_AFTER_SECONDS)) {
      const { shortcode } = mpesaConfig()
      const ts = timestamp()
      const res = await darajaPost('/mpesa/stkpushquery/v1/query', {
        BusinessShortCode: shortcode, Password: password(ts), Timestamp: ts, CheckoutRequestID: pay.checkout_request_id,
      })
      await db.from('payment_events').insert({ payment_id: pay.id, checkout_request_id: pay.checkout_request_id, source: 'status_query', payload: res.body ?? {} })

      // Still processing comes back as an error (e.g. errorCode 500.001.1001) with no ResultCode: keep waiting.
      if (res.body?.ResultCode !== undefined && res.body?.ResultCode !== null && res.body?.ResultCode !== '') {
        const code = Number(res.body.ResultCode)
        const mapped = mapResultCode(code)
        await db.rpc('apply_payment_result', {
          p_checkout_request_id: pay.checkout_request_id,
          p_status: mapped.status,
          p_result_code: code,
          p_result_desc: mapped.status === 'paid' ? String(res.body.ResultDesc ?? '') : mapped.message,
          // The query does not return a receipt number: it is filled in when the callback arrives.
        })
        log('status_query_applied', { paymentId: pay.id, resultCode: code })
      } else if (pay.status === 'pending' && ageSeconds > TIMEOUT_AFTER_SECONDS) {
        await db.rpc('apply_payment_result', {
          p_checkout_request_id: pay.checkout_request_id, p_status: 'timeout', p_result_code: 1037, p_result_desc: "We haven't received confirmation yet.",
        })
        log('payment_timed_out', { paymentId: pay.id })
      }

      const before = pay.status
      pay = (await load())!
      if (pay.status !== before) await broadcastPayment(pay)
    } else if (pay.status === 'pending' && ageSeconds > TIMEOUT_AFTER_SECONDS && !pay.checkout_request_id) {
      // No CheckoutRequestID means Safaricom never accepted it.
      await db.from('payments').update({ status: 'failed', result_desc: "We couldn't send the M-Pesa prompt. Check the number and try again." }).eq('id', pay.id).eq('status', 'pending')
      pay = (await load())!
    }

    return json(publicStatus(pay))
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, e.status)
    log('payment_status_error', { message: (e as Error).message })
    return json({ error: 'Something went wrong on our side. Please try again.' }, 500)
  }
})
