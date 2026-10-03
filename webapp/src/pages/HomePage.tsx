import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'
import { Mic, LogOut } from 'lucide-react'

export default function HomePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()

  const urgentCount = inventory.filter(i => i.urgency === 'critical' || i.urgency === 'warning').length

  return (
    <div className="h-full max-h-full bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/30 flex flex-col justify-between overflow-hidden px-5 py-3.5 select-none">
      {/* 1. Header superior minimalista: Saludo & Alerta discreta */}
      <div className="flex-shrink-0 pt-safe">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight">
              Hola, Chef Sostenible 👋
            </p>
          </div>
          <button
            onClick={signOut}
            title="Cerrar sesión"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Alerta discreta: solo cápsula si hay alimentos urgentes */}
        {urgentCount > 0 && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 border border-red-200/70 text-red-700 text-[11px] font-semibold shadow-2xs transition active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span>
                {urgentCount} {urgentCount === 1 ? 'alimento necesita' : 'alimentos necesitan'} atención
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 2 & 3. Centro de captura: Pregunta principal + Botón protagonista de voz */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto text-center gap-4 sm:gap-5 px-2">
        {/* Pregunta principal */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            ¿Qué tienes hoy en casa?
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Dilo con tu voz y cocinemos sin desperdiciar
          </p>
        </div>

        {/* Botón de voz protagonista (30% - 40% de la atención visual) */}
        <div className="flex flex-col items-center my-1">
          <div className="relative flex items-center justify-center">
            {/* Ondas concéntricas sutiles estilo Apple Voice Memos / Siri */}
            <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-[#4CAF50]/10 animate-ping opacity-25 pointer-events-none" />
            <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#4CAF50]/15 pointer-events-none transition-transform duration-700" />

            <button
              onClick={() => navigate('/voice')}
              className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#4CAF50] hover:bg-[#43A047] text-white shadow-xl shadow-green-500/25 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Toca para hablar"
            >
              <Mic className="w-12 h-12 text-white stroke-[2.2]" />
            </button>
          </div>

          {/* Texto de acción */}
          <button
            onClick={() => navigate('/voice')}
            className="mt-3.5 text-sm sm:text-base font-extrabold text-gray-800 hover:text-green-600 transition flex items-center justify-center gap-1.5"
          >
            <span>🎙️</span>
            <span>Toca para hablar</span>
          </button>
        </div>

        {/* 4. Ejemplo conversacional limpio y amigable */}
        <div
          onClick={() => navigate('/voice')}
          className="bg-white/95 backdrop-blur-xs border border-gray-100 rounded-2xl px-4 py-3 shadow-2xs max-w-xs text-center cursor-pointer hover:border-green-200 transition"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">
            Prueba diciendo:
          </p>
          <p className="text-xs text-gray-600 italic leading-relaxed">
            "Tengo dos yogures que vencen mañana,<br />
            cuatro tomates y media lechuga."
          </p>
        </div>
      </div>

      {/* 5. Accesos secundarios compactos (sin tarjetas grandes, sin estadísticas) */}
      <div className="flex-shrink-0 pt-2 pb-1">
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <span>📦</span>
            <span>Inventario</span>
          </button>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <span>🥫</span>
            <span>Plan</span>
          </button>

          <button
            onClick={() => navigate('/impact')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <span>📈</span>
            <span>Impacto</span>
          </button>
        </div>
      </div>
    </div>
  )
}
