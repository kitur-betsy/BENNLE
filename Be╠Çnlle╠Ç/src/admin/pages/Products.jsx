import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Package, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { cn, money, slugify } from '../lib/utils'
import { toast } from '../store/toast'
import { useAdminMeta } from '../store/meta'
import {
  Badge, Button, EmptyState, IconButton, PageHeader, SearchInput, Select, SelectField, StatusPill, TextField, Thumb, Toggle,
} from '../components/ui'
import { DataTable } from '../components/DataTable'
import { ConfirmDialog, Drawer } from '../components/overlays'
import { ImageField } from '../components/fields'

const blank = {
  name: '', slug: '', subtitle: '', category: '', status: 'active', price: '', stock: '', badge: '', size: '',
  featured: false, description: '', ingredients: '', image: '', rating: 0, reviews: 0,
}

export default function Products() {
  const products = useAsync(() => adminApi.products.list(), [])
  const categories = useAsync(() => adminApi.categories.list(), [])
  const threshold = useAdminMeta((s) => s.settings?.lowStockThreshold ?? 10)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null) // product object or `blank`
  const [deleting, setDeleting] = useState(null) // array of ids
  const [busy, setBusy] = useState(false)

  // Deep link: /admin/products?edit=prod_1 (used by the dashboard "Restock" button)
  useEffect(() => {
    const id = params.get('edit')
    if (id && products.data) {
      const p = products.data.find((x) => x.id === id)
      if (p) setEditing(p)
      params.delete('edit'); setParams(params, { replace: true })
    }
  }, [params, products.data, setParams])

  const catName = useMemo(() => Object.fromEntries((categories.data || []).map((c) => [c.slug, c.name])), [categories.data])

  const rows = useMemo(() => {
    if (!products.data) return null
    const term = q.trim().toLowerCase()
    return products.data.filter((p) =>
      (cat === 'all' || p.category === cat) &&
      (status === 'all' || (status === 'low' ? p.stock <= threshold : p.status === status)) &&
      (!term || `${p.name} ${p.subtitle}`.toLowerCase().includes(term)))
  }, [products.data, q, cat, status, threshold])

  const patch = async (id, change, msg) => {
    products.setData((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)))
    try { await adminApi.products.update(id, change); if (msg) toast.success(msg) }
    catch (e) { toast.error(e.message); products.reload() }
  }

  const bulkStatus = async (value) => {
    setBusy(true)
    await Promise.all(selected.map((id) => adminApi.products.update(id, { status: value })))
    await products.reload()
    toast.success(`${selected.length} products set to ${value}`)
    setSelected([]); setBusy(false)
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await Promise.all(deleting.map((id) => adminApi.products.remove(id)))
      products.setData((list) => list.filter((p) => !deleting.includes(p.id)))
      toast.success(deleting.length > 1 ? `${deleting.length} products deleted` : 'Product deleted')
      setSelected((s) => s.filter((id) => !deleting.includes(id)))
      setDeleting(null)
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const onSaved = (saved, isNew) => {
    products.setData((list) => (isNew ? [saved, ...list] : list.map((p) => (p.id === saved.id ? saved : p))))
    setEditing(null)
  }

  const columns = [
    {
      key: 'name', header: 'Product', sortable: true,
      cell: (p) => (
        <div className="flex min-w-56 items-center gap-3">
          <Thumb src={p.image} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">{p.name}{p.badge && <Badge>{p.badge}</Badge>}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{p.subtitle}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, hideOn: 'md', sortValue: (p) => catName[p.category], cell: (p) => <span className="text-neutral-600 dark:text-neutral-300">{catName[p.category] || '—'}</span> },
    { key: 'price', header: 'Price', sortable: true, align: 'right', cell: (p) => money(p.price, { cents: p.price % 1 !== 0 }) },
    {
      key: 'stock', header: 'Stock', sortable: true, align: 'right',
      cell: (p) => (
        <span className={cn('tabular-nums', p.stock === 0 ? 'font-medium text-red-600 dark:text-red-400' : p.stock <= threshold && 'font-medium text-amber-600 dark:text-amber-400')}>
          {p.stock === 0 ? 'Out' : p.stock}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true, hideOn: 'sm',
      cell: (p) => <StatusPill tone={p.status === 'active' ? 'emerald' : 'neutral'}>{p.status}</StatusPill>,
    },
    {
      key: 'featured', header: 'Featured', hideOn: 'lg',
      cell: (p) => <Toggle size="sm" label={undefined} checked={p.featured} onChange={(v) => patch(p.id, { featured: v }, v ? `${p.name} is now featured` : `${p.name} removed from featured`)} />,
    },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton icon={Pencil} label={`Edit ${p.name}`} onClick={() => setEditing(p)} />
          <IconButton icon={Trash2} label={`Delete ${p.name}`} onClick={() => setDeleting([p.id])} className="hover:text-red-600" />
        </div>
      ),
    },
  ]

  const catOptions = [{ value: 'all', label: 'All categories' }, ...(categories.data || []).map((c) => ({ value: c.slug, label: c.name }))]

  return (
    <div>
      <PageHeader
        title="Products"
        description={products.data ? `${products.data.length} products · ${products.data.filter((p) => p.status === 'active').length} active` : 'Loading…'}
        actions={<Button icon={Plus} onClick={() => setEditing(blank)}>Add product</Button>}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={products.loading}
        error={products.error}
        onRetry={products.reload}
        onRowClick={setEditing}
        selectable
        selected={selected}
        onSelect={setSelected}
        initialSort={{ key: 'name', dir: 'asc' }}
        bulkBar={
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulkStatus('active')}>Set active</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => bulkStatus('draft')}>Set draft</Button>
            <Button size="sm" variant="secondary" icon={Trash2} disabled={busy} onClick={() => setDeleting(selected)} className="hover:text-red-600">Delete</Button>
          </>
        }
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search products…" className="sm:max-w-xs sm:flex-1" />
            <div className="flex gap-2">
              <Select aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)} options={catOptions} className="sm:w-48" />
              <Select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'low', label: 'Low stock' }]}
                className="sm:w-40"
              />
            </div>
          </>
        }
        empty={
          <EmptyState
            icon={Package}
            title={q || cat !== 'all' || status !== 'all' ? 'No products match' : 'No products yet'}
            description={q || cat !== 'all' || status !== 'all' ? 'Try a different search or clear the filters.' : 'Add your first product to start selling.'}
            action={q || cat !== 'all' || status !== 'all'
              ? <Button variant="secondary" size="sm" onClick={() => { setQ(''); setCat('all'); setStatus('all') }}>Clear filters</Button>
              : <Button size="sm" icon={Plus} onClick={() => setEditing(blank)}>Add product</Button>}
          />
        }
      />

      <ProductForm product={editing} categories={categories.data || []} onClose={() => setEditing(null)} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title={deleting?.length > 1 ? `Delete ${deleting.length} products?` : 'Delete this product?'}
        description="This removes the product from the store. Past orders keep their line items."
      />
    </div>
  )
}

/* ------------------------------ Product form ----------------------------- */

function ProductForm({ product, categories, onClose, onSaved }) {
  const isNew = product && !product.id
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({ ...blank, category: categories[0]?.slug || '', ...product })
      setErrors({})
      setSlugTouched(!!product.id)
    }
  }, [product, categories])

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(v) } : {}) }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    if (form.price === '' || Number(form.price) <= 0) e.price = 'Enter a price above 0'
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Enter a whole number, 0 or more'
    if (!form.category) e.category = 'Choose a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async (e) => {
    e?.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
    try {
      const saved = isNew ? await adminApi.products.create(payload) : await adminApi.products.update(product.id, payload)
      toast.success(isNew ? 'Product created' : 'Product saved')
      onSaved(saved, isNew)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <Drawer
      open={!!product}
      onClose={onClose}
      title={isNew ? 'New product' : form.name || 'Edit product'}
      description={isNew ? 'Add a product to your catalogue.' : `/${form.slug}`}
      footer={
        <>
          {!isNew && (
            <Button variant="ghost" icon={Copy} className="mr-auto" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/product/${form.slug}`); toast.success('Product link copied') }}>
              Copy link
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={save}>{isNew ? 'Create product' : 'Save changes'}</Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-8">
        <Section title="Basics">
          <TextField label="Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Barrier Repair Serum" />
          <TextField label="Subtitle" value={form.subtitle} onChange={set('subtitle')} placeholder="Ceramides + Niacinamide 5%" hint="Key actives, shown under the name on product cards." />
          <TextField label="URL slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug')(slugify(e.target.value)) }} error={errors.slug} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Category" value={form.category} onChange={set('category')} error={errors.category} options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
            <SelectField label="Status" value={form.status} onChange={set('status')} options={[{ value: 'active', label: 'Active — visible in store' }, { value: 'draft', label: 'Draft — hidden' }]} />
          </div>
        </Section>

        <Section title="Image">
          <ImageField label="Product image" value={form.image} onChange={set('image')} aspect="aspect-square" />
        </Section>

        <Section title="Pricing & inventory">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={set('price')} error={errors.price} />
            <TextField label="Stock" type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={set('stock')} error={errors.stock} />
            <TextField label="Size" value={form.size} onChange={set('size')} placeholder="30 ml" optional />
            <TextField label="Badge" value={form.badge} onChange={set('badge')} placeholder="New, Bestseller, -20%" optional />
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <Toggle
              checked={form.featured}
              onChange={set('featured')}
              label={<span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Featured</span>}
              description="Show in the Featured Products section on the homepage."
            />
          </div>
        </Section>

        <Section title="Details">
          <TextField label="Description" multiline rows={4} value={form.description} onChange={set('description')} />
          <TextField label="Ingredients" multiline rows={3} value={form.ingredients} onChange={set('ingredients')} hint="Full INCI list, comma separated." />
        </Section>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{title}</legend>
      {children}
    </fieldset>
  )
}
