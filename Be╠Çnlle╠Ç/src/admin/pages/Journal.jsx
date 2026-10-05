import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { date, slugify } from '../lib/utils'
import { toast } from '../store/toast'
import { Button, EmptyState, IconButton, PageHeader, SearchInput, StatusPill, Tabs, TextField, Thumb, Toggle } from '../components/ui'
import { DataTable } from '../components/DataTable'
import { ConfirmDialog, Drawer } from '../components/overlays'
import { ImageField, ListEditor } from '../components/fields'

const blank = () => ({
  title: '', slug: '', category: '', date: new Date().toISOString().slice(0, 10), excerpt: '', cover: '', readTime: 4, published: false, body: [''],
})

export default function Journal() {
  const { data, setData, loading, error, reload } = useAsync(() => adminApi.posts.list(), [])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    if (!data) return null
    const t = q.trim().toLowerCase()
    return data.filter((p) => (filter === 'all' || (filter === 'published') === p.published) && (!t || `${p.title} ${p.category}`.toLowerCase().includes(t)))
  }, [data, q, filter])

  const togglePublished = async (p, v) => {
    setData((l) => l.map((x) => (x.id === p.id ? { ...x, published: v } : x)))
    await adminApi.posts.update(p.id, { published: v })
    toast.success(v ? `“${p.title}” published` : `“${p.title}” moved to drafts`)
  }

  const columns = [
    {
      key: 'title', header: 'Article', sortable: true,
      cell: (p) => (
        <div className="flex min-w-64 items-center gap-3">
          <Thumb src={p.cover} alt="" className="h-12 w-16" />
          <div className="min-w-0">
            <p className="truncate font-medium">{p.title}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{p.excerpt}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, hideOn: 'md', cell: (p) => <span className="text-neutral-600 dark:text-neutral-300">{p.category || '—'}</span> },
    { key: 'date', header: 'Date', sortable: true, hideOn: 'sm', cell: (p) => <span className="whitespace-nowrap text-neutral-600 dark:text-neutral-300">{date(p.date)}</span> },
    {
      key: 'published', header: 'Status', sortable: true, sortValue: (p) => (p.published ? 1 : 0),
      cell: (p) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <Toggle size="sm" checked={p.published} onChange={(v) => togglePublished(p, v)} />
          <StatusPill tone={p.published ? 'emerald' : 'neutral'}>{p.published ? 'Published' : 'Draft'}</StatusPill>
        </div>
      ),
    },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {p.published && <IconButton icon={ArrowUpRight} label="View on site" onClick={() => window.open(`/journal/${p.slug}`, '_blank')} />}
          <IconButton icon={Pencil} label={`Edit ${p.title}`} onClick={() => setEditing(p)} />
          <IconButton icon={Trash2} label={`Delete ${p.title}`} onClick={() => setDeleting(p)} className="hover:text-red-600" />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader eyebrow="Website" title="Journal" description="Write and publish articles for the storefront journal." actions={<Button icon={Plus} onClick={() => setEditing(blank())}>New article</Button>} />

      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: 'all', label: 'All', count: data?.length ?? 0 },
          { value: 'published', label: 'Published', count: data?.filter((p) => p.published).length ?? 0 },
          { value: 'draft', label: 'Drafts', count: data?.filter((p) => !p.published).length ?? 0 },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={setEditing}
        initialSort={{ key: 'date', dir: 'desc' }}
        toolbar={<SearchInput value={q} onChange={setQ} placeholder="Search articles…" className="sm:max-w-sm sm:flex-1" />}
        empty={<EmptyState icon={Newspaper} title="No articles" description="Write your first journal article." action={<Button size="sm" icon={Plus} onClick={() => setEditing(blank())}>New article</Button>} />}
      />

      <PostForm
        post={editing}
        onClose={() => setEditing(null)}
        onSaved={(p, isNew) => { setData((l) => (isNew ? [p, ...l] : l.map((x) => (x.id === p.id ? p : x)))); setEditing(null) }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={busy}
        title="Delete this article?"
        description={`“${deleting?.title}” will be removed from the journal.`}
        onConfirm={async () => {
          setBusy(true)
          await adminApi.posts.remove(deleting.id)
          setData((l) => l.filter((x) => x.id !== deleting.id))
          toast.success('Article deleted')
          setDeleting(null); setBusy(false)
        }}
      />
    </div>
  )
}

function PostForm({ post, onClose, onSaved }) {
  const isNew = post && !post.id
  const [form, setForm] = useState(blank())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (post) { setForm({ ...blank(), ...post }); setErrors({}) } }, [post])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e, ...(k === 'title' && isNew ? { slug: slugify(e.target.value) } : {}) }))

  const save = async (publish) => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    if (!form.body.some((p) => p.trim())) e.body = 'Write at least one paragraph'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    const payload = { ...form, readTime: Number(form.readTime) || 1, body: form.body.filter((p) => p.trim()), published: publish ?? form.published }
    try {
      const saved = isNew ? await adminApi.posts.create(payload) : await adminApi.posts.update(post.id, payload)
      toast.success(publish ? 'Article published' : 'Article saved')
      onSaved(saved, isNew)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  const words = form.body.join(' ').split(/\s+/).filter(Boolean).length

  return (
    <Drawer
      open={!!post}
      onClose={onClose}
      width="max-w-2xl"
      title={isNew ? 'New article' : 'Edit article'}
      description={`${words} words · about ${Math.max(1, Math.round(words / 200))} min read`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {!form.published && <Button variant="secondary" loading={saving} onClick={() => save(false)}>Save draft</Button>}
          <Button loading={saving} onClick={() => save(form.published ? undefined : true)}>{form.published ? 'Save changes' : 'Publish'}</Button>
        </>
      }
    >
      <div className="space-y-6">
        <TextField label="Title" value={form.title} onChange={set('title')} error={errors.title} className="[&_input]:h-12 [&_input]:text-lg [&_input]:font-semibold" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Slug" value={form.slug} error={errors.slug} onChange={(e) => set('slug')(slugify(e.target.value))} hint={`/journal/${form.slug || '…'}`} />
          <TextField label="Category" value={form.category} onChange={set('category')} placeholder="Ingredients, Routines…" />
          <TextField label="Date" type="date" value={form.date} onChange={set('date')} />
          <TextField label="Read time (min)" type="number" min="1" value={form.readTime} onChange={set('readTime')} />
        </div>
        <TextField label="Excerpt" multiline rows={2} value={form.excerpt} onChange={set('excerpt')} hint="Shown on journal cards and in search results." />
        <ImageField label="Cover image" value={form.cover} onChange={set('cover')} aspect="aspect-video" />
        <div>
          <p className="mb-1.5 text-sm font-medium">Body</p>
          {errors.body && <p className="mb-2 text-xs text-red-600">{errors.body}</p>}
          <ListEditor
            items={form.body}
            onChange={set('body')}
            newItem=""
            min={1}
            addLabel="Add paragraph"
            renderItem={(p, update, i) => (
              <textarea value={p} onChange={(e) => update(e.target.value)} rows={4} aria-label={`Paragraph ${i + 1}`} placeholder="Write a paragraph…" className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-6 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900" />
            )}
          />
        </div>
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Toggle checked={form.published} onChange={set('published')} label="Published" description="Published articles appear on the journal page and homepage preview." />
        </div>
      </div>
    </Drawer>
  )
}
