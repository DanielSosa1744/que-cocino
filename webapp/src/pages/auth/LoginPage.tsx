import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Leaf, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signInDemo, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      navigate('/home')
    }
  }

  const handleDemoAccess = () => {
    signInDemo()
    navigate('/home')
  }

  return (
    <div className="min-h-app bg-white flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-green-50 mb-3 shadow-sm border border-green-100">
            <Leaf className="w-8 h-8 text-[#4CAF50]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">¿Qué Cocino?</h1>
          <p className="text-gray-500 mt-1 text-xs">
            Asistente doméstico para evitar tirar comida
          </p>
        </div>

        {/* Botón de acceso demo instantáneo */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-3 px-4 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-green-600" />
            Acceso Rápido Demo (Probar ahora)
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">o accede con tu cuenta</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tuemail@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
          )}

          <div className="flex justify-between items-center text-xs">
            <Link
              to="/forgot-password"
              className="text-gray-400 hover:text-green-600 transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition disabled:opacity-60 text-sm shadow-md shadow-green-100"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-green-600 font-bold hover:underline">
            Crear cuenta gratuita
          </Link>
        </p>

        {isDemoMode && (
          <p className="text-[11px] text-gray-400 text-center mt-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            ℹ️ Base de datos local activa. Conecta Supabase en <code className="text-gray-600">.env</code> para sincronización cloud.
          </p>
        )}
      </div>
    </div>
  )
}
