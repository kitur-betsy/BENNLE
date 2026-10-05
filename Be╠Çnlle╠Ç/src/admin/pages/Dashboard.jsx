import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, CreditCard, ArrowRight, ArrowUpRight, Banknote, Eye, LayoutTemplate, Mail, Package, Plus, ShoppingBag } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { useAdminAuth } from '../store/auth'
import { cn, date, money, number } from '../lib/utils'
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, StatusPill, Thumb, orderStatus } from '../components/ui'

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

function Tile({ kpi }) {
  const up = kpi.change != null && kpi.change >= 0
  return (
    <Card className="p-5">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{kpi.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.format === 'money' ? money(kpi.value) : number(kpi.value)}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
        {kpi.change == null ? 'No earlier data' : (
          <>
            <span className={cn('inline-flex items-center gap-0.5 font-medium', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(kpi.change).toFixed(0)}%
            </span> vs previous 30 days
          </>
        )}
      </p>
    </Card>
  )
}

// A plain bar strip: easy to read, no chart library.
function Bars({ points }) {
  const max = Math.max(1, ...points.map((p) => p.revenue))
  const total = points.reduce((s, p) => s + p.revenue, 0)
  return (
    <figure aria-label={`Revenue for the last ${points.length} days: ${money(total)}`}>
      <div className="flex h-32 items-end gap-1.5">
        {points.map((p) => (
          <div key={p.date} title={`${date(p.date, { day: 'numeric', month: 'short' })}: ${money(p.revenue)}`} className="group flex h-full flex-1 items-end">
            <div className="w-full rounded-t bg-neutral-900/80 transition-colors group-hover:bg-emerald-600 dark:bg-white/80 dark:group-hover:bg-emerald-400" style={{ height: `${Math.max(3, (p.revenue / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>{date(points[0].date, { day: 'numeric', month: 'short' })}</span><span>{money(total)} in {points.length} days</span><span>Today</span>
      </figcaption>
    </figure>
  )
}

const actions = [
  { to: '/admin/products', icon: Plus, label: 'Add a product' },
  { to: '/admin/website', icon: LayoutTemplate, label: 'Edit homepage' },
  { to: '/admin/interest', icon: Eye, label: 'Shopper interest' },
  { to: '/admin/payouts', icon: Banknote, label: 'Payouts' },
]

export default function Dashboard() {
  const user = useAdminAuth((s) => s.user)
  const { data, loading, error, reload } = useAsync(() => adminApi.dashboard.get(30), [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{greeting()}, {user?.name?.split(' ')[0]}.</h1>
      </div>

      {error ? <Card><ErrorState error={error} onRetry={reload} /></Card> : (
        <>
          {data && (data.pendingCount > 0 || data.unreadMessages > 0 || data.pendingPayments > 0) && (
            <div className="flex flex-wrap gap-2">
              {data.pendingCount > 0 && <Link to="/admin/orders?status=pending" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"><ShoppingBag className="h-3.5 w-3.5" /> {data.pendingCount} {data.pendingCount === 1 ? 'order needs' : 'orders need'} processing <ArrowRight className="h-3.5 w-3.5" /></Link>}
              {data.pendingPayments > 0 && <Link to="/admin/payments?status=pending" className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-sm text-amber-900 hover:border-amber-500 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"><CreditCard className="h-3.5 w-3.5" /> {data.pendingPayments} pending {data.pendingPayments === 1 ? 'payment' : 'payments'} <ArrowRight className="h-3.5 w-3.5" /></Link>}
              {data.unreadMessages > 0 && <Link to="/admin/messages" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"><Mail className="h-3.5 w-3.5" /> {data.unreadMessages} unread {data.unreadMessages === 1 ? 'message' : 'messages'} <ArrowRight className="h-3.5 w-3.5" /></Link>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading && !data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />) : data.kpis.map((k) => <Tile key={k.id} kpi={k} />)}
          </div>

          <Card>
            <CardHeader title="Revenue" description="Daily, last 14 days" />
            <div className="p-6 pt-4">{loading && !data ? <Skeleton className="h-40" /> : <Bars points={data.revenue.slice(-14)} />}</div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent orders" action={<Link to="/admin/orders" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white">View all</Link>} />
              {loading && !data ? <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
                : !data.recentOrders.length ? <EmptyState icon={ShoppingBag} title="No orders yet" description="New orders will show up here." />
                  : (
                    <ul className="divide-y divide-neutral-200 pt-2 dark:divide-neutral-800">
                      {data.recentOrders.map((o) => (
                        <li key={o.id}>
                          <Link to="/admin/orders" className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <div className="min-w-0"><p className="truncate text-sm font-medium">{o.customer.name}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{o.id} · {date(o.date)}</p></div>
                            <div className="flex items-center gap-3"><StatusPill tone={orderStatus[o.status]?.tone}>{o.status}</StatusPill><span className="w-16 text-right text-sm font-medium">{money(o.total)}</span></div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
            </Card>

            <Card>
              <CardHeader title="Best sellers" description="Last 30 days" />
              {loading && !data ? <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
                : !data.topProducts.length ? <EmptyState icon={Package} title="No sales yet" description="Your top products will appear after the first orders." />
                  : (
                    <ul className="divide-y divide-neutral-200 pt-2 dark:divide-neutral-800">
                      {data.topProducts.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 px-6 py-3">
                          <Thumb src={p.image} alt="" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{number(p.units)} sold</p></div>
                          <span className="text-sm font-medium">{money(p.revenue)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
            </Card>
          </div>

          {data?.lowStock.length > 0 && (
            <Card className="p-5">
              <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4 text-amber-500" /> Running low</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.lowStock.slice(0, 8).map((p) => <li key={p.id}><Link to="/admin/products" className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700">{p.name} <span className="font-semibold">{p.stock === 0 ? 'sold out' : `${p.stock} left`}</span></Link></li>)}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {actions.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm font-medium transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"><Icon className="h-4 w-4 text-neutral-500" />{label}</Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
