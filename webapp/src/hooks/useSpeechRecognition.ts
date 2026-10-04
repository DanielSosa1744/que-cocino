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
      return 'No se detectó voz reciente. El micrófono continúa activo para que puedas seguir hablando.'
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
  const userStoppedRef = useRef(false)
  const accumulatedFinalRef = useRef('')
  const latestInterimRef = useRef('')
  const retryCountRef = useRef(0)
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Texto final de la sesión de reconocimiento en curso (aún no consolidado en accumulatedFinalRef)
  const sessionFinalRef = useRef('')
  // Fallos consecutivos al invocar recognition.start() para evitar bucles infinitos de reinicio
  const startFailuresRef = useRef(0)

  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const isSupported = !!SpeechRecognitionAPI

  const cleanupRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
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
    latestInterimRef.current = ''
    userStoppedRef.current = false
    isListeningRef.current = true
    setIsListening(true)

    // Iniciar sesión de reconocimiento de voz directamente.
    // SpeechRecognition maneja nativamente la solicitud de permisos del micrófono
    // sin el bloqueo de hardware que produce getUserMedia() + track.stop() inmediato en Chromium.

    const initRecognitionSession = () => {
      if (!isListeningRef.current || userStoppedRef.current) return

      try {
        const recognition = new SpeechRecognitionAPI()

        // Modo continuo para no cortar la frase automáticamente
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = retryCountRef.current > 0 ? 'es-ES' : (navigator.language?.startsWith('es') ? navigator.language : 'es-ES')

        sessionFinalRef.current = ''

        recognition.onstart = () => {
          startFailuresRef.current = 0
          if (isListeningRef.current) {
            setIsListening(true)
            setError(null)
            setErrorCode(null)
          }
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let sessionFinal = ''
          let interim = ''

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i]
            if (res.isFinal) {
              sessionFinal += res[0].transcript + ' '
            } else {
              interim += res[0].transcript
            }
          }

          sessionFinalRef.current = sessionFinal
          latestInterimRef.current = interim
          const combined = (accumulatedFinalRef.current ? accumulatedFinalRef.current + ' ' : '') + sessionFinal
          const cleanText = collapseRepeats(combined.trim())
          if (cleanText) {
            setTranscript(cleanText)
          }
          setInterimTranscript(interim)
        }

        recognition.onerror = (event: Event) => {
          const err = (event as Event & { error?: string }).error || 'unknown'

          // Si el usuario pausó unos segundos, Chrome dispara 'no-speech'.
          // ¡NO detener! Mantener la escucha activa para que el usuario pueda pensar y seguir hablando.
          if (err === 'no-speech') {
            return
          }

          if (err === 'aborted') {
            return
          }

          // Si falla por network en el primer intento, reintentar automáticamente con locale es-ES
          if (err === 'network' && retryCountRef.current === 0) {
            retryCountRef.current = 1
            if (isListeningRef.current && !userStoppedRef.current) {
              restartTimerRef.current = setTimeout(() => {
                initRecognitionSession()
              }, 200)
              return
            }
          }

          setErrorCode(err)
          setError(humanizeSpeechError(err))
          setIsListening(false)
          isListeningRef.current = false
        }

        recognition.onend = () => {
          // Consolidar el texto final de esta sesión antes de reiniciar
          if (sessionFinalRef.current.trim()) {
            const currentCombined = (accumulatedFinalRef.current ? accumulatedFinalRef.current + ' ' : '') + sessionFinalRef.current
            accumulatedFinalRef.current = collapseRepeats(currentCombined.trim())
            sessionFinalRef.current = ''
            setTranscript(accumulatedFinalRef.current)
          }

          // REGLA CLAVE: Solo el usuario puede detener el micrófono.
          // Si el navegador se desconectó o terminó por silencio pero el usuario NO pulsó parar:
          if (isListeningRef.current && !userStoppedRef.current) {
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && !userStoppedRef.current) {
                initRecognitionSession()
              }
            }, 100)
            return
          }

          setIsListening(false)
          isListeningRef.current = false
          setInterimTranscript('')
        }

        recognitionRef.current = recognition
        recognition.start()
      } catch (err: any) {
        console.warn('Error iniciando sesión de reconocimiento:', err)
        startFailuresRef.current += 1
        // Evitar bucle infinito: tras 5 fallos consecutivos, informar y detener
        if (startFailuresRef.current >= 5) {
          setErrorCode('start-failed')
          setError('No se pudo iniciar el micrófono. Puedes escribir tus ingredientes abajo.')
          setIsListening(false)
          isListeningRef.current = false
          return
        }
        if (isListeningRef.current && !userStoppedRef.current) {
          restartTimerRef.current = setTimeout(() => {
            initRecognitionSession()
          }, 300)
        }
      }
    }

    startFailuresRef.current = 0
    initRecognitionSession()
  }, [SpeechRecognitionAPI, cleanupRecognition])

  const stopListening = useCallback(() => {
    userStoppedRef.current = true
    isListeningRef.current = false

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }

    // Consolidar en orden: lo acumulado + finales de la sesión actual + interim pendiente.
    // (Antes se perdían los finales de la sesión en curso y el texto podía quedar duplicado/desordenado.)
    const parts = [
      accumulatedFinalRef.current,
      sessionFinalRef.current.trim(),
      latestInterimRef.current.trim(),
    ].filter(Boolean)
    if (parts.length > 0) {
      const clean = collapseRepeats(parts.join(' ').trim())
      accumulatedFinalRef.current = clean
      setTranscript(clean)
    }
    sessionFinalRef.current = ''
    latestInterimRef.current = ''

    // Desconectar handlers y abortar: el texto ya fue consolidado, así evitamos que
    // un onresult/onend tardío vuelva a añadir el mismo texto.
    cleanupRecognition()

    setIsListening(false)
    setInterimTranscript('')
  }, [cleanupRecognition])

  const resetTranscript = useCallback(() => {
    accumulatedFinalRef.current = ''
    latestInterimRef.current = ''
    sessionFinalRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setErrorCode(null)
    retryCountRef.current = 0
  }, [])

  const simulateVoiceInput = useCallback((sampleText?: string) => {
    const textToSimulate = sampleText || 'Tengo cuatro tomates, media cebolla, seis huevos y dos yogures que vencen mañana'

    stopListening()
    resetTranscript()
    setIsListening(true)
    isListeningRef.current = true
    userStoppedRef.current = false
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
        accumulatedFinalRef.current = textToSimulate
        setIsListening(false)
        isListeningRef.current = false
        userStoppedRef.current = true
      }
    }, 160)
  }, [stopListening, resetTranscript])

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current)
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
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
