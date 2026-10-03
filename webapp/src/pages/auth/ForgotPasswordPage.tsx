import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowLeft, Leaf } from 'lucide-react'

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
    <div className="h-full max-h-full bg-white flex flex-col justify-center px-5 py-2 overflow-y-auto">
      <div className="max-w-sm mx-auto w-full">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Volver</span>
        </Link>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 mb-1.5 shadow-xs">
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Recuperar contraseña</h1>
          <p className="text-gray-400 mt-0.5 text-xs">Te enviaremos un enlace por email</p>
        </div>

        {sent ? (
          <div className="text-center bg-green-50 rounded-2xl p-6">
            <div className="text-3xl mb-2">📧</div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Email enviado</h3>
            <p className="text-gray-500 text-xs">
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <Link to="/login" className="block mt-3 text-green-600 text-xs font-semibold">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tuemail@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
