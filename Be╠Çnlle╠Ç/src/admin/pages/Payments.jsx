import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CreditCard, Download, RefreshCw } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { cn, date, downloadCsv, money } from '../lib/utils'
import { toast } from '../store/toast'
import { useAdminMeta } from '../store/meta'
import { Button, EmptyState, PageHeader, SearchInput, Skeleton, StatusPill, Tabs, paymentStatus } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { Drawer } from '../components/overlays'

// 254712345678 → 2547••••678 (enough to recognise a number, never all of it)
const mask = (p = '') => (p.length >= 9 ? `${p.slice(0, 4)}••••${p.slice(-3)}` : '••••')
const when = (iso) => date(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const sourceLabel = { stk_request: 'Prompt requested', callback: 'Safaricom callback', status_query: 'Status query' }

function Pill({ p }) {
  const s = paymentStatus[p.status] || { tone: 'neutral', label: p.status }
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusPill tone={s.tone}>{s.label}</StatusPill>
      {p.needsReview && <span title="Needs review: amount mismatch" className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle className="h-3 w-3" /> Mismatch</span>}
    </span>
  )
}

export default function Payments() {
  const { data, loading, error, reload } = useAsync(() => adminApi.payments.list(), [])
  const refreshMeta = useAdminMeta((s) => s.refresh)
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') || 'all')
  const [q, setQ] = useState(params.get('q') || '')
  const [openId, setOpenId] = useState(params.get('open'))

  useEffect(() => {
    const next = new URLSearchParams()
    if (status !== 'all') next.set('status', status)
    if (q) next.set('q', q)
    if (openId) next.set('open', openId)
    setParams(next, { replace: true })
  }, [status, q, openId, setParams])

  const counts = useMemo(() => {
    const c = { all: data?.length || 0, review: 0 }
    data?.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; if (p.needsReview) c.review += 1 })
    return c
  }, [data])

  const rows = useMemo(() => {
    if (!data) return null
    const term = q.trim().toLowerCase()
    return data.filter((p) => (status === 'all' || (status === 'review' ? p.needsReview : p.status === status)) &&
      (!term || `${p.receipt || ''} ${p.orderId || ''} ${p.customer.name}`.toLowerCase().includes(term)))
  }, [data, status, q])

  const open = data?.find((p) => p.id === openId)

  const exportCsv = () => downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['Date', 'Order', 'Customer', 'Phone', 'Amount (KES)', 'Status', 'M-Pesa receipt', 'Needs review'],
    ...(rows || []).map((p) => [p.date, p.orderId, p.customer.name, mask(p.phone), p.amount, p.status, p.receipt, p.needsReview ? 'yes' : '']),
  ])

  const columns = [
    { key: 'date', header: 'Date', sortable: true, sortValue: (p) => new Date(p.date).getTime(), cell: (p) => <span className="whitespace-nowrap text-neutral-600 dark:text-neutral-300">{when(p.date)}</span> },
    { key: 'order', header: 'Order', sortable: true, sortValue: (p) => p.orderId || '', cell: (p) => <span className="font-medium">{p.orderId || '—'}</span> },
    { key: 'customer', header: 'Customer', hideOn: 'md', sortable: true, sortValue: (p) => p.customer.name, cell: (p) => <span className="whitespace-nowrap">{p.customer.name}</span> },
    { key: 'phone', header: 'Phone', hideOn: 'sm', cell: (p) => <span className="tabular-nums text-neutral-600 dark:text-neutral-300">{mask(p.phone)}</span> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: (p) => p.amount, cell: (p) => <span className="font-medium">{money(p.amount)}</span> },
    { key: 'status', header: 'Status', cell: (p) => <Pill p={p} /> },
    { key: 'receipt', header: 'Receipt', hideOn: 'sm', cell: (p) => <span className="font-mono text-xs tracking-wide">{p.receipt || '—'}</span> },
  ]

  const tabs = [
    { value: 'all', label: 'All', count: counts.all },
    ...['pending', 'paid', 'failed', 'cancelled', 'timeout'].map((k) => ({ value: k, label: paymentStatus[k].label, count: counts[k] || 0 })),
    ...(counts.review ? [{ value: 'review', label: 'Needs review', count: counts.review }] : []),
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every M-Pesa payment attempt, with the Safaricom receipt once it is confirmed."
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!rows?.length}>Export CSV</Button>}
      />

      <Tabs tabs={tabs} value={status} onChange={setStatus} className="mb-4" />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(p) => setOpenId(p.id)}
        initialSort={{ key: 'date', dir: 'desc' }}
        toolbar={<SearchInput value={q} onChange={setQ} placeholder="Search by receipt or order number…" className="sm:max-w-sm sm:flex-1" />}
        empty={<EmptyState icon={CreditCard} title="No payments found" description={q ? 'Try a different search.' : 'Payments will appear here as customers pay with M-Pesa.'} />}
      />

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Payment ${open.receipt || open.orderId || ''}` : ''} description={open ? `Started ${when(open.date)}` : ''} width="max-w-2xl">
        {open && <PaymentDetail payment={open} onChanged={() => { reload(); refreshMeta() }} />}
      </Drawer>
    </div>
  )
}

function PaymentDetail({ payment: p, onChanged }) {
  const events = useAsync(() => adminApi.payments.events(p.id), [p.id])
  const [checking, setChecking] = useState(false)

  const recheck = async () => {
    setChecking(true)
    try {
      const r = await adminApi.payments.recheck(p.id)
      toast.success(r.status === p.status ? `Still ${r.status}` : `Status is now ${r.status}`)
      events.reload(); onChanged()
    } catch (e) { toast.error(e.message) } finally { setChecking(false) }
  }

  const field = (label, value) => (
    <div><dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt><dd className="mt-0.5 break-all text-sm font-medium">{value || '—'}</dd></div>
  )

  return (
    <div className="space-y-8">
      {p.needsReview && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><span className="font-semibold">Amount mismatch.</span> Safaricom confirmed a different amount from the order total, so the order was not marked paid. Check receipt <span className="font-mono">{p.receipt || '(none)'}</span> in the M-Pesa portal and refund or fulfil by hand.</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Pill p={p} />
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={checking} onClick={recheck} disabled={p.status === 'paid' && !!p.receipt}>Re-check status</Button>
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {field('Amount', money(p.amount))}
        {field('M-Pesa receipt', p.receipt && <span className="font-mono tracking-wide">{p.receipt}</span>)}
        {field('Order', p.orderId && <Link to={`/admin/orders?open=${p.orderId}`} className="underline">{p.orderId}</Link>)}
        {field('Customer', p.customer.name)}
        {field('Phone', mask(p.phone))}
        {field('Paid at (Safaricom)', p.transactionDate && date(p.transactionDate, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}
        {field('Result', p.resultCode != null ? `${p.resultCode}${p.resultDesc ? ` · ${p.resultDesc}` : ''}` : '')}
        {field('Checkout request', p.checkoutRequestId && <span className="font-mono text-xs">{p.checkoutRequestId}</span>)}
      </dl>

      <section>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Event timeline</h3>
        {events.loading && !events.data ? <Skeleton className="h-24 rounded-2xl" /> : events.error ? <p className="text-sm text-red-600">{events.error.message}</p>
          : !events.data?.length ? <p className="text-sm text-neutral-500">No events recorded.</p> : (
            <ol className="space-y-3 border-l border-neutral-200 pl-5 dark:border-neutral-800">
              {events.data.map((e) => (
                <li key={e.id} className="relative">
                  <span className={cn('absolute -left-[26px] top-1.5 h-2 w-2 rounded-full', e.source === 'callback' ? 'bg-emerald-500' : e.source === 'status_query' ? 'bg-sky-500' : 'bg-amber-500')} />
                  <p className="text-sm font-medium">{sourceLabel[e.source] || e.source} <span className="font-normal text-neutral-500 dark:text-neutral-400">· {when(e.created_at)}</span></p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Show payload</summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-neutral-100 p-3 text-xs dark:bg-neutral-800">{JSON.stringify(e.payload, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ol>
          )}
      </section>

      <section>
        <details>
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Raw callback JSON</summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-neutral-100 p-3 text-xs dark:bg-neutral-800">{p.rawCallback ? JSON.stringify(p.rawCallback, null, 2) : 'No callback received yet.'}</pre>
        </details>
      </section>
    </div>
  )
}
