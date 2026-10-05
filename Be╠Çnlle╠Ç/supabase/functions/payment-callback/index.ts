// POST /functions/v1/payment-callback?token=<MPESA_CALLBACK_SECRET>
// Safaricom calls this with the STK Push result. Public: deploy with --no-verify-jwt.
// Always answers HTTP 200 quickly so Safaricom never retries into a loop; bad tokens are ignored silently.
import { adminClient, broadcastPayment, env, json, log, mapResultCode, parseMpesaDate, PAYMENT_COLUMNS } from '../_shared/daraja.ts'

const ACK = { ResultCode: 0, ResultDesc: 'Accepted' }

// Constant-time comparison so the token cannot be guessed from response timing.
function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a); const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

Deno.serve(async (req) => {
  try {
    const token = new URL(req.url).searchParams.get('token') || ''
    if (!safeEqual(token, env('MPESA_CALLBACK_SECRET'))) {
      log('callback_rejected', { reason: 'bad_token' })
      return json(ACK)
    }

    const payload = await req.json().catch(() => null)
    const cb = payload?.Body?.stkCallback
    if (!cb?.CheckoutRequestID) { log('callback_ignored', { reason: 'no_stk_callback' }); return json(ACK) }

    const db = adminClient()
    const crid = String(cb.CheckoutRequestID)

    // Look up by CheckoutRequestID only. Safaricom may mask the phone number, so it is never used to find a payment.
    const { data: found } = await db.from('payments').select('id').eq('checkout_request_id', crid).maybeSingle()

    // Always keep the raw payload first, before anything can fail.
    await db.from('payment_events').insert({ payment_id: found?.id ?? null, checkout_request_id: crid, source: 'callback', payload })
    if (!found) { log('callback_unknown_payment', { checkoutRequestId: crid }); return json(ACK) }

    const meta: Record<string, unknown> = {}
    for (const item of cb.CallbackMetadata?.Item ?? []) if (item?.Name) meta[item.Name] = item.Value

    const resultCode = Number(cb.ResultCode)
    const mapped = mapResultCode(resultCode)
    const { data: result, error } = await db.rpc('apply_payment_result', {
      p_checkout_request_id: crid,
      p_status: mapped.status,
      p_result_code: resultCode,
      p_result_desc: mapped.status === 'paid' ? String(cb.ResultDesc ?? '') : mapped.message,
      p_receipt: meta.MpesaReceiptNumber ? String(meta.MpesaReceiptNumber) : null,
      p_amount: meta.Amount != null ? Number(meta.Amount) : null,
      p_tx_date: parseMpesaDate(meta.TransactionDate as number),
      p_callback: payload,
    })
    if (error) { log('callback_apply_failed', { code: error.code, checkoutRequestId: crid }); return json(ACK) }

    log('callback_applied', { checkoutRequestId: crid, resultCode, status: result?.status, changed: result?.changed, needsReview: result?.needs_review })
    if (result?.changed) {
      const { data: row } = await db.from('payments').select(PAYMENT_COLUMNS).eq('id', found.id).single()
      if (row) await broadcastPayment(row)
    }
  } catch (e) {
    log('callback_error', { message: (e as Error).message })
  }
  return json(ACK)
})
