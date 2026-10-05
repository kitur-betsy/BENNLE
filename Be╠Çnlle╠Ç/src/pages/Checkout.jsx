import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Lock, Smartphone } from 'lucide-react'
import { checkoutSchema } from '../lib/schemas'
import { ordersApi } from '../api/services'
import { site } from '../config/site'
import { formatPrice } from '../lib/format'
import { clearPending, loadPending, normalisePhone, rememberPhone, rememberedPhone } from '../services/paymentService'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import StepIndicator from '../components/ui/StepIndicator'
import MpesaModal from '../components/shop/MpesaModal'

const steps = ['Contact', 'Shipping', 'Payment']
const stepFields = [['name', 'email'], ['address', 'city', 'zip', 'country'], []]

function Summary({ items, subtotal, shipping, total }) {
  return (
    <div>
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-4">
            <div className="relative">
              <img src={i.image} alt="" className="size-14 rounded-xl object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-inverse text-[10px] font-medium text-inverse-fg">{i.qty}</span>
            </div>
            <span className="flex-1 text-sm">{i.name}</span>
            <span className="text-sm font-medium">{formatPrice(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
        <div className="flex justify-between text-muted"><dt>Shipping</dt><dd>{shipping ? formatPrice(shipping) : 'Free'}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
      </dl>
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, clear } = useCart()
  const subtotal = useCart((s) => s.subtotal())
  const shipping = useCart((s) => s.shipping())
  const total = subtotal + shipping
  const notify = useUI((s) => s.notify)
  const demo = site.api.useMock // no Supabase: M-Pesa cannot run, keep the offline demo order

  // A payment that was in flight when the page reloaded: reopen the modal instead of starting over.
  const [saved] = useState(() => {
    const pending = demo ? null : loadPending()
    if (pending && !items.length) { clearPending(); return null } // the bag was already cleared: that payment finished
    return pending
  })
  const [step, setStep] = useState(saved ? 2 : 0)
  const [phone, setPhone] = useState(saved?.phone || rememberedPhone())
  const [phoneError, setPhoneError] = useState('')
  const [orderId, setOrderId] = useState(saved?.orderId || null) // reused so "Try again" never creates a second order
  const [modal, setModal] = useState(saved ? { phone: saved.phone, shipping: saved.shipping, resume: saved } : null)

  const { register, handleSubmit, trigger, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { country: 'Kenya', ...(saved?.shipping || {}) },
  })

  // Clear the bag only once the payment is confirmed.
  const onPaid = useCallback(() => { clear() }, [clear])
  const onDone = useCallback((id) => { clearPending(); navigate(`/order/${id}`, { replace: true }) }, [navigate])
  const onChangeNumber = useCallback((id) => { clearPending(); setOrderId(id); setModal(null); setStep(2) }, [])

  if (!items.length && !modal) return (
    <div className="container-site py-32 text-center">
      <p className="text-2xl font-semibold tracking-tight">Your bag is empty</p>
      <p className="mt-2 text-muted">Add something beautiful to get started.</p>
      <div className="mt-8"><Button to="/shop">Shop now</Button></div>
    </div>
  )

  const next = async () => { if (await trigger(stepFields[step])) setStep(step + 1) }

  const onSubmit = async (values) => {
    if (demo) {
      try {
        const order = await ordersApi.create({ customer: values, items: items.map(({ id, qty, price }) => ({ id, qty, price })), subtotal, shipping, total })
        clear(); navigate(`/order/${order.id}`, { replace: true })
      } catch (e) { notify(e.message, 'error') }
      return
    }
    const normalised = normalisePhone(phone)
    if (!normalised) { setPhoneError('Enter a valid Safaricom number, e.g. 0712 345 678'); return }
    setPhoneError('')
    rememberPhone(normalised)
    setModal({ phone: normalised, shipping: values })
  }
  const v = getValues()

  return (
    <div className="lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_28rem]">
      <details className="group border-b border-line bg-surface lg:hidden">
        <summary className="container-site flex cursor-pointer list-none items-center justify-between py-4 text-sm">
          <span className="flex items-center gap-2">Order summary <ChevronDown className="size-4 transition group-open:rotate-180" /></span>
          <span className="font-semibold">{formatPrice(total)}</span>
        </summary>
        <div className="container-site pb-6"><Summary {...{ items, subtotal, shipping, total }} /></div>
      </details>

      <div className="px-6 py-10 lg:flex lg:justify-end lg:px-16">
        <div className="w-full max-w-xl">
          <StepIndicator steps={steps} current={step} />
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 space-y-5">
            {step === 0 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Contact</h1>
                <Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
                <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              </>
            )}
            {step === 1 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Shipping address</h1>
                <Field label="Address" autoComplete="street-address" error={errors.address?.message} {...register('address')} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
                  <Field label="ZIP" autoComplete="postal-code" error={errors.zip?.message} {...register('zip')} />
                  <Field label="Country" autoComplete="country-name" error={errors.country?.message} {...register('country')} />
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
                <dl className="divide-y divide-line rounded-xl border border-line text-sm">
                  {[['Contact', `${v.name} · ${v.email}`, 0], ['Ship to', `${v.address}, ${v.city} ${v.zip}, ${v.country}`, 1]].map(([k, val, s]) => (
                    <div key={k} className="flex items-start justify-between gap-4 p-4">
                      <div><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5">{val}</dd></div>
                      <button type="button" onClick={() => setStep(s)} className="text-xs underline">Change</button>
                    </div>
                  ))}
                </dl>

                {demo ? (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
                    <Lock className="size-5 shrink-0 text-accent" />
                    Demo mode: connect Supabase to take M-Pesa payments. Placing this order will not charge anyone.
                  </div>
                ) : (
                  <fieldset className="space-y-4 rounded-xl border border-fg p-4">
                    <legend className="sr-only">Payment method</legend>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent-strong"><Smartphone className="size-5" aria-hidden /></span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">M-Pesa</p>
                        <p className="text-xs text-muted">You'll get a PIN prompt on your phone.</p>
                      </div>
                      <span className="size-4 rounded-full border-4 border-fg" aria-hidden />
                    </div>
                    <Field label="M-Pesa phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} error={phoneError}
                      onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                      onBlur={() => setPhoneError(phone && !normalisePhone(phone) ? 'Enter a valid Safaricom number, e.g. 0712 345 678' : '')} />
                  </fieldset>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              {step === 0
                ? <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> Keep shopping</Link>
                : <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> Back</button>}
              {step < 2
                ? <Button key="next" type="button" size="lg" onClick={next}>Continue</Button>
                : <Button key="submit" type="submit" size="lg" loading={isSubmitting} disabled={Boolean(modal)}>{demo ? `Place order · ${formatPrice(total)}` : `Pay ${formatPrice(total)} with M-Pesa`}</Button>}
            </div>
          </form>
        </div>
      </div>

      <aside aria-label="Order summary" className="hidden border-l border-line bg-surface lg:block">
        <div className="sticky top-0 p-10"><Summary {...{ items, subtotal, shipping, total }} /></div>
      </aside>

      {modal && (
        <MpesaModal items={items} shipping={modal.shipping} phone={modal.phone} orderId={orderId} resume={modal.resume}
          onPaid={onPaid} onDone={onDone} onChangeNumber={onChangeNumber} />
      )}
    </div>
  )
}
