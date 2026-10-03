import { useLocation, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import GoogleIcon from './GoogleIcon'

export const isTabBarHidden = (pathname: string) =>
  ['/login', '/register', '/forgot-password', '/reset-password', '/voice', '/confirm-ingredients'].includes(pathname)

export const MAIN_TABS = [
  { path: '/home', label: 'Inicio', icon: 'home' },
  { path: '/recetas', label: 'Recetas', icon: 'menu_book' },
  { path: '/inventory', label: 'Despensa', icon: 'inventory_2' },
  { path: '/impact', label: 'Actividad', icon: 'history' },
]

export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHidden = isTabBarHidden(location.pathname)

  const { data: inventory = [] } = useInventory()

  if (isHidden) return null

  return (
    <div className="flex-shrink-0 w-full z-40 bg-[#fbf9f5]/85 backdrop-blur-xl border-t border-stone-200/50 pb-safe">
      <nav className="flex justify-around items-center h-14 px-3 max-w-sm mx-auto">
        {MAIN_TABS.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/recetas' && location.pathname === '/vaciar-nevera')

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative tap-subtle cursor-pointer ${
                isActive ? 'text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <GoogleIcon
                  name={tab.icon}
                  filled={isActive}
                  className={`text-[20px] transition-all duration-200 ${
                    isActive ? 'text-stone-900 scale-105' : 'text-stone-400'
                  }`}
                />
                {tab.path === '/inventory' && inventory.length > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-stone-400/80" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight transition-colors ${
                isActive ? 'text-stone-900 font-medium' : 'text-stone-400 font-normal'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-3.5 h-[2px] rounded-full bg-stone-800/70" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}


