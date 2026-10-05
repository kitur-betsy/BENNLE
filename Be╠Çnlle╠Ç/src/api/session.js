import { supabase } from './supabase'
import { toUser } from './services'
import { useAuth } from '../store/auth'

// Keeps the UI store in step with the Supabase session: refreshed tokens, expiry, sign-out in another tab,
// and a role re-check on every page load (so a tampered local role never shows the admin portal).
export function initSessionSync() {
  if (!supabase) return () => {}
  const { setToken, setSession, expire } = useAuth.getState()

  const verify = async () => {
    const { data } = await supabase.auth.getSession()
    const state = useAuth.getState()
    if (!data.session) { if (state.user) expire(); return }
    if (!state.user || state.user.id !== data.session.user.id || state.token !== data.session.access_token) {
      setSession({ user: await toUser(data.session.user), token: data.session.access_token })
      return
    }
    const fresh = await toUser(data.session.user)
    if (fresh.role !== state.user.role) setSession({ user: fresh, token: data.session.access_token })
  }
  verify().catch(() => {})

  const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' && session) setToken(session.access_token)
    // Signed out without the user asking (user already cleared by logout() means this is a normal sign-out).
    if (event === 'SIGNED_OUT' && useAuth.getState().user) expire()
  })
  return () => sub.subscription.unsubscribe()
}
