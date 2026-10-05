import { forwardRef } from 'react'
import { cn } from '../../lib/format'

export const inputCls = 'w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none transition focus:border-fg'

const Field = forwardRef(function Field({ label, error, as = 'input', className, children, ...rest }, ref) {
  const Tag = as
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block font-medium">{label}</span>}
      <Tag ref={ref} className={cn(inputCls, className)} {...rest}>{children}</Tag>
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
})
export default Field
