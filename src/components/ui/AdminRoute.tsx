import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageSpinner } from './Spinner'

/** Requires the Admin role. Redirects non-admins to /employee. */
export function AdminRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.employee.role !== 'Admin') return <Navigate to="/employee" replace />

  return <Outlet />
}
