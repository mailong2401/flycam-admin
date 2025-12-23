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
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      // Nếu đã đăng nhập và đang ở trang login, chuyển hướng đến dashboard
      if (location.pathname === '/admin/login') {
        console.log('🔄 User already logged in, redirecting to dashboard')
        navigate('/admin/dashboard', { replace: true })
      }
      // Nếu đã đăng nhập và truy cập /admin, chuyển hướng đến dashboard
      else if (location.pathname === '/admin') {
        console.log('🔄 Redirecting from /admin to /admin/dashboard')
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [user, loading, location.pathname, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!user) {
    // KHÔNG redirect nếu đang ở trang login
    if (location.pathname === '/admin/login') {
      return <>{children}</> // Trả về AdminLogin component
    }
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}