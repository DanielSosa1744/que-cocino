import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Leaf } from 'lucide-react'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message || 'Error al crear la cuenta.')
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/home'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-app bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4"><span className="material-symbols-rounded align-middle text-[1.2em] mb-0.5 inline-block">celebration</span></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-500">Redirigiendo a la app...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full max-h-full bg-white flex flex-col justify-center px-5 py-2 overflow-y-auto">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 mb-1.5 shadow-xs">
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Crear cuenta</h1>
          <p className="text-gray-400 mt-0.5 text-xs">Empieza a ahorrar en comida hoy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tuemail@ejemplo.com"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">Confirmar contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite la contraseña"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-xs shadow-xs"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:text-green-700">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
