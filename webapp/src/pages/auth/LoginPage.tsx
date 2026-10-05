import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginEntranceAnimation from '../../components/LoginEntranceAnimation'
import GoogleIcon from '../../components/GoogleIcon'

export default function LoginPage() {
  const { signIn, signInDemo } = useAuth()
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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center px-5 py-4 overflow-y-auto animate-fade-in text-[#2F2A26]">
      {showEntrance && <LoginEntranceAnimation onComplete={() => navigate('/home')} />}

      <div className="max-w-sm mx-auto w-full menu-card-frame rounded-3xl p-6 sm:p-7 relative shadow-lg">
        {/* Esquinas ornamentales discretas */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

        {/* Logo y Encabezado de la Casa */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 opacity-80 mb-1">
            <span className="h-[1px] w-5 bg-gradient-to-r from-transparent to-[#A88B57]" />
            <span className="text-[#A88B57] text-[9px]">✦</span>
            <span className="text-[9px] tracking-[0.22em] uppercase font-semibold text-[#8F7347]">
              Maison Culinaria
            </span>
            <span className="text-[#A88B57] text-[9px]">✦</span>
            <span className="h-[1px] w-5 bg-gradient-to-l from-transparent to-[#A88B57]" />
          </div>

          <h1 className="font-menu-title text-2xl font-bold text-[#1C1917] tracking-tight leading-tight">
            ¿Qué Cocino?
          </h1>
          <p className="font-menu-serif italic text-[#766153] mt-0.5 text-xs">
            Atelier gastronómico & carta personalizada
          </p>
        </div>

        {/* Botón de acceso demo instantáneo */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-white border border-[#A88B57]/40 text-[#1C1917] font-menu-serif font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-2xs tap-subtle cursor-pointer"
          >
            <GoogleIcon name="auto_awesome" className="text-[#8F7347] text-base" />
            <span>✦ Entrada Rápida · Modo Degustación ✦</span>
          </button>
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#A88B57]/20"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#FAF7F2] px-2.5 text-[#766153] font-menu-serif italic">o ingrese con sus credenciales</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3 font-menu-serif">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="su.nombre@gastronomia.com"
              className="w-full px-3 py-2 rounded-xl border border-[#A88B57]/30 bg-white/90 text-[#1C1917] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#8F7347] transition font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Clave de acceso</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-[#A88B57]/30 bg-white/90 text-[#1C1917] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#8F7347] transition pr-10 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#766153] hover:text-[#1C1917] cursor-pointer"
              >
                <GoogleIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-base text-[#766153]" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[#C84B31] text-xs bg-[#FAF7F2] p-2 rounded-xl border border-[#C84B31]/30">{error}</p>
          )}

          <div className="flex justify-between items-center text-xs pt-0.5">
            <Link
              to="/forgot-password"
              className="text-[#8F7347] hover:text-[#1C1917] italic transition"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] font-semibold tracking-wider rounded-xl transition disabled:opacity-60 text-xs shadow-sm tap-subtle cursor-pointer mt-1 border border-[#A88B57]/40"
          >
            {loading ? 'Accediendo a la casa...' : '✦ Ingresar al Atelier ✦'}
          </button>
        </form>

        <p className="text-center text-xs text-[#766153] mt-4 font-menu-serif">
          ¿Primera visita?{' '}
          <Link to="/register" className="text-[#8F7347] font-semibold hover:underline">
            Crear registro de cortesía
          </Link>
        </p>
      </div>
    </div>
  )
}
