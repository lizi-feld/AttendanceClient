import { Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// Full implementation coming in Step 4
export function EmployeeDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          שלום, {user?.employee.FullName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">לוח בקרה עובד — יושלם בשלב 4</p>
      </div>

      <div className="card flex items-center gap-4 text-gray-500">
        <Clock className="h-8 w-8 text-primary-400" />
        <span>מסך נוכחות עובד בבנייה...</span>
      </div>
    </div>
  )
}
