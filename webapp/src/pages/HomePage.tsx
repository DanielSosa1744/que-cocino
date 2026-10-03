import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { extractIngredients, calculateInventoryEconomicRisk } from '../lib/ingredientParser'
import { Mic, MicOff, LogOut, ChevronRight, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    simulateVoiceInput,
  } = useSpeechRecognition()

  // Alimentos urgentes y cálculo de riesgo económico real
  const urgentCount = inventory.filter(i => i.urgency === 'critical' || i.urgency === 'warning').length
  const { riskValue } = calculateInventoryEconomicRisk(inventory)

  // Texto acumulado y alimentos detectados en tiempo real
  const currentText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim()
  const detectedIngredients = currentText ? extractIngredients(currentText) : []

  const handleToggleMic = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  const handleConfirmAndProcess = () => {
    if (isListening) {
      stopListening()
    }
    const textToProcess = currentText || transcript
    if (!textToProcess) return

    const parsed = extractIngredients(textToProcess)
    navigate('/confirm-ingredients', {
      state: {
        parsed,
        rawText: textToProcess,
      },
    })
  }

  const handleUseExample = () => {
    const exampleSentence = 'Tengo dos yogures que vencen mañana, cuatro tomates y media lechuga'
    simulateVoiceInput(exampleSentence)
  }

  return (
    <div className="h-full max-h-full bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/50 flex flex-col justify-between overflow-hidden px-5 py-3.5 select-none">
      {/* 1. Saludo minimalista superior */}
      <header className="flex-shrink-0 pt-safe flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-gray-500">
          Hola, Chef Sostenible 👋
        </p>
        <button
          onClick={signOut}
          title="Cerrar sesión"
          className="p-1.5 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100/80 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Núcleo central del asistente inteligente (Centro de Captura) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-auto px-2 max-w-sm mx-auto w-full">
        {/* 2 & 3. Pregunta principal y subtítulo */}
        <div className="mb-4 sm:mb-5 space-y-1 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            ¿Qué tienes hoy en casa?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed">
            {isListening
              ? 'Te escucho... dime tus alimentos a tu ritmo'
              : 'Cuéntame qué alimentos tienes y te ayudaré a aprovecharlos.'}
          </p>
        </div>

        {/* 4. Micrófono Protagonista (Doble halo suave, sombreado moderno y captura en 1 toque) */}
        <div className="relative flex items-center justify-center my-2">
          {/* Halos dinámicos */}
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
              isListening
                ? 'w-60 h-60 sm:w-68 sm:h-68 bg-red-400/20 animate-ping'
                : 'w-56 h-56 sm:w-64 sm:h-64 bg-emerald-400/15 animate-pulse'
            }`}
          />
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-500 ${
              isListening
                ? 'w-48 h-48 sm:w-52 sm:h-52 bg-red-500/25'
                : 'w-44 h-44 sm:w-48 sm:h-48 bg-emerald-500/15'
            }`}
          />

          {/* Botón de voz protagonista interactivo */}
          <button
            onClick={handleToggleMic}
            className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full text-white shadow-2xl border-4 border-white flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer group ${
              isListening
                ? 'bg-gradient-to-b from-red-500 to-rose-600 shadow-red-500/40 ring-4 ring-red-300/40 animate-pulse'
                : 'bg-gradient-to-b from-[#4CAF50] to-[#388E3C] hover:from-[#43A047] hover:to-[#2E7D32] shadow-emerald-500/40 hover:scale-105'
            }`}
            aria-label={isListening ? 'Detener dictado' : 'Toca para hablar'}
          >
            {isListening ? (
              <MicOff className="w-16 h-16 text-white stroke-[2.2] drop-shadow-sm transition-transform" />
            ) : (
              <Mic className="w-16 h-16 text-white stroke-[2.2] drop-shadow-sm group-hover:scale-105 transition-transform" />
            )}
          </button>
        </div>

        {/* Indicador de estado y botón de acción */}
        <div className="mt-2.5 flex flex-col items-center gap-1.5 w-full">
          {isListening ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-red-600 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                Escuchando en vivo... Habla con naturalidad
              </span>
              <button
                onClick={handleConfirmAndProcess}
                disabled={!currentText}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-full text-xs font-black shadow-md shadow-emerald-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>✓ Listo, revisar {detectedIngredients.length > 0 ? `(${detectedIngredients.length})` : ''}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : currentText ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmAndProcess}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black shadow-md shadow-emerald-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Revisar {detectedIngredients.length} alimentos detectados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetTranscript}
                className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Limpiar
              </button>
            </div>
          ) : (
            <button
              onClick={handleToggleMic}
              className="text-sm sm:text-base font-bold text-gray-800 hover:text-green-700 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>🎙️</span>
              <span>Toca para hablar</span>
            </button>
          )}

          {/* Transcripción en vivo si hay audio detectado */}
          {currentText && (
            <div className="w-full mt-2 bg-white/95 rounded-2xl p-2.5 border border-emerald-100 shadow-2xs text-left max-h-20 overflow-y-auto">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">
                {isListening ? 'Detectando en directo:' : 'Transcripción:'}
              </p>
              <p className="text-xs text-gray-800 italic leading-snug">
                "{currentText}"
              </p>
            </div>
          )}

          {/* Fallback amigable si hay error de reconocimiento o navegador no compatible */}
          {!isSupported && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              Voz nativa no soportada en este navegador. Toca el ejemplo abajo para probar la demo.
            </div>
          )}

          {error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* 5. Alerta discreta de alimentos en riesgo (con valor económico en riesgo) */}
        {urgentCount > 0 && (
          <div className="mt-3">
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50/80 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-medium transition active:scale-95 shadow-2xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span>
                {urgentCount} {urgentCount === 1 ? 'alimento necesita' : 'alimentos necesitan'} atención
                {riskValue > 0 ? ` (≈ ${riskValue.toFixed(2)}€ en riesgo)` : ''}
              </span>
              <span className="text-red-400 font-semibold flex items-center gap-0.5">
                · Ver plan <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        )}

        {/* 6. Ejemplo conversacional amigable y limpio (con 1 toque ejecuta el ejemplo) */}
        {!isListening && !currentText && (
          <div
            onClick={handleUseExample}
            className="mt-3.5 max-w-xs text-center cursor-pointer group px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-gray-100 hover:border-emerald-200 transition shadow-2xs"
            title="Toca para probar con este ejemplo"
          >
            <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 font-medium mb-0.5">
              <span>Por ejemplo</span>
              <Sparkles className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs text-gray-600 italic leading-relaxed group-hover:text-gray-900 transition-colors">
              "Tengo dos yogures que vencen mañana,<br />
              cuatro tomates y media lechuga."
            </p>
          </div>
        )}
      </main>

      {/* 7. Accesos secundarios discretos (menor peso visual) */}
      <footer className="flex-shrink-0 pt-2 pb-1">
        <nav className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50 cursor-pointer"
          >
            <span>📦</span>
            <span>Inventario</span>
          </button>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50 cursor-pointer"
          >
            <span>🥫</span>
            <span>Plan</span>
          </button>

          <button
            onClick={() => navigate('/impact')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50/90 hover:bg-gray-100 text-gray-600 text-xs font-medium transition active:scale-95 border border-gray-200/50 cursor-pointer"
          >
            <span>📈</span>
            <span>Impacto</span>
          </button>
        </nav>
      </footer>
    </div>
  )
}
