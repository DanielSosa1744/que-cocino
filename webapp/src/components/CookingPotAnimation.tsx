import { useEffect, useState } from 'react'

interface CookingPotAnimationProps {
  message?: string
  subMessage?: string
  inline?: boolean
}

const COOKING_STEPS = [
  'Echando los ingredientes a la olla...',
  'Combinando sabores y texturas...',
  'Buscando las mejores combinaciones...',
  '¡Ajustando el fuego y casi listo!',
]

export default function CookingPotAnimation({
  message = 'Preparando tus recetas...',
  subMessage,
  inline = false,
}: CookingPotAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % COOKING_STEPS.length)
    }, 1300)
    return () => clearInterval(timer)
  }, [])

  const currentSub = subMessage || COOKING_STEPS[stepIndex]

  const containerClasses = inline
    ? 'flex flex-col items-center justify-center py-10 px-4 select-none'
    : 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F3EC]/95 backdrop-blur-md px-6 select-none animate-fade-in'

  return (
    <div className={containerClasses}>
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center">
        {/* ========================================================
            VAPOR / STEAM PUFFS (DIBUJOS ANIMADOS)
            ======================================================== */}
        <div className="absolute top-12 w-36 h-20 pointer-events-none flex justify-center items-end">
          {/* Vapor 1 */}
          <div
            className="absolute left-6 animate-cartoon-steam"
            style={{ animationDelay: '0s', animationDuration: '2.4s' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 24C10 20 8 16 12 11C15 7 11 4 14 2"
                stroke="#A68A64"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
            </svg>
          </div>

          {/* Vapor 2 */}
          <div
            className="absolute left-16 animate-cartoon-steam"
            style={{ animationDelay: '0.8s', animationDuration: '2.2s' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 28C21 23 23 18 18 12C14 7 19 4 16 2"
                stroke="#766153"
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
          </div>

          {/* Vapor 3 */}
          <div
            className="absolute right-5 animate-cartoon-steam"
            style={{ animationDelay: '1.4s', animationDuration: '2.6s' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20C9 16 7 13 10 9C12 6 9 3 12 1"
                stroke="#A68A64"
                strokeWidth="3"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
            </svg>
          </div>
        </div>

        {/* ========================================================
            INGREDIENTES CAYENDO (TIPO DIBUJO ANIMADO)
            ======================================================== */}
        <div className="absolute top-6 w-56 h-36 pointer-events-none overflow-visible">
          {/* 1. Carne / Bife jugoso 🥩 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '42%', animationDelay: '0s' }}
          >
            <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
              {/* Contorno y cuerpo carne */}
              <path
                d="M8 18C4 12 7 5 15 4C23 3 32 6 38 12C43 17 41 26 34 29C26 32 12 30 8 18Z"
                fill="#C84B31"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Grasa / veta dibujo animado */}
              <path
                d="M16 8C20 9 27 12 31 17C33 19 33 23 30 25"
                stroke="#F4D3C4"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="15" cy="17" r="3.5" fill="#FFFFFF" stroke="#2F2A26" strokeWidth="2" />
            </svg>
          </div>

          {/* 2. Tomate brillante 🍅 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '56%', animationDelay: '0.48s' }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              {/* Cuerpo tomate */}
              <circle
                cx="18"
                cy="20"
                r="13"
                fill="#E63946"
                stroke="#2F2A26"
                strokeWidth="2.5"
              />
              {/* Brillo cartoon */}
              <path
                d="M12 14C14 11 18 10 20 11"
                stroke="#FFAAA6"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Ramita / Cáliz verde */}
              <path
                d="M18 7V3M15 8L12 6M21 8L24 6M18 8L15 10M18 8L21 10"
                stroke="#5D7A56"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 3. Zanahoria 🥕 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '30%', animationDelay: '0.95s' }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              {/* Ramas verdes */}
              <path
                d="M26 12L33 5M28 14L34 10M25 10L29 4"
                stroke="#5D7A56"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Cono zanahoria */}
              <path
                d="M27 13L10 30C8 32 5 31 6 28L18 11C20 9 25 10 27 13Z"
                fill="#F77F00"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Rayitas cartoon */}
              <path
                d="M17 17L14 18M21 21L18 22M23 15L21 16"
                stroke="#D65A00"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 4. Cebolla dorada 🧅 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '62%', animationDelay: '1.42s' }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              {/* Tallo */}
              <path d="M18 4V8" stroke="#5D7A56" strokeWidth="2.5" strokeLinecap="round" />
              {/* Cuerpo cebolla */}
              <path
                d="M18 8C11 11 7 18 10 24C12 28 16 30 18 30C20 30 24 28 26 24C29 18 25 11 18 8Z"
                fill="#D4A373"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Líneas capas */}
              <path
                d="M18 10C15 15 14 23 18 28M18 10C21 15 22 23 18 28"
                stroke="#BC8A5F"
                strokeWidth="1.8"
              />
              {/* Raicillas */}
              <path d="M16 30L15 33M18 30V34M20 30L21 33" stroke="#8C6239" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* 5. Champiñón 🍄 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '46%', animationDelay: '1.9s' }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              {/* Tronco */}
              <path
                d="M13 18H21V27C21 29 19 30 17 30C15 30 13 29 13 27V18Z"
                fill="#FAEDCD"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Sombrero */}
              <path
                d="M6 18C6 11 10 6 17 6C24 6 28 11 28 18H6Z"
                fill="#B07D62"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Manchas cartoon */}
              <circle cx="12" cy="12" r="2" fill="#FFFFFF" opacity="0.8" />
              <circle cx="21" cy="11" r="2.5" fill="#FFFFFF" opacity="0.8" />
              <circle cx="17" cy="15" r="1.5" fill="#FFFFFF" opacity="0.8" />
            </svg>
          </div>

          {/* 6. Cuña de queso 🧀 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '34%', animationDelay: '2.38s' }}
          >
            <svg width="38" height="34" viewBox="0 0 38 34" fill="none">
              {/* Cuerpo cuña */}
              <path
                d="M6 24L32 18L18 8L6 24Z"
                fill="#F4A261"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M6 24V28C6 29 8 30 10 30L32 24V18L6 24Z"
                fill="#E76F51"
                stroke="#2F2A26"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Agujeros de queso */}
              <circle cx="15" cy="18" r="2" fill="#D97736" stroke="#2F2A26" strokeWidth="1" />
              <circle cx="23" cy="16" r="1.5" fill="#D97736" />
              <circle cx="18" cy="24" r="1.5" fill="#B85D25" />
            </svg>
          </div>
        </div>

        {/* ========================================================
            OLLA DE COCINA (CARTOON POT CON ASAS Y HERVOR)
            ======================================================== */}
        <div className="relative mt-20 animate-pot-simmer">
          {/* Asas laterales */}
          {/* Asa izquierda */}
          <div className="absolute -left-5 top-8 w-6 h-10 pointer-events-none">
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
              <path
                d="M20 6C10 6 4 13 4 20C4 27 10 34 20 34"
                stroke="#2F2A26"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M20 9C12 9 7 14 7 20C7 26 12 31 20 31"
                stroke="#8A381A"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Asa derecha */}
          <div className="absolute -right-5 top-8 w-6 h-10 pointer-events-none">
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
              <path
                d="M4 6C14 6 20 13 20 20C20 27 14 34 4 34"
                stroke="#2F2A26"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M4 9C12 9 17 14 17 20C17 26 12 31 4 31"
                stroke="#8A381A"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Cuerpo principal de la olla */}
          <svg width="170" height="110" viewBox="0 0 170 110" fill="none" className="drop-shadow-md">
            {/* Sombra base */}
            <ellipse cx="85" cy="106" rx="60" ry="4" fill="#2F2A26" opacity="0.15" />

            {/* Olla cuerpo inferior */}
            <path
              d="M15 22C15 65 30 102 85 102C140 102 155 65 155 22H15Z"
              fill="#C85A32"
              stroke="#2F2A26"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Brillo cartoon en cuerpo izquierdo */}
            <path
              d="M28 32C26 55 36 85 65 94"
              stroke="#E07A5F"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M36 36C34 50 42 70 56 78"
              stroke="#F4A261"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Borde / Reborde de la olla */}
            <ellipse
              cx="85"
              cy="22"
              rx="70"
              ry="16"
              fill="#B04A26"
              stroke="#2F2A26"
              strokeWidth="4"
            />

            {/* Caldo burbujeante dentro */}
            <ellipse
              cx="85"
              cy="22"
              rx="63"
              ry="12"
              fill="#F4A261"
            />
            {/* Ondas / reflejo del caldo */}
            <path
              d="M35 22C50 18 65 24 85 22C105 20 120 25 135 22C125 30 105 32 85 32C65 32 45 30 35 22Z"
              fill="#E76F51"
              opacity="0.85"
            />

            {/* Rostro amigable tipo dibujo animado en la olla (Cute Kawaii / Cartoon Eyes) */}
            {/* Ojo izquierdo */}
            <ellipse cx="68" cy="58" rx="4.5" ry="6" fill="#2F2A26" />
            <circle cx="66.5" cy="56" r="1.8" fill="#FFFFFF" />

            {/* Ojo derecho */}
            <ellipse cx="102" cy="58" rx="4.5" ry="6" fill="#2F2A26" />
            <circle cx="100.5" cy="56" r="1.8" fill="#FFFFFF" />

            {/* Sonrisa traviesa */}
            <path
              d="M79 67C82 71 88 71 91 67"
              stroke="#2F2A26"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Mejillas sonrojadas */}
            <ellipse cx="58" cy="64" rx="4" ry="2.5" fill="#E07A5F" opacity="0.8" />
            <ellipse cx="112" cy="64" rx="4" ry="2.5" fill="#E07A5F" opacity="0.8" />
          </svg>

          {/* Burbujas saliendo del caldo */}
          <div
            className="absolute top-1 left-16 w-3 h-3 rounded-full bg-[#FFE3A8] border border-[#2F2A26] animate-cartoon-bubble"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="absolute top-3 left-24 w-4 h-4 rounded-full bg-[#FFE3A8] border border-[#2F2A26] animate-cartoon-bubble"
            style={{ animationDelay: '0.6s' }}
          />
          <div
            className="absolute top-2 left-20 w-2.5 h-2.5 rounded-full bg-[#FFE3A8] border border-[#2F2A26] animate-cartoon-bubble"
            style={{ animationDelay: '1.1s' }}
          />
        </div>
      </div>

      {/* ========================================================
          TEXTOS Y ESTADO DE PREPARACIÓN
          ======================================================== */}
      <div className="mt-4 text-center max-w-xs mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#2F2A26] tracking-tight flex items-center justify-center gap-2">
          <span>{message}</span>
        </h3>
        <p className="text-xs text-[#766153] mt-1.5 font-medium transition-all duration-300 min-h-[1.25rem]">
          {currentSub}
        </p>

        {/* Barra de progreso sutil y cálida */}
        <div className="w-36 h-1.5 bg-[#766153]/15 rounded-full mx-auto mt-3 overflow-hidden">
          <div className="h-full bg-[#5D7A56] rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  )
}
