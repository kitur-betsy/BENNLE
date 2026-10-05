import { Controller, useFieldArray, useForm, get } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button, SelectField, TextField, Toggle } from './ui'
import { ImageField } from './fields'
import { cn } from '../lib/utils'

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400 dark:focus:ring-white/5'

// Spec-driven form. A field is { name, label, type, ... } where type is one of:
// text (default) | textarea | number | select | toggle | image | static | strings | list.
// `strings` edits string[] (kind: 'image' | 'textarea' | 'text'); `list` edits object[] via nested `fields`.
const full = (f) => ['textarea', 'image', 'strings', 'list'].includes(f.type) || f.full

function Hint({ children }) { return children ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{children}</p> : null }

function Strings({ f, name, control, error }) {
  return (
    <Controller control={control} name={name} render={({ field }) => {
      const list = field.value || []
      const set = (i, v) => field.onChange(list.map((x, j) => (j === i ? v : x)))
      return (
        <div className="text-sm">
          <span className="mb-1.5 block font-medium">{f.label}</span>
          <div className="space-y-2">
            {list.map((v, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {f.kind === 'image' ? <ImageField label={f.itemLabel ? `${f.itemLabel} ${i + 1}` : undefined} value={v} onChange={(x) => set(i, x)} />
                    : f.kind === 'textarea' ? <textarea rows={3} value={v} onChange={(e) => set(i, e.target.value)} className={inputCls} aria-label={`${f.label} ${i + 1}`} />
                    : <input value={v} onChange={(e) => set(i, e.target.value)} className={inputCls} aria-label={`${f.label} ${i + 1}`} />}
                </div>
                {!f.fixed && <button type="button" onClick={() => field.onChange(list.filter((_, j) => j !== i))} className="mt-2 rounded-md p-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800" aria-label={`Remove ${f.label} ${i + 1}`}><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
          {!f.fixed && <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => field.onChange([...list, ''])}><Plus className="h-4 w-4" />{f.addLabel || 'Add'}</Button>}
          <Hint>{f.hint}</Hint>
          {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </div>
      )
    }} />
  )
}

function ListField({ f, name, control, register, errors }) {
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: '_key' })
  return (
    <div className="text-sm">
      <span className="mb-1.5 block font-medium">{f.label}</span>
      <div className="space-y-3">
        {fields.map((item, i) => (
          <div key={item._key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50" data-testid={`${name}-${i}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{f.itemLabel || 'Item'} {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded-md p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30" aria-label={`Move ${f.itemLabel || 'item'} ${i + 1} up`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="rounded-md p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30" aria-label={`Move ${f.itemLabel || 'item'} ${i + 1} down`}><ArrowDown className="h-4 w-4" /></button>
                {!f.fixed && <button type="button" onClick={() => remove(i)} className="rounded-md p-1.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800" aria-label={`Remove ${f.itemLabel || 'item'} ${i + 1}`}><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {f.fields.map((sf) => <Item key={sf.name} f={sf} prefix={`${name}.${i}.`} control={control} register={register} errors={errors} />)}
            </div>
          </div>
        ))}
      </div>
      {!f.fixed && <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => append(structuredClone(f.newItem || {}))}><Plus className="h-4 w-4" />{f.addLabel || 'Add item'}</Button>}
      <Hint>{f.hint}</Hint>
    </div>
  )
}

function Item({ f, prefix = '', control, register, errors }) {
  const name = prefix + f.name
  const error = get(errors, name)?.message
  const wrap = (node) => <div className={cn(full(f) && 'sm:col-span-2')}>{node}</div>
  switch (f.type) {
    case 'textarea': return wrap(<><TextField label={f.label} multiline rows={f.rows || 4} error={error} {...register(name)} /><Hint>{f.hint}</Hint></>)
    case 'number': return wrap(<><TextField label={f.label} type="number" step={f.step || 'any'} error={error} {...register(name)} /><Hint>{f.hint}</Hint></>)
    case 'select': return wrap(<SelectField label={f.label} options={f.options} error={error} {...register(name)} />)
    case 'toggle': return wrap(
      <Controller control={control} name={name} render={({ field }) => (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800 text-sm">
          <div><p className="font-medium">{f.label}</p><Hint>{f.hint}</Hint></div>
          <Toggle checked={!!field.value} onChange={field.onChange} label={undefined} />
        </div>
      )} />)
    case 'image': return wrap(<Controller control={control} name={name} render={({ field }) => <ImageField label={f.label} value={field.value} onChange={field.onChange} error={error} />} />)
    case 'static': return wrap(<Controller control={control} name={name} render={({ field }) => <p className="pt-1 text-sm font-medium">{field.value}</p>} />)
    case 'strings': return wrap(<Strings f={f} name={name} control={control} error={error} />)
    case 'list': return wrap(<ListField f={f} name={name} control={control} register={register} errors={errors} />)
    default: return wrap(<><TextField label={f.label} type={f.inputType || 'text'} placeholder={f.placeholder} error={error} {...register(name)} /><Hint>{f.hint}</Hint></>)
  }
}

export default function SpecForm({ fields, defaultValues, schema, onSubmit, submitLabel = 'Save changes', onCancel, children }) {
  const { control, register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({ resolver: schema ? zodResolver(schema) : undefined, defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => <Item key={f.name} f={f} control={control} register={register} errors={errors} />)}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        {children}
        {isDirty && <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">Unsaved changes</span>}
      </div>
    </form>
  )
}
