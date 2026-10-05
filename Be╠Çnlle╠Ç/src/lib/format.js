import { site } from '../config/site'

const money = new Intl.NumberFormat(site.currency.locale, { style: 'currency', currency: site.currency.code, maximumFractionDigits: 0 })
export const formatPrice = (n) => money.format(n).replace(/\.00$/, '')
export const formatDate = (d) => new Date(d).toLocaleDateString(site.currency.locale, { year: 'numeric', month: 'short', day: 'numeric' })
export const cn = (...c) => c.filter(Boolean).join(' ')
export const initialsOf = (name = '') => name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
