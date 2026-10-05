import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Megaphone, Phone, Store, Truck } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { site } from '../../config/site'
import { useAsync } from '../lib/useAsync'
import { money } from '../lib/utils'
import { toast } from '../store/toast'
import { useAdminMeta } from '../store/meta'
import { Button, Card, ErrorState, PageHeader, Skeleton, StatusPill, TextField } from '../components/ui'
import { SaveBar } from '../components/overlays'
import { ListEditor } from '../components/fields'

const resetDemoData = () => {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('aure-cms-') || k === 'aure-mock-orders' || k === 'aure-settings').forEach((k) => localStorage.removeItem(k))
  } catch { /* storage unavailable */ }
  location.reload()
}

export default function Settings() {
  const { data, setData, error, reload } = useAsync(() => adminApi.settings.get(), [])
  const refreshMeta = useAdminMeta((s) => s.refresh)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setForm(data) }, [data])
  const dirty = useMemo(() => form && JSON.stringify(form) !== JSON.stringify(data), [form, data])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  const save = async () => {
    const e = {}
    if (!form.storeName.trim()) e.storeName = 'Store name is required'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
    if (Number(form.freeShippingThreshold) < 0) e.freeShippingThreshold = 'Must be 0 or more'
    if (Number(form.flatShippingRate) < 0) e.flatShippingRate = 'Must be 0 or more'
    setErrors(e)
    if (Object.keys(e).length) return toast.error('Check the highlighted fields')
    setSaving(true)
    try {
      const payload = {
        ...form,
        freeShippingThreshold: Number(form.freeShippingThreshold),
        flatShippingRate: Number(form.flatShippingRate),
        lowStockThreshold: Number(form.lowStockThreshold),
        announcements: form.announcements.filter((a) => a.trim()),
      }
      const saved = await adminApi.settings.save(payload)
      setData(saved); refreshMeta()
      toast.success('Settings saved')
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  if (error) return <Card><ErrorState error={error} onRetry={reload} /></Card>
  if (!form) return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>

  return (
    <div>
      <PageHeader eyebrow="Website" title="Settings" description="Store details used across the storefront, checkout and emails." />

      <div className="space-y-6">
        <Section icon={Store} title="Store" description="Shown in the header, footer, page titles and emails.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Store name" value={form.storeName} onChange={set('storeName')} error={errors.storeName} />
            <TextField label="Tagline" value={form.tagline} onChange={set('tagline')} />
            <TextField className="sm:col-span-2" label="Description" multiline rows={3} value={form.description} onChange={set('description')} hint="Used as the meta description for search engines." />
          </div>
        </Section>

        <Section icon={Megaphone} title="Announcement bar" description="Short messages in the strip above the header. Hidden on mobile.">
          <ListEditor
            items={form.announcements}
            onChange={set('announcements')}
            newItem=""
            max={4}
            addLabel="Add message"
            renderItem={(a, update, i) => (
              <input value={a} onChange={(e) => update(e.target.value)} aria-label={`Announcement ${i + 1}`} placeholder="Free shipping on orders over…" className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900" />
            )}
          />
          {form.announcements.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-neutral-900 px-4 py-2 text-xs text-white/90 dark:bg-neutral-100 dark:text-neutral-900">
              {form.announcements.slice(0, 2).map((a, i) => <span key={i} className="truncate">{a || '…'}</span>)}
            </div>
          )}
        </Section>

        <Section icon={Truck} title="Shipping & inventory">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="Free shipping over" type="number" min="0" value={form.freeShippingThreshold} onChange={set('freeShippingThreshold')} error={errors.freeShippingThreshold} />
            <TextField label="Flat shipping rate" type="number" min="0" step="1" value={form.flatShippingRate} onChange={set('flatShippingRate')} error={errors.flatShippingRate} />
            <TextField label="Low stock alert at" type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} hint="Units remaining" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Orders under {money(Number(form.freeShippingThreshold))} pay {money(Number(form.flatShippingRate), { cents: true })} shipping.
          </p>
        </Section>

        <Section icon={CreditCard} title="Payments" description="M-Pesa runs on Supabase secrets. Keys are never shown here.">
          <MpesaMode />
        </Section>

        <Section icon={Phone} title="Contact" description="Shown in the Contact section and footer.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
            <TextField label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          </div>
        </Section>

        {site.api.useMock && (
          <Section title="Demo data" description="Mock mode only: wipe local edits and orders, then reload the seed data.">
            <Button variant="secondary" size="sm" onClick={resetDemoData}>Reset demo data</Button>
          </Section>
        )}
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setForm(data); setErrors({}) }} />
    </div>
  )
}

// Read-only: asks the payment-status function which Daraja environment its secrets point at.
function MpesaMode() {
  const { data, loading, error } = useAsync(() => adminApi.payments.mode(), [])
  if (site.api.useMock) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Demo mode: M-Pesa is not connected.</p>
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-neutral-600 dark:text-neutral-400">Mode</span>
        {loading ? <Skeleton className="h-6 w-20" /> : error ? <span className="text-neutral-500">Unavailable (functions not deployed?)</span>
          : <StatusPill tone={data === 'live' ? 'emerald' : 'amber'}>{data === 'live' ? 'Live' : 'Sandbox'}</StatusPill>}
      </div>
      <p className="text-neutral-500 dark:text-neutral-400">{data === 'sandbox' ? 'Sandbox payments use Safaricom test credentials and do not move real money.' : 'To switch mode, update the M-Pesa secrets with `supabase secrets set`. No code change is needed.'}</p>
    </div>
  )
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <Card className="grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">{Icon && <Icon className="h-4 w-4 text-neutral-400" />}{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}
