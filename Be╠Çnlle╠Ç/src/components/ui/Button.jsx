import { Link } from 'react-router-dom'
import { cn } from '../../lib/format'

const styles = {
  primary: 'bg-inverse text-inverse-fg hover:opacity-90',
  outline: 'border border-line hover:bg-hover',
  ghost: 'hover:bg-hover',
  danger: 'bg-danger text-white hover:opacity-90',
}
const sizes = { sm: 'px-3 py-1.5 text-sm rounded-lg', md: 'px-5 py-2.5 rounded-xl font-medium', lg: 'px-6 py-3 rounded-full font-medium' }

export default function Button({ variant = 'primary', size = 'md', to, className, loading, children, ...rest }) {
  const cls = cn('inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:pointer-events-none', styles[variant], sizes[size], className)
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  return <button className={cls} disabled={loading || rest.disabled} {...rest}>{loading ? 'Please wait…' : children}</button>
}
