import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { extractIngredients } from '../../lib/ingredientParser'
import { GoogleIcon } from '../../components/GoogleIcon'
import type { ParsedIngredient } from '../../types/app.types'

export default function VoicePage() {
  const navigate = useNavigate()
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

  const [editableText, setEditableText] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  // Sync transcript to editable text when not listening and transcript is populated
  useEffect(() => {
    if (!isListening && transcript) {
      setEditableText(transcript)
      setShowEdit(true)
    }
  }, [isListening, transcript])

  // Si ocurre un error, abrir automáticamente el modo de edición para que el usuario no quede bloqueado
  useEffect(() => {
    if (error) {
      setShowEdit(true)
    }
  }, [error])

  const handleToggleMic = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      setEditableText('')
      setShowEdit(false)
      startListening()
    }
  }

  const handleSimulateVoice = () => {
    simulateVoiceInput()
  }

  const handleAddQuickIngredient = (ingredient: string) => {
    setShowEdit(true)
    setEditableText(prev => {
      const trimmed = prev.trim()
      if (!trimmed) return ingredient
      return `${trimmed}, ${ingredient}`
    })
  }

  const handleConfirm = () => {
    const text = editableText.trim()
    if (!text) return
    const parsed: ParsedIngredient[] = extractIngredients(text)
    navigate('/confirm-ingredients', { state: { parsed, rawText: text } })
  }

  const examples = [
    '"Tengo cuatro tomates y dos yogures"',
    '"Tengo cuatro tomates, seis huevos y media cebolla"',
    '"Dos yogures que vencen mañana"',
    '"Un kilo de pollo, arroz y ajo"',
  ]

  const quickPills = [
    '4 tomates',
    '6 huevos',
    '2 yogures',
    '1 litro de leche',
    'pechuga de pollo',
    'media cebolla',
    'arroz',
  ]

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col justify-between overflow-hidden animate-fade-in text-[#2F2A26]">
      {/* Header */}
      <div className="px-4 pt-safe pb-2 border-b border-[#A88B57]/20 flex-shrink-0 bg-transparent">
        <button
          onClick={() => navigate(-1)}
          className="font-menu-serif text-sm text-[#8F7347] hover:text-[#1C1917] mb-1.5 transition tap-subtle flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <span>←</span>
          <span>Volver a La Cocina</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
              <span className="text-[#A88B57] text-xs">✦</span>
              <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#8F7347]">
                Dictado de Comanda
              </span>
            </div>
            <h1 className="font-menu-title text-2xl font-bold text-[#1C1917] leading-tight">
              ¿Qué ingredientes tiene hoy?
            </h1>
            <p className="font-menu-serif italic text-[#766153] text-sm">Dicte de viva voz o anote sus provisiones</p>
          </div>
          <button
            onClick={handleSimulateVoice}
            title="Probar simulación de voz"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAF7F2] hover:bg-white border border-[#A88B57]/40 text-[#8F7347] text-xs font-menu-serif font-semibold transition tap-subtle cursor-pointer shadow-2xs"
          >
            <GoogleIcon name="auto_awesome" size={16} className="text-[#8F7347]" />
            <span>Comanda demo</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 overflow-hidden gap-2">
        <div className="w-full flex flex-col items-center gap-3 flex-1 overflow-y-auto no-scrollbar justify-center">
          {/* Microphone button */}
          {!isSupported ? (
            <div className="flex items-center gap-2.5 bg-[#FAF7F2] rounded-xl p-3.5 w-full border border-[#A88B57]/40">
              <GoogleIcon name="error" size={18} className="text-[#A88B57] flex-shrink-0" />
              <p className="text-[#766153] text-xs sm:text-sm font-menu-serif">
                Su navegador no soporta reconocimiento acústico nativo. Puede escribir directamente a continuación.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 flex-shrink-0 my-1">
              <button
                onClick={handleToggleMic}
                className={`relative w-22 h-22 rounded-full flex items-center justify-center transition-all border-2 ${
                  isListening
                    ? 'bg-[#1C1917] border-[#A88B57] shadow-lg shadow-[#1C1917]/20 scale-105'
                    : 'bg-[#FAF7F2] border-[#A88B57]/40 hover:border-[#8F7347] shadow-sm hover:scale-105'
                } tap-subtle cursor-pointer`}
                aria-label="Micrófono de comanda"
              >
                {isListening ? (
                  <GoogleIcon name="graphic_eq" size={38} className="text-[#FAF7F2]" />
                ) : (
                  <GoogleIcon name="mic" size={38} className="text-[#8F7347]" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#A88B57] opacity-25 pointer-events-none" />
                )}
              </button>

              {isListening ? (
                <div className="flex flex-col items-center gap-2 mt-1">
                  <span className="text-[#8F7347] font-menu-serif font-semibold text-sm flex items-center gap-2 animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8F7347] animate-ping inline-block" />
                    Escuchando activamente... Dicte a su propio ritmo
                  </span>
                  <button
                    onClick={handleToggleMic}
                    className="px-4 py-2 bg-[#1C1917] hover:bg-black text-[#FAF7F2] rounded-full text-xs sm:text-sm font-menu-serif font-semibold shadow-xs transition flex items-center gap-1.5 tap-subtle cursor-pointer border border-[#A88B57]/40"
                  >
                    <GoogleIcon name="stop_circle" size={16} className="text-[#FAF7F2]" />
                    <span>Concluir dictado</span>
                  </button>
                </div>
              ) : (
                <p className="font-menu-serif italic text-[#766153] text-sm text-center font-medium">
                  Presione para dictar su comanda
                </p>
              )}
            </div>
          )}

          {/* Real-time transcript display */}
          {(transcript || interimTranscript) && (
            <div className="w-full bg-[#FAF7F2] rounded-xl p-3.5 border border-[#A88B57]/30 max-h-28 overflow-y-auto shadow-2xs">
              <p className="text-xs font-semibold text-[#8F7347] uppercase tracking-wider mb-1 font-menu-serif">
                {isListening ? '✦ Transcripción en vivo...' : '✦ Comanda detectada:'}
              </p>
              <p className="text-[#1C1917] text-sm leading-relaxed font-menu-serif">
                {transcript}
                {interimTranscript && (
                  <span className="text-[#8F7347] font-medium italic"> {interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* Error Banner with contextual recovery actions */}
          {error && (
            <div className="w-full bg-[#FAF7F2] border border-[#A88B57]/40 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <GoogleIcon name="error" size={18} className="text-[#A88B57] flex-shrink-0 mt-0.5" />
                <p className="text-[#766153] text-xs sm:text-sm leading-snug font-menu-serif">{error}</p>
              </div>
              
              <div className="flex items-center gap-2 pt-1 border-t border-[#A88B57]/20">
                <button
                  onClick={handleToggleMic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#A88B57]/30 text-[#8F7347] text-xs font-menu-serif font-medium hover:bg-[#FAF7F2] transition tap-subtle cursor-pointer"
                >
                  <GoogleIcon name="refresh" size={15} />
                  <span>Reintentar</span>
                </button>
                <button
                  onClick={handleSimulateVoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1917] text-[#FAF7F2] text-xs font-menu-serif font-medium hover:bg-black transition tap-subtle cursor-pointer border border-[#A88B57]/30"
                >
                  <GoogleIcon name="play_arrow" size={15} className="text-[#FAF7F2]" />
                  <span>Probar comanda demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Editable text area */}
          {showEdit && (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-menu-serif font-semibold text-[#8F7347] uppercase tracking-wide">
                  ✦ Revisar o anotar ingredientes
                </p>
                {editableText && (
                  <button
                    onClick={() => setEditableText('')}
                    className="text-xs text-[#766153] hover:text-[#C84B31] transition font-menu-serif cursor-pointer font-medium"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A88B57]/30 bg-[#FAF7F2] text-[#1C1917] text-sm sm:text-base focus:outline-none focus:border-[#8F7347] resize-none leading-relaxed font-menu-serif"
                placeholder="Escriba los alimentos disponibles (ej: cuatro tomates, carne, queso...)"
              />
            </div>
          )}

          {/* Manual text entry option if not yet showing edit */}
          {!showEdit && !isListening && (
            <div className="w-full space-y-1.5">
              <p className="text-xs font-menu-serif font-semibold text-[#8F7347] uppercase tracking-wide">✦ O redacte directamente:</p>
              <textarea
                value={editableText}
                onChange={e => {
                  setEditableText(e.target.value)
                  if (!showEdit) setShowEdit(true)
                }}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A88B57]/30 bg-[#FAF7F2] text-[#1C1917] text-sm sm:text-base focus:outline-none focus:border-[#8F7347] resize-none font-menu-serif"
                placeholder="Ej: cuatro tomates, solomillo de ternera, cebolla..."
              />
            </div>
          )}

          {/* Quick ingredient badges for rapid 1-tap entry */}
          {!isListening && (
            <div className="w-full space-y-1.5">
              <p className="text-xs font-menu-serif font-semibold text-[#8F7347] uppercase tracking-wide">✦ Incorporar con un toque:</p>
              <div className="flex flex-wrap gap-2">
                {quickPills.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddQuickIngredient(item)}
                    className="px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-white text-[#1C1917] border border-[#A88B57]/30 text-xs font-menu-serif font-medium transition tap-subtle cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {!isListening && !editableText && (
            <div className="w-full space-y-1.5">
              <p className="text-xs font-menu-serif font-semibold text-[#8F7347] uppercase tracking-wide">✦ Fórmulas habituales:</p>
              {examples.slice(0, 2).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setEditableText(ex.replace(/"/g, '')); setShowEdit(true) }}
                  className="w-full text-left text-xs sm:text-sm text-[#766153] bg-[#FAF7F2] border border-[#A88B57]/20 rounded-lg px-3 py-2 hover:bg-white transition truncate font-menu-serif italic cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!editableText.trim()}
          className="w-full py-3.5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] font-menu-serif font-semibold tracking-wider rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0 text-sm sm:text-base shadow-md active:scale-98 cursor-pointer border border-[#A88B57]/40"
        >
          <span>✦ Procesar comanda e ingredientes ✦</span>
          <GoogleIcon name="arrow_forward" size={18} />
        </button>
      </div>
    </div>
  )
}
