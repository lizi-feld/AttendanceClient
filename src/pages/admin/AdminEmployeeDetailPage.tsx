import { useParams } from 'react-router-dom'
import { UserCircle } from 'lucide-react'

// Full implementation coming in Step 5
export function AdminEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">פרטי עובד</h1>
        <p className="text-gray-500 text-sm mt-1">מזהה: {id} — יושלם בשלב 5</p>
      </div>

      <div className="card flex items-center gap-4 text-gray-500">
        <UserCircle className="h-8 w-8 text-primary-400" />
        <span>מסך פרטי עובד בבנייה...</span>
      </div>
    </div>
  )
}
