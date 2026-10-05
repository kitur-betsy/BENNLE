import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { supabase } from '../../api/supabase'
import { authApi } from '../../api/services'
import { useTheme } from '../lib/useTheme'
import { Button, TextField } from '../components/ui'

// Landing page for the link in the password-reset email. supabase-js turns the link into a short-lived
// recovery session; without one this page explains how to get a fresh link.
export default function ResetPassword() {
  useTheme()
  const navigate = useNavigate()
  const [ready, setReady] = useState(supabase ? null : false) // null = checking, true/false
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    let live = true
    const settle = (ok) => live && setReady((r) => (r === true ? true : ok))
    supabase.auth.getSession().then(({ data }) => settle(Boolean(data.session)))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => { if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) settle(true) })
    const t = setTimeout(() => settle(false), 2500)
    return () => { live = false; clearTimeout(t); sub.subscription.unsubscribe() }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (pw.next.length < 4) return setError('Choose a longer password.')
    if (pw.next !== pw.confirm) return setError('The two passwords do not match.')
    setLoading(true); setError('')
    try {
      await authApi.updatePassword(pw.next)
      navigate('/admin/login', { replace: true, state: { reason: 'password-updated' } })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-white px-6 text-neutral-900 dark:bg-neutral-900 dark:text-white">
      <div className="w-full max-w-sm">
        <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl border border-neutral-200 dark:border-neutral-700"><KeyRound className="h-5 w-5" /></span>
        {ready === null && <p className="text-sm text-neutral-500">Checking your link…</p>}
        {ready === false && (
          <>
            <h1 className="font-editorial text-3xl font-semibold italic tracking-tight">This link has expired</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Reset links work once and expire quickly. Request a new one from the sign-in page.</p>
            <Button as={Link} to="/admin/login" size="lg" className="mt-8 w-full">Back to sign in</Button>
          </>
        )}
        {ready === true && (
          <>
            <h1 className="font-editorial text-3xl font-semibold italic tracking-tight">Choose a new password</h1>
            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
              <div className="relative">
                <TextField label="New password" type={show ? 'text' : 'password'} autoComplete="new-password" autoFocus value={pw.next} onChange={(e) => { setPw({ ...pw, next: e.target.value }); setError('') }} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute bottom-2.5 right-3 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <TextField label="Confirm password" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw.confirm} onChange={(e) => { setPw({ ...pw, confirm: e.target.value }); setError('') }} />
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
              <Button type="submit" size="lg" loading={loading} className="w-full">Update password</Button>
            </form>
          </>
        )}
        <Link to="/" className="mt-8 block text-center text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400">Back to store</Link>
      </div>
    </div>
  )
}
