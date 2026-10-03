import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { extractIngredients } from '../../lib/ingredientParser'
import { Mic, MicOff, ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react'
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
  } = useSpeechRecognition()

  const [editableText, setEditableText] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  // Sync transcript to editable text when not listening
  useEffect(() => {
    if (!isListening && transcript) {
      setEditableText(transcript)
      setShowEdit(true)
    }
  }, [isListening, transcript])

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

  const handleConfirm = () => {
    const text = editableText.trim()
    if (!text) return
    const parsed: ParsedIngredient[] = extractIngredients(text)
    navigate('/confirm-ingredients', { state: { parsed, rawText: text } })
  }

  const examples = [
    '"Tengo cuatro tomates, seis huevos y media cebolla"',
    '"Dos yogures que vencen mañana"',
    '"Un kilo de pollo, arroz y ajo"',
  ]

  return (
    <div className="h-full max-h-full bg-white flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 mb-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Volver</span>
        </button>
        <h1 className="text-lg font-black text-gray-900 leading-tight">¿Qué tienes en casa?</h1>
        <p className="text-gray-400 text-xs">Dímelo con tu voz o escríbelo</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-4 py-2 overflow-hidden gap-2">
        <div className="w-full flex flex-col items-center gap-3 flex-1 overflow-y-auto no-scrollbar justify-center">
          {/* Microphone button */}
          {!isSupported ? (
            <div className="flex items-center gap-2.5 bg-red-50 rounded-xl p-3 w-full">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-xs">
                Tu navegador no soporta reconocimiento de voz. Escribe directamente abajo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleToggleMic}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 scale-105'
                    : 'bg-green-500 hover:bg-green-600 shadow-md shadow-green-200 hover:scale-105'
                } active:scale-95`}
                aria-label="Micrófono"
              >
                {isListening ? (
                  <MicOff className="w-9 h-9 text-white" />
                ) : (
                  <Mic className="w-9 h-9 text-white" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
                )}
              </button>
              <p className="text-gray-500 text-xs text-center font-medium">
                {isListening ? (
                  <span className="text-red-500 font-bold">🔴 Escuchando... Pulsa para parar</span>
                ) : (
                  'Pulsa para hablar'
                )}
              </p>
            </div>
          )}

          {/* Real-time transcript display */}
          {(transcript || interimTranscript) && (
            <div className="w-full bg-gray-50 rounded-xl p-2.5 border border-gray-100 max-h-20 overflow-y-auto">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Transcripción</p>
              <p className="text-gray-900 text-xs leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="w-full bg-red-50 rounded-xl p-2 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {/* Editable text area */}
          {showEdit && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Revisa y edita si hace falta
              </p>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                placeholder="Escribe lo que tienes..."
              />
            </div>
          )}

          {/* Manual text entry option */}
          {!showEdit && !isListening && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">O escribe directamente</p>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                placeholder="Ej: cuatro tomates, seis huevos..."
              />
            </div>
          )}

          {/* Examples */}
          {!isListening && !editableText && (
            <div className="w-full space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ejemplos rápidos</p>
              {examples.slice(0, 2).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setEditableText(ex.replace(/"/g, '')); setShowEdit(true) }}
                  className="w-full text-left text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 hover:bg-green-50 hover:text-green-700 transition truncate"
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
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0 text-sm shadow-md shadow-green-100 active:scale-98"
        >
          Analizar ingredientes
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
