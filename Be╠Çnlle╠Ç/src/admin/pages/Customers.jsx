import { useMemo, useState } from 'react'
import { Download, Mail, Phone, Users } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { date, downloadCsv, money } from '../lib/utils'
import { Avatar, Button, Card, EmptyState, PageHeader, SearchInput, Skeleton, StatusPill, orderStatus } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { Drawer } from '../components/overlays'

export default function Customers() {
  const { data, loading, error, reload } = useAsync(() => adminApi.customers.list(), [])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  const rows = useMemo(() => {
    if (!data) return null
    const t = q.trim().toLowerCase()
    return data.filter((c) => !t || `${c.name} ${c.email}`.toLowerCase().includes(t))
  }, [data, q])

  const stats = useMemo(() => {
    if (!data) return null
    const buyers = data.filter((c) => c.orders > 0)
    return {
      total: data.length,
      repeat: buyers.length ? Math.round((data.filter((c) => c.orders > 1).length / buyers.length) * 100) : 0,
      ltv: buyers.length ? buyers.reduce((s, c) => s + c.spent, 0) / buyers.length : 0,
    }
  }, [data])

  const columns = [
    {
      key: 'name', header: 'Customer', sortable: true,
      cell: (c) => (
        <div className="flex min-w-48 items-center gap-3">
          <Avatar name={c.name} />
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'orders', header: 'Orders', sortable: true, align: 'right' },
    { key: 'spent', header: 'Spent', sortable: true, align: 'right', cell: (c) => <span className="font-medium">{money(c.spent)}</span> },
    { key: 'lastOrder', header: 'Last order', sortable: true, hideOn: 'md', sortValue: (c) => (c.lastOrder ? new Date(c.lastOrder).getTime() : 0), cell: (c) => <span className="text-neutral-600 dark:text-neutral-300">{date(c.lastOrder)}</span> },
    { key: 'joined', header: 'Joined', sortable: true, hideOn: 'sm', sortValue: (c) => new Date(c.joined).getTime(), cell: (c) => <span className="text-neutral-600 dark:text-neutral-300">{date(c.joined)}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone who has shopped with you."
        actions={
          <Button variant="secondary" icon={Download} disabled={!rows?.length} onClick={() => downloadCsv('customers.csv', [
            ['Name', 'Email', 'Phone', 'Orders', 'Spent', 'Joined'],
            ...rows.map((c) => [c.name, c.email, c.phone, c.orders, c.spent, c.joined]),
          ])}>Export CSV</Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Customers', stats?.total],
          ['Repeat purchase rate', stats && `${stats.repeat}%`],
          ['Avg. lifetime value', stats && money(stats.ltv)],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
            {value != null ? <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p> : <Skeleton className="mt-2 h-7 w-20" />}
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setOpen}
        initialSort={{ key: 'spent', dir: 'desc' }}
        toolbar={<SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" className="sm:max-w-sm sm:flex-1" />}
        empty={<EmptyState icon={Users} title="No customers found" description={q ? 'Try a different search.' : 'Customers appear here after their first order.'} />}
      />

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} description={open && `Customer since ${date(open.joined, { month: 'long', year: 'numeric' })}`}>
        {open && <CustomerDetail customer={open} />}
      </Drawer>
    </div>
  )
}

function CustomerDetail({ customer }) {
  const { data: orders } = useAsync(() => adminApi.customers.orders(customer.id), [customer.id])
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar name={customer.name} className="h-14 w-14 text-base" />
        <div className="space-y-1 text-sm">
          <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:underline"><Mail className="h-4 w-4 text-neutral-400" />{customer.email}</a>
          {customer.phone && <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 text-neutral-400" />{customer.phone}</a>}
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {[['Orders', customer.orders], ['Spent', money(customer.spent)], ['Avg. order', money(customer.orders ? customer.spent / customer.orders : 0)]].map(([k, v]) => (
          <div key={k} className="p-4">
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">{k}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Order history</h3>
        {!orders ? <Skeleton className="h-40 rounded-2xl" /> : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{date(o.date)} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}</p>
                </div>
                <StatusPill tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</StatusPill>
                <span className="w-20 text-right font-medium tabular-nums">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
