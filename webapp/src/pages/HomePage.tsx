import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useReplaceInventory } from '../hooks/useInventory'
import { extractIngredients, guessCategory, defaultExpiryDate, getIngredientImportance } from '../lib/ingredientParser'
import { registerAbortAction } from '../lib/actionAbort'
import GoogleIcon from '../components/GoogleIcon'
import CookingPotAnimation from '../components/CookingPotAnimation'

export default function HomePage() {
  const navigate = useNavigate()
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const isAbortedRef = useRef(false)
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

    // Registrar abandono inmediato cuando se toque cualquier botón del dock/toolbar
    const unregister = registerAbortAction(() => {
      isAbortedRef.current = true
      setIsProcessing(false)
      stopListening()
      resetTranscript()
    })

    return () => {
      unregister()
      stopListening()
    }
  }, [stopListening, resetTranscript])

  // Si termina de escuchar y hay transcripción, autocompletar en el input
  useEffect(() => {
    if (!isListening && transcript) {
      setInputText(transcript)
    }
  }, [isListening, transcript])

  const processAndShowRecipes = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    isAbortedRef.current = false
    setIsProcessing(true)
    try {
      // Guardar recetas de la tanda anterior como "vistas" para que la nueva carga no las repita
      const currentSeen = sessionStorage.getItem('que_cocino_current_recipe_ids')
      if (currentSeen) {
        sessionStorage.setItem('que_cocino_previous_recipe_ids', currentSeen)
      }
      sessionStorage.removeItem('que_cocino_current_recipe_ids')

      const parsed = extractIngredients(trimmed)

      // Ejecutar reemplazo de inventario (no acumular tanda previa) junto a una animación ágil y fluida (400ms)
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
        new Promise((resolve) => setTimeout(resolve, 80)),
      ])

      // Si el usuario tocó otro botón del toolbar, abandonar de inmediato y no redirigir
      if (isAbortedRef.current) return

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
      if (isAbortedRef.current) return
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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-start sm:justify-center items-center px-4 sm:px-8 py-5 sm:py-10 overflow-y-auto select-none animate-fade-in text-[#2F2A26]">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto text-center my-auto py-2">
        {/* Filigrana superior gourmet */}
        <div className="flex items-center justify-center gap-2 mb-2 sm:mb-2.5 opacity-90">
          <span className="h-[1.5px] w-6 sm:w-8 bg-gradient-to-r from-transparent to-[#A88B57]" />
          <span className="text-[#A88B57] text-xs sm:text-sm">✦</span>
          <span className="text-xs sm:text-base tracking-[0.2em] sm:tracking-[0.25em] uppercase font-bold text-[#8F7347]">
            Atelier Gastronómico
          </span>
          <span className="text-[#A88B57] text-xs sm:text-sm">✦</span>
          <span className="h-[1.5px] w-6 sm:w-8 bg-gradient-to-l from-transparent to-[#A88B57]" />
        </div>

        {/* Título principal de la casa */}
        <h1 className="font-menu-title text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C1917] mb-2 sm:mb-3 leading-tight">
          ¿Qué Cocinamos Hoy?
        </h1>

        {/* Subtítulo elegante */}
        <p className="font-menu-serif text-sm sm:text-base md:text-lg text-[#44382F] max-w-md mx-auto leading-relaxed mb-4 sm:mb-6 font-normal">
          Dicte o indique los ingredientes disponibles en su cocina para componer una carta a su medida.
        </p>

        {/* Micrófono flotante con halo dorado refinado */}
        <div className="relative my-7 flex items-center justify-center">
          {/* Halos dorados suaves */}
          <div
            className={`absolute w-36 h-36 rounded-full pointer-events-none transition-all duration-700 ${
              isListening
                ? 'bg-[#A88B57]/35 blur-xl scale-125'
                : 'bg-[#A88B57]/20 blur-xl animate-halo-warm'
            }`}
          />
          <div
            className={`absolute w-28 h-28 rounded-full pointer-events-none transition-all duration-500 ${
              isListening
                ? 'bg-[#A88B57]/45 animate-pulse'
                : 'bg-[#8F7347]/15 animate-halo-warm-inner'
            }`}
          />

          {/* Botón de micrófono flotante */}
          <button
            type="button"
            onClick={handleStartVoice}
            aria-label={isListening ? 'Detener comanda de voz' : 'Dictar ingredientes'}
            className={`animate-float-slow relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center border-2 transition-all duration-300 tap-subtle cursor-pointer shadow-lg ${
              isListening
                ? 'bg-[#1C1917] border-[#A88B57] text-[#FAF7F2] scale-105 shadow-[#1C1917]/25'
                : 'bg-[#FAF7F2] border-[#A88B57]/60 hover:border-[#8F7347] text-[#1C1917]'
            }`}
          >
            <GoogleIcon
              name={isListening ? 'graphic_eq' : 'mic'}
              size={42}
              className={isListening ? 'text-[#FAF7F2]' : 'text-[#8F7347]'}
            />
          </button>
        </div>

        {/* Estado activo de voz si está escuchando */}
        {isListening ? (
          <div className="py-4 space-y-3.5 transition-all duration-300">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FAF7F2] border border-[#A88B57]/50 text-[#1C1917] text-base font-menu-serif shadow-xs">
              <span className="w-3 h-3 rounded-full bg-[#8F7347] animate-pulse" />
              <span className="font-medium">{currentVoiceText || 'Escuchando comanda... dicte a su ritmo'}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={handleStartVoice}
                className="px-7 py-3.5 bg-[#1C1917] text-[#FAF7F2] text-base font-menu-serif font-bold tracking-wide rounded-2xl hover:bg-black transition tap-subtle cursor-pointer border border-[#A88B57]/40 shadow-sm"
              >
                ✦ Listo, confeccionar carta ✦
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Aviso amigable y discreto si el micrófono tiene error o no está disponible */}
            {(!isSupported || error) && (
              <div className="mb-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#A88B57]/35 text-base text-[#766153] text-left animate-fade-in shadow-2xs">
                <p className="font-menu-title font-bold text-[#1C1917] mb-1 text-base">
                  ✦ Micrófono no disponible
                </p>
                <p className="font-menu-serif leading-relaxed text-sm text-[#44382F]">
                  Puede escribir los ingredientes disponibles a continuación.
                </p>
                <button
                  type="button"
                  onClick={() => simulateVoiceInput('asado de tira, papas, morrón y cebolla')}
                  className="mt-2 text-sm font-bold text-[#8F7347] hover:underline block cursor-pointer font-menu-serif"
                >
                  Usar comanda de ejemplo →
                </button>
              </div>
            )}

            {/* Formulario de entrada limpio */}
            <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Escriba sus ingredientes (ej. ternera, papas, romero...)"
                className="w-full px-5 py-4 bg-[#FAF7F2] border-2 border-[#A88B57]/40 focus:border-[#8F7347] focus:bg-white rounded-2xl text-base sm:text-lg text-[#1C1917] placeholder:text-[#766153]/70 outline-none transition shadow-2xs font-menu-serif font-medium"
              />
            </div>

            {/* Acciones principales: Hablar y Confeccionar Carta */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleStartVoice}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 bg-[#FAF7F2] border-2 border-[#A88B57]/40 hover:border-[#8F7347] text-[#1C1917] text-sm sm:text-base font-menu-serif font-bold rounded-2xl transition flex items-center justify-center gap-2 tap-subtle cursor-pointer shadow-2xs"
              >
                <GoogleIcon name="mic" size={22} className="text-[#8F7347]" />
                Dictar comanda
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 bg-[#1C1917] hover:bg-black text-[#FAF7F2] text-sm sm:text-base font-menu-serif font-bold tracking-wide rounded-2xl transition disabled:opacity-45 disabled:cursor-not-allowed tap-subtle cursor-pointer shadow-sm border border-[#A88B57]/40"
              >
                {isProcessing ? 'Elaborando...' : 'Confeccionar carta'}
              </button>
            </div>
          </form>
        </>
      )}

        {/* Ejemplo sugerido con rombos de alta cocina */}
        <div className="mt-8 pt-5 border-t border-[#A88B57]/25 text-base text-[#44382F] flex flex-wrap items-center justify-center gap-2">
          <span className="text-[#A88B57] text-sm">✦</span>
          <span className="font-menu-serif font-medium">Sugerencia de hoy: </span>
          <button
            type="button"
            onClick={() => {
              setInputText('Tomates, huevos, queso y cebolla')
            }}
            className="text-[#1C1917] hover:text-[#8F7347] underline underline-offset-4 transition cursor-pointer font-menu-serif font-bold text-base"
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
