import { useMemo, useState } from 'react'
import { Heart, ShoppingBag, Users } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { number, timeAgo } from '../lib/utils'
import { Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, Tabs, Thumb } from '../components/ui'

const kindLabel = { add_to_cart: 'Added to cart', wishlist_add: 'Saved to wishlist', wishlist_remove: 'Removed from wishlist' }

const Stat = ({ icon: Icon, label, value }) => (
  <Card className="flex items-center gap-4 p-5">
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Icon className="h-4 w-4" /></span>
    <div><p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p><p className="text-2xl font-semibold tracking-tight">{number(value)}</p></div>
  </Card>
)

export default function Interest() {
  const { data, loading, error, reload } = useAsync(() => adminApi.interest.get(), [])
  const [tab, setTab] = useState('products')
  const rows = useMemo(() => data?.products ?? [], [data])

  return (
    <div>
      <PageHeader eyebrow="Manage" title="Shopper interest" description="What visitors wanted to buy: items they added to a cart or saved, next to what they actually ordered." />
      {error ? <Card><ErrorState error={error} onRetry={reload} /></Card> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {loading && !data ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[84px] rounded-2xl" />) : (
              <>
                <Stat icon={ShoppingBag} label="Added to cart" value={data.totals.carted} />
                <Stat icon={Heart} label="Saved to wishlist" value={data.totals.saved} />
                <Stat icon={Users} label="Different shoppers" value={data.totals.shoppers} />
              </>
            )}
          </div>
          <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'products', label: 'By product' }, { value: 'recent', label: 'Recent activity' }]} />
          <Card className="overflow-hidden">
            {loading && !data ? <div className="space-y-3 p-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
              : !data.recent.length ? <EmptyState icon={ShoppingBag} title="No activity yet" description="When visitors add products to their cart or wishlist, you will see them here." />
                : tab === 'products' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                      <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        <tr><th className="px-6 py-3 font-medium">Product</th><th className="px-3 py-3 text-right font-medium">In carts</th><th className="px-3 py-3 text-right font-medium">Saved</th><th className="px-3 py-3 text-right font-medium">Ordered</th><th className="px-6 py-3 text-right font-medium">Not yet bought</th></tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td className="px-6 py-3"><div className="flex items-center gap-3"><Thumb src={r.image} alt="" /><span className="font-medium">{r.name}</span></div></td>
                            <td className="px-3 py-3 text-right tabular-nums">{number(r.carted)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{number(r.saved)}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{number(r.ordered)}</td>
                            <td className="px-6 py-3 text-right tabular-nums font-medium">{number(Math.max(0, r.carted - r.ordered))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <CardHeader title="Latest 60 events" description="Signed-in shoppers show their email; everyone else is a guest." className="pb-3" />
                    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {data.recent.map((a) => (
                        <li key={a.id} className="flex items-center gap-3 px-6 py-3">
                          <Thumb src={a.image} alt="" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.name}</p>
                            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{kindLabel[a.kind]}{a.kind === 'add_to_cart' && a.qty > 1 ? ` ×${a.qty}` : ''} · {a.email || 'Guest'}</p>
                          </div>
                          <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(a.date)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
          </Card>
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Counts start from when tracking began. “Not yet bought” is units added to carts minus units ordered.</p>
        </>
      )}
    </div>
  )
}
