import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../store/auth'

export function AdminRoute() {
  const user = useAdminAuth((s) => s.user)
  const location = useLocation()
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
