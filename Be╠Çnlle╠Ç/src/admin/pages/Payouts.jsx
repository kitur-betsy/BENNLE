import { useState } from 'react'
import { Banknote, Info, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { useAsync } from '../lib/useAsync'
import { toast } from '../store/toast'
import { payoutTypes, summarize, typeOptions, validate } from '../lib/payouts'
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, PageHeader, SelectField, Skeleton, TextField, Toggle } from '../components/ui'
import { ConfirmDialog, Drawer } from '../components/overlays'

const blank = { type: 'mpesa', label: '', details: {}, isDefault: false, enabled: true }

// Dropdown fields show their first option, so store it as the value up front.
const withDefaults = (type, details = {}) => ({
  ...Object.fromEntries(payoutTypes[type].fields.filter((f) => f.select).map((f) => [f.key, f.select[0][0]])),
  ...details,
})

function MethodForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ ...initial, details: withDefaults(initial.type, initial.details) })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const def = payoutTypes[form.type]
  const setDetail = (k, v) => { setForm((f) => ({ ...f, details: { ...f.details, [k]: v } })); setErrors((e) => ({ ...e, [k]: undefined })) }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(form.type, form.label, form.details)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      // Only keep the fields that belong to the chosen type.
      const details = Object.fromEntries(def.fields.map((f) => [f.key, (form.details[f.key] || '').trim()]).filter(([, v]) => v))
      onSaved(await adminApi.payouts.save({ ...form, label: form.label.trim(), details }))
      toast.success('Payout method saved')
      onClose()
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <SelectField label="Type" value={form.type} options={typeOptions} disabled={Boolean(form.id)}
        onChange={(e) => { setForm({ ...form, type: e.target.value, details: withDefaults(e.target.value) }); setErrors({}) }} />
      <TextField label="Name" hint="Shown only to you, e.g. “Shop till” or “Equity main account”" value={form.label}
        error={errors.label} onChange={(e) => { setForm({ ...form, label: e.target.value }); setErrors({ ...errors, label: undefined }) }} />
      {def.fields.map((f) => f.select ? (
        <SelectField key={f.key} label={f.label} value={form.details[f.key] || f.select[0][0]} error={errors[f.key]}
          options={f.select.map(([value, label]) => ({ value, label }))} onChange={(e) => setDetail(f.key, e.target.value)} />
      ) : (
        <TextField key={f.key} label={f.label} multiline={f.multiline} optional={!f.required} value={form.details[f.key] || ''}
          error={errors[f.key]} inputMode={f.key === 'number' || f.key === 'accountNumber' ? 'numeric' : undefined} autoComplete="off"
          onChange={(e) => setDetail(f.key, e.target.value)} />
      ))}
      <Toggle checked={form.isDefault} onChange={(v) => setForm({ ...form, isDefault: v })} label="Default payout method" description="Used first when payments are connected." />
      <div className="flex justify-end gap-2 border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>Save method</Button>
      </div>
    </form>
  )
}

export default function Payouts() {
  const { data, setData, loading, error, reload } = useAsync(() => adminApi.payouts.list(), [])
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const act = async (fn, msg) => { try { const r = await fn(); if (Array.isArray(r)) setData(r); else reload(); if (msg) toast.success(msg) } catch (e) { toast.error(e.message) } }

  return (
    <div>
      <PageHeader eyebrow="Money" title="Payouts" description="Where your sales money is paid out to."
        actions={<Button icon={Plus} onClick={() => setEditing({ ...blank, isDefault: !data?.length })}>Add method</Button>} />

      <Card className="mb-6 flex gap-3 p-4 text-sm text-neutral-600 dark:text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Save the accounts you want to be paid into. Sending payment prompts to customers will be connected next. Keep API keys and passwords out of here: they belong on a secure server, not in this list.</p>
      </Card>

      {error ? <Card><ErrorState error={error} onRetry={reload} /></Card>
        : loading && !data ? <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          : !data.length ? (
            <Card><EmptyState icon={Banknote} title="No payout methods yet" description="Add the M-Pesa till, bank account or PayPal where you want to receive money."
              action={<Button icon={Plus} onClick={() => setEditing({ ...blank, isDefault: true })}>Add your first method</Button>} /></Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.map((m) => (
                <li key={m.id}>
                  <Card className={`flex h-full flex-col p-5 ${m.enabled ? '' : 'opacity-70'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.label}</p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{payoutTypes[m.type]?.label}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {m.isDefault && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">Default</Badge>}
                        {!m.enabled && <Badge>Off</Badge>}
                      </div>
                    </div>
                    <p className="mt-3 flex-1 break-words text-sm text-neutral-600 dark:text-neutral-300">{summarize(m) || 'No details'}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                      <Toggle checked={m.enabled} size="sm" label={`${m.label} enabled`} onChange={(v) => { setData((l) => l.map((x) => (x.id === m.id ? { ...x, enabled: v } : x))); act(() => adminApi.payouts.setEnabled(m.id, v)) }} />
                      <div className="flex items-center gap-1">
                        {!m.isDefault && <IconButton icon={Star} label="Make default" onClick={() => act(() => adminApi.payouts.setDefault(m.id), 'Default updated')} />}
                        <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(m)} />
                        <IconButton icon={Trash2} label="Delete" onClick={() => setDeleting(m)} />
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit payout method' : 'Add payout method'} width="max-w-lg">
        {editing && <MethodForm key={editing.id || 'new'} initial={editing} onClose={() => setEditing(null)} onSaved={setData} />}
      </Drawer>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} loading={busy} title="Delete this payout method?"
        description={deleting ? `“${deleting.label}” will be removed. This cannot be undone.` : ''}
        onConfirm={async () => { setBusy(true); await act(() => adminApi.payouts.remove(deleting.id), 'Payout method deleted'); setBusy(false); setDeleting(null) }} />
    </div>
  )
}
