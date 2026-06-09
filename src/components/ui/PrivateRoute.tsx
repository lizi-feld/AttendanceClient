import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageSpinner } from './Spinner'

/** Requires any authenticated user. Redirects to /login if not logged in. */
export function PrivateRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
