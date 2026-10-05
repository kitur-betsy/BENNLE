import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, Minus, Plus, Truck, ShieldCheck, ChevronRight } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { productsApi } from '../api/services'
import { formatPrice, cn } from '../lib/format'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'
import { useUI } from '../store/ui'
import Button from '../components/ui/Button'
import Stars from '../components/ui/Stars'
import Accordion from '../components/ui/Accordion'
import ProductCard from '../components/shop/ProductCard'
import { Spinner, ErrorState, Skeleton } from '../components/ui/States'

function Detail({ p }) {
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const add = useCart((s) => s.add)
  const inCart = useCart((s) => s.items.find((i) => i.id === p.id)?.qty || 0)
  const { has, toggle } = useWishlist()
  // Subscribes to ids so the heart button stays in sync.
  useWishlist((s) => s.ids)
  const notify = useUI((s) => s.notify)
  const openCart = useUI((s) => s.setCartOpen)
  const gallery = p.gallery?.length ? p.gallery : [p.image]
  const maxQty = Math.max(0, p.stock - inCart)
  const addToCart = () => {
    if (qty > maxQty) return notify(`Only ${p.stock} in stock`, 'error')
    add(p, qty); notify(`${p.name} added to bag`); openCart(true)
  }
  const label = p.stock === 0 ? 'Sold out' : maxQty === 0 ? 'Max in bag' : 'Add to cart'
  const stockNote = p.stock === 0 ? 'Sold out' : p.stock < 10 ? `Only ${p.stock} left` : 'In stock'

  return (
    <div className="container-site pb-28 pt-6 md:pb-16 md:pt-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link to="/shop" className="transition hover:text-fg">Shop</Link>
        <ChevronRight className="size-3" />
        <Link to={`/shop?category=${p.category}`} className="capitalize transition hover:text-fg">{p.category}</Link>
        <ChevronRight className="size-3" />
        <span className="text-fg" aria-current="page">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Gallery: vertical thumbs on desktop, a row under the image on mobile */}
        <div className="flex flex-col gap-3 lg:col-span-7 lg:flex-row-reverse">
          <div className="flex-1 overflow-hidden rounded-2xl bg-surface">
            <img key={active} src={gallery[active]} alt={`${p.name}, view ${active + 1}`} className="aspect-[4/5] w-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 lg:w-20 lg:flex-col">
              {gallery.map((g, i) => (
                <button key={g + i} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-pressed={i === active}
                  className={cn('w-20 overflow-hidden rounded-xl border-2 transition', i === active ? 'border-fg' : 'border-transparent opacity-60 hover:opacity-100')}>
                  <img src={g} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sticky buy box */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            {p.badge && <span className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-strong dark:text-accent">{p.badge}</span>}
            <h1 className="serif text-4xl leading-tight tracking-tight md:text-5xl">{p.name}</h1>
            <p className="mt-2 text-muted">{p.subtitle}</p>
            <Stars className="mt-4" rating={p.rating} reviews={p.reviews} />
            <p className="mt-6 text-3xl font-semibold">{formatPrice(p.price)}</p>
            <p className="mt-1 text-xs text-muted">{p.size} · {stockNote}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Minus className="size-4" /></button>
                <span className="w-5 text-center" aria-live="polite">{qty}</span>
                <button onClick={() => setQty(Math.min(Math.max(1, maxQty), qty + 1))} aria-label="Increase quantity"><Plus className="size-4" /></button>
              </div>
              <Button className="min-w-40 flex-1" disabled={maxQty === 0} onClick={addToCart}>{label}</Button>
              <button onClick={() => toggle(p.id)} aria-pressed={has(p.id)} aria-label="Toggle wishlist" className="rounded-xl border border-line p-3 transition hover:bg-hover">
                <Heart className={cn('size-5', has(p.id) && 'fill-current text-danger')} />
              </button>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><Truck className="size-4 shrink-0" />Free shipping on orders over KES 7,740</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0" />Dermatologist tested · 30-day returns</li>
            </ul>

            <Accordion className="mt-8" items={[
              { title: 'Description', content: <p>{p.description}</p> },
              { title: 'Key ingredients', content: <ul className="flex flex-wrap gap-2">{p.ingredients.map((x) => <li key={x} className="rounded-full border border-line px-3 py-1 text-xs text-fg">{x}</li>)}</ul> },
              { title: 'Size & details', content: <p>{p.size}. Suitable for sensitive skin. Packaged in recyclable glass.</p> },
              { title: 'Shipping & returns', content: <p>Free shipping on orders over KES 7,740, otherwise a flat rate. Returns accepted within 30 days.</p> },
            ]} />
          </div>
        </div>
      </div>

      {/* Mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-sm text-muted">{formatPrice(p.price)}</p></div>
        <Button disabled={maxQty === 0} onClick={addToCart}>{label}</Button>
      </div>
    </div>
  )
}

function PairsWith({ p }) {
  const state = useAsync(() => productsApi.list().then((r) => {
    const others = r.filter((x) => x.id !== p.id && x.stock > 0)
    return [...others.filter((x) => x.category !== p.category), ...others.filter((x) => x.category === p.category)].slice(0, 4)
  }), [p.id])
  if (state.data && !state.data.length) return null
  return (
    <section className="border-t border-line bg-surface">
      <div className="container-site py-14">
        <h2 className="serif mb-8 text-2xl md:text-3xl">Pairs well with</h2>
        {state.loading
          ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
          : state.error ? <ErrorState error={state.error} />
            : <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{state.data.map((x) => <ProductCard key={x.id} product={x} dense />)}</div>}
      </div>
    </section>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: p, loading, error } = useAsync(() => productsApi.bySlug(slug), [slug])
  if (loading) return <Spinner />
  if (error) return (
    <div className="container-site py-20">
      <ErrorState error={error} />
      <Link to="/shop" className="mt-4 block text-center text-sm underline">Back to shop</Link>
    </div>
  )
  return <><Detail key={p.id} p={p} /><PairsWith p={p} /></>
}
