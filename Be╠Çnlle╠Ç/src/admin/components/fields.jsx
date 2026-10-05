import { useId, useRef } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Upload } from 'lucide-react'
import { Button, Field, IconButton } from './ui'
import { cn } from '../lib/utils'
import { uploadApi } from '../../api/services'
import { toast } from '../store/toast'

/* Image URL input with preview + upload. uploadApi resizes in mock mode and POSTs to the backend otherwise. */
export function ImageField({ label = 'Image', value, onChange, hint, aspect = 'aspect-[4/3]', error }) {
  const id = useId()
  const fileRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadApi.image(file).then(onChange).catch((err) => toast.error(err.message))
    e.target.value = ''
  }
  return (
    <Field label={label} hint={hint || 'Paste an image URL or upload a file.'} error={error} htmlFor={id}>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            'group relative w-32 shrink-0 overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800',
            aspect,
          )}
          aria-label="Upload image"
        >
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-4 w-4 text-white" />
              </span>
            </>
          ) : (
            <span className="grid h-full place-items-center text-neutral-400"><ImagePlus className="h-5 w-5" /></span>
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            id={id}
            value={value?.startsWith('data:') ? 'Uploaded file' : value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>Upload</Button>
            {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>Remove</Button>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </Field>
  )
}

/* Generic list editor: add, remove and reorder rows. renderItem(item, update, index) */
export function ListEditor({ items, onChange, renderItem, newItem, addLabel = 'Add item', max, min = 0, className }) {
  const move = (i, d) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <span className="mt-2 w-5 shrink-0 text-xs tabular-nums text-neutral-400">{i + 1}</span>
          <div className="min-w-0 flex-1">
            {renderItem(item, (patch) => onChange(items.map((x, j) => (j === i ? (typeof patch === 'object' && !Array.isArray(patch) && patch !== null ? { ...x, ...patch } : patch) : x))), i)}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <IconButton size="sm" icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
            <IconButton size="sm" icon={ArrowDown} label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} />
            <IconButton size="sm" icon={Trash2} label="Remove" disabled={items.length <= min} onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:text-red-600" />
          </div>
        </div>
      ))}
      {(!max || items.length < max) && (
        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={() => onChange([...items, typeof newItem === 'function' ? newItem() : newItem])}>
          {addLabel}
        </Button>
      )}
    </div>
  )
}
