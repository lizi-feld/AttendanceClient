import { LogOut, Clock, Shield, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Navbar() {
  const { user, logout } = useAuth()
  const isAdmin = user?.employee.Role === 'Admin'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand — right side in RTL */}
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              מערכת נוכחות
            </span>
          </div>

          {/* User info + logout — left side in RTL */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-gray-800">
                  {user.employee.FullName}
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
