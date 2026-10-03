import { useLocation, useNavigate } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import GoogleIcon from './GoogleIcon'

export const isTabBarHidden = (pathname: string) =>
  ['/login', '/register', '/forgot-password', '/reset-password', '/voice', '/confirm-ingredients'].includes(pathname)

export const MAIN_TABS = [
  { path: '/home', label: 'Inicio', icon: 'mic' },
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/inventory', label: 'Despensa', icon: 'inventory_2' },
  { path: '/vaciar-nevera', label: 'Vaciar', icon: 'skillet' },
  { path: '/impact', label: 'Impacto', icon: 'insights' },
]

export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHidden = isTabBarHidden(location.pathname)

  const { data: inventory = [] } = useInventory()
  const urgentCount = inventory.filter(i => i.urgency === 'critical').length

  if (isHidden) return null

  return (
    <div className="flex-shrink-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/60 pb-safe">
      <nav className="flex justify-around items-center h-14 px-2 max-w-lg mx-auto">
        {MAIN_TABS.map((tab) => {
          const isActive = location.pathname === tab.path

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative tap-subtle cursor-pointer ${
                isActive ? 'text-emerald-800 font-bold' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <GoogleIcon
                  name={tab.icon}
                  filled={isActive}
                  className={`text-[22px] transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-800' : 'text-stone-400'
                  }`}
                />
                {tab.path === '/vaciar-nevera' && urgentCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {urgentCount}
                  </span>
                )}
                {tab.path === '/inventory' && inventory.length > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 bg-stone-200 text-stone-600 text-[8px] font-bold rounded-full flex items-center justify-center">
                    {inventory.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
