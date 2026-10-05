// POST /functions/v1/stk-push
// Prices the order on the server, creates (or reuses) it, and sends the M-Pesa PIN prompt to the customer's phone.
// Deploy with: supabase functions deploy stk-push --no-verify-jwt   (auth is checked in getCaller; see README)
import {
  UserError, adminClient, corsHeaders, darajaPost, env, getCaller, json, log, maskPhone, mpesaConfig,
  normalisePhone, password, timestamp,
} from '../_shared/daraja.ts'

const DOUBLE_SUBMIT_SECONDS = 90
const MAX_PUSHES_PER_PHONE = 4 // per 10 minutes: stops the endpoint being used to spam someone's phone

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') throw new UserError('Invalid request')

    // 1. Validate input
    const phone = normalisePhone(body.phone)
    const items = body.items
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new UserError('Your bag is empty')
    const lines = items.map((i: any) => {
      const qty = Number(i?.qty)
      if (typeof i?.productId !== 'string' || !i.productId || !Number.isInteger(qty) || qty < 1 || qty > 99) throw new UserError('Your bag has an invalid item')
      return { id: i.productId, qty }
    })
    const shipping = body.shipping
    if (!shipping || typeof shipping !== 'object') throw new UserError('Missing shipping details')
    const orderId = typeof body.orderId === 'string' && body.orderId ? body.orderId : null

    const db = adminClient()
    const caller = await getCaller(req, db)

    // 2 + 3. Price from the products table and create/reuse the order (one database function, one transaction).
    const { data: order, error: orderErr } = await db.rpc('create_mpesa_order', {
      p_user: caller.userId, p_customer: shipping, p_items: lines, p_order_id: orderId,
    })
    if (orderErr) {
      log('order_rejected', { code: orderErr.code })
      // Messages raised by create_mpesa_order are written for customers ("Only 2 left of …").
      throw new UserError(orderErr.code === 'P0001' ? orderErr.message : 'We could not create your order. Please try again.')
    }
    const amount: number = order.amount
    const customerMessage = 'Check your phone and enter your M-Pesa PIN to complete the payment.'

    // 4. Double-submit guard: same order, same number, same amount, prompted in the last 90 seconds.
    const since = new Date(Date.now() - DOUBLE_SUBMIT_SECONDS * 1000).toISOString()
    const { data: recent } = await db.from('payments').select('id, checkout_request_id, amount')
      .eq('order_id', order.id).eq('phone', phone).eq('status', 'pending').eq('amount', amount)
      .not('checkout_request_id', 'is', null).gte('created_at', since).order('created_at', { ascending: false }).limit(1)
    if (recent?.length) {
      log('stk_push_deduplicated', { orderId: order.id })
      return json({ paymentId: recent[0].id, orderId: order.id, checkoutRequestId: recent[0].checkout_request_id, amount, customerMessage, reused: true })
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await db.from('payments').select('id', { count: 'exact', head: true }).eq('phone', phone).gte('created_at', tenMinutesAgo)
    if ((count ?? 0) >= MAX_PUSHES_PER_PHONE) throw new UserError('Too many payment attempts for this number. Please wait a few minutes and try again.', 429)

    // 5. Build the request. The password is derived from the passkey, so it is kept out of what we store.
    const { shortcode, transactionType } = mpesaConfig()
    const ts = timestamp()
    const stkRequest = {
      BusinessShortCode: shortcode,
      Timestamp: ts,
      TransactionType: transactionType,
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${env('SUPABASE_URL')}/functions/v1/payment-callback?token=${env('MPESA_CALLBACK_SECRET')}`,
      AccountReference: String(order.id).slice(0, 12),
      TransactionDesc: 'Order payment',
    }
    const { CallBackURL: _hidden, PartyA: _a, PhoneNumber: _p, ...storable } = stkRequest // no secret token, no full phone in stored logs
    const safeRequest = { ...storable, PhoneMasked: maskPhone(phone) }

    const { data: payment, error: payErr } = await db.from('payments').insert({
      order_id: order.id, user_id: caller.userId, phone, amount, status: 'pending', raw_request: safeRequest,
    }).select('id').single()
    if (payErr || !payment) { log('payment_insert_failed', { code: payErr?.code }); throw new UserError('We could not start your payment. Please try again.', 500) }
    await db.from('payment_events').insert({ payment_id: payment.id, source: 'stk_request', payload: safeRequest })

    // 6. Send the prompt
    let res
    try {
      res = await darajaPost('/mpesa/stkpush/v1/processrequest', { ...stkRequest, Password: password(ts) })
    } catch (e) {
      await failPayment(db, payment.id, order.id, { error: 'network_or_timeout' })
      throw e
    }

    // 7. Accepted
    if (res.body?.ResponseCode === '0' && res.body?.CheckoutRequestID) {
      await db.from('payments').update({
        merchant_request_id: res.body.MerchantRequestID, checkout_request_id: res.body.CheckoutRequestID, raw_response: res.body,
      }).eq('id', payment.id)
      log('stk_push_sent', { paymentId: payment.id, orderId: order.id, phone: maskPhone(phone) })
      return json({ paymentId: payment.id, orderId: order.id, checkoutRequestId: res.body.CheckoutRequestID, amount, customerMessage })
    }

    // 8. Rejected: store the raw reason for admins, give the customer a friendly one.
    await failPayment(db, payment.id, order.id, res.body)
    log('stk_push_rejected', { paymentId: payment.id, status: res.status, code: res.body?.errorCode || res.body?.ResponseCode })
    throw new UserError("We couldn't send the M-Pesa prompt. Check the number and try again.", 502)
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, e.status)
    log('stk_push_error', { message: (e as Error).message })
    return json({ error: 'Something went wrong on our side. Please try again.' }, 500)
  }
})

// result_desc is customer-facing (payment-status returns it); the raw Daraja reason stays in raw_response / payment_events.
async function failPayment(db: ReturnType<typeof adminClient>, paymentId: string, orderId: string, raw: unknown) {
  const desc = "We couldn't send the M-Pesa prompt. Check the number and try again."
  await db.from('payments').update({ status: 'failed', result_desc: desc, raw_response: raw }).eq('id', paymentId)
  await db.from('orders').update({ payment_status: 'failed' }).eq('id', orderId).neq('payment_status', 'paid')
  await db.from('payment_events').insert({ payment_id: paymentId, source: 'stk_request', payload: { failed: true, desc, raw } })
}
