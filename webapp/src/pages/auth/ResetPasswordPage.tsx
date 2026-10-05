import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { CheckCircle } from 'lucide-react'

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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center px-5 py-4 overflow-y-auto animate-fade-in text-[#2F2A26]">
      <div className="max-w-sm mx-auto w-full menu-card-frame rounded-3xl p-6 sm:p-7 relative shadow-lg">
        {/* Esquinas ornamentales discretas */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 opacity-80 mb-1">
            <span className="h-[1px] w-5 bg-gradient-to-r from-transparent to-[#A88B57]" />
            <span className="text-[#A88B57] text-xs">✦</span>
            <span className="text-xs tracking-[0.22em] uppercase font-semibold text-[#8F7347]">
              Maison Culinaria
            </span>
            <span className="text-[#A88B57] text-xs">✦</span>
            <span className="h-[1px] w-5 bg-gradient-to-l from-transparent to-[#A88B57]" />
          </div>

          <h1 className="font-menu-title text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-tight">
            Nueva Clave
          </h1>
          <p className="font-menu-serif italic text-sm text-[#766153] mt-1">
            Defina su nueva credencial privada de acceso
          </p>
        </div>

        {success ? (
          <div className="bg-[#EBF1E8] rounded-2xl p-5 text-center border border-[#4A6B44]/25">
            <CheckCircle className="w-10 h-10 text-[#4A6B44] mx-auto mb-2" />
            <h3 className="font-menu-title font-bold text-[#1C1917] mb-1 text-base">✦ Clave Actualizada ✦</h3>
            <p className="font-menu-serif text-sm text-[#4A6B44]">Redirigiendo a la entrada principal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-700 text-xs sm:text-sm text-center font-menu-serif">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[#766153] mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A88B57]/30 bg-white/80 text-sm sm:text-base text-[#1C1917] placeholder-[#A89F91] focus:outline-none focus:ring-1 focus:ring-[#A88B57] focus:border-[#A88B57] transition font-menu-serif"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C1917] hover:bg-[#2F2A26] text-[#FAF7F2] font-semibold rounded-xl text-sm sm:text-base uppercase tracking-widest transition shadow-sm disabled:opacity-60 border border-[#A88B57]/40"
            >
              {loading ? 'Guardando...' : '✦ Actualizar Credencial ✦'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-menu-serif text-[#8F7347] hover:text-[#1C1917] hover:underline">
                Cancelar y regresar
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
