import { useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { extractIngredients, calculateInventoryEconomicRisk } from '../lib/ingredientParser'
import GoogleIcon from '../components/GoogleIcon'

export default function HomePage() {
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
    <div className="h-full max-h-full bg-stone-50/40 flex flex-col justify-between overflow-hidden px-5 py-4 select-none">
      {/* Encabezado eliminado según solicitud del usuario */}

      {/* Núcleo central del asistente inteligente (Centro de Captura) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-auto px-2 max-w-sm mx-auto w-full">
        {/* Pregunta principal y subtítulo calmado */}
        <div className="mb-5 space-y-1.5 max-w-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            ¿Qué tienes hoy en casa?
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
            {isListening
              ? 'Te escucho... dime tus alimentos a tu ritmo'
              : 'Cuéntame qué alimentos tienes y te ayudaré a aprovecharlos.'}
          </p>
        </div>

        {/* Micrófono Protagonista (Doble halo suave, tono botánico reposado) */}
        <div className="relative flex items-center justify-center my-3">
          {/* Halos orgánicos suaves */}
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
              isListening
                ? 'w-56 h-56 sm:w-64 sm:h-64 bg-rose-400/15 animate-ping'
                : 'w-52 h-52 sm:w-60 sm:h-60 bg-emerald-500/8 animate-pulse'
            }`}
          />
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-500 ${
              isListening
                ? 'w-44 h-44 sm:w-48 sm:h-48 bg-rose-500/20'
                : 'w-40 h-40 sm:w-44 sm:h-44 bg-emerald-600/10'
            }`}
          />

          {/* Botón de voz con sombreado moderno sobrio */}
          <button
            onClick={handleToggleMic}
            className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full text-white shadow-xl border-4 border-white flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer group tap-subtle ${
              isListening
                ? 'bg-gradient-to-b from-rose-600 to-rose-700 shadow-rose-600/30 ring-4 ring-rose-200/50'
                : 'bg-gradient-to-b from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-900/20 hover:scale-105'
            }`}
            aria-label={isListening ? 'Detener dictado' : 'Toca para hablar'}
          >
            <GoogleIcon
              name={isListening ? 'mic_off' : 'mic'}
              className="text-white text-6xl drop-shadow-sm group-hover:scale-105 transition-transform"
            />
          </button>
        </div>

        {/* Indicador de estado y botón de acción */}
        <div className="mt-3 flex flex-col items-center gap-2 w-full">
          {isListening ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-rose-700 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                Escuchando... Habla con naturalidad
              </span>
              <button
                onClick={handleConfirmAndProcess}
                disabled={!currentText}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-full text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer tap-subtle"
              >
                <span>Listo, revisar {detectedIngredients.length > 0 ? `(${detectedIngredients.length})` : ''}</span>
                <GoogleIcon name="arrow_forward" className="text-sm" />
              </button>
            </div>
          ) : currentText ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmAndProcess}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer tap-subtle"
              >
                <GoogleIcon name="check_circle" className="text-emerald-400 text-base" />
                <span>Revisar {detectedIngredients.length} alimentos detectados</span>
                <GoogleIcon name="arrow_forward" className="text-sm" />
              </button>
              <button
                onClick={resetTranscript}
                className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-stone-600 transition"
              >
                Limpiar
              </button>
            </div>
          ) : (
            <button
              onClick={handleToggleMic}
              className="text-sm font-semibold text-stone-700 hover:text-emerald-800 transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <GoogleIcon name="mic" className="text-emerald-700 text-base" />
              <span>Toca para hablar</span>
            </button>
          )}

          {/* Transcripción en vivo sutil */}
          {currentText && (
            <div className="w-full mt-2 bg-white rounded-2xl p-2.5 border border-stone-200/70 shadow-xs text-left max-h-20 overflow-y-auto">
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                {isListening ? 'Detectando en directo:' : 'Transcripción:'}
              </p>
              <p className="text-xs text-stone-800 italic leading-snug">
                "{currentText}"
              </p>
            </div>
          )}

          {/* Fallback si el navegador no soporta reconocimiento de voz nativo */}
          {!isSupported && (
            <div className="mt-2 text-xs text-amber-800 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/70">
              Voz no disponible en este navegador. Toca el ejemplo abajo para probar la demo.
            </div>
          )}

          {error && (
            <div className="mt-2 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/70">
              {error}
            </div>
          )}
        </div>

        {/* Alerta discreta de alimentos en riesgo */}
        {urgentCount > 0 && (
          <div className="mt-3">
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 border border-stone-200/70 text-stone-700 text-xs font-medium transition active:scale-95 shadow-2xs cursor-pointer tap-subtle"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
              <span>
                {urgentCount} {urgentCount === 1 ? 'alimento necesita' : 'alimentos necesitan'} atención
                {riskValue > 0 ? ` (≈ ${riskValue.toFixed(2)}€ en riesgo)` : ''}
              </span>
              <span className="text-stone-400 font-semibold flex items-center gap-0.5">
                · Ver plan <GoogleIcon name="chevron_right" className="text-xs" />
              </span>
            </button>
          </div>
        )}

        {/* Ejemplo conversacional amigable y limpio */}
        {!isListening && !currentText && (
          <div
            onClick={handleUseExample}
            className="mt-3.5 max-w-xs text-center cursor-pointer group px-4 py-2.5 rounded-2xl bg-white hover:border-emerald-200/70 border border-stone-200/60 transition shadow-2xs hover-lift"
            title="Toca para probar con este ejemplo"
          >
            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400 font-medium mb-0.5">
              <span>Por ejemplo</span>
              <GoogleIcon name="auto_awesome" className="text-emerald-700 text-xs" />
            </div>
            <p className="text-xs text-stone-600 italic leading-relaxed group-hover:text-stone-900 transition-colors">
              "Tengo dos yogures que vencen mañana,<br />
              cuatro tomates y media lechuga."
            </p>
          </div>
        )}
      </main>

      {/* Accesos secundarios discretos (menor peso visual) */}
      <footer className="flex-shrink-0 pt-2 pb-1">
        <nav className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-600 text-xs font-medium transition active:scale-95 border border-stone-200/60 cursor-pointer tap-subtle"
          >
            <GoogleIcon name="inventory_2" className="text-sm text-stone-500" />
            <span>Inventario</span>
          </button>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-600 text-xs font-medium transition active:scale-95 border border-stone-200/60 cursor-pointer tap-subtle"
          >
            <GoogleIcon name="skillet" className="text-sm text-stone-500" />
            <span>Plan</span>
          </button>

          <button
            onClick={() => navigate('/impact')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-600 text-xs font-medium transition active:scale-95 border border-stone-200/60 cursor-pointer tap-subtle"
          >
            <GoogleIcon name="insights" className="text-sm text-stone-500" />
            <span>Impacto</span>
          </button>
        </nav>
      </footer>
    </div>
  )
}
