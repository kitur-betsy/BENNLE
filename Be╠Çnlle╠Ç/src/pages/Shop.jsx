import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { productsApi } from '../api/services'
import ProductGrid from '../components/shop/ProductGrid'
import { cn } from '../lib/format'

const prices = [
  { id: '', label: 'Any price' },
  { id: 'lt25', label: 'Under KES 3,000', test: (p) => p.price < 3000 },
  { id: '25-50', label: 'KES 3,000 – 6,500', test: (p) => p.price >= 3000 && p.price <= 6500 },
  { id: 'gt50', label: 'Over KES 6,500', test: (p) => p.price > 6500 },
]
const sorts = [['', 'Featured'], ['rating', 'Top rated'], ['price-asc', 'Price: low → high'], ['price-desc', 'Price: high → low']]

function Filters({ price, stock, set }) {
  return (
    <div className="space-y-8 text-sm">
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">Price</legend>
        <div className="space-y-2">
          {prices.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="price" checked={price === o.id} onChange={() => set('price', o.id)} className="size-4 accent-[var(--fg)]" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={stock} onChange={(e) => set('stock', e.target.checked ? '1' : '')} className="size-4 accent-[var(--fg)]" />
          In stock only
        </label>
      </fieldset>
    </div>
  )
}

function FilterDrawer({ open, onClose, children }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Filters" className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-bg p-6 shadow-lift">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold">Filters</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close filters" className="rounded-md p-1.5 hover:bg-hover"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        <button onClick={onClose} className="mt-6 rounded-xl bg-inverse py-3 font-medium text-inverse-fg">Show results</button>
      </div>
    </div>
  )
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const category = params.get('category') || ''
  const sort = params.get('sort') || ''
  const q = params.get('q') || ''
  const price = params.get('price') || ''
  const stock = params.get('stock') === '1'
  const cats = useAsync(productsApi.categories)
  const raw = useAsync(() => productsApi.list({ category, sort, q }), [category, sort, q])
  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }) }

  const state = useMemo(() => {
    if (!raw.data) return raw
    const test = prices.find((p) => p.id === price)?.test
    return { ...raw, data: raw.data.filter((p) => (!test || test(p)) && (!stock || p.stock > 0)) }
  }, [raw, price, stock])

  const catLabel = cats.data?.find((c) => c.id === category)?.label
  const active = [
    q && { key: 'q', label: `“${q}”` },
    catLabel && { key: 'category', label: catLabel },
    price && { key: 'price', label: prices.find((p) => p.id === price)?.label },
    stock && { key: 'stock', label: 'In stock' },
  ].filter(Boolean)
  const count = state.data?.length

  return (
    <div className="container-site py-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {q ? 'Search' : catLabel || 'Shop'} <span className="ml-1 text-sm font-normal text-muted" aria-live="polite">{count != null && `${count} ${count === 1 ? 'product' : 'products'}`}</span>
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawer(true)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover lg:hidden">
            <SlidersHorizontal className="size-4" /> Filters{active.length > 0 && ` (${active.length})`}
          </button>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => set('sort', e.target.value)} className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm">
            {sorts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <nav aria-label="Categories" className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto border-b border-line px-6 pb-4">
        {[{ id: '', label: 'All' }, ...(cats.data || [])].map((c) => (
          <button key={c.id} onClick={() => set('category', c.id)} aria-pressed={category === c.id}
            className={cn('shrink-0 rounded-full border px-4 py-1.5 text-sm transition',
              category === c.id ? 'border-fg bg-fg text-bg' : 'border-line text-muted hover:border-fg hover:text-fg')}>
            {c.label}
          </button>
        ))}
      </nav>

      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {active.map((a) => (
            <button key={a.key} onClick={() => set(a.key, '')} className="inline-flex items-center gap-1.5 rounded-full bg-hover px-3 py-1 text-xs">
              {a.label} <X className="size-3" /><span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button onClick={() => setParams({}, { replace: true })} className="text-xs text-muted underline">Clear all</button>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[13rem_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-24"><Filters price={price} stock={stock} set={set} /></div></aside>
        <ProductGrid state={state} dense empty="No products match these filters." />
      </div>

      <FilterDrawer open={drawer} onClose={() => setDrawer(false)}><Filters price={price} stock={stock} set={set} /></FilterDrawer>
    </div>
  )
}
