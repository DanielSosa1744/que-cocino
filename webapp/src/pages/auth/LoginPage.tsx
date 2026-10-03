import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginEntranceAnimation from '../../components/LoginEntranceAnimation'
import GoogleIcon from '../../components/GoogleIcon'

export default function LoginPage() {
  const { signIn, signInDemo, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEntrance, setShowEntrance] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      setShowEntrance(true)
    }
  }

  const handleDemoAccess = () => {
    signInDemo()
    setShowEntrance(true)
  }

  return (
    <div className="h-full max-h-full bg-stone-50/50 flex flex-col justify-center px-5 py-2 overflow-y-auto">
      {showEntrance && <LoginEntranceAnimation onComplete={() => navigate('/home')} />}

      <div className="max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 mb-2 shadow-xs border border-emerald-100/80">
            <GoogleIcon name="eco" className="text-emerald-700 text-2xl" filled />
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight leading-tight">¿Qué Cocino?</h1>
          <p className="text-stone-400 mt-0.5 text-xs">
            Asistente para no tirar comida
          </p>
        </div>

        {/* Botón de acceso demo instantáneo */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-xs tap-subtle cursor-pointer"
          >
            <GoogleIcon name="auto_awesome" className="text-emerald-700 text-base" />
            Acceso Rápido Demo (Probar ahora)
          </button>
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200/60"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-stone-50/80 px-2.5 text-stone-400">o accede con tu cuenta</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-0.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tuemail@ejemplo.com"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <GoogleIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg text-stone-400" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
          )}

          <div className="flex justify-between items-center text-xs">
            <Link
              to="/forgot-password"
              className="text-stone-400 hover:text-emerald-700 transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl transition disabled:opacity-60 text-sm shadow-md tap-subtle cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-500 mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Crear cuenta gratuita
          </Link>
        </p>

        {isDemoMode && (
          <p className="text-[11px] text-stone-400 text-center mt-4 bg-white p-2.5 rounded-xl border border-stone-200/60">
            <GoogleIcon name="info" className="text-stone-400 text-xs mr-1 align-middle" /> Base de datos local activa.
          </p>
        )}
      </div>
    </div>
  )
}
