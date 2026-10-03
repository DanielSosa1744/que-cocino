import { useLocation, useNavigate } from 'react-router-dom'
import { Mic, LayoutDashboard, Package, Flame, TrendingDown } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'

export const isTabBarHidden = (pathname: string) =>
  ['/login', '/register', '/forgot-password', '/reset-password', '/voice', '/confirm-ingredients'].includes(pathname)

export default function BottomTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHidden = isTabBarHidden(location.pathname)

  // Solo cargar inventario si la barra está visible
  const { data: inventory = [] } = useInventory()

  const urgentCount = inventory.filter(i => i.urgency === 'critical').length

  const tabs = [
    { path: '/home', label: 'Inicio', icon: Mic },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Despensa', icon: Package, badge: inventory.length },
    { path: '/vaciar-nevera', label: 'Vaciar', icon: Flame, alertBadge: urgentCount },
    { path: '/impact', label: 'Impacto', icon: TrendingDown },
  ]

  if (isHidden) return null

  return (
    <div className="flex-shrink-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe">
      <nav className="flex justify-around items-center h-14 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition relative ${
                isActive ? 'text-[#4CAF50] font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {tab.alertBadge !== undefined && tab.alertBadge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#F44336] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {tab.alertBadge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
