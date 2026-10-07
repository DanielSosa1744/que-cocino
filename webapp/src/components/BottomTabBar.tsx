import { useLocation, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { abortActiveActions } from '../lib/actionAbort'
import GoogleIcon from './GoogleIcon'

export const isTabBarHidden = (pathname: string) =>
  ['/login', '/register', '/forgot-password', '/reset-password', '/voice', '/confirm-ingredients'].includes(pathname)

export const MAIN_TABS = [
  { path: '/home', label: 'La Cocina', icon: 'soup_kitchen' },
  { path: '/recetas', label: 'La Carta', icon: 'menu_book' },
  { path: '/inventory', label: 'Despensa', icon: 'inventory_2' },
  { path: '/impact', label: 'Cuaderno', icon: 'auto_stories' },
]

export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHidden = isTabBarHidden(location.pathname)

  const { data: inventory = [] } = useInventory()

  if (isHidden) return null

  return (
    <div className="flex-shrink-0 w-full z-40 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#A88B57]/30 pb-safe shadow-[0_-2px_12px_rgba(168,139,87,0.06)] select-none">
      <nav className="flex justify-around items-center h-17 px-2 sm:px-4 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto touch-manipulation">
        {MAIN_TABS.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/recetas' && location.pathname === '/vaciar-nevera')

          const handleTabSelect = () => {
            // 1. Abandonar de inmediato cualquier acción anterior (reconocimiento de voz, timers, promesas)
            abortActiveActions()

            // 2. Si ya está activo, la acción ya fue cancelada arriba (restablece vista limpia)
            if (isActive) return

            // 3. Acelerar el cambio de página navegando al instante
            navigate(tab.path)
          }

          return (
            <button
              key={tab.path}
              type="button"
              onPointerDown={() => {
                // Al primer contacto táctil, abortar inmediatamente la acción previa
                abortActiveActions()
              }}
              onClick={handleTabSelect}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer touch-manipulation select-none active:scale-95 transition-transform duration-75 ${
                isActive ? 'text-[#1C1917]' : 'text-[#766153] hover:text-[#1C1917]'
              }`}
            >
              <div className="relative flex items-center justify-center pointer-events-none">
                <GoogleIcon
                  name={tab.icon}
                  filled={isActive}
                  className={`text-[26px] ${
                    isActive ? 'text-[#8F7347] scale-105' : 'text-[#766153]'
                  }`}
                />
                {tab.path === '/inventory' && inventory.length > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#A88B57]" />
                )}
              </div>
              <span className={`text-[13px] sm:text-[14px] mt-0.5 tracking-wider font-menu-serif pointer-events-none ${
                isActive ? 'text-[#1C1917] font-extrabold' : 'text-[#5A483D] font-semibold'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-[3px] rounded-full bg-[#A88B57]" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}


