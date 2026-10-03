import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { extractIngredients } from '../../lib/ingredientParser'
import { Mic, MicOff, ArrowLeft, ChevronRight, AlertCircle, RefreshCw, Play, Sparkles } from 'lucide-react'
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
    <div className="h-full max-h-full bg-white flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 mb-1 transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Volver</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">¿Qué tienes en casa?</h1>
            <p className="text-gray-400 text-xs">Dímelo con tu voz o escríbelo</p>
          </div>
          <button
            onClick={handleSimulateVoice}
            title="Probar simulación de voz"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-[11px] font-semibold transition active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Dictado demo</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 overflow-hidden gap-2">
        <div className="w-full flex flex-col items-center gap-2.5 flex-1 overflow-y-auto no-scrollbar justify-center">
          {/* Microphone button */}
          {!isSupported ? (
            <div className="flex items-center gap-2.5 bg-amber-50 rounded-xl p-3 w-full border border-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-amber-800 text-xs">
                Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir directamente abajo o usar el botón de demo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 my-1">
              <button
                onClick={handleToggleMic}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 scale-105'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200 hover:scale-105'
                } active:scale-95 cursor-pointer`}
                aria-label="Micrófono"
              >
                {isListening ? (
                  <MicOff className="w-9 h-9 text-white" />
                ) : (
                  <Mic className="w-9 h-9 text-white" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30 pointer-events-none" />
                )}
              </button>

              {isListening ? (
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <span className="text-red-600 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                    Escuchando activamente... Habla a tu ritmo
                  </span>
                  <button
                    onClick={handleToggleMic}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-md shadow-red-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>⏹️ He terminado de hablar</span>
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center font-medium">
                  Pulsa para hablar
                </p>
              )}
            </div>
          )}

          {/* Real-time transcript display */}
          {(transcript || interimTranscript) && (
            <div className="w-full bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100/80 max-h-24 overflow-y-auto">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">
                {isListening ? 'Escuchando en vivo...' : 'Transcripción detectada'}
              </p>
              <p className="text-gray-900 text-xs leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-emerald-700 font-medium italic"> {interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* Error Banner with contextual recovery actions */}
          {error && (
            <div className="w-full bg-red-50/90 border border-red-100 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-xs leading-snug">{error}</p>
              </div>
              
              <div className="flex items-center gap-2 pt-1 border-t border-red-100">
                <button
                  onClick={handleToggleMic}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-700 text-[11px] font-semibold hover:bg-red-50 transition active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reintentar</span>
                </button>
                <button
                  onClick={handleSimulateVoice}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition active:scale-95"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Probar con dictado demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Editable text area */}
          {showEdit && (
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Revisa o agrega alimentos
                </p>
                {editableText && (
                  <button
                    onClick={() => setEditableText('')}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none leading-relaxed"
                placeholder="Escribe lo que tienes (ej: cuatro tomates, dos yogures...)"
              />
            </div>
          )}

          {/* Manual text entry option if not yet showing edit */}
          {!showEdit && !isListening && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">O escribe directamente</p>
              <textarea
                value={editableText}
                onChange={e => {
                  setEditableText(e.target.value)
                  if (!showEdit) setShowEdit(true)
                }}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                placeholder="Ej: cuatro tomates, seis huevos..."
              />
            </div>
          )}

          {/* Quick ingredient badges for rapid 1-tap entry */}
          {!isListening && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Agregar rápido con un toque</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPills.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddQuickIngredient(item)}
                    className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-gray-200/60 text-[11px] text-gray-600 transition active:scale-95"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {!isListening && !editableText && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Frases de ejemplo</p>
              {examples.slice(0, 2).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setEditableText(ex.replace(/"/g, '')); setShowEdit(true) }}
                  className="w-full text-left text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-700 transition truncate"
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
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0 text-sm shadow-md shadow-emerald-100 active:scale-98 cursor-pointer"
        >
          <span>Analizar ingredientes</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
