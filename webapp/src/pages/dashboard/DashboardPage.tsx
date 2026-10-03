import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import {
  Package,
  AlertTriangle,
  Flame,
  PieChart,
  ArrowRight,
  Mic,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import UrgencyBadge from '../../components/UrgencyBadge'
import { calculateInventoryEconomicRisk } from '../../lib/ingredientParser'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()
  const { data: recipes = [] } = useVaciarNevera(inventory)

  const totalRegistered = inventory.length
  const criticalItems = inventory.filter(i => i.urgency === 'critical')
  const warningItems = inventory.filter(i => i.urgency === 'warning')
  const okItems = inventory.filter(i => i.urgency === 'ok')
  const totalUrgents = criticalItems.length + warningItems.length

  // Métricas económicas de desperdicio
  const { totalValue, riskValue, riskWeightKg } = calculateInventoryEconomicRisk(inventory)

  // Tarjeta 3: Riesgo de desperdicio (Alto / Medio / Bajo)
  let wasteRiskLevel: 'Alto' | 'Medio' | 'Bajo' = 'Bajo'
  if (criticalItems.length > 0) {
    wasteRiskLevel = 'Alto'
  } else if (warningItems.length > 0) {
    wasteRiskLevel = 'Medio'
  }

  // Tarjeta 4: Porcentaje estimado de aprovechamiento
  // ¿Cuántos ingredientes distintos del inventario se aprovechan en las recetas compatibles?
  const uniqueUsedIngredients = new Set<string>()
  recipes.forEach(r => {
    r.matchedIngredients.forEach(ing => uniqueUsedIngredients.add(ing.toLowerCase()))
  })
  const utilizedCount = totalRegistered > 0
    ? Math.min(totalRegistered, uniqueUsedIngredients.size)
    : 0
  const utilizationPercentage = totalRegistered > 0
    ? Math.min(100, Math.round((utilizedCount / totalRegistered) * 100))
    : 0

  return (
    <div className="h-full max-h-full bg-gray-50 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="bg-white px-3.5 pt-safe pb-1.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Control Doméstico
          </span>
          <button
            onClick={() => navigate('/voice')}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-green-600 transition"
          >
            <Mic className="w-3 h-3" />
            + Añadir
          </button>
        </div>
        <h1 className="text-base font-black text-gray-900 leading-tight">Dashboard de Cocina</h1>
        <p className="text-gray-400 text-[10px]">
          Estado de tu despensa y alimentos en riesgo
        </p>
      </div>

      <div className="px-3 py-1.5 space-y-1.5 flex-1 flex flex-col justify-evenly overflow-hidden">
        {/* Banner CTA principal para "Modo Vaciar Nevera" */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-3 text-white shadow-xs flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span className="font-extrabold text-[11px] tracking-wide uppercase text-orange-100">
                Acción recomendada hoy
              </span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {recipes.length} receta{recipes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <h2 className="text-base font-black mb-0.5">Modo Vaciar Nevera</h2>
          <p className="text-orange-100 text-[11px] leading-tight mb-2.5">
            {riskValue > 0
              ? `Cocina primero para salvar ${riskValue.toFixed(2)}€ y ${(riskWeightKg * 1000).toFixed(0)}g de comida en riesgo.`
              : 'Cocina primero los ingredientes de mayor riesgo para no tirar comida.'}
          </p>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="w-full py-2 bg-white text-orange-600 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-orange-50 transition active:scale-98 text-xs"
          >
            Ver recetas para vaciar nevera
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* LAS 4 TARJETAS REQUERIDAS */}
        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
          {/* TARJETA 1: Ingredientes registrados */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Registrados
              </span>
              <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                <Package className="w-3 h-3 text-blue-500" />
              </div>
            </div>
            <p className="text-xl font-black text-gray-900 leading-none">{totalRegistered}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">≈ {totalValue.toFixed(2)}€ en despensa</p>
          </div>

          {/* TARJETA 2: Ingredientes urgentes */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Urgentes
              </span>
              <div className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-500" />
              </div>
            </div>
            <p className="text-xl font-black text-red-500 leading-none">{criticalItems.length}</p>
            <p className="text-[10px] text-red-500 font-bold mt-0.5">{riskValue > 0 ? `≈ ${riskValue.toFixed(2)}€ en riesgo` : '+0 esta sem.'}</p>
          </div>

          {/* TARJETA 3: Riesgo de desperdicio */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Riesgo
              </span>
              <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center">
                <Flame className="w-3 h-3 text-amber-500" />
              </div>
            </div>
            <p className="text-lg font-black text-gray-900 leading-none">{wasteRiskLevel}</p>
            <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5 overflow-hidden flex">
              <div
                className="bg-red-500 h-full"
                style={{ width: `${totalRegistered > 0 ? (criticalItems.length / totalRegistered) * 100 : 0}%` }}
              />
              <div
                className="bg-orange-400 h-full"
                style={{ width: `${totalRegistered > 0 ? (warningItems.length / totalRegistered) * 100 : 0}%` }}
              />
              <div
                className="bg-green-500 h-full"
                style={{ width: `${totalRegistered > 0 ? (okItems.length / totalRegistered) * 100 : 100}%` }}
              />
            </div>
          </div>

          {/* TARJETA 4: Porcentaje estimado de aprovechamiento */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Aprovechamiento
              </span>
              <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                <PieChart className="w-3 h-3 text-green-500" />
              </div>
            </div>
            <p className="text-xl font-black text-green-600 leading-none">{utilizationPercentage}%</p>
            <p className="text-[10px] text-green-600 font-medium mt-0.5">{utilizedCount} de {totalRegistered} usados</p>
          </div>
        </div>

        {/* Lista visual de alimentos urgentes (Semáforo) */}
        {totalUrgents > 0 && (
          <div className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-2xs flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-gray-900 text-xs">Semáforo de Vencimiento</h3>
              <button
                onClick={() => navigate('/inventory')}
                className="text-[10px] text-green-600 font-medium hover:underline flex items-center"
              >
                Ver todos <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[...criticalItems, ...warningItems].slice(0, 2).map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[11px] ${
                    item.urgency === 'critical'
                      ? 'bg-red-50/70 border-red-100 text-red-900'
                      : 'bg-orange-50/70 border-orange-100 text-orange-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.urgency === 'critical' ? 'bg-[#F44336]' : 'bg-[#FF9800]'
                      }`}
                    />
                    <p className="font-semibold text-[11px] capitalize truncate">{item.name}</p>
                  </div>
                  <UrgencyBadge item={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acceso directo a Impacto e Inventario */}
        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2.5 bg-white border border-gray-100 rounded-xl text-left hover:border-gray-200 transition shadow-2xs active:scale-98"
          >
            <p className="text-[10px] text-gray-400 font-medium leading-none">Despensa</p>
            <p className="font-bold text-gray-900 text-xs mt-0.5">Ver Inventario</p>
          </button>
          <button
            onClick={() => navigate('/impact')}
            className="p-2.5 bg-white border border-gray-100 rounded-xl text-left hover:border-gray-200 transition shadow-2xs active:scale-98"
          >
            <p className="text-[10px] text-gray-400 font-medium leading-none">Sostenibilidad</p>
            <p className="font-bold text-green-600 text-xs mt-0.5">Mi Impacto 🌱</p>
          </button>
        </div>
      </div>
    </div>
  )
}
