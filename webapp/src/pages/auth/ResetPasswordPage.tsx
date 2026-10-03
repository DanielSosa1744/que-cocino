import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Leaf, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  return (
    <div className="h-full max-h-full bg-white flex flex-col justify-center px-5 py-2 overflow-y-auto">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 mb-1.5 shadow-xs">
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Nueva contraseña</h1>
          <p className="text-gray-400 text-xs mt-0.5">Introduce tu nueva clave de acceso</p>
        </div>

        {success ? (
          <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1 text-sm">¡Contraseña actualizada!</h3>
            <p className="text-gray-500 text-xs">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-xs text-gray-500 hover:underline">
                Cancelar y volver
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
