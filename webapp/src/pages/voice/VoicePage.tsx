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
    <div className="min-h-app bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-safe pb-5 border-b border-gray-100">
        <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>
        <h1 className="text-xl font-bold text-gray-900">¿Qué tienes en casa?</h1>
        <p className="text-gray-500 text-sm mt-1">Dímelo con tu voz o escríbelo</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-5 py-8">
        <div className="w-full flex flex-col items-center gap-6 flex-1">
          {/* Microphone button */}
          {!isSupported ? (
            <div className="flex items-center gap-3 bg-red-50 rounded-2xl p-4 w-full">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-sm">
                Tu navegador no soporta reconocimiento de voz. Escribe directamente abajo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleToggleMic}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-200 scale-105'
                    : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 hover:scale-105'
                } active:scale-95`}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
                )}
              </button>
              <p className="text-gray-500 text-sm text-center">
                {isListening ? (
                  <span className="text-red-500 font-medium">🔴 Escuchando... Pulsa para parar</span>
                ) : (
                  'Pulsa para hablar'
                )}
              </p>
            </div>
          )}

          {/* Real-time transcript display */}
          {(transcript || interimTranscript) && (
            <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcripción</p>
              <p className="text-gray-900 text-sm leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="w-full bg-red-50 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Editable text area */}
          {showEdit && (
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Revisa y edita si hace falta
              </p>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                placeholder="Escribe lo que tienes..."
              />
            </div>
          )}

          {/* Manual text entry option */}
          {!showEdit && !isListening && (
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">O escribe directamente</p>
              <textarea
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                placeholder="Ej: cuatro tomates, seis huevos..."
              />
            </div>
          )}

          {/* Examples */}
          {!isListening && !editableText && (
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ejemplos</p>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setEditableText(ex.replace(/"/g, '')); setShowEdit(true) }}
                  className="w-full text-left text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 hover:bg-green-50 hover:text-green-700 transition"
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
          className="w-full mt-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Analizar ingredientes
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
