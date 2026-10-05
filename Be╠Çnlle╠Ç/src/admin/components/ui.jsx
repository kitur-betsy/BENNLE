import { forwardRef, useId } from 'react'
import { AlertCircle, Inbox, Loader2, Search, X } from 'lucide-react'
import { cn, initials } from '../lib/utils'

/* --------------------------------- Button -------------------------------- */

const variants = {
  primary: 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200',
  secondary: 'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  accent: 'bg-emerald-600 text-white hover:bg-emerald-700',
}
const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' }

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, loading, className, children, as: Comp = 'button', ...props }, ref,
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant], sizes[size], className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </Comp>
  )
})

export function IconButton({ icon: Icon, label, className, size = 'md', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
        'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
        'focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-40',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9', className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/* ---------------------------------- Card --------------------------------- */

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-6 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------------------------- Forms -------------------------------- */

const control =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors ' +
  'focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 ' +
  'dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-400 dark:focus:ring-white/5 ' +
  'aria-[invalid=true]:border-red-500'

export function Field({ label, hint, error, children, className, htmlFor, optional }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center justify-between text-sm font-medium">
          {label}
          {optional && <span className="text-xs font-normal text-neutral-400">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><AlertCircle className="h-3.5 w-3.5" />{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      ) : null}
    </div>
  )
}

// Label + control in one, with ids wired up
// Refs are forwarded so these also work with react-hook-form's register().
export const TextField = forwardRef(function TextField({ label, hint, error, optional, className, multiline, rows = 4, ...props }, ref) {
  const id = useId()
  const Comp = multiline ? 'textarea' : 'input'
  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={id} className={className}>
      <Comp ref={ref} id={id} aria-invalid={!!error} rows={multiline ? rows : undefined} className={cn(control, multiline ? 'py-2.5 leading-6' : 'h-10')} {...props} />
    </Field>
  )
})

export const SelectField = forwardRef(function SelectField({ label, hint, error, options, className, ...props }, ref) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <Select ref={ref} id={id} options={options} {...props} />
    </Field>
  )
})

export const Select = forwardRef(function Select({ options, className, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, 'h-10 cursor-pointer pr-8', className)} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
})

export function Input({ className, ...props }) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(control, 'h-10 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description, disabled, size = 'md' }) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? label : undefined}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700',
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (size === 'sm' ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5',
        )}
      />
    </button>
  )
  if (!label) return sw
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {sw}
    </div>
  )
}

/* ------------------------------ Status & tags ---------------------------- */

const tones = {
  neutral: 'bg-neutral-400',
  amber: 'bg-amber-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
}

// Pill with a colored dot; the text always carries the meaning
export function StatusPill({ tone = 'neutral', children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium capitalize',
      'dark:border-neutral-700 dark:bg-neutral-900', className,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tones[tone])} />
      {children}
    </span>
  )
}

export const orderStatus = {
  awaiting_payment: { tone: 'neutral', label: 'Awaiting payment' },
  pending: { tone: 'amber', label: 'Pending' },
  processing: { tone: 'blue', label: 'Processing' },
  shipped: { tone: 'violet', label: 'Shipped' },
  delivered: { tone: 'emerald', label: 'Delivered' },
  cancelled: { tone: 'red', label: 'Cancelled' },
}

// Payment lifecycle (payments.status and orders.payment_status share most of these)
export const paymentStatus = {
  pending: { tone: 'amber', label: 'Pending' },
  paid: { tone: 'emerald', label: 'Paid' },
  failed: { tone: 'red', label: 'Failed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  timeout: { tone: 'violet', label: 'Timed out' },
  unpaid: { tone: 'neutral', label: 'Unpaid' },
  refunded: { tone: 'blue', label: 'Refunded' },
}

export function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300', className)}>
      {children}
    </span>
  )
}

export function CountBadge({ count, inverted, className }) {
  if (!count) return null
  return (
    <span className={cn(
      'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold',
      inverted ? 'bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900', className,
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

/* ------------------------------ Segmented tabs --------------------------- */

export function Tabs({ tabs, value, onChange, className, size = 'md' }) {
  return (
    <div role="tablist" className={cn('inline-flex max-w-full overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900', className)}>
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
            )}
          >
            {t.icon && <t.icon className="h-4 w-4" />}
            {t.label}
            {t.count != null && <span className="tabular-nums text-neutral-400">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------- Avatars & images --------------------------- */

export function Avatar({ name, className }) {
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200', className)}>
      {initials(name)}
    </span>
  )
}

export function Thumb({ src, alt = '', className }) {
  return (
    <span className={cn('block h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100 text-[0px] dark:bg-neutral-800', className)}>
      {src && <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />}
    </span>
  )
}

/* ------------------------------- States ---------------------------------- */

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800', className)} />
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <Icon className="h-5 w-5 text-neutral-400" />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={error?.message || 'We could not load this data.'}
      action={onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    />
  )
}
