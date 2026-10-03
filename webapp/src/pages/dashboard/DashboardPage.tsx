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
  TrendingUp,
  Sparkles
} from 'lucide-react'
import UrgencyBadge from '../../components/UrgencyBadge'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: inventory = [] } = useInventory()
  const { data: recipes = [] } = useVaciarNevera(inventory)

  const totalRegistered = inventory.length
  const criticalItems = inventory.filter(i => i.urgency === 'critical')
  const warningItems = inventory.filter(i => i.urgency === 'warning')
  const okItems = inventory.filter(i => i.urgency === 'ok')
  const totalUrgents = criticalItems.length + warningItems.length

  // Categorías de inventario
  const categoriesCount = inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Tarjeta 3: Riesgo de desperdicio (Alto / Medio / Bajo)
  let wasteRiskLevel: 'Alto' | 'Medio' | 'Bajo' = 'Bajo'
  let wasteRiskText = 'Sin riesgo inminente de desperdicio'
  if (criticalItems.length > 0) {
    wasteRiskLevel = 'Alto'
    wasteRiskText = `${criticalItems.length} producto${criticalItems.length > 1 ? 's' : ''} vence${criticalItems.length === 1 ? '' : 'n'} en ≤2 días`
  } else if (warningItems.length > 0) {
    wasteRiskLevel = 'Medio'
    wasteRiskText = `${warningItems.length} producto${warningItems.length > 1 ? 's' : ''} vence${warningItems.length === 1 ? '' : 'n'} esta semana`
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
    <div className="min-h-app bg-gray-50 flex flex-col pb-10">
      {/* Header */}
      <div className="bg-white px-5 pt-safe pb-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            Control Doméstico
          </span>
          <button
            onClick={() => navigate('/voice')}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-600 transition"
          >
            <Mic className="w-3.5 h-3.5" />
            + Añadir
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Cocina</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Estado actual de tu despensa y alimentos en riesgo
        </p>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Banner CTA principal para "Modo Vaciar Nevera" */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span className="font-bold text-sm tracking-wide uppercase text-orange-100">
                Acción recomendada hoy
              </span>
            </div>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {recipes.length} receta{recipes.length !== 1 ? 's' : ''} lista{recipes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <h2 className="text-xl font-black mb-1">Modo Vaciar Nevera</h2>
          <p className="text-orange-100 text-xs leading-relaxed mb-4">
            Responde a: "¿Qué debería cocinar hoy para no tirar comida?" usando primero los ingredientes de mayor riesgo.
          </p>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="w-full py-3.5 bg-white text-orange-600 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:bg-orange-50 transition active:scale-98 text-sm"
          >
            Ver recetas para vaciar nevera
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* LAS 4 TARJETAS REQUERIDAS */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* TARJETA 1: Ingredientes registrados */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Registrados
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{totalRegistered}</p>
              <p className="text-xs text-gray-500 mt-1">alimentos en casa</p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>{categoriesCount['verdura'] || 0} verduras</span>
              <span>{categoriesCount['proteína'] || 0} proteínas</span>
            </div>
          </div>

          {/* TARJETA 2: Ingredientes urgentes */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Urgentes
                </span>
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-red-500">{criticalItems.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                +{warningItems.length} esta semana
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              <span className="text-gray-600 font-medium">{criticalItems.length} críticos</span>
            </div>
          </div>

          {/* TARJETA 3: Riesgo de desperdicio */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Riesgo
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900">{wasteRiskLevel}</p>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                {wasteRiskText}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden flex">
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
          </div>

          {/* TARJETA 4: Porcentaje estimado de aprovechamiento */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Aprovechamiento
                </span>
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-green-600">{utilizationPercentage}%</p>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                con recetas sugeridas
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1 text-[11px] text-green-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>{utilizedCount} de {totalRegistered} usados</span>
            </div>
          </div>
        </div>

        {/* Lista visual de alimentos urgentes (Semáforo) */}
        {totalUrgents > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Semáforo de Vencimiento</h3>
              <button
                onClick={() => navigate('/inventory')}
                className="text-xs text-green-600 font-medium hover:underline flex items-center"
              >
                Inventario completo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {[...criticalItems, ...warningItems].slice(0, 4).map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm ${
                    item.urgency === 'critical'
                      ? 'bg-red-50/70 border-red-100 text-red-900'
                      : 'bg-orange-50/70 border-orange-100 text-orange-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.urgency === 'critical' ? 'bg-[#F44336]' : 'bg-[#FF9800]'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-xs capitalize leading-tight">{item.name}</p>
                      <p className="text-[10px] opacity-75">
                        {item.quantity ? `${item.quantity} ${item.unit}` : item.category}
                      </p>
                    </div>
                  </div>
                  <UrgencyBadge item={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acceso directo a Impacto e Inventario */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate('/inventory')}
            className="p-3.5 bg-white border border-gray-100 rounded-2xl text-left hover:border-gray-200 transition shadow-sm"
          >
            <p className="text-xs text-gray-400 font-medium">Despensa</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">Ver Inventario</p>
          </button>
          <button
            onClick={() => navigate('/impact')}
            className="p-3.5 bg-white border border-gray-100 rounded-2xl text-left hover:border-gray-200 transition shadow-sm"
          >
            <p className="text-xs text-gray-400 font-medium">Sostenibilidad</p>
            <p className="font-bold text-green-600 text-sm mt-0.5">Mi Impacto 🌱</p>
          </button>
        </div>
      </div>
    </div>
  )
}
