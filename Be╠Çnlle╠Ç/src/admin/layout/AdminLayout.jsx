import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight, Banknote, CreditCard, DatabaseZap, Eye, LayoutDashboard, LayoutTemplate, LogOut, Mail, Moon, Newspaper, Package,
  Settings, ShoppingBag, Sun, Users,
} from 'lucide-react'
import { useAdminAuth, adminLogout } from '../store/auth'
import { useAdminMeta } from '../store/meta'
import { useDb } from '../../store/db'
import { useTheme } from '../lib/useTheme'
import { Avatar, CountBadge, Skeleton } from '../components/ui'
import { Toaster } from '../components/overlays'
import { cn } from '../lib/utils'

const nav = [
  {
    group: 'Manage',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: 'pendingOrders' },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard, badge: 'pendingPayments' },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/interest', label: 'Shopper interest', icon: Eye },
    ],
  },
  {
    group: 'Money',
    items: [{ to: '/admin/payouts', label: 'Payouts', icon: Banknote }],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/website', label: 'Homepage', icon: LayoutTemplate },
      { to: '/admin/journal', label: 'Journal', icon: Newspaper },
      { to: '/admin/messages', label: 'Messages', icon: Mail, badge: 'unreadMessages' },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout() {
  const user = useAdminAuth((s) => s.user)
  const meta = useAdminMeta()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { meta.refresh() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const dbMissing = useDb((s) => s.missing)
  const signOut = () => { adminLogout(); navigate('/admin/login', { replace: true }) }
  const storeName = meta.settings?.name || 'Benlle'

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6 dark:border-neutral-800">
          <Link to="/admin" className="text-lg font-semibold tracking-tight">{storeName}</Link>
          <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">Admin</span>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6" aria-label="Admin">
          {nav.map((section) => (
            <div key={section.group}>
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">{section.group}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-neutral-900 font-medium text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <CountBadge count={meta[item.badge]} inverted={isActive} />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-neutral-200 p-3 dark:border-neutral-800">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            <ArrowUpRight className="h-4 w-4" /> View store
          </a>
          <button onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800">
            <Avatar name={user?.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
            </div>
            <button onClick={signOut} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{storeName}</span>
            <span className="rounded-full border border-neutral-200 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-neutral-500 dark:border-neutral-700">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer" aria-label="View store" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><ArrowUpRight className="h-4 w-4" /></a>
            <button onClick={toggle} aria-label="Toggle theme" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]" aria-label="Admin">
          {nav.flatMap((s) => s.items).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                'relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                isActive ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-400',
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
              {item.badge && meta[item.badge] > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label={`${meta[item.badge]} new`} />}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {dbMissing && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <DatabaseZap className="mt-0.5 h-4 w-4 shrink-0" />
              <p><span className="font-semibold">The database is not set up yet.</span> You are looking at demo data and nothing you change is saved to Supabase. Open Supabase → SQL Editor, paste <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">supabase/setup.sql</code>, run it, then refresh this page.</p>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

function PageFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}
