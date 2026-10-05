import { Link } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import Reveal from '../ui/Reveal'
import Stars from '../ui/Stars'
import Button from '../ui/Button'
import { formatPrice, cn } from '../../lib/format'
import { useCart } from '../../store/cart'
import { useWishlist } from '../../store/wishlist'
import { useUI } from '../../store/ui'

export default function ProductCard({ product: p, index = 0, dense = false }) {
  const add = useCart((s) => s.add)
  const { has, toggle } = useWishlist()
  // Subscribes to ids so this card re-renders when the wishlist changes,
  // keeping the heart button in sync without passing ids as a prop.
  useWishlist((s) => s.ids)
  const notify = useUI((s) => s.notify)
  const soldOut = p.stock === 0
  if (dense) return (
    <article className="group">
      <div className="relative overflow-hidden rounded-card bg-surface">
        <Link to={`/product/${p.slug}`} aria-label={p.name}>
          <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        {p.badge && <span className="absolute left-3 top-3 rounded-full border border-line bg-bg/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">{p.badge}</span>}
        <button onClick={() => toggle(p.id)} aria-label={`${has(p.id) ? 'Remove' : 'Save'} ${p.name} ${has(p.id) ? 'from' : 'to'} wishlist`} aria-pressed={has(p.id)}
          className="absolute right-3 top-3 rounded-full bg-bg/90 p-2 shadow-sm transition hover:scale-110">
          <Heart className={cn('size-4', has(p.id) && 'fill-current text-danger')} />
        </button>
        <button disabled={soldOut} onClick={() => { add(p); notify(`${p.name} added to bag`) }} aria-label={`Add ${p.name} to cart`}
          className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-inverse text-inverse-fg shadow-sm transition hover:scale-110 disabled:opacity-40">
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium"><Link to={`/product/${p.slug}`}>{p.name}</Link></h3>
          <p className="truncate text-xs text-muted">{soldOut ? 'Sold out' : p.subtitle}</p>
        </div>
        <span className="text-sm font-medium">{formatPrice(p.price)}</span>
      </div>
    </article>
  )
  return (
    <Reveal as="article" variant="card" index={index}
      className="group overflow-hidden rounded-card border border-line bg-elevated transition-all duration-300 hover:scale-105 hover:shadow-lift">
      <div className="relative overflow-hidden">
        <Reveal variant="image" index={1}>
          <Link to={`/product/${p.slug}`}>
            <img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </Link>
        </Reveal>
        {p.badge && <Reveal as="span" variant="fadeIn" index={2} className="absolute left-4 top-4 rounded-full border border-line bg-bg/60 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">{p.badge}</Reveal>}
        <Reveal as="button" variant="rotateIn" index={3} onClick={() => toggle(p.id)} aria-label="Toggle wishlist"
          className="absolute right-4 top-4 rounded-full bg-bg/95 p-2.5 shadow-sm transition hover:scale-110">
          <Heart className={cn('size-4', has(p.id) && 'fill-current text-danger')} />
        </Reveal>
      </div>
      <div className="p-6">
        <header className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Reveal as="h3" variant="text" index={4} className="text-lg font-semibold tracking-tight"><Link to={`/product/${p.slug}`}>{p.name}</Link></Reveal>
            <Reveal as="p" variant="text" index={5} className="mt-1 text-sm text-muted">{p.subtitle}</Reveal>
          </div>
          <Reveal as="span" variant="slideLeft" index={6} className="ml-4 text-lg font-semibold">{formatPrice(p.price)}</Reveal>
        </header>
        <Reveal variant="fadeIn" index={7}><Stars className="mt-4" rating={p.rating} reviews={p.reviews} /></Reveal>
        <Reveal variant="scaleIn" index={8} className="mt-6">
          <Button className="w-full transition-all duration-300 hover:scale-105" disabled={soldOut}
            onClick={() => { add(p); notify(`${p.name} added to bag`) }}>
            {soldOut ? 'Sold out' : <>Add to cart <Plus className="size-4" /></>}
          </Button>
        </Reveal>
      </div>
    </Reveal>
  )
}
