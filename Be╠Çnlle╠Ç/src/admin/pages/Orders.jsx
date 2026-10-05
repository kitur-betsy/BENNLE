import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Download, Link2, Mail, MapPin, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { cn, date, downloadCsv, money } from '../lib/utils'
import { toast } from '../store/toast'
import { useAdminMeta } from '../store/meta'
import { Avatar, Button, EmptyState, PageHeader, SearchInput, StatusPill, Tabs, Thumb, orderStatus, paymentStatus } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { Drawer } from '../components/overlays'

const flow = ['pending', 'processing', 'shipped', 'delivered']

// Inline status select, styled like a StatusPill
function StatusSelect({ value, onChange }) {
  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <span className={cn('pointer-events-none absolute left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full', {
        amber: 'bg-amber-500', blue: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', red: 'bg-red-500',
      }[orderStatus[value].tone])} />
      <select
        aria-label="Order status"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-full border border-neutral-200 bg-white py-1 pl-6 pr-3 text-xs font-medium hover:border-neutral-400 focus:outline-2 focus:outline-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {Object.entries(orderStatus).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </select>
    </div>
  )
}

export default function Orders() {
  const { data, setData, loading, error, reload } = useAsync(() => adminApi.orders.list(), [])
  const refreshMeta = useAdminMeta((s) => s.refresh)
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(params.get('open'))

  useEffect(() => {
    const next = new URLSearchParams()
    if (status !== 'all') next.set('status', status)
    if (openId) next.set('open', openId)
    setParams(next, { replace: true })
  }, [status, openId, setParams])

  const counts = useMemo(() => {
    const c = { all: data?.length || 0 }
    data?.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1 })
    return c
  }, [data])

  const rows = useMemo(() => {
    if (!data) return null
    const term = q.trim().toLowerCase()
    return data.filter((o) => (status === 'all' || o.status === status) &&
      (!term || `${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(term)))
  }, [data, status, q])

  const updateStatus = async (id, value) => {
    setData((list) => list.map((o) => (o.id === id ? { ...o, status: value } : o)))
    try {
      await adminApi.orders.setStatus(id, value)
      toast.success(`${id} marked ${orderStatus[value].label.toLowerCase()}`)
      refreshMeta()
    } catch (e) { toast.error(e.message); reload() }
  }

  const exportCsv = () => downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Order', 'Date', 'Customer', 'Email', 'Items', 'Status', 'Payment', 'M-Pesa receipt', 'Subtotal', 'Shipping', 'Total'],
    ...(rows || []).map((o) => [o.id, o.date, o.customer.name, o.customer.email, o.items.reduce((s, i) => s + i.qty, 0), o.status, o.paymentStatus, o.mpesaReceipt, o.subtotal, o.shipping, o.total]),
  ])

  const open = data?.find((o) => o.id === openId)

  const columns = [
    { key: 'id', header: 'Order', sortable: true, cell: (o) => <span className="font-medium">{o.id}</span> },
    {
      key: 'customer', header: 'Customer', sortable: true, sortValue: (o) => o.customer.name,
      cell: (o) => (
        <div className="min-w-40">
          <p className="font-medium">{o.customer.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{o.customer.email}</p>
        </div>
      ),
    },
    { key: 'items', header: 'Items', align: 'right', hideOn: 'md', sortable: true, sortValue: (o) => o.items.reduce((s, i) => s + i.qty, 0), cell: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
    { key: 'date', header: 'Date', sortable: true, hideOn: 'sm', sortValue: (o) => new Date(o.date).getTime(), cell: (o) => <span className="whitespace-nowrap text-neutral-600 dark:text-neutral-300">{date(o.date)}</span> },
    { key: 'status', header: 'Status', cell: (o) => <StatusSelect value={o.status} onChange={(v) => updateStatus(o.id, v)} /> },
    { key: 'total', header: 'Total', sortable: true, align: 'right', cell: (o) => <span className="font-medium">{money(o.total)}</span> },
  ]

  const tabs = [{ value: 'all', label: 'All', count: counts.all }, ...Object.entries(orderStatus).map(([k, s]) => ({ value: k, label: s.label, count: counts[k] || 0 }))]

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track, fulfil and update customer orders."
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!rows?.length}>Export CSV</Button>}
      />

      <Tabs tabs={tabs} value={status} onChange={setStatus} className="mb-4" />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(o) => setOpenId(o.id)}
        initialSort={{ key: 'date', dir: 'desc' }}
        toolbar={<SearchInput value={q} onChange={setQ} placeholder="Search by order, name or email…" className="sm:max-w-sm sm:flex-1" />}
        empty={<EmptyState icon={ShoppingBag} title="No orders found" description={q ? 'Try a different search.' : 'Orders with this status will appear here.'} />}
      />

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open ? `Order ${open.id}` : ''}
        description={open ? `Placed ${date(open.date, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
        footer={open && (
          <>
            <Button as="a" variant="ghost" icon={Mail} href={`mailto:${open.customer.email}?subject=Your Benlle order ${open.id}`} className="mr-auto">Email customer</Button>
            {flow.indexOf(open.status) > -1 && flow.indexOf(open.status) < flow.length - 1 && (
              <Button onClick={() => updateStatus(open.id, flow[flow.indexOf(open.status) + 1])}>
                Mark as {orderStatus[flow[flow.indexOf(open.status) + 1]].label.toLowerCase()}
              </Button>
            )}
          </>
        )}
      >
        {open && <OrderDetail order={open} onStatus={(v) => updateStatus(open.id, v)} />}
      </Drawer>
    </div>
  )
}

function OrderDetail({ order, onStatus }) {
  const step = flow.indexOf(order.status)
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Status</p>
        <StatusSelect value={order.status} onChange={onStatus} />
      </div>

      {/* Timeline */}
      {order.status === 'cancelled' ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">This order was cancelled.</p>
      ) : (
        <ol className="grid grid-cols-4 gap-2" aria-label="Fulfilment progress">
          {flow.map((s, i) => (
            <li key={s} className="space-y-2">
              <div className={cn('h-1 rounded-full', i <= step ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-700')} />
              <p className={cn('flex items-center gap-1 text-xs', i <= step ? 'font-medium' : 'text-neutral-400')}>
                {i < step && <Check className="h-3 w-3 text-emerald-500" />}
                {orderStatus[s].label}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Items</h3>
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {order.items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3 p-3">
              <div className="relative">
                <Thumb src={i.image} alt={i.name} />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white dark:bg-white dark:text-neutral-900">{i.qty}</span>
              </div>
              <p className="flex-1 text-sm font-medium">{i.name}</p>
              <p className="text-sm tabular-nums">{money(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping ? money(order.shipping) : 'Free'}</dd></div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Payment</h3>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Method</dt><dd className="mt-0.5 font-medium">{order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod || '—'}</dd></div>
          <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Status</dt><dd className="mt-0.5"><StatusPill tone={paymentStatus[order.paymentStatus]?.tone}>{paymentStatus[order.paymentStatus]?.label || order.paymentStatus}</StatusPill></dd></div>
          <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">M-Pesa receipt</dt><dd className="mt-0.5 font-medium tracking-wide">{order.mpesaReceipt || '—'}</dd></div>
          <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">Paid at</dt><dd className="mt-0.5">{order.paidAt ? date(order.paidAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</dd></div>
        </dl>
        {order.paymentMethod === 'mpesa' && <Link to={`/admin/payments?q=${order.id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><Link2 className="h-3.5 w-3.5" /> View payment attempts</Link>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Customer</h3>
          <div className="flex items-center gap-3">
            <Avatar name={order.customer.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{order.customer.name}</p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{order.customer.email}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Ship to</h3>
          <p className="flex gap-2 text-sm leading-6">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
            <span>{order.address.line1}<br />{order.address.city} {order.address.zip}<br />{order.address.country}</span>
          </p>
        </div>
      </section>
    </div>
  )
}
