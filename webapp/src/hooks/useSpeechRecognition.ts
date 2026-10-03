import { useState, useEffect, useRef, useCallback } from 'react'
import { collapseRepeats } from '../lib/ingredientParser'

// Browser Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  readonly isFinal: boolean
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: ((e: Event) => void) | null
  onstart: ((e: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface UseSpeechRecognitionReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isListeningRef = useRef(false)

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const isSupported = !!SpeechRecognitionAPI

  useEffect(() => {
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
    
    // En Android, continuous: true tiende a duplicar iterativamente los resultados finales
    recognition.continuous = !isAndroid
    recognition.interimResults = true
    
    const navLang = typeof navigator !== 'undefined' ? navigator.language : 'es-ES'
    recognition.lang = navLang.startsWith('es') ? navLang : 'es-ES'

    recognition.onstart = () => {
      setIsListening(true)
      isListeningRef.current = true
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''

      // Reconstruir siempre la sesión completa desde 0 sin concatenar previas
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript(collapseRepeats(finalText.trim()))
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event: Event) => {
      const err = (event as Event & { error?: string }).error || 'unknown'
      if (err === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.')
      } else if (err === 'not-allowed') {
        setError('Permiso de micrófono denegado. Habilítalo en tu navegador.')
      } else {
        setError(`Error de reconocimiento: ${err}`)
      }
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onend = () => {
      // Si en Android estamos en escucha continua manual y no se abortó intencionalmente
      if (isAndroid && isListeningRef.current) {
        try {
          recognition.start()
          return
        } catch {
          // Si no se puede reiniciar, caer a stop normal
        }
      }
      setIsListening(false)
      isListeningRef.current = false
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      isListeningRef.current = false
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {}
      recognitionRef.current = null
    }
  }, [SpeechRecognitionAPI])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return
    setError(null)
    setInterimTranscript('')
    isListeningRef.current = true
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.warn('Recognition already started', e)
    }
  }, [])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {}
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
