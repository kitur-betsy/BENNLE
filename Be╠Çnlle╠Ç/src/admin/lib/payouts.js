// Payout method definitions. Only identifiers are stored (till numbers, account names), never API secrets.
const digits = (min, max, msg) => (v) => (new RegExp(`^[0-9 +-]{${min},${max}}$`).test(v) ? '' : msg)
const email = (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Enter a valid email')

export const payoutTypes = {
  mpesa: {
    label: 'M-Pesa',
    fields: [
      { key: 'kind', label: 'Receive money with', select: [['till', 'Till number (Buy Goods)'], ['paybill', 'Paybill'], ['send', 'Phone number (Send money)']], required: true },
      { key: 'number', label: 'Till / Paybill / phone number', required: true, sensitive: true, validate: digits(5, 15, 'Digits only, 5 to 15 characters') },
      { key: 'accountName', label: 'Registered name', required: true },
      { key: 'reference', label: 'Account reference (Paybill only)' },
    ],
  },
  bank: {
    label: 'Bank transfer',
    fields: [
      { key: 'bankName', label: 'Bank name', required: true },
      { key: 'accountName', label: 'Account name', required: true },
      { key: 'accountNumber', label: 'Account number', required: true, sensitive: true, validate: (v) => (/^[0-9A-Za-z -]{6,34}$/.test(v) ? '' : 'Enter a valid account number') },
      { key: 'branch', label: 'Branch or SWIFT code' },
    ],
  },
  paypal: { label: 'PayPal', fields: [{ key: 'email', label: 'PayPal email', required: true, validate: email }] },
  card: {
    label: 'Card processor',
    fields: [
      { key: 'provider', label: 'Provider', select: [['Stripe', 'Stripe'], ['Flutterwave', 'Flutterwave'], ['Paystack', 'Paystack'], ['Other', 'Other']], required: true },
      { key: 'accountEmail', label: 'Processor account email', required: true, validate: email },
      { key: 'settlement', label: 'Settles to (bank or M-Pesa label)' },
    ],
  },
  other: { label: 'Other', fields: [{ key: 'instructions', label: 'How to pay out', required: true, multiline: true }] },
}

export const typeOptions = Object.entries(payoutTypes).map(([value, t]) => ({ value, label: t.label }))

export const mask = (v = '') => (v.length > 4 ? `•••• ${v.slice(-4)}` : v)

// One-line, safe-to-display summary of a method.
export function summarize(m) {
  const t = payoutTypes[m.type]
  if (!t) return ''
  return t.fields
    .filter((f) => m.details?.[f.key])
    .map((f) => (f.sensitive ? mask(m.details[f.key]) : f.select ? f.select.find(([v]) => v === m.details[f.key])?.[1] || m.details[f.key] : m.details[f.key]))
    .join(' · ')
}

export function validate(type, label, details) {
  const errors = {}
  if (!label.trim()) errors.label = 'Give this method a name'
  for (const f of payoutTypes[type].fields) {
    const v = (details[f.key] || '').trim()
    if (f.required && !v) errors[f.key] = 'Required'
    else if (v && f.validate) { const msg = f.validate(v); if (msg) errors[f.key] = msg }
  }
  return errors
}
