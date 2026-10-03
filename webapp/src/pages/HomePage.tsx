import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'
import { Mic, LogOut, ChevronRight } from 'lucide-react'

export default function HomePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()

  const urgentCount = inventory.filter(i => i.urgency === 'critical' || i.urgency === 'warning').length

  return (
    <div className="h-full max-h-full bg-gradient-to-b from-emerald-50/30 via-white to-gray-50/40 flex flex-col justify-between overflow-hidden px-5 py-3.5 select-none">
      {/* 1. Saludo minimalista superior */}
      <header className="flex-shrink-0 pt-safe flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-gray-500">
          Hola, Chef Sostenible 👋
        </p>
        <button
          onClick={signOut}
          title="Cerrar sesión"
          className="p-1.5 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100/80 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Núcleo central del asistente inteligente (60% atención en micrófono, 20% pregunta) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-auto px-2">
        {/* 2 & 3. Pregunta principal y subtítulo */}
        <div className="mb-5 sm:mb-6 space-y-1.5 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            ¿Qué tienes hoy en casa?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed">
            Cuéntame qué alimentos tienes y te ayudaré a aprovecharlos.
          </p>
        </div>

        {/* 4. Micrófono Protagonista (+28% tamaño, doble halo suave y sombreado moderno) */}
        <div className="relative flex items-center justify-center my-1 sm:my-2">
          {/* Doble halo suave */}
          {/* Halo 1 exterior suave */}
          <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-emerald-400/10 animate-pulse pointer-events-none" />
          {/* Halo 2 interior cálido */}
          <div className="absolute w-44 h-44 sm:w-50 sm:h-50 rounded-full bg-emerald-500/15 pointer-events-none" />

          {/* Botón de voz grande y dominante */}
          <button
            onClick={() => navigate('/voice')}
            className="relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-[#4CAF50] to-[#388E3C] hover:from-[#43A047] hover:to-[#2E7D32] text-white shadow-2xl shadow-emerald-500/40 border-4 border-white/80 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
            aria-label="Toca para hablar"
          >
            <Mic className="w-16 h-16 text-white stroke-[2.2] drop-shadow-sm group-hover:scale-105 transition-transform" />
          </button>
        </div>

        {/* Texto de acción */}
        <button
          onClick={() => navigate('/voice')}
          className="mt-3.5 text-sm sm:text-base font-bold text-gray-800 hover:text-green-700 transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>🎙️</span>
          <span>Toca para hablar</span>
        </button>

        {/* 5. Alerta discreta (ubicada DEBAJO del micrófono, sin competir) */}
        {urgentCount > 0 && (
          <div className="mt-3.5">
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50/80 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-medium transition active:scale-95 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span>{urgentCount} {urgentCount === 1 ? 'alimento necesita' : 'alimentos necesitan'} atención</span>
              <span className="text-red-400 font-semibold flex items-center gap-0.5">
                · Ver plan <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        )}

        {/* 6. Ejemplo conversacional amigable y limpio */}
        <div
          onClick={() => navigate('/voice')}
          className="mt-4 max-w-xs text-center cursor-pointer group px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-gray-100 hover:border-emerald-200 transition shadow-2xs"
        >
          <p className="text-[11px] text-gray-400 font-medium mb-0.5">
            Por ejemplo:
          </p>
          <p className="text-xs text-gray-600 italic leading-relaxed group-hover:text-gray-900 transition-colors">
            "Tengo dos yogures que vencen mañana,<br />
            cuatro tomates y media lechuga."
          </p>
        </div>
      </main>

      {/* 7. Accesos secundarios discretos (menor peso visual) */}
      <footer className="flex-shrink-0 pt-2 pb-1">
        <nav className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50"
          >
            <span>📦</span>
            <span>Inventario</span>
          </button>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50"
          >
            <span>🥫</span>
            <span>Plan</span>
          </button>

          <button
            onClick={() => navigate('/impact')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50"
          >
            <span>📈</span>
            <span>Impacto</span>
          </button>
        </nav>
      </footer>
    </div>
  )
}
