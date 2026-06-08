import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// AppRoutes will be added in Step 3
function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-xl font-medium text-gray-700">מערכת נוכחות — בבנייה</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider must be inside BrowserRouter — it uses useNavigate */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
