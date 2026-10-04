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
    <div className="h-full max-h-full bg-[#F7F3EC] flex flex-col justify-center px-5 py-4 overflow-y-auto">
      {showEntrance && <LoginEntranceAnimation onComplete={() => navigate('/home')} />}

      <div className="max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EFF4EC] mb-2 shadow-xs border border-[#5D7A56]/25">
            <GoogleIcon name="eco" className="text-[#5D7A56] text-2xl" filled />
          </div>
          <h1 className="text-xl font-serif font-medium text-[#2F2A26] tracking-tight leading-tight">¿Qué Cocino?</h1>
          <p className="text-[#766153] mt-0.5 text-xs">
            Cuaderno inteligente para tu cocina
          </p>
        </div>

        {/* Botón de acceso demo instantáneo */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-[#EFF4EC] hover:bg-[#E2ECE0] border border-[#5D7A56]/30 text-[#2F2A26] font-medium rounded-2xl transition flex items-center justify-center gap-1.5 text-xs shadow-xs tap-subtle cursor-pointer"
          >
            <GoogleIcon name="auto_awesome" className="text-[#5D7A56] text-base" />
            Acceso Rápido Demo (Entrar directo)
          </button>
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#766153]/15"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#F7F3EC] px-2.5 text-[#766153]">o accede con tu cuenta</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#2F2A26] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tuemail@ejemplo.com"
              className="w-full px-3 py-2.5 rounded-xl border border-[#766153]/20 bg-[#FCFAF7] text-[#2F2A26] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#5D7A56] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2F2A26] mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-[#766153]/20 bg-[#FCFAF7] text-[#2F2A26] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#5D7A56] transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#766153] hover:text-[#2F2A26] cursor-pointer"
              >
                <GoogleIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-base text-[#766153]" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[#A68A64] text-xs bg-[#FCFAF7] p-2.5 rounded-xl border border-[#A68A64]/30">{error}</p>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <Link
              to="/forgot-password"
              className="text-[#766153] hover:text-[#2F2A26] transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2F2A26] hover:bg-black text-[#F7F3EC] font-medium rounded-2xl transition disabled:opacity-60 text-xs shadow-sm tap-subtle cursor-pointer mt-1"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-[#766153] mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-[#5D7A56] font-medium hover:underline">
            Crear cuenta gratuita
          </Link>
        </p>

        {isDemoMode && (
          <p className="text-[11px] text-[#766153] text-center mt-4 bg-[#FCFAF7] p-2 rounded-xl border border-[#766153]/15">
            <GoogleIcon name="info" className="text-[#5D7A56] text-xs mr-1 align-middle" /> Modo demostración activo con base de datos local.
          </p>
        )}
      </div>
    </div>
  )
}
