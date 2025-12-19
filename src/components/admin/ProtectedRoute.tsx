import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate() // THÊM HOOK NÀY

  // Nếu đã login và đang ở trang login, tự động redirect đến dashboard
  useEffect(() => {
    if (user && location.pathname === '/admin/login') {
      console.log('🔄 Auto-redirecting from login to dashboard')
      navigate('/admin/dashboard', { replace: true }) // DÙNG navigate THAY VÌ window.location
    }
  }, [user, location.pathname, navigate]) // THÊM navigate VÀO DEPENDENCIES

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}