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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#F7F3EC] transition-opacity duration-300 ${
        phase === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center p-6 text-center">
        {/* Anillos de expansión orgánicos */}
        <div
          className={`absolute w-32 h-32 rounded-full bg-[#5D7A56]/15 transition-transform duration-700 ease-out pointer-events-none ${
            phase !== 'welcome' ? 'scale-[2.6] opacity-0' : 'scale-90 opacity-100'
          }`}
        />
        <div
          className={`absolute w-24 h-24 rounded-full bg-[#A68A64]/20 transition-transform duration-500 ease-out pointer-events-none ${
            phase !== 'welcome' ? 'scale-[2] opacity-0' : 'scale-95 opacity-100'
          }`}
        />

        {/* Emblema central con Google Icon */}
        <div
          className={`relative z-10 w-16 h-16 rounded-2xl bg-[#2F2A26] text-[#F7F3EC] flex items-center justify-center shadow-lg transition-all duration-500 ${
            phase === 'welcome'
              ? 'scale-95 opacity-90'
              : phase === 'opening'
              ? 'scale-110 shadow-[0_8px_24px_rgba(93,122,86,0.25)]'
              : 'scale-125 opacity-0'
          }`}
        >
          <GoogleIcon
            name="eco"
            className="text-[#5D7A56] text-3xl"
            filled
          />
        </div>

        {/* Textos con entrada y salida tipográfica suave */}
        <div
          className={`mt-4 space-y-1 transition-all duration-300 ${
            phase === 'fadeout' ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <h2 className="text-base font-serif font-medium text-[#2F2A26] tracking-tight">
            {phase === 'welcome' ? 'Abriendo libreta...' : `Bienvenido, ${userName}`}
          </h2>
          <p className="text-xs text-[#766153]">
            {phase === 'welcome' ? 'Preparando tu despensa...' : 'Todo listo para cocinar'}
          </p>
        </div>
      </div>
    </div>
  )
}
