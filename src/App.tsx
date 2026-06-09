import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { PrivateRoute } from './components/ui/PrivateRoute'
import { AdminRoute } from './components/ui/AdminRoute'
import { FullPageSpinner } from './components/ui/Spinner'
import { LoginPage } from './pages/LoginPage'
import { EmployeeDashboardPage } from './pages/EmployeeDashboardPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminEmployeeDetailPage } from './pages/admin/AdminEmployeeDetailPage'
import { useAuth } from './hooks/useAuth'

/** Redirects root path to the correct dashboard based on auth state. */
function RootRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={user.employee.Role === 'Admin' ? '/admin/dashboard' : '/employee'}
      replace
    />
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Employee (any authenticated user) */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/employee" element={<EmployeeDashboardPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<AdminRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/employee/:id" element={<AdminEmployeeDetailPage />} />
        </Route>
      </Route>

      {/* Root → smart redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter — it calls useNavigate */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
