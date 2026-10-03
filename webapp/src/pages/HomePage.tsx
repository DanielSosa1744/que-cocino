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
  LayoutDashboard,
  AlertTriangle
} from 'lucide-react'
import UrgencyBadge from '../components/UrgencyBadge'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()

  const criticalItems = inventory.filter(i => i.urgency === 'critical')
  const totalItems = inventory.length

  const firstName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'amigo'

  return (
    <div className="min-h-screen bg-gray-50 pb-12 flex flex-col">
      {/* Header superior */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center border border-green-100">
              <Leaf className="w-4 h-4 text-[#4CAF50]" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">¿Qué Cocino?</span>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
          Hola, {firstName} 👋
        </p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">
          ¿Qué tienes en casa?
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Dime lo que tienes y te diré qué cocinar para no tirar comida.
        </p>
      </div>

      <div className="px-5 mt-4 space-y-4 flex-1">
        {/* Alerta de alimentos críticos si existen */}
        {criticalItems.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-red-600 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5" />
                Alimentos urgentes (≤2 días)
              </span>
              <span className="text-[11px] font-semibold text-red-500">
                {criticalItems.length} en riesgo
              </span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              {criticalItems.map(i => i.name).join(', ')}
            </p>
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="mt-2.5 text-xs text-red-700 font-bold flex items-center gap-1 hover:underline"
            >
              Cocinar recetas con estos ingredientes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SECCIÓN PRINCIPAL: BOTÓN CENTRAL DE MICRÓFONO */}
        <div className="bg-white rounded-3xl p-7 text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
            Entrada Rápida por Voz
          </p>

          <p className="text-gray-700 text-sm font-medium mb-6 max-w-xs">
            Cuéntame qué ingredientes tienes disponibles.
          </p>

          <div className="relative my-2">
            <button
              onClick={() => navigate('/voice')}
              className="relative w-24 h-24 rounded-full bg-[#4CAF50] hover:bg-green-600 text-white shadow-xl shadow-green-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Iniciar reconocimiento de voz"
            >
              <Mic className="w-10 h-10" />
            </button>
          </div>

          <p className="text-gray-900 font-bold text-base mt-5">
            Pulsa el micrófono para hablar
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 w-full text-left space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center">
              Ejemplos que puedes decir:
            </p>
            <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 text-center italic border border-gray-100">
              "Tengo cuatro tomates, seis huevos y media cebolla."
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 text-center italic border border-gray-100">
              "Tengo dos yogures que vencen mañana."
            </div>
          </div>
        </div>

        {/* ACCESOS DIRECTOS DEL FLUJO PRINCIPAL */}
        <div className="grid grid-cols-2 gap-3">
          {/* Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:border-gray-200 transition flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Panel general</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Dashboard</p>
            </div>
          </button>

          {/* Modo Vaciar Nevera */}
          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="bg-white rounded-2xl p-4 border border-orange-200 shadow-sm text-left hover:border-orange-300 transition flex flex-col justify-between bg-gradient-to-br from-white to-orange-50/40"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
              <Trash2 className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-medium">Recomendaciones</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Vaciar Nevera</p>
            </div>
          </button>

          {/* Inventario */}
          <button
            onClick={() => navigate('/inventory')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:border-gray-200 transition flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
              <Package className="w-4 h-4 text-gray-700" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{totalItems} alimentos</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Inventario</p>
            </div>
          </button>

          {/* Impacto */}
          <button
            onClick={() => navigate('/impact')}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left hover:border-gray-200 transition flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center mb-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Ahorro y CO₂</p>
              <p className="text-sm font-bold text-green-700 mt-0.5">Mi Impacto</p>
            </div>
          </button>
        </div>

        {/* Resumen rápido de despensa si hay alimentos */}
        {totalItems > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                En tu despensa ({totalItems})
              </h3>
              <button
                onClick={() => navigate('/inventory')}
                className="text-xs text-green-600 font-semibold hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-1.5">
              {inventory.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 text-xs"
                >
                  <span className="font-semibold text-gray-800 capitalize">{item.name}</span>
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
