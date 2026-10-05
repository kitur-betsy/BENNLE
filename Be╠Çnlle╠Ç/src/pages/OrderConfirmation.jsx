import { useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { ordersApi, productsApi } from '../api/services'
import { formatPrice, formatDate } from '../lib/format'
import Button from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'
import ProductCard from '../components/shop/ProductCard'
import { OrderTimeline, OrderLines, PaymentSummary } from '../components/shop/OrderParts'
import { Spinner, ErrorState } from '../components/ui/States'

function Suggested({ bought }) {
  const { data } = useAsync(() => productsApi.list({ sort: 'rating' }).then((r) => r.filter((p) => p.stock > 0 && !bought.includes(p.id)).slice(0, 4)), [bought.join()])
  if (!data?.length) return null
  return (
    <section className="container-site py-14">
      <h2 className="serif mb-8 text-2xl md:text-3xl">You might also love</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{data.map((p) => <ProductCard key={p.id} product={p} dense />)}</div>
    </section>
  )
}

const next = [
  ['Confirmation', 'A receipt is on its way to your inbox.'],
  ['We pack it', 'Your order is packed in recyclable glass and paper.'],
  ['It ships', 'You will get tracking details as soon as it leaves us.'],
]

export default function OrderConfirmation() {
  const { id } = useParams()
  const { data: o, loading, error } = useAsync(() => ordersApi.byId(id), [id])
  if (loading) return <Spinner />
  if (error) return <div className="container-site py-20"><ErrorState error={error} /><div className="mt-4 text-center"><Button to="/shop" variant="outline">Back to shop</Button></div></div>
  const name = (o.customer?.name || o.customer || '').toString().split(' ')[0]
  const awaiting = o.paymentStatus && o.paymentStatus !== 'paid'

  return (
    <div>
      <div className="bg-accent/10">
        <Reveal variant="blurSlide" className="container-site py-14 text-center md:py-20">
          <CheckCircle2 className="mx-auto size-14 text-accent-strong dark:text-accent" aria-hidden />
          <h1 className="serif mt-5 text-5xl md:text-7xl">{awaiting ? 'Almost there' : 'Thank you'}{name && <>, <em className="italic">{name}</em></>}</h1>
          <p className="mt-4 text-muted">{awaiting
            ? <>Order <span className="font-medium text-fg">{o.id}</span> is waiting for payment. We'll start packing it as soon as M-Pesa confirms.</>
            : <>Order <span className="font-medium text-fg">{o.id}</span> is confirmed. A receipt is on its way to {o.email}.</>}</p>
        </Reveal>
      </div>

      <div className="container-site grid gap-10 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <section aria-labelledby="progress"><h2 id="progress" className="mb-5 text-sm font-medium uppercase tracking-widest text-muted">Order progress</h2><OrderTimeline status={o.status} /></section>
          <section aria-labelledby="next">
            <h2 id="next" className="mb-5 text-sm font-medium uppercase tracking-widest text-muted">What happens next</h2>
            <ol className="grid gap-4 sm:grid-cols-3">
              {next.map(([t, d], i) => (
                <li key={t} className="rounded-card border border-line p-5"><span className="serif text-3xl italic text-accent-strong dark:text-accent">{i + 1}</span><p className="mt-2 font-medium">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          <div className="rounded-card border border-line border-b-4 border-b-fg/20 bg-elevated p-6 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-muted">Receipt · {formatDate(o.date)}</p>
            <OrderLines items={o.items} className="mt-3" />
            <dl className="mt-3 space-y-2 border-t border-dashed border-line pt-4 text-sm">
              <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              <div className="flex justify-between text-muted"><dt>Shipping</dt><dd>{o.shipping ? formatPrice(o.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
            </dl>
            <PaymentSummary order={o} className="mt-3 border-t border-dashed border-line pt-4" />
          </div>
          <Button to={`/track?id=${o.id}`} variant="outline" className="mt-6 w-full">Track this order</Button>
          <Button to="/shop" variant="ghost" className="mt-2 w-full">Continue shopping</Button>
        </div>
      </div>
      <div className="border-t border-line bg-surface"><Suggested bought={(o.items || []).map((i) => i.id)} /></div>
    </div>
  )
}
