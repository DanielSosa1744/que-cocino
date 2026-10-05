import { useLocation, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
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
    <div className="flex-shrink-0 w-full z-40 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#A88B57]/30 pb-safe shadow-[0_-2px_12px_rgba(168,139,87,0.06)]">
      <nav className="flex justify-around items-center h-17 px-3 max-w-md mx-auto">
        {MAIN_TABS.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/recetas' && location.pathname === '/vaciar-nevera')

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative tap-subtle cursor-pointer ${
                isActive ? 'text-[#1C1917]' : 'text-[#766153] hover:text-[#1C1917]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <GoogleIcon
                  name={tab.icon}
                  filled={isActive}
                  className={`text-[26px] transition-all duration-200 ${
                    isActive ? 'text-[#8F7347] scale-105' : 'text-[#766153]'
                  }`}
                />
                {tab.path === '/inventory' && inventory.length > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#A88B57]" />
                )}
              </div>
              <span className={`text-[13px] sm:text-[14px] mt-0.5 tracking-wider font-menu-serif transition-colors ${
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


