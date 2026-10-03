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

export function humanizeSpeechError(err: string): string {
  switch (err) {
    case 'network':
      return 'No se pudo conectar con el servicio de voz de Google. Es común si usas Brave, bloqueadores de anuncios o estás sin conexión. Puedes escribir tus alimentos abajo o usar el dictado de prueba.'
    case 'not-allowed':
    case 'permission-denied':
      return 'Permiso de micrófono denegado. Permite el acceso al micrófono en el icono del candado del navegador.'
    case 'no-speech':
      return 'No se detectó voz. Pulsa el micrófono y habla de nuevo.'
    case 'audio-capture':
      return 'No se encontró ningún micrófono conectado en tu dispositivo.'
    case 'service-not-allowed':
      return 'El servicio de reconocimiento de voz está bloqueado o deshabilitado en este navegador.'
    case 'language-not-supported':
      return 'El idioma de voz no está disponible en este dispositivo.'
    case 'aborted':
      return ''
    default:
      return `Error en el reconocimiento de voz (${err}). Puedes escribir tus ingredientes abajo.`
  }
}

export interface UseSpeechRecognitionReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  errorCode: string | null
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
  simulateVoiceInput: (sampleText?: string) => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isListeningRef = useRef(false)
  const retryCountRef = useRef(0)
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const isSupported = !!SpeechRecognitionAPI

  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onstart = null
      recognitionRef.current.onresult = null
      recognitionRef.current.onerror = null
      recognitionRef.current.onend = null
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }
  }, [])

  const startListening = useCallback(async () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }

    if (!SpeechRecognitionAPI) {
      setErrorCode('not-supported')
      setError('Tu navegador no soporta reconocimiento de voz nativo. Escribe directamente abajo.')
      return
    }

    cleanupRecognition()
    setError(null)
    setErrorCode(null)
    setInterimTranscript('')

    // Intentar despertar y solicitar permisos de micrófono de forma explícita
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setErrorCode('not-allowed')
          setError(humanizeSpeechError('not-allowed'))
          setIsListening(false)
          isListeningRef.current = false
          return
        }
      }
    }

    const recognition = new SpeechRecognitionAPI()

    // continuous: false para máxima compatibilidad y evitar timeouts de red en Chromium
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = retryCountRef.current > 0 ? 'es-ES' : (navigator.language?.startsWith('es') ? navigator.language : 'es-ES')

    recognition.onstart = () => {
      setIsListening(true)
      isListeningRef.current = true
      setError(null)
      setErrorCode(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setTranscript(prev => {
          const combined = prev ? `${prev} ${finalText.trim()}` : finalText.trim()
          return collapseRepeats(combined)
        })
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event: Event) => {
      const err = (event as Event & { error?: string }).error || 'unknown'
      if (err === 'aborted') {
        setIsListening(false)
        isListeningRef.current = false
        return
      }

      // Si falla por network en el primer intento, reintentar una vez con locale es-ES
      if (err === 'network' && retryCountRef.current === 0) {
        retryCountRef.current = 1
        cleanupRecognition()
        setTimeout(() => {
          startListening()
        }, 150)
        return
      }

      setErrorCode(err)
      setError(humanizeSpeechError(err))
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onend = () => {
      setIsListening(false)
      isListeningRef.current = false
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    isListeningRef.current = true

    try {
      recognition.start()
    } catch (e: any) {
      console.warn('Speech recognition start failed:', e)
      setIsListening(false)
      isListeningRef.current = false
      setErrorCode('network')
      setError(humanizeSpeechError('network'))
    }
  }, [SpeechRecognitionAPI, cleanupRecognition])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setErrorCode(null)
    retryCountRef.current = 0
  }, [])

  // Simulación realista de dictado por voz (ideal para tests, demos o navegadores sin Google Cloud)
  const simulateVoiceInput = useCallback((sampleText?: string) => {
    const textToSimulate = sampleText || 'Tengo cuatro tomates, media cebolla, seis huevos y dos yogures que vencen mañana'
    
    stopListening()
    resetTranscript()
    setIsListening(true)
    setError(null)
    setErrorCode(null)

    const words = textToSimulate.split(' ')
    let currentIdx = 0

    simulationTimerRef.current = setInterval(() => {
      currentIdx++
      if (currentIdx <= words.length) {
        const partial = words.slice(0, currentIdx).join(' ')
        setInterimTranscript(partial)
      } else {
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current)
          simulationTimerRef.current = null
        }
        setInterimTranscript('')
        setTranscript(textToSimulate)
        setIsListening(false)
      }
    }, 160)
  }, [stopListening, resetTranscript])

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current)
      }
      cleanupRecognition()
    }
  }, [cleanupRecognition])

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    errorCode,
    startListening,
    stopListening,
    resetTranscript,
    simulateVoiceInput,
  }
}
