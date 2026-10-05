import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError('No se pudo enviar el correo. Verifica el email.')
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center px-5 py-4 overflow-y-auto animate-fade-in text-[#2F2A26]">
      <div className="max-w-sm mx-auto w-full menu-card-frame rounded-3xl p-6 sm:p-7 relative shadow-lg">
        {/* Esquinas ornamentales discretas */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

        <Link to="/login" className="inline-flex items-center gap-1.5 text-[#8F7347] hover:text-[#1C1917] mb-3 text-sm font-menu-serif font-medium transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Atelier</span>
        </Link>

        {/* Encabezado */}
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
            Recuperar Clave
          </h1>
          <p className="font-menu-serif italic text-sm text-[#766153] mt-1">
            Le enviaremos un enlace confidencial para restablecer el acceso
          </p>
        </div>

        {sent ? (
          <div className="text-center bg-[#F7F3EC] border border-[#A88B57]/20 rounded-2xl p-6">
            <div className="text-3xl mb-2 text-[#A88B57]">✦ ✉ ✦</div>
            <h3 className="font-menu-title text-lg font-bold text-[#1C1917] mb-1">Enlace Enviado</h3>
            <p className="font-menu-serif text-sm text-[#766153] leading-relaxed">
              Revise su bandeja de entrada y siga las instrucciones de la Casa.
            </p>
            <Link to="/login" className="inline-block mt-4 text-[#8F7347] hover:text-[#1C1917] text-sm font-semibold uppercase tracking-wider underline">
              Regresar al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[#766153] mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="chef@maison.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A88B57]/30 bg-white/80 text-sm sm:text-base text-[#1C1917] placeholder-[#A89F91] focus:outline-none focus:ring-1 focus:ring-[#A88B57] focus:border-[#A88B57] transition font-menu-serif"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-700 text-xs sm:text-sm text-center font-menu-serif">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C1917] hover:bg-[#2F2A26] text-[#FAF7F2] font-semibold rounded-xl text-sm sm:text-base uppercase tracking-widest transition shadow-sm disabled:opacity-60 border border-[#A88B57]/40"
            >
              {loading ? 'Enviando...' : '✦ Enviar Enlace de Acceso ✦'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
