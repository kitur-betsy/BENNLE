import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { X, Minus, Plus, Search, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { contentApi, productsApi } from '../../api/services'
import { useAsync } from '../../lib/useAsync'
import { site } from '../../config/site'
import { useSettings } from '../../store/settings'
import { drawer } from '../../lib/motion'
import { formatPrice } from '../../lib/format'
import { useCart } from '../../store/cart'
import { useUI } from '../../store/ui'
import Button from '../ui/Button'

function Drawer({ open, onClose, side, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside variants={drawer[side]} initial="hidden" animate="show" exit="hidden" transition={drawer.transition}
            className={`absolute top-0 flex h-full w-full max-w-sm flex-col bg-bg p-6 shadow-lift ${side === 'left' ? 'left-0' : 'right-0'}`}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">{title}</span>
              <button onClick={onClose} className="rounded-md p-2 hover:bg-hover" aria-label="Close"><X className="size-5" /></button>
            </div>
            {children}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI()
  const navigate = useNavigate()
  const { items, setQty, remove } = useCart()
  const subtotal = useCart((s) => s.subtotal())
  const shipping = useCart((s) => s.shipping())
  const threshold = useSettings((s) => s.freeShippingThreshold)
  const left = Math.max(0, threshold - subtotal)
  return (
    <Drawer open={cartOpen} onClose={() => setCartOpen(false)} side="right" title="Your bag">
      {items.length === 0 ? (
        <div className="grid flex-1 place-items-center text-center text-muted">
          <div><ShoppingBag className="mx-auto mb-3 size-8" />Your bag is empty.</div>
        </div>
      ) : (
        <>
          <ul className="-mx-2 flex-1 space-y-4 overflow-y-auto px-2">
            {items.map((i) => (
              <li key={i.id} className="flex gap-4">
                <img src={i.image} alt={i.name} className="size-20 rounded-xl object-cover" />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between gap-2"><Link to={`/product/${i.slug}`} onClick={() => setCartOpen(false)} className="font-medium">{i.name}</Link><span>{formatPrice(i.price * i.qty)}</span></div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded-md border border-line p-1" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease"><Minus className="size-3" /></button>
                    <span className="w-5 text-center">{i.qty}</span>
                    <button className="rounded-md border border-line p-1" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase"><Plus className="size-3" /></button>
                    <button className="ml-auto text-xs text-muted underline" onClick={() => remove(i.id)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
            <p className="text-muted">{left > 0 ? `Add ${formatPrice(left)} more for free shipping` : 'You have free shipping'}</p>
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : 'Free'}</span></div>
            <Button className="w-full" onClick={() => { setCartOpen(false); navigate('/checkout') }}>Checkout</Button>
          </div>
        </>
      )}
    </Drawer>
  )
}

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen, setSearchOpen } = useUI()
  const { data: content } = useAsync(contentApi.home)
  const close = () => setMobileNavOpen(false)
  return (
    <Drawer open={mobileNavOpen} onClose={close} side="left" title="Menu">
      <nav className="flex flex-col gap-4">
        {(content?.navigation || site.nav).map((n) => <Link key={n.label} to={n.to} onClick={close} className="transition hover:text-muted">{n.label}</Link>)}
      </nav>
      <button onClick={() => { close(); setSearchOpen(true) }} className="mt-8 flex w-full items-center justify-between rounded-lg border border-line px-4 py-2 hover:bg-hover">
        Search <Search className="size-4" />
      </button>
    </Drawer>
  )
}

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUI()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    let live = true
    const t = setTimeout(() => productsApi.list({ q: q.trim() }).then((r) => live && setResults(r.slice(0, 5))), 200)
    return () => { live = false; clearTimeout(t) }
  }, [q])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSearchOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen])
  const close = () => { setSearchOpen(false); setQ('') }
  const go = (e) => { e.preventDefault(); if (!q.trim()) return; navigate(`/shop?q=${encodeURIComponent(q.trim())}`); close() }
  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 pt-24 sm:p-6 sm:pt-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-elevated shadow-lift">
            <form onSubmit={go} className="flex items-center gap-3 px-5 py-4">
              <Search className="size-5 text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="flex-1 bg-transparent outline-none" />
              <button type="button" onClick={close} aria-label="Close search"><X className="size-4 text-muted" /></button>
            </form>
            {results.length > 0 && (
              <ul className="border-t border-line p-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link to={`/product/${p.slug}`} onClick={close} className="flex items-center gap-3 rounded-lg p-2 hover:bg-hover">
                      <img src={p.image} alt="" className="size-10 rounded-lg object-cover" />
                      <span className="flex-1 text-sm font-medium">{p.name}</span>
                      <span className="text-sm text-muted">{formatPrice(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {q.trim().length >= 2 && results.length === 0 && <p className="border-t border-line p-4 text-sm text-muted">No matches. Press Enter to search the shop.</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
