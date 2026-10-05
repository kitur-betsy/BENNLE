import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, MailCheck } from 'lucide-react'
import { useAdminAuth, adminLogin } from '../store/auth'
import { authApi } from '../../api/services'
import { useTheme } from '../lib/useTheme'
import { Button, TextField } from '../components/ui'
import { images } from '../../data/images'

const ease = [0.25, 0.46, 0.45, 0.94]
const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())
const MAX_TRIES = 5
const COOLDOWN = 30

const Notice = ({ tone = 'error', children }) => (
  <p role={tone === 'error' ? 'alert' : 'status'} className={tone === 'error'
    ? 'rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
    : 'flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'}>
    {tone === 'ok' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<span>{children}</span>
  </p>
)

export default function Login() {
  useTheme()
  const user = useAdminAuth((s) => s.user)
  const expired = useAdminAuth((s) => s.expired)
  const clearExpired = useAdminAuth((s) => s.clearExpired)
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // signin | forgot | sent
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tries, setTries] = useState(0)
  const [wait, setWait] = useState(0)
  const resetDone = location.state?.reason === 'password-updated'

  useEffect(() => {
    if (wait <= 0) return undefined
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])
  useEffect(() => () => clearExpired(), [clearExpired])

  // Only signed-out visitors see this page.
  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (wait > 0 || loading) return
    if (!emailOk(form.email)) return setError('Enter a valid email address.')
    if (!form.password) return setError('Enter your password.')
    setLoading(true); setError('')
    try {
      await adminLogin(form.email, form.password)
      navigate(location.state?.from?.startsWith('/admin') ? location.state.from : '/admin', { replace: true })
    } catch (err) {
      const n = tries + 1
      setTries(n)
      if (n >= MAX_TRIES) { setWait(COOLDOWN); setTries(0); setError(`Too many failed attempts. Try again in ${COOLDOWN} seconds.`) } else setError(err.message)
    } finally { setLoading(false) }
  }

  const sendReset = async (e) => {
    e.preventDefault()
    if (!emailOk(form.email)) return setError('Enter the email address of your admin account.')
    setLoading(true); setError('')
    try { await authApi.requestReset(form.email); setMode('sent') } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="grid min-h-screen bg-white text-neutral-900 lg:grid-cols-2 dark:bg-neutral-900 dark:text-white">
      {/* Image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img src={images.hero} alt="" initial={{ scale: 1.1, filter: 'blur(5px)' }} animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <span className="text-lg font-semibold tracking-tight">Benlle</span>
          <div className="max-w-md">
            <p className="text-sm uppercase tracking-widest opacity-80">Owner portal</p>
            <p className="mt-3 font-editorial text-4xl font-semibold italic leading-tight tracking-tight">
              Run the shop with the same care you put into every formula.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
        <motion.div initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease }} className="m-auto w-full max-w-sm py-12">
          <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200 dark:border-neutral-700">
            {mode === 'sent' ? <MailCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </span>

          {mode === 'signin' && (
            <>
              <h1 className="font-editorial text-4xl font-semibold italic tracking-tight">Welcome back</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Sign in to manage your store.</p>
              <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                {expired && <Notice>Your session ended. Please sign in again.</Notice>}
                {resetDone && <Notice tone="ok">Password updated. Sign in with your new password.</Notice>}
                <TextField label="Email" type="email" autoComplete="email" autoFocus value={form.email} onChange={set('email')} placeholder="you@example.com" />
                <div className="relative">
                  <TextField label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="••••••••" />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute bottom-2.5 right-3 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <Notice>{error}</Notice>}
                <Button type="submit" size="lg" loading={loading} disabled={wait > 0} className="w-full">{wait > 0 ? `Try again in ${wait}s` : 'Sign in'}</Button>
                <button type="button" onClick={() => { setMode('forgot'); setError('') }} className="block w-full text-center text-sm text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-white">
                  Forgot your password?
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1 className="font-editorial text-4xl font-semibold italic tracking-tight">Reset password</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Enter your admin email and we will send you a link to choose a new password.</p>
              <form onSubmit={sendReset} className="mt-8 space-y-4" noValidate>
                <TextField label="Email" type="email" autoComplete="email" autoFocus value={form.email} onChange={set('email')} placeholder="you@example.com" />
                {error && <Notice>{error}</Notice>}
                <Button type="submit" size="lg" loading={loading} className="w-full">Send reset link</Button>
                <button type="button" onClick={() => { setMode('signin'); setError('') }} className="block w-full text-center text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Back to sign in</button>
              </form>
            </>
          )}

          {mode === 'sent' && (
            <>
              <h1 className="font-editorial text-4xl font-semibold italic tracking-tight">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">If <span className="font-medium text-neutral-900 dark:text-white">{form.email}</span> belongs to an admin account, a reset link is on its way. It can take a minute.</p>
              <Button size="lg" variant="secondary" className="mt-8 w-full" onClick={() => setMode('signin')}>Back to sign in</Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
