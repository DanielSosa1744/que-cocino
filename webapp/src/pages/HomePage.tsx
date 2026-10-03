import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'
import {
  Mic,
  Package,
  ChevronRight,
  Leaf,
  Trash2,
  TrendingDown,
  LayoutDashboard
} from 'lucide-react'
import UrgencyBadge from '../components/UrgencyBadge'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()

  const criticalItems = inventory.filter(i => i.urgency === 'critical')
  const totalItems = inventory.length

  // Ordenar alimentos por caducidad (los más urgentes primero)
  const sortedInventory = [...inventory].sort((a, b) => {
    const daysA = a.days_until_expiry ?? 999
    const daysB = b.days_until_expiry ?? 999
    return daysA - daysB
  })

  const firstName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'amigo'

  return (
    <div className="h-full max-h-full bg-gray-50 flex flex-col justify-between overflow-hidden">
      {/* Header superior compacto */}
      <div className="bg-white border-b border-gray-100 px-3.5 pt-safe pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
              <Leaf className="w-3.5 h-3.5 text-[#4CAF50]" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-xs block leading-tight">¿Qué Cocino?</span>
              <p className="text-[10px] text-gray-400 font-medium">Hola, {firstName} 👋</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="px-3 py-1.5 flex-1 flex flex-col justify-evenly gap-1.5 overflow-hidden">
        {/* Alerta de alimentos críticos si existen */}
        {criticalItems.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-2 flex items-center justify-between flex-shrink-0 shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden pr-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-ping" />
              <div className="truncate">
                <span className="text-[11px] font-bold text-red-700 block truncate">
                  {criticalItems.length} urgente(s): {criticalItems.map(i => i.name).join(', ')}
                </span>
                <span className="text-[9px] text-red-500 font-medium block">Vencen en ≤2 días</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="text-[11px] bg-red-500 hover:bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg whitespace-nowrap flex items-center gap-0.5 flex-shrink-0 shadow-xs"
            >
              Cocinar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* SECCIÓN PRINCIPAL: BOTÓN CENTRAL DE MICRÓFONO */}
        <div className="bg-white rounded-2xl p-2.5 text-center shadow-xs border border-gray-100 flex flex-col items-center justify-center flex-1 max-h-[190px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
            Entrada Rápida por Voz
          </p>
          <p className="text-gray-500 text-[11px] mt-0.5 mb-1.5">
            Dicta tus ingredientes para no tirar comida
          </p>

          <button
            onClick={() => navigate('/voice')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#4CAF50] hover:bg-green-600 text-white shadow-md shadow-green-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer my-0.5"
            aria-label="Iniciar reconocimiento de voz"
          >
            <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          <p className="text-gray-800 font-extrabold text-xs mt-1">
            Pulsa para hablar
          </p>
          <p className="text-[10px] text-gray-400 italic mt-0.5 truncate max-w-[280px]">
            "Tengo tomates, huevos y media cebolla"
          </p>
        </div>

        {/* ACCESOS DIRECTOS DEL FLUJO PRINCIPAL */}
        <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
          {/* Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-xl p-2 border border-gray-100 shadow-2xs text-left hover:border-gray-200 transition flex items-center gap-2 active:scale-98"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-gray-400 leading-tight">Panel</p>
              <p className="text-xs font-bold text-gray-900 leading-tight">Dashboard</p>
            </div>
          </button>

          {/* Modo Vaciar Nevera */}
          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-2 text-white shadow-2xs text-left transition flex items-center gap-2 active:scale-98"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-orange-100 leading-tight">Cocinar hoy</p>
              <p className="text-xs font-black text-white leading-tight">Vaciar Nevera</p>
            </div>
          </button>

          {/* Inventario */}
          <button
            onClick={() => navigate('/inventory')}
            className="bg-white rounded-xl p-2 border border-gray-100 shadow-2xs text-left hover:border-gray-200 transition flex items-center gap-2 active:scale-98"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-gray-700" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-gray-400 leading-tight">{totalItems} ítems</p>
              <p className="text-xs font-bold text-gray-900 leading-tight">Inventario</p>
            </div>
          </button>

          {/* Impacto */}
          <button
            onClick={() => navigate('/impact')}
            className="bg-white rounded-xl p-2 border border-gray-100 shadow-2xs text-left hover:border-gray-200 transition flex items-center gap-2 active:scale-98"
          >
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-gray-400 leading-tight">Ahorro</p>
              <p className="text-xs font-bold text-green-700 leading-tight">Mi Impacto</p>
            </div>
          </button>
        </div>

        {/* Resumen rápido de despensa si hay alimentos */}
        {totalItems > 0 && (
          <div className="bg-white rounded-xl p-2 border border-gray-100 shadow-2xs flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                Prioridad de Vencimiento ({totalItems})
              </h3>
              <button
                onClick={() => navigate('/inventory')}
                className="text-[10px] text-green-600 font-semibold hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {sortedInventory.slice(0, 2).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-2 py-1 rounded-lg bg-gray-50 text-[11px]"
                >
                  <span className="font-semibold text-gray-800 capitalize truncate pr-1">{item.name}</span>
                  <UrgencyBadge item={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
