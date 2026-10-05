import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Smartphone } from 'lucide-react'
import { clearPending, getPaymentStatus, initiateMpesa, maskPhone, savePending, subscribeToPayment } from '../../services/paymentService'
import { formatPrice } from '../../lib/format'
import Button from '../ui/Button'

const PROMPT_SECONDS = 90       // how long the PIN prompt stays on the phone
const POLL_AFTER_SECONDS = 25   // no realtime update by now? start asking the server
const POLL_EVERY_SECONDS = 5
const GIVE_UP_SECONDS = 180     // stop waiting and show the timeout state
const REDIRECT_MS = 2000
const RING = 2 * Math.PI * 44

function Ring({ left }) {
  return (
    <div className="relative mx-auto size-28">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="5" className="stroke-line" />
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-accent-strong transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeDasharray={RING} strokeDashoffset={RING * (1 - left / PROMPT_SECONDS)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Smartphone className="size-6 text-muted" aria-hidden />
        <span className="absolute bottom-6 text-xs font-medium tabular-nums text-muted">{left}s</span>
      </div>
    </div>
  )
}

function Tick() {
  return (
    <svg viewBox="0 0 52 52" className="mx-auto size-20" aria-hidden>
      <motion.circle cx="26" cy="26" r="24" fill="none" strokeWidth="3" className="stroke-accent-strong" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      <motion.path d="M15 27l8 8 14-16" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-strong"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.4 }} />
    </svg>
  )
}

// The whole M-Pesa conversation: send the prompt, wait for the PIN, then paid / failed / timeout.
// Not dismissible by clicking outside: closing mid-payment would hide a charge that may still go through.
//   items, shipping, phone  what to send to stk-push (only ids + quantities are used for pricing)
//   orderId                 an existing unpaid order to reuse (after "Change number")
//   resume                  { paymentId, orderId, amount, startedAt } to pick up after a reload
//   onPaid(orderId)         payment confirmed (clear the cart here)
//   onDone(orderId)         2 seconds after success (navigate here)
//   onChangeNumber(orderId) go back to the phone input; the same order is reused on the next try
export default function MpesaModal({ items, shipping, phone, orderId, resume, onPaid, onDone, onChangeNumber }) {
  const [phase, setPhase] = useState(resume ? 'waiting' : 'sending') // sending | waiting | paid | failed | timeout
  const [info, setInfo] = useState({ paymentId: resume?.paymentId || null, amount: resume?.amount || null, message: '', receipt: '', checking: false })
  const [left, setLeft] = useState(PROMPT_SECONDS)
  const ctx = useRef({ orderId: resume?.orderId || orderId || null, startedAt: resume?.startedAt || Date.now() })
  const phaseRef = useRef(phase)
  const began = useRef(false)
  const headingRef = useRef(null)
  const setPhaseSafe = (p) => { phaseRef.current = p; setPhase(p) }
  const cb = useRef({ onPaid, onDone }) // latest callbacks, so effects below do not restart on every parent render
  useEffect(() => { cb.current = { onPaid, onDone } })

  // Apply a status coming from realtime or from payment-status. Final states are never overwritten.
  const apply = useCallback((s) => {
    if (!s || phaseRef.current === 'paid' || phaseRef.current === 'failed') return
    if (s.status === 'paid') {
      clearPending()
      setInfo((i) => ({ ...i, receipt: s.mpesaReceipt || i.receipt, amount: s.amount || i.amount }))
      setPhaseSafe('paid')
      cb.current.onPaid?.(s.orderId || ctx.current.orderId)
    } else if (s.status === 'failed' || s.status === 'cancelled') {
      setInfo((i) => ({ ...i, message: s.message }))
      setPhaseSafe('failed')
    } else if (s.status === 'timeout') {
      setPhaseSafe('timeout')
    }
  }, [])

  const start = useCallback(async () => {
    setPhaseSafe('sending')
    setInfo((i) => ({ ...i, message: '' }))
    try {
      const r = await initiateMpesa({ items, phone, shipping, orderId: ctx.current.orderId })
      ctx.current = { orderId: r.orderId, startedAt: Date.now() }
      savePending({ paymentId: r.paymentId, orderId: r.orderId, amount: r.amount, phone, shipping, startedAt: ctx.current.startedAt })
      setInfo({ paymentId: r.paymentId, amount: r.amount, message: '', receipt: '', checking: false })
      setLeft(PROMPT_SECONDS)
      setPhaseSafe('waiting')
    } catch (e) {
      // The old order cannot be paid any more (already paid, or expired): the next try starts a fresh one.
      if (/no longer be paid/i.test(e.message)) ctx.current.orderId = null
      setInfo((i) => ({ ...i, message: e.message }))
      setPhaseSafe('failed')
    }
  }, [items, phone, shipping])

  const check = useCallback(async (manual = false) => {
    if (!info.paymentId) return
    if (manual) setInfo((i) => ({ ...i, checking: true, message: '' }))
    try {
      const s = await getPaymentStatus(info.paymentId)
      if (s.status === 'pending' && phaseRef.current === 'timeout') setInfo((i) => ({ ...i, message: 'Still no confirmation from M-Pesa. If you were charged, wait a minute and check again.' }))
      apply(s)
    } catch (e) {
      if (manual) setInfo((i) => ({ ...i, message: e.message }))
    } finally {
      if (manual) setInfo((i) => ({ ...i, checking: false }))
    }
  }, [info.paymentId, apply])

  // Begin: send a new prompt, or pick up an in-flight payment after a reload (guarded: StrictMode runs effects twice).
  useEffect(() => {
    if (began.current) return
    began.current = true
    if (resume) check(); else start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // While waiting: realtime first, polling as the fallback, a countdown ring, and a hard stop at 3 minutes.
  useEffect(() => {
    if (phase !== 'waiting' || !info.paymentId) return undefined
    const unsubscribe = subscribeToPayment(info.paymentId, apply)
    let lastPoll = 0
    let polling = false
    const tick = setInterval(async () => {
      const elapsed = (Date.now() - ctx.current.startedAt) / 1000
      setLeft(Math.max(0, Math.ceil(PROMPT_SECONDS - elapsed)))
      if (phaseRef.current !== 'waiting') return
      const due = elapsed >= POLL_AFTER_SECONDS && elapsed - lastPoll >= POLL_EVERY_SECONDS
      if (due && !polling) {
        polling = true; lastPoll = elapsed
        try { apply(await getPaymentStatus(info.paymentId)) } catch { /* try again on the next poll */ } finally { polling = false }
      }
      if (elapsed >= GIVE_UP_SECONDS && phaseRef.current === 'waiting') {
        try { apply(await getPaymentStatus(info.paymentId)) } catch { /* fall through to timeout */ }
        if (phaseRef.current === 'waiting') setPhaseSafe('timeout')
      }
    }, 1000)
    return () => { unsubscribe(); clearInterval(tick) }
  }, [phase, info.paymentId, apply])

  // Success: show it for 2 seconds, then go to the order page.
  useEffect(() => {
    if (phase !== 'paid') return undefined
    const t = setTimeout(() => cb.current.onDone?.(ctx.current.orderId), REDIRECT_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => { headingRef.current?.focus() }, [phase])

  const amount = info.amount != null ? formatPrice(info.amount) : ''

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="mpesa-title" aria-live="polite" className="w-full max-w-sm rounded-card border border-line bg-elevated p-8 text-center shadow-soft">
        {phase === 'sending' && (
          <>
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-line border-t-fg" aria-hidden />
            <h2 id="mpesa-title" ref={headingRef} tabIndex={-1} className="mt-6 text-lg font-semibold outline-none">Sending payment request…</h2>
            <p className="mt-2 text-sm text-muted">This takes a few seconds.</p>
          </>
        )}

        {phase === 'waiting' && (
          <>
            <Ring left={left} />
            <h2 id="mpesa-title" ref={headingRef} tabIndex={-1} className="mt-6 text-lg font-semibold outline-none">Check your phone</h2>
            <p className="mt-2 text-sm text-muted">Enter your M-Pesa PIN to pay <span className="font-semibold text-fg">{amount}</span>.</p>
            <p className="mt-3 text-sm">Request sent to <span className="font-medium tabular-nums">{maskPhone(phone) || 'your phone'}</span></p>
            <p className="mt-1 text-xs text-muted">{left > 0 ? 'The prompt expires when the timer ends.' : 'Still waiting for confirmation…'}</p>
            <button type="button" onClick={() => onChangeNumber(ctx.current.orderId)} className="mt-5 text-sm underline">Wrong number?</button>
          </>
        )}

        {phase === 'paid' && (
          <>
            <Tick />
            <h2 id="mpesa-title" ref={headingRef} tabIndex={-1} className="mt-5 text-lg font-semibold outline-none">Payment received</h2>
            <p className="mt-2 text-sm text-muted">{amount} paid with M-Pesa.</p>
            <p className="mt-3 text-sm">{info.receipt ? <>Receipt <span className="font-medium tracking-wide">{info.receipt}</span></> : 'Your M-Pesa receipt arrives by SMS.'}</p>
            <p className="mt-1 text-xs text-muted">Taking you to your order…</p>
          </>
        )}

        {phase === 'failed' && (
          <>
            <AlertCircle className="mx-auto size-12 text-danger" aria-hidden />
            <h2 id="mpesa-title" ref={headingRef} tabIndex={-1} className="mt-5 text-lg font-semibold outline-none">Payment not completed</h2>
            <p className="mt-2 text-sm text-muted">{info.message || "Payment didn't go through. Please try again."}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={start}>Try again</Button>
              <Button variant="ghost" onClick={() => onChangeNumber(ctx.current.orderId)}>Change number</Button>
            </div>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <AlertCircle className="mx-auto size-12 text-muted" aria-hidden />
            <h2 id="mpesa-title" ref={headingRef} tabIndex={-1} className="mt-5 text-lg font-semibold outline-none">We haven't received confirmation yet</h2>
            <p className="mt-2 text-sm text-muted">{info.message || 'If money left your M-Pesa, it can take a minute to reach us.'}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => check(true)} loading={info.checking}>I've paid, check again</Button>
              <Button variant="outline" onClick={start}>Resend prompt</Button>
              <Button variant="ghost" onClick={() => onChangeNumber(ctx.current.orderId)}>Change number</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
