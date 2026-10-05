import { useMemo, useState } from 'react'
import { ArrowLeft, Download, Inbox, Mail, MailOpen, Reply, Trash2, UserMinus, UserPlus, Users } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { cn, date, downloadCsv, timeAgo } from '../lib/utils'
import { toast } from '../store/toast'
import { useAdminMeta } from '../store/meta'
import { Avatar, Button, Card, EmptyState, ErrorState, IconButton, PageHeader, SearchInput, Skeleton, StatusPill, Tabs } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { ConfirmDialog } from '../components/overlays'

export default function Messages() {
  const [tab, setTab] = useState('inbox')
  const messages = useAsync(() => adminApi.messages.list(), [])
  const subscribers = useAsync(() => adminApi.subscribers.list(), [])
  const unread = messages.data?.filter((m) => !m.read).length ?? 0
  const active = subscribers.data?.filter((s) => s.active).length ?? 0

  return (
    <div>
      <PageHeader eyebrow="Website" title="Messages" description="Contact form enquiries and newsletter subscribers." />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'inbox', label: 'Inbox', icon: Inbox, count: unread || undefined },
          { value: 'subscribers', label: 'Subscribers', icon: Users, count: active },
        ]}
      />
      {tab === 'inbox' ? <InboxView state={messages} /> : <SubscribersView state={subscribers} />}
    </div>
  )
}

/* ---------------------------------- Inbox -------------------------------- */

function InboxView({ state }) {
  const { data, setData, loading, error, reload } = state
  const refreshMeta = useAdminMeta((s) => s.refresh)
  const [openId, setOpenId] = useState(null)
  const [q, setQ] = useState('')
  const [deleting, setDeleting] = useState(null)

  const list = useMemo(() => {
    if (!data) return []
    const t = q.trim().toLowerCase()
    return [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((m) => !t || `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(t))
  }, [data, q])
  const open = data?.find((m) => m.id === openId)

  const setRead = async (m, read) => {
    setData((l) => l.map((x) => (x.id === m.id ? { ...x, read } : x)))
    await adminApi.messages.update(m.id, { read })
    refreshMeta()
  }
  const select = (m) => { setOpenId(m.id); if (!m.read) setRead(m, true) }

  if (error) return <Card><ErrorState error={error} onRetry={reload} /></Card>
  if (loading && !data) return <Skeleton className="h-[540px] rounded-2xl" />
  if (data.length === 0) return <Card><EmptyState icon={Inbox} title="Inbox zero" description="Messages from the contact form will land here." /></Card>

  return (
    <Card className="grid min-h-[540px] overflow-hidden lg:grid-cols-[360px_1fr]">
      {/* List */}
      <div className={cn('flex flex-col border-neutral-200 lg:border-r dark:border-neutral-800', open && 'hidden lg:flex')}>
        <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
          <SearchInput value={q} onChange={setQ} placeholder="Search messages…" />
        </div>
        <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
          {list.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => select(m)}
                className={cn('flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  m.id === openId && 'bg-neutral-50 dark:bg-neutral-800/60')}
              >
                <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', m.read ? 'bg-transparent' : 'bg-emerald-500')} aria-label={m.read ? undefined : 'Unread'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-sm', !m.read && 'font-semibold')}>{m.name}</p>
                    <span className="shrink-0 text-xs text-neutral-400">{timeAgo(m.date)}</span>
                  </div>
                  <p className={cn('truncate text-sm', m.read ? 'text-neutral-600 dark:text-neutral-400' : 'font-medium')}>{m.subject}</p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-500">{m.message}</p>
                </div>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="p-8 text-center text-sm text-neutral-500">No messages match.</li>}
        </ul>
      </div>

      {/* Reading pane */}
      <div className={cn('flex flex-col', !open && 'hidden lg:flex')}>
        {open ? (
          <>
            <div className="flex items-center gap-1 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
              <IconButton icon={ArrowLeft} label="Back to inbox" onClick={() => setOpenId(null)} className="lg:hidden" />
              <div className="flex-1" />
              <IconButton icon={open.read ? Mail : MailOpen} label={open.read ? 'Mark as unread' : 'Mark as read'} onClick={() => setRead(open, !open.read)} />
              <IconButton icon={Trash2} label="Delete message" onClick={() => setDeleting(open)} className="hover:text-red-600" />
            </div>
            <article className="flex-1 overflow-y-auto p-6 lg:p-8">
              <h2 className="text-xl font-semibold tracking-tight">{open.subject}</h2>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={open.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{open.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{open.email}</p>
                </div>
                <p className="text-xs text-neutral-500">{date(open.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-neutral-700 dark:text-neutral-300">{open.message}</p>
              <Button as="a" icon={Reply} href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`} className="mt-8">Reply by email</Button>
            </article>
          </>
        ) : (
          <EmptyState icon={Mail} title="Select a message" description="Choose a message from the list to read it." className="m-auto" />
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this message?"
        description={`From ${deleting?.name}: “${deleting?.subject}”`}
        onConfirm={async () => {
          await adminApi.messages.remove(deleting.id)
          setData((l) => l.filter((x) => x.id !== deleting.id))
          if (openId === deleting.id) setOpenId(null)
          setDeleting(null)
          toast.success('Message deleted')
          refreshMeta()
        }}
      />
    </Card>
  )
}

/* ------------------------------- Subscribers ----------------------------- */

function SubscribersView({ state }) {
  const { data, setData, loading, error, reload } = state
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('active')

  const rows = useMemo(() => {
    if (!data) return null
    const t = q.trim().toLowerCase()
    return data.filter((s) => (filter === 'all' || (filter === 'active') === s.active) && (!t || s.email.includes(t)))
  }, [data, q, filter])

  const setActive = async (s, active) => {
    setData((l) => l.map((x) => (x.id === s.id ? { ...x, active } : x)))
    await adminApi.subscribers.update(s.id, { active })
    toast.success(active ? `${s.email} resubscribed` : `${s.email} unsubscribed`)
  }

  const columns = [
    { key: 'email', header: 'Email', sortable: true, cell: (s) => <span className="font-medium">{s.email}</span> },
    { key: 'date', header: 'Subscribed', sortable: true, hideOn: 'sm', sortValue: (s) => new Date(s.date).getTime(), cell: (s) => <span className="text-neutral-600 dark:text-neutral-300">{date(s.date)}</span> },
    { key: 'active', header: 'Status', cell: (s) => <StatusPill tone={s.active ? 'emerald' : 'neutral'}>{s.active ? 'Subscribed' : 'Unsubscribed'}</StatusPill> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      cell: (s) => s.active
        ? <Button size="sm" variant="ghost" icon={UserMinus} onClick={() => setActive(s, false)}>Unsubscribe</Button>
        : <Button size="sm" variant="ghost" icon={UserPlus} onClick={() => setActive(s, true)}>Resubscribe</Button>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      onRetry={reload}
      initialSort={{ key: 'date', dir: 'desc' }}
      toolbar={
        <>
          <SearchInput value={q} onChange={setQ} placeholder="Search emails…" className="sm:max-w-xs sm:flex-1" />
          <Tabs size="sm" value={filter} onChange={setFilter} tabs={[{ value: 'active', label: 'Subscribed' }, { value: 'inactive', label: 'Unsubscribed' }, { value: 'all', label: 'All' }]} />
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            className="sm:ml-auto"
            disabled={!data?.some((s) => s.active)}
            onClick={() => downloadCsv('subscribers.csv', [['Email', 'Subscribed'], ...data.filter((s) => s.active).map((s) => [s.email, s.date])])}
          >
            Export subscribed
          </Button>
        </>
      }
      empty={<EmptyState icon={Users} title="No subscribers" description="Newsletter signups from the footer appear here." />}
    />
  )
}
