import { Link } from 'react-router-dom'
import { Heart, Plus, X } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { productsApi } from '../api/services'
import { useWishlist } from '../store/wishlist'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { formatPrice, cn } from '../lib/format'
import Button from '../components/ui/Button'
import { Skeleton, ErrorState } from '../components/ui/States'

// Mixed aspect ratios give the CSS-column masonry its collage feel.
const ratios = ['aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/6]']

export function WishlistTiles({ products }) {
  const toggle = useWishlist((s) => s.toggle)
  const add = useCart((s) => s.add)
  const notify = useUI((s) => s.notify)
  return (
    <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {products.map((p, i) => (
        <li key={p.id} className="group mb-4 break-inside-avoid">
          <div className="relative overflow-hidden rounded-card bg-elevated shadow-soft">
            <Link to={`/product/${p.slug}`}><img src={p.image} alt={p.name} loading="lazy" className={cn('w-full object-cover transition-transform duration-500 group-hover:scale-105', ratios[i % ratios.length])} /></Link>
            <button onClick={() => toggle(p.id)} aria-label={`Remove ${p.name} from wishlist`} className="absolute right-3 top-3 rounded-full bg-bg/90 p-2 shadow-sm transition hover:scale-110"><X className="size-4" /></button>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-white">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-neutral-200">{formatPrice(p.price)}</p></div>
              <button disabled={p.stock === 0} onClick={() => { add(p); notify(`${p.name} added to bag`) }} aria-label={p.stock === 0 ? `${p.name} is sold out` : `Add ${p.name} to cart`}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-neutral-900 transition hover:scale-110 disabled:opacity-40"><Plus className="size-4" /></button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids)
  const all = useAsync(() => productsApi.list())
  const saved = (all.data || []).filter((p) => ids.includes(p.id))
  const add = useCart((s) => s.add)
  const notify = useUI((s) => s.notify)
  const addAll = () => { const ok = saved.filter((p) => p.stock > 0); ok.forEach((p) => add(p)); notify(`${ok.length} added to bag`) }

  return (
    <div className="dots min-h-[70vh] bg-surface">
      <div className="container-site py-10 md:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="serif text-4xl md:text-5xl">Your <em className="italic">wishlist</em></h1>
            <p className="mt-2 text-sm text-muted" aria-live="polite">{ids.length ? `${saved.length || ids.length} saved ${ids.length === 1 ? 'piece' : 'pieces'}` : 'A place for everything you love.'}</p>
          </div>
          {saved.length > 1 && <Button variant="outline" onClick={addAll}>Add all to bag</Button>}
        </div>

        {all.error && <ErrorState error={all.error} />}
        {all.loading && ids.length > 0 && <div className="columns-2 gap-4 md:columns-3 lg:columns-4">{[56, 72, 64, 80].map((h, i) => <Skeleton key={i} className="mb-4 break-inside-avoid" style={{ height: h * 4 }} />)}</div>}
        {!all.loading && !all.error && saved.length > 0 && <WishlistTiles products={saved} />}
        {!all.loading && !all.error && saved.length === 0 && (
          <div className="mx-auto max-w-md rounded-panel border border-dashed border-line bg-bg px-8 py-14 text-center">
            <Heart className="mx-auto size-10 text-muted" />
            <h2 className="serif mt-4 text-2xl">Nothing saved yet</h2>
            <p className="mt-2 text-sm text-muted">Tap the heart on anything that catches your eye and it will wait for you here.</p>
            <Button to="/shop" className="mt-6">Browse the shop</Button>
          </div>
        )}
      </div>
    </div>
  )
}
