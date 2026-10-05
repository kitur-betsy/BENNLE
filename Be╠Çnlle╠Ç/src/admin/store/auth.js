import { useAuth } from '../../store/auth'
import { authApi } from '../../api/services'
import { supabase } from '../../api/supabase'

// The admin shares the storefront session; the role on the user (read from the database's admins table) decides access.
export const useAdminAuth = useAuth

export async function adminLogin(email, password) {
  const session = await authApi.login({ email: email.trim(), password })
  if (session.user.role !== 'admin') {
    // Do not leave a customer session behind after a failed admin attempt.
    await supabase?.auth.signOut().catch(() => {})
    throw new Error('This account does not have admin access.')
  }
  useAuth.getState().setSession(session)
  return session.user
}

export const adminLogout = () => useAuth.getState().logout()
