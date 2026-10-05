import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center px-5 py-2 overflow-y-auto animate-fade-in text-[#2F2A26]">
      <div className="max-w-sm mx-auto w-full menu-card-frame rounded-3xl p-6 sm:p-7 relative shadow-lg">
        {/* Esquinas ornamentales discretas */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 opacity-80 mb-1">
            <span className="h-[1px] w-5 bg-gradient-to-r from-transparent to-[#A88B57]" />
            <span className="text-[#A88B57] text-[9px]">✦</span>
            <span className="text-[9px] tracking-[0.22em] uppercase font-semibold text-[#8F7347]">
              Maison Culinaria
            </span>
            <span className="text-[#A88B57] text-[9px]">✦</span>
            <span className="h-[1px] w-5 bg-gradient-to-l from-transparent to-[#A88B57]" />
          </div>
          <h1 className="font-menu-title text-2xl font-bold text-[#1C1917] leading-tight">Registro de Cortesía</h1>
          <p className="font-menu-serif italic text-[#766153] mt-0.5 text-xs">Acceda a su cuaderno de cocina y despensa</p>
        </div>

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
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 rounded-xl border border-[#A88B57]/30 bg-white/90 text-[#1C1917] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#8F7347] transition pr-10 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#766153] hover:text-[#1C1917] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">Confirmar clave</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Repita la clave"
              className="w-full px-3 py-2 rounded-xl border border-[#A88B57]/30 bg-white/90 text-[#1C1917] placeholder-[#766153]/50 text-xs focus:outline-none focus:border-[#8F7347] transition font-sans"
            />
          </div>

          {error && (
            <p className="text-[#C84B31] text-xs bg-[#FAF7F2] p-2 rounded-xl border border-[#C84B31]/30">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] font-semibold tracking-wider rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-xs shadow-sm cursor-pointer border border-[#A88B57]/40"
          >
            {loading ? 'Creando registro...' : '✦ Crear Cuenta en el Atelier ✦'}
          </button>
        </form>

        <p className="text-center text-xs text-[#766153] mt-4 font-menu-serif">
          ¿Ya tiene registro?{' '}
          <Link to="/login" className="text-[#8F7347] font-semibold hover:underline">
            Acceder
          </Link>
        </p>
      </div>
    </div>
  )
}
