import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useAsync } from '../../lib/useAsync'
import { productsApi } from '../../api/services'
import { formatPrice, cn } from '../../lib/format'

const payLabel = { paid: 'Paid', pending: 'Awaiting payment', unpaid: 'Not paid', failed: 'Payment failed', refunded: 'Refunded' }
const methodLabel = { mpesa: 'M-Pesa' }

// Payment method, status and M-Pesa receipt. Renders nothing for orders that predate payments.
export function PaymentSummary({ order, className }) {
  if (!order?.paymentMethod && !order?.paymentStatus) return null
  const paid = order.paymentStatus === 'paid'
  return (
    <dl className={cn('space-y-2 text-sm', className)}>
      <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd>{methodLabel[order.paymentMethod] || order.paymentMethod || '—'}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className={cn('font-medium', paid ? 'text-accent-strong dark:text-accent' : order.paymentStatus === 'failed' ? 'text-danger' : '')}>{payLabel[order.paymentStatus] || order.paymentStatus}</dd></div>
      {paid && <div className="flex justify-between"><dt className="text-muted">M-Pesa receipt</dt><dd className="font-medium tracking-wide">{order.mpesaReceipt || 'Sent by SMS'}</dd></div>}
    </dl>
  )
}

const steps = [
  ['pending', 'Order placed'],
  ['processing', 'Preparing'],
  ['shipped', 'On its way'],
  ['delivered', 'Delivered'],
]

// Horizontal on wide screens, vertical on narrow. Cancelled orders show a single terminal state.
export function OrderTimeline({ status, className }) {
  if (status === 'cancelled') return (
    <p className={cn('flex items-center gap-2 text-sm text-danger', className)}><X className="size-4" /> This order was cancelled.</p>
  )
  const current = Math.max(0, steps.findIndex(([k]) => k === status))
  return (
    <ol className={cn('grid gap-4 sm:grid-cols-4', className)}>
      {steps.map(([k, label], i) => {
        const done = i <= current
        return (
          <li key={k} aria-current={i === current ? 'step' : undefined} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <div className="flex items-center sm:w-full">
              <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border text-xs', done ? 'border-accent-strong bg-accent-strong text-white' : 'border-line text-muted')}>
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className={cn('ml-2 hidden h-px flex-1 sm:block', i < current ? 'bg-accent-strong' : 'bg-line')} />}
            </div>
            <span className={cn('text-sm', done ? 'font-medium' : 'text-muted')}>{label}{i === current && <span className="sr-only"> (current)</span>}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Orders only store id/qty/price, so names and images are looked up from the catalogue.
export function OrderLines({ items = [], className }) {
  const { data } = useAsync(() => productsApi.list({ includeDrafts: true }))
  const byId = Object.fromEntries((data || []).map((p) => [p.id, p]))
  if (!items.length) return null
  return (
    <ul className={cn('divide-y divide-line', className)}>
      {items.map((i) => {
        const p = byId[i.id]
        return (
          <li key={i.id} className="flex items-center gap-4 py-3">
            {p ? <img src={p.image} alt="" className="size-14 rounded-lg object-cover" /> : <div className="size-14 rounded-lg bg-hover" />}
            <div className="min-w-0 flex-1">
              {p ? <Link to={`/product/${p.slug}`} className="block truncate text-sm font-medium hover:underline">{p.name}</Link> : <span className="text-sm font-medium">Item {i.id}</span>}
              <p className="text-xs text-muted">Qty {i.qty} · {formatPrice(i.price)} each</p>
            </div>
            <span className="text-sm font-medium">{formatPrice(i.price * i.qty)}</span>
          </li>
        )
      })}
    </ul>
  )
}
