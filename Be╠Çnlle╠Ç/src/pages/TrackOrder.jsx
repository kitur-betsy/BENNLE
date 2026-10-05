import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageSearch } from 'lucide-react'
import { ordersApi } from '../api/services'
import { formatPrice, formatDate } from '../lib/format'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import { OrderTimeline, OrderLines, PaymentSummary } from '../components/shop/OrderParts'

// Guest order lookup: no account needed. The order number is unguessable and the email must match the order.
export default function TrackOrder() {
  const [params] = useSearchParams()
  const [id, setId] = useState(params.get('id') || '')
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ loading: false, error: '', order: null })

  const submit = async (e) => {
    e.preventDefault()
    const orderId = id.trim().toUpperCase()
    if (!orderId || !email.trim()) return setState({ loading: false, error: 'Enter your order number and the email you used at checkout.', order: null })
    setState({ loading: true, error: '', order: null })
    try {
      const order = await ordersApi.byId(orderId)
      // Same message for "not found" and "wrong email" so order numbers cannot be probed.
      if ((order.email || '').toLowerCase() !== email.trim().toLowerCase()) throw new Error('We could not find an order with those details.')
      setState({ loading: false, error: '', order })
    } catch {
      setState({ loading: false, error: 'We could not find an order with those details. Check the order number and email.', order: null })
    }
  }

  const o = state.order
  return (
    <div className="container-site max-w-2xl py-12 md:py-20">
      <PackageSearch className="size-8 text-muted" aria-hidden />
      <h1 className="serif mt-4 text-4xl md:text-5xl">Track your order</h1>
      <p className="mt-3 text-muted">No account needed. Enter the order number from your confirmation and the email you ordered with.</p>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field label="Order number" placeholder="AU-1A2B3C4D" value={id} onChange={(e) => setId(e.target.value)} autoComplete="off" />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="sm:col-span-2"><Button type="submit" size="lg" loading={state.loading}>Find my order</Button></div>
      </form>
      {state.error && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}

      {o && (
        <section aria-label="Order details" className="mt-10 rounded-card border border-line bg-elevated p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Order {o.id}</h2>
            <p className="text-sm text-muted">Placed {formatDate(o.date)}</p>
          </div>
          <OrderTimeline status={o.status} className="mt-6" />
          <OrderLines items={o.items} className="mt-6 border-t border-line" />
          <dl className="mt-2 space-y-2 border-t border-dashed border-line pt-4 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Shipping</dt><dd>{o.shipping ? formatPrice(o.shipping) : 'Free'}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
          </dl>
          <PaymentSummary order={o} className="mt-3 border-t border-dashed border-line pt-4" />
        </section>
      )}
    </div>
  )
}
