import { NavLink } from 'react-router-dom'
import { LogOut, Clock, Shield, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const { user, logout } = useAuth()
  const isAdmin = user?.employee.role === 'Admin'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand — right side in RTL */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              מערכת נוכחות
            </span>
          </div>

          {/* Navigation tabs — admin only, center */}
          {user && isAdmin && (
            <nav className="flex items-center gap-1">
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">לוח מנהל</span>
              </NavLink>

              <NavLink
                to="/employee"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">לוח עובד</span>
              </NavLink>
            </nav>
          )}

          {/* User info + logout — left side in RTL */}
          {user && (
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-gray-800">
                  {user.employee.fullName}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {isAdmin ? (
                    <>
                      <Shield className="h-3 w-3 text-primary-500" />
                      מנהל
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 text-gray-400" />
                      עובד
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600
                           transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                title="יציאה מהמערכת"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">יציאה</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
