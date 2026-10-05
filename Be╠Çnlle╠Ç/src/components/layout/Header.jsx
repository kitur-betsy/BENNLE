import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Heart, ShoppingBag, Sun, Moon, ChevronDown, ArrowRight } from 'lucide-react'
import { site } from '../../config/site'
import { useSettings } from '../../store/settings'
import { variants, dropdown, stagger } from '../../lib/motion'
import { useCart } from '../../store/cart'
import { useUI } from '../../store/ui'
import { useWishlist } from '../../store/wishlist'
import { useAsync } from '../../lib/useAsync'
import { contentApi } from '../../api/services'

const iconBtn = 'p-2 rounded-md hover:bg-hover transition-colors'

function CollectionsMenu({ item }) {
  const [open, setOpen] = useState(false)
  const { data } = useAsync(contentApi.home)
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link to={item.to} className="flex items-center gap-1 transition hover:text-muted">
        {item.label}
        <ChevronDown className="size-3 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </Link>
      <AnimatePresence>
        {open && data && (
          <motion.div variants={dropdown} initial="hidden" animate="show" exit="hidden"
            className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-2">
            <div className="rounded-xl border border-line bg-elevated p-6 shadow-lift">
              <div className="grid gap-4">
                {data.menu.map((c) => (
                  <Link key={c.id} to={`/shop?category=${c.category}`} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-hover">
                    <img src={c.image} alt="" className="size-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-medium">{c.title}</h4>
                      <p className="text-xs text-muted">{c.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 border-t border-line pt-4">
                <Link to="/#collections" className="flex items-center gap-2 text-sm font-medium transition hover:text-muted">
                  View all collections <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header() {
  const { name, announcements } = useSettings()
  const { data: content } = useAsync(contentApi.home)
  const nav = content?.navigation || site.nav
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))
  const wishCount = useWishlist((s) => s.ids.length)
  const { setCartOpen, setMobileNavOpen, setSearchOpen, toggleTheme } = useUI()
  const dark = useUI((s) => s.theme) === 'dark'

  return (
    <>
      <motion.div variants={variants.slideDown} initial="hidden" animate="show" className={`${announcements.some(Boolean) ? 'hidden sm:block' : 'hidden'} bg-inverse text-sm text-inverse-fg`}>
        <div className="container-site flex items-center justify-between py-2">
          {announcements.filter(Boolean).map((a, i) => (
            <motion.p key={a} variants={variants.text} initial="hidden" animate="show" transition={{ delay: stagger(i + 1) }} className="opacity-90">{a}</motion.p>
          ))}
        </div>
      </motion.div>
      <motion.header variants={variants.blurSlide} initial="hidden" animate="show"
        className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
        <div className="container-site flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <button className={`${iconBtn} sm:hidden`} onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
            <Link to="/" className="text-lg font-semibold tracking-tight">{name}</Link>
          </div>
          <nav className="hidden items-center gap-8 text-sm sm:flex">
            {nav.map((n, i) => (
              <motion.div key={n.label} variants={variants.fadeIn} initial="hidden" animate="show" transition={{ delay: stagger(i + 2) }}>
                {n.dropdown ? <CollectionsMenu item={n} /> : <NavLink to={n.to} className="transition hover:text-muted">{n.label}</NavLink>}
              </motion.div>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button className={`${iconBtn} hidden sm:inline-flex`} onClick={() => setSearchOpen(true)} aria-label="Search"><Search className="size-5" /></button>
            <Link to="/wishlist" className={`${iconBtn} relative`} aria-label="Wishlist">
              <Heart className="size-5" />
              {wishCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-inverse text-[10px] text-inverse-fg">{wishCount}</span>}
            </Link>
            <button className={`${iconBtn} relative`} onClick={() => setCartOpen(true)} aria-label="Open cart">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-inverse text-[10px] text-inverse-fg">{count}</motion.span>
              )}
            </button>
            <button onClick={toggleTheme} className="ml-1 inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 transition-colors hover:bg-hover">
              {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="text-xs">{dark ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
      </motion.header>
    </>
  )
}
