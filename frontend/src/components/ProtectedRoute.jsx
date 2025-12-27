import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex-1 bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Role not allowed
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet /> 
}
