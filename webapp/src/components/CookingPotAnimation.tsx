import { useEffect, useState } from 'react'

interface CookingPotAnimationProps {
  message?: string
  subMessage?: string
  inline?: boolean
}

const GOURMET_STEPS = [
  'Seleccionando y armonizando materias primas...',
  'Compilando creaciones exclusivas de la Casa...',
  'Equilibrando notas aromáticas y perfiles de sabor...',
  'Puliendo la presentación y detalles de la Carta...',
]

export default function CookingPotAnimation({
  message = 'Confeccionando la Carta del Chef...',
  subMessage,
  inline = false,
}: CookingPotAnimationProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % GOURMET_STEPS.length)
    }, 1400)
    return () => clearInterval(timer)
  }, [])

  const currentSub = subMessage || GOURMET_STEPS[stepIndex]

  const content = (
    <div className="w-full max-w-sm mx-auto menu-card-frame rounded-3xl p-6 sm:p-7 relative shadow-lg text-center select-none animate-fade-in text-[#2F2A26]">
      {/* Esquinas ornamentales en latón */}
      <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
      <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

      {/* Emblema superior */}
      <div className="flex items-center justify-center gap-2 opacity-80 mb-2">
        <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#A88B57]" />
        <span className="text-[#A88B57] text-xs">✦</span>
        <span className="text-xs tracking-[0.22em] uppercase font-semibold text-[#8F7347]">
          Atelier de Cuisine
        </span>
        <span className="text-[#A88B57] text-xs">✦</span>
        <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#A88B57]" />
      </div>

      {/* Ilustración de Alta Cocina: Cocotte de Cobre con ingredientes cayendo */}
      <div className="relative w-64 h-64 mx-auto flex flex-col items-center justify-center overflow-visible">
        {/* ========================================================
            VOLUTAS DE VAPOR AROMÁTICO (DELICADO Y EN TONOS CÁLIDOS)
            ======================================================== */}
        <div className="absolute top-8 w-36 h-20 pointer-events-none flex justify-center items-end">
          {/* Voluta 1 */}
          <div
            className="absolute left-6 animate-cartoon-steam"
            style={{ animationDelay: '0s', animationDuration: '2.6s' }}
          >
            <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
              <path
                d="M12 24C8 19 6 15 10 10C13 6 9 3 12 1"
                stroke="#A88B57"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
            </svg>
          </div>

          {/* Voluta 2 */}
          <div
            className="absolute left-16 animate-cartoon-steam"
            style={{ animationDelay: '0.9s', animationDuration: '2.4s' }}
          >
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
              <path
                d="M14 28C18 22 20 17 16 11C12 6 17 3 14 1"
                stroke="#8F7347"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
          </div>

          {/* Voluta 3 */}
          <div
            className="absolute right-6 animate-cartoon-steam"
            style={{ animationDelay: '1.6s', animationDuration: '2.8s' }}
          >
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <path
                d="M11 22C8 17 7 14 9 9C11 5 8 2 11 1"
                stroke="#C7A971"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.5"
              />
            </svg>
          </div>
        </div>

        {/* ========================================================
            INGREDIENTES GOURMET DESCENDIENDO (ESTILO BOTÁNICO/BISTRÓ)
            ======================================================== */}
        <div className="absolute top-4 w-52 h-36 pointer-events-none overflow-visible">
          {/* 1. Ramita de romero fresco 🌿 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '42%', animationDelay: '0s' }}
          >
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
              {/* Tallo leñoso */}
              <path d="M17 38V4" stroke="#6F4E37" strokeWidth="2" strokeLinecap="round" />
              {/* Agujas aromáticas verdes */}
              <path d="M17 10L9 6M17 10L25 6" stroke="#4A6B44" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 17L8 14M17 17L26 14" stroke="#5D7A56" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 24L10 22M17 24L24 22" stroke="#4A6B44" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 31L11 30M17 31L23 30" stroke="#5D7A56" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 2. Tomate heirloom con rama 🍅 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '56%', animationDelay: '0.5s' }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              {/* Cuerpo tomate rubí */}
              <circle
                cx="17"
                cy="19"
                r="11.5"
                fill="#A62824"
                stroke="#6B1613"
                strokeWidth="1.5"
              />
              {/* Reflejo satinado */}
              <path
                d="M12 14C14 11 17 10.5 19 11.5"
                stroke="#E87874"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Cáliz y rabillo */}
              <path
                d="M17 6V2M14 7L11 5M20 7L23 5M17 7L14 9M17 7L20 9"
                stroke="#4A6B44"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 3. Seta silvestre Boletus 🍄 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '28%', animationDelay: '1.0s' }}
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              {/* Tronco marfil */}
              <path
                d="M14 18H20V26C20 28 18 29 17 29C16 29 14 28 14 26V18Z"
                fill="#F0E8DC"
                stroke="#766153"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Sombrero acaramelado */}
              <path
                d="M8 18C8 11.5 12 7 17 7C22 7 26 11.5 26 18H8Z"
                fill="#8C5C3E"
                stroke="#54331E"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Vetas finas */}
              <path d="M12 12C14 10 17 10 20 12" stroke="#B88A6E" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 4. Corte noble de ternera / magret 🥩 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '64%', animationDelay: '1.45s' }}
          >
            <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
              {/* Corte carne curada */}
              <path
                d="M7 16C3 11 6 5 13 4C20 3 28 6 33 11C38 16 36 24 30 26C23 28 11 26 7 16Z"
                fill="#872424"
                stroke="#521212"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Veta marmoleada fina */}
              <path
                d="M14 8C18 9 24 12 27 16C29 18 29 21 26 23"
                stroke="#F2D7CD"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 5. Cuña de queso artesano afinado 🧀 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '46%', animationDelay: '1.95s' }}
          >
            <svg width="34" height="30" viewBox="0 0 34 30" fill="none">
              <path
                d="M5 21L28 16L16 7L5 21Z"
                fill="#DEAA52"
                stroke="#8A5F1C"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M5 21V25C5 26 7 27 9 27L28 21V16L5 21Z"
                fill="#C68C32"
                stroke="#8A5F1C"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="13" cy="16" r="1.5" fill="#8A5F1C" opacity="0.6" />
              <circle cx="20" cy="14" r="1.2" fill="#8A5F1C" opacity="0.6" />
            </svg>
          </div>

          {/* 6. Hoja de laurel y flor de sal 🌿 */}
          <div
            className="absolute animate-ingredient-drop"
            style={{ left: '36%', animationDelay: '2.4s' }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M5 25C9 21 12 14 25 5C18 18 11 21 5 25Z"
                fill="#3F5A36"
                stroke="#253820"
                strokeWidth="1.5"
              />
              <path d="M9 21L19 11" stroke="#5A7D4F" strokeWidth="1.2" strokeLinecap="round" />
              {/* Cristal de sal */}
              <circle cx="21" cy="18" r="1.2" fill="#FAF7F2" stroke="#A88B57" strokeWidth="0.8" />
              <circle cx="16" cy="24" r="1.2" fill="#FAF7F2" stroke="#A88B57" strokeWidth="0.8" />
            </svg>
          </div>
        </div>

        {/* ========================================================
            COCOTTE DE COBRE DE ALTA COCINA (FRENCH COPPER COCOTTE)
            ======================================================== */}
        <div className="relative mt-16 animate-pot-simmer">
          <svg width="190" height="120" viewBox="0 0 190 120" fill="none" className="drop-shadow-md">
            <defs>
              {/* Degradado metálico de cobre pulido con reflejos */}
              <linearGradient id="gourmetCopperBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#913B17" />
                <stop offset="20%" stopColor="#BA562A" />
                <stop offset="50%" stopColor="#DE7B4B" />
                <stop offset="80%" stopColor="#BA562A" />
                <stop offset="100%" stopColor="#7A2D0E" />
              </linearGradient>

              {/* Degradado de asas en latón dorado satinado */}
              <linearGradient id="gourmetBrassHandle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2C58E" />
                <stop offset="50%" stopColor="#B38E4F" />
                <stop offset="100%" stopColor="#735322" />
              </linearGradient>

              {/* Degradado para el caldo / fondo de cocina en ebullición */}
              <linearGradient id="gourmetBroth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D99C4B" />
                <stop offset="100%" stopColor="#9C5D1F" />
              </linearGradient>

              {/* Rescoldo suave y elegante */}
              <radialGradient id="gourmetHearthGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E0924A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#E0924A" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Rescoldo suave en la base */}
            <ellipse cx="95" cy="114" rx="68" ry="6" fill="url(#gourmetHearthGlow)" />
            <ellipse cx="95" cy="115" rx="54" ry="3" fill="#1C1917" opacity="0.12" />

            {/* Asas francesas de latón fundido con remaches */}
            {/* Asa izquierda */}
            <path
              d="M24 38 C12 38 6 48 6 56 C6 64 12 72 24 72"
              stroke="url(#gourmetBrassHandle)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="24" cy="42" r="2.5" fill="#66491E" />
            <circle cx="24" cy="68" r="2.5" fill="#66491E" />

            {/* Asa derecha */}
            <path
              d="M166 38 C178 38 184 48 184 56 C184 64 178 72 166 72"
              stroke="url(#gourmetBrassHandle)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="166" cy="42" r="2.5" fill="#66491E" />
            <circle cx="166" cy="68" r="2.5" fill="#66491E" />

            {/* Cuerpo de la Cocotte de Cobre */}
            <path
              d="M23 32 C23 76 40 110 95 110 C150 110 167 76 167 32 H23 Z"
              fill="url(#gourmetCopperBody)"
              stroke="#68270E"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            {/* Reflejos satinados en el cobre */}
            <path
              d="M36 42 C34 68 47 96 74 104"
              stroke="#F7B28B"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M45 44 C43 62 52 84 69 92"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Ribete superior en latón dorado satinado */}
            <ellipse
              cx="95"
              cy="32"
              rx="74"
              ry="13"
              fill="url(#gourmetBrassHandle)"
              stroke="#66491E"
              strokeWidth="1.4"
            />

            {/* Borde interior */}
            <ellipse
              cx="95"
              cy="32"
              rx="69"
              ry="10.5"
              fill="#7A2D0E"
            />

            {/* Caldo gastronómico aromatizado */}
            <ellipse
              cx="95"
              cy="32"
              rx="65"
              ry="8.5"
              fill="url(#gourmetBroth)"
            />

            {/* Ondas sutiles del hervor */}
            <path
              d="M42 32 C55 29 74 34 95 32 C116 30 135 34 148 32 C138 37 118 39 95 39 C72 39 52 37 42 32 Z"
              fill="#E8AC5E"
              opacity="0.55"
            />

            {/* Emblema ornamental en el centro de la olla */}
            <g transform="translate(95, 68)" opacity="0.8">
              <circle cx="0" cy="0" r="12" fill="#7A2D0E" stroke="#DDB879" strokeWidth="0.9" strokeDasharray="2 1.5" />
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#F7DBA3"
                fontSize="7.5"
                fontFamily="'Playfair Display', serif"
                fontWeight="bold"
              >
                ✦
              </text>
              <path
                d="M-7 7 C-3.5 10 3.5 10 7 7"
                stroke="#DDB879"
                strokeWidth="0.8"
                fill="none"
              />
            </g>
          </svg>

          {/* Burbujas doradas saliendo del caldo gastronómico */}
          <div
            className="absolute top-1 left-16 w-2.5 h-2.5 rounded-full bg-[#FFE199] border border-[#8F7347] animate-cartoon-bubble"
            style={{ animationDelay: '0.1s' }}
          />
          <div
            className="absolute top-3 left-24 w-3 h-3 rounded-full bg-[#FFE199] border border-[#8F7347] animate-cartoon-bubble"
            style={{ animationDelay: '0.6s' }}
          />
          <div
            className="absolute top-2 left-20 w-2 h-2 rounded-full bg-[#FFE199] border border-[#8F7347] animate-cartoon-bubble"
            style={{ animationDelay: '1.2s' }}
          />
        </div>
      </div>

      {/* ========================================================
          TIPOGRAFÍA EDITORIAL DE CARTA GOURMET
          ======================================================== */}
      <div className="mt-3.5 text-center max-w-xs mx-auto">
        <h3 className="font-menu-title text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight leading-snug">
          {message}
        </h3>
        <p className="font-menu-serif italic text-sm sm:text-base text-[#766153] mt-2 transition-all duration-300 min-h-[1.75rem]">
          {currentSub}
        </p>

        {/* Fina línea de latón con indicador de brillo */}
        <div className="w-44 h-[2.5px] bg-[#A88B57]/20 rounded-full mx-auto mt-3.5 overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#A88B57] to-transparent animate-pulse rounded-full" />
        </div>

        {/* Florón discreto */}
        <div className="text-xs text-[#A88B57]/70 mt-3 select-none">
          — ❖ —
        </div>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-2 w-full">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F3EC]/92 backdrop-blur-md px-4 select-none animate-fade-in">
      {content}
    </div>
  )
}
