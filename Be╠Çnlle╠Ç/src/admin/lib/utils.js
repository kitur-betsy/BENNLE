import { site } from '../../config/site'

export const cn = (...c) => c.filter(Boolean).join(' ')

export const money = (n, opts = {}) =>
  new Intl.NumberFormat(site.currency.locale, { style: 'currency', currency: site.currency.code, maximumFractionDigits: n % 1 === 0 && !opts.cents ? 0 : 2 }).format(n || 0)

export const number = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0))

export const date = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat('en-GB', opts).format(new Date(iso)) : '—'

export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return date(iso, { day: 'numeric', month: 'short' })
}

export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export const slugify = (s = '') => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
