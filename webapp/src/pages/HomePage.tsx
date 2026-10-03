import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAddIngredients } from '../hooks/useInventory'
import { extractIngredients, guessCategory, defaultExpiryDate } from '../lib/ingredientParser'
import GoogleIcon from '../components/GoogleIcon'

export default function HomePage() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { mutateAsync: addIngredients } = useAddIngredients()

  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  const currentVoiceText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim()

  // Si termina de escuchar y hay transcripción, autocompletar en el input
  useEffect(() => {
    if (!isListening && transcript) {
      setInputText(transcript)
    }
  }, [isListening, transcript])

  const processAndShowRecipes = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setIsProcessing(true)
    try {
      const parsed = extractIngredients(trimmed)
      if (parsed.length > 0) {
        // Guardar ingredientes en la despensa
        const items = parsed.map(p => ({
          name: p.name,
          quantity: p.quantity ?? 1,
          unit: p.unit ?? 'ud',
          category: p.category || guessCategory(p.name),
          expires_at: p.expiryDays != null ? defaultExpiryDate(p.expiryDays) : null,
        }))
        await addIngredients(items)
      }
      navigate('/recetas')
    } catch (err) {
      console.error('Error procesando ingredientes:', err)
      navigate('/recetas')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartVoice = () => {
    if (isListening) {
      stopListening()
      if (currentVoiceText) {
        processAndShowRecipes(currentVoiceText)
      }
    } else {
      resetTranscript()
      setInputText('')
      startListening()
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      processAndShowRecipes(inputText)
    }
  }

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center items-center px-6 py-8 overflow-y-auto select-none animate-fade-in">
      <div className="w-full max-w-sm mx-auto text-center">
        {/* Título principal */}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          ¿Qué Cocino?
        </h1>

        {/* Subtítulo limpio */}
        <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed mb-6 font-normal">
          Introduce los ingredientes que tienes disponibles y te mostraremos qué recetas puedes preparar.
        </p>

        {/* Micrófono flotante con animación vertical lenta y halo pulsante (Apple Voice Memos / Calm) */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Halos orgánicos suaves */}
          <div
            className={`absolute w-32 h-32 rounded-full pointer-events-none transition-all duration-700 ${
              isListening
                ? 'bg-stone-400/25 blur-xl scale-125'
                : 'bg-stone-300/30 blur-xl animate-halo-warm'
            }`}
          />
          <div
            className={`absolute w-24 h-24 rounded-full pointer-events-none transition-all duration-500 ${
              isListening
                ? 'bg-stone-300/40 animate-pulse'
                : 'bg-stone-200/50 animate-halo-warm-inner'
            }`}
          />

          {/* Botón de micrófono flotante */}
          <button
            type="button"
            onClick={handleStartVoice}
            aria-label={isListening ? 'Detener escucha' : 'Hablar'}
            className={`animate-float-slow relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-sm border border-stone-200/80 transition-all duration-300 tap-subtle cursor-pointer ${
              isListening
                ? 'bg-stone-900 text-white scale-105 shadow-md shadow-stone-900/10'
                : 'bg-white hover:bg-stone-50 text-stone-800'
            }`}
          >
            <GoogleIcon
              name={isListening ? 'graphic_eq' : 'mic'}
              size={28}
              className={isListening ? 'text-white' : 'text-stone-700'}
            />
          </button>
        </div>

        {/* Estado activo de voz si está escuchando */}
        {isListening ? (
          <div className="py-4 space-y-3 transition-all duration-300">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-stone-200/60 text-stone-700 text-xs font-mono shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
              <span>{currentVoiceText || 'Escuchando... habla a tu ritmo'}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleStartVoice}
                className="px-5 py-2.5 bg-stone-900 text-white text-xs font-medium rounded-xl hover:bg-black transition tap-subtle cursor-pointer"
              >
                Listo, ver recetas
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de entrada limpio */
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Escribe tus ingredientes..."
                className="w-full px-4 py-3 bg-white/80 border border-stone-200/80 focus:border-stone-800 focus:bg-white rounded-xl text-sm text-stone-900 placeholder:text-stone-400 outline-none transition shadow-2xs"
              />
            </div>

            {/* Acciones principales: Hablar y Escribir/Ver */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleStartVoice}
                className="flex-1 py-2.5 px-4 bg-white/90 border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 tap-subtle cursor-pointer shadow-2xs"
              >
                <GoogleIcon name="mic" size={16} />
                Hablar
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed tap-subtle cursor-pointer shadow-2xs"
              >
                {isProcessing ? 'Buscando...' : 'Ver recetas'}
              </button>
            </div>
          </form>
        )}

        {/* Ejemplo sugerido */}
        <div className="mt-8 pt-4 border-t border-stone-200/50 text-xs text-stone-400">
          <span>Ejemplo: </span>
          <button
            type="button"
            onClick={() => {
              setInputText('Tomates, huevos, queso y cebolla')
            }}
            className="text-stone-600 hover:text-stone-900 underline underline-offset-2 transition cursor-pointer"
          >
            Tomates, huevos, queso y cebolla.
          </button>
        </div>
      </div>
    </div>
  )
}
