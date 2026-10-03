import { useEffect, useState } from 'react'
import GoogleIcon from './GoogleIcon'

interface LoginEntranceAnimationProps {
  userName?: string
  onComplete: () => void
}

export default function LoginEntranceAnimation({
  userName = 'Chef',
  onComplete,
}: LoginEntranceAnimationProps) {
  const [phase, setPhase] = useState<'welcome' | 'opening' | 'fadeout'>('welcome')

  useEffect(() => {
    // Fase 1: Bienvenida (350ms)
    const t1 = setTimeout(() => {
      setPhase('opening')
    }, 450)

    // Fase 2: Apertura y disolución (850ms)
    const t2 = setTimeout(() => {
      setPhase('fadeout')
    }, 850)

    // Fase 3: Concluye y da paso al inicio (1100ms)
    const t3 = setTimeout(() => {
      onComplete()
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300 ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center p-6 text-center">
        {/* Anillos de expansión JS */}
        <div
          className={`absolute w-32 h-32 rounded-full bg-emerald-100/60 transition-transform duration-700 ease-out pointer-events-none ${
            phase !== 'welcome' ? 'scale-[2.6] opacity-0' : 'scale-90 opacity-100'
          }`}
        />
        <div
          className={`absolute w-24 h-24 rounded-full bg-emerald-200/50 transition-transform duration-500 ease-out pointer-events-none ${
            phase !== 'welcome' ? 'scale-[2] opacity-0' : 'scale-95 opacity-100'
          }`}
        />

        {/* Emblema central con Google Icon */}
        <div
          className={`relative z-10 w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg transition-all duration-500 ${
            phase === 'welcome'
              ? 'scale-95 opacity-90'
              : phase === 'opening'
              ? 'scale-110 shadow-emerald-500/20'
              : 'scale-125 opacity-0'
          }`}
        >
          <GoogleIcon
            name="eco"
            className="text-emerald-400 text-3xl"
            filled
          />
        </div>

        {/* Textos con entrada y salida tipográfica suave */}
        <div
          className={`mt-4 space-y-1 transition-all duration-300 ${
            phase === 'fadeout' ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <h2 className="text-base font-bold text-stone-900 tracking-tight">
            {phase === 'welcome' ? 'Iniciando sesión...' : `Bienvenido, ${userName}`}
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            {phase === 'welcome' ? 'Cargando tu despensa...' : 'Todo listo para aprovechar hoy'}
          </p>
        </div>
      </div>
    </div>
  )
}
