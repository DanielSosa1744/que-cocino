import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useReplaceInventory } from '../hooks/useInventory'
import { extractIngredients, guessCategory, defaultExpiryDate, getIngredientImportance } from '../lib/ingredientParser'
import GoogleIcon from '../components/GoogleIcon'
import CookingPotAnimation from '../components/CookingPotAnimation'

export default function HomePage() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { mutateAsync: replaceInventory } = useReplaceInventory()

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

  const currentVoiceText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim()

  // Al volver a la pantalla principal, limpiar el texto y dictado anterior para comenzar fresco
  useEffect(() => {
    setInputText('')
    resetTranscript()
  }, [])

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
      // Guardar recetas de la tanda anterior como "vistas" para que la nueva carga no las repita
      const currentSeen = sessionStorage.getItem('que_cocino_current_recipe_ids')
      if (currentSeen) {
        sessionStorage.setItem('que_cocino_previous_recipe_ids', currentSeen)
      }
      sessionStorage.removeItem('que_cocino_current_recipe_ids')

      const parsed = extractIngredients(trimmed)

      // Ejecutar reemplazo de inventario (no acumular tanda previa) junto a la animación de la olla (mínimo 2.1s)
      const [addedNames] = await Promise.all([
        (async () => {
          let names: string[] = []
          if (parsed.length > 0) {
            // Ordenar los ingredientes por jerarquía culinaria (la carne y proteína primero; aromáticos después)
            const sortedParsed = [...parsed].sort((a, b) => {
              const impA = getIngredientImportance(a.name)
              const impB = getIngredientImportance(b.name)
              return impB - impA
            })

            // Guardar EXCLUSIVAMENTE estos ingredientes en la despensa (reemplazando lo previo)
            const items = sortedParsed.map(p => ({
              name: p.name,
              quantity: p.quantity ?? 1,
              unit: p.unit ?? 'ud',
              category: p.category || guessCategory(p.name),
              expires_at: p.expiryDays != null ? defaultExpiryDate(p.expiryDays) : null,
            }))
            await replaceInventory(items)
            names = items.map(i => i.name)
          } else {
            // Reemplazar inventario con el ingrediente único introducido
            await replaceInventory([{
              name: trimmed,
              quantity: 1,
              unit: 'ud',
              category: guessCategory(trimmed),
              expires_at: defaultExpiryDate(7),
            }])
            names = [trimmed]
          }
          return names
        })(),
        new Promise((resolve) => setTimeout(resolve, 2100)),
      ])

      // Guardar los ingredientes de este uso exclusivo
      sessionStorage.setItem('que_cocino_recent_ingredients', JSON.stringify(addedNames))
      navigate('/recetas', {
        state: {
          recentIngredients: addedNames,
          isNewBatch: true,
          timestamp: Date.now(),
        },
      })
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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-center items-center px-6 py-8 overflow-y-auto select-none animate-fade-in text-[#2F2A26]">
      <div className="w-full max-w-sm mx-auto text-center">
        {/* Filigrana superior gourmet */}
        <div className="flex items-center justify-center gap-2 mb-2 opacity-80">
          <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#A88B57]" />
          <span className="text-[#A88B57] text-[10px]">✦</span>
          <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-[#8F7347]">
            Atelier Gastronómico
          </span>
          <span className="text-[#A88B57] text-[10px]">✦</span>
          <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#A88B57]" />
        </div>

        {/* Título principal de la casa */}
        <h1 className="font-menu-title text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1917] mb-1.5">
          ¿Qué Cocinamos Hoy?
        </h1>

        {/* Subtítulo elegante */}
        <p className="font-menu-serif italic text-xs sm:text-sm text-[#766153] max-w-xs mx-auto leading-relaxed mb-6 font-normal">
          Dicte o indique los ingredientes disponibles en su cocina para componer una carta a su medida.
        </p>

        {/* Micrófono flotante con halo dorado refinado */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Halos dorados suaves */}
          <div
            className={`absolute w-32 h-32 rounded-full pointer-events-none transition-all duration-700 ${
              isListening
                ? 'bg-[#A88B57]/30 blur-xl scale-125'
                : 'bg-[#A88B57]/15 blur-xl animate-halo-warm'
            }`}
          />
          <div
            className={`absolute w-24 h-24 rounded-full pointer-events-none transition-all duration-500 ${
              isListening
                ? 'bg-[#A88B57]/40 animate-pulse'
                : 'bg-[#8F7347]/10 animate-halo-warm-inner'
            }`}
          />

          {/* Botón de micrófono flotante */}
          <button
            type="button"
            onClick={handleStartVoice}
            aria-label={isListening ? 'Detener comanda de voz' : 'Dictar ingredientes'}
            className={`animate-float-slow relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 tap-subtle cursor-pointer shadow-md ${
              isListening
                ? 'bg-[#1C1917] border-[#A88B57] text-[#FAF7F2] scale-105 shadow-[#1C1917]/20'
                : 'bg-[#FAF7F2] border-[#A88B57]/40 hover:border-[#8F7347] text-[#1C1917]'
            }`}
          >
            <GoogleIcon
              name={isListening ? 'graphic_eq' : 'mic'}
              size={28}
              className={isListening ? 'text-[#FAF7F2]' : 'text-[#8F7347]'}
            />
          </button>
        </div>

        {/* Estado activo de voz si está escuchando */}
        {isListening ? (
          <div className="py-4 space-y-3 transition-all duration-300">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF7F2] border border-[#A88B57]/40 text-[#1C1917] text-xs font-menu-serif shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#8F7347] animate-pulse" />
              <span>{currentVoiceText || 'Escuchando comanda... dicte a su ritmo'}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleStartVoice}
                className="px-5 py-2.5 bg-[#1C1917] text-[#FAF7F2] text-xs font-menu-serif font-semibold tracking-wide rounded-xl hover:bg-black transition tap-subtle cursor-pointer border border-[#A88B57]/40 shadow-xs"
              >
                ✦ Listo, confeccionar carta ✦
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Aviso amigable y discreto si el micrófono tiene error o no está disponible */}
            {(!isSupported || error) && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#A88B57]/30 text-xs text-[#766153] text-left animate-fade-in shadow-2xs">
                <p className="font-menu-title font-semibold text-[#1C1917] mb-1">
                  ✦ Micrófono no disponible
                </p>
                <p className="font-menu-serif leading-relaxed text-[11px]">
                  Puede escribir los ingredientes disponibles a continuación.
                </p>
                <button
                  type="button"
                  onClick={() => simulateVoiceInput('asado de tira, papas, morrón y cebolla')}
                  className="mt-2 text-[11px] font-medium text-[#8F7347] hover:underline block cursor-pointer font-menu-serif"
                >
                  Usar comanda de ejemplo →
                </button>
              </div>
            )}

            {/* Formulario de entrada limpio */}
            <form onSubmit={handleTextSubmit} className="space-y-3.5">
            <div>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Escriba sus ingredientes (ej. ternera, papas, romero...)"
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#A88B57]/35 focus:border-[#8F7347] focus:bg-white rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#766153]/60 outline-none transition shadow-2xs font-menu-serif"
              />
            </div>

            {/* Acciones principales: Hablar y Confeccionar Carta */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleStartVoice}
                className="flex-1 py-2.5 px-4 bg-[#FAF7F2] border border-[#A88B57]/35 hover:border-[#8F7347] text-[#1C1917] text-xs font-menu-serif font-medium rounded-xl transition flex items-center justify-center gap-1.5 tap-subtle cursor-pointer shadow-2xs"
              >
                <GoogleIcon name="mic" size={16} className="text-[#8F7347]" />
                Dictar comanda
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="flex-1 py-2.5 px-4 bg-[#1C1917] hover:bg-black text-[#FAF7F2] text-xs font-menu-serif font-semibold tracking-wide rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed tap-subtle cursor-pointer shadow-2xs border border-[#A88B57]/40"
              >
                {isProcessing ? 'Elaborando...' : 'Confeccionar carta'}
              </button>
            </div>
          </form>
        </>
      )}

        {/* Ejemplo sugerido con rombos de alta cocina */}
        <div className="mt-8 pt-4 border-t border-[#A88B57]/20 text-xs text-[#766153] flex items-center justify-center gap-1.5">
          <span className="text-[#A88B57] text-[10px]">✦</span>
          <span className="font-menu-serif italic">Sugerencia de hoy: </span>
          <button
            type="button"
            onClick={() => {
              setInputText('Tomates, huevos, queso y cebolla')
            }}
            className="text-[#1C1917] hover:text-[#8F7347] underline underline-offset-2 transition cursor-pointer font-menu-serif font-semibold"
          >
            Tomates, huevos, queso y cebolla.
          </button>
        </div>
      </div>

      {/* Animación de la olla cocinando estilo dibujo animado */}
      {isProcessing && (
        <CookingPotAnimation
          message="¡Al fuego!"
          subMessage="Echando los ingredientes a la olla y buscando recetas..."
        />
      )}
    </div>
  )
}
