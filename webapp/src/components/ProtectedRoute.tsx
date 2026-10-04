import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen h-full flex items-center justify-center bg-[#F7F3EC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[#5D7A56] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#766153] text-xs font-mono">Abriendo cocina...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
