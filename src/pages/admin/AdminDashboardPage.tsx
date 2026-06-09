import { LayoutDashboard } from 'lucide-react'

// Full implementation coming in Step 5
export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה מנהל</h1>
        <p className="text-gray-500 text-sm mt-1">יושלם בשלב 5</p>
      </div>

      <div className="card flex items-center gap-4 text-gray-500">
        <LayoutDashboard className="h-8 w-8 text-primary-400" />
        <span>מסך מנהל בבנייה...</span>
      </div>
    </div>
  )
}
