import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import UrgencyBadge from '../../components/UrgencyBadge'
import GoogleIcon from '../../components/GoogleIcon'
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
    <div className="h-full max-h-full bg-stone-50/50 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-stone-200/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Control Doméstico
          </span>
          <button
            onClick={() => navigate('/voice')}
            className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-emerald-800 transition tap-subtle cursor-pointer"
          >
            <GoogleIcon name="mic" className="text-emerald-700 text-xs" />
            + Añadir
          </button>
        </div>
        <h1 className="text-base font-extrabold text-stone-900 tracking-tight leading-tight">Dashboard de Cocina</h1>
        <p className="text-stone-400 text-[11px]">
          Estado de tu despensa y alimentos en riesgo
        </p>
      </div>

      <div className="px-3 py-2 space-y-2 flex-1 flex flex-col justify-evenly overflow-hidden">
        {/* Banner CTA principal para "Modo Vaciar Nevera" (Paleta sobria de bajo ruido visual) */}
        <div className="bg-stone-900 rounded-2xl p-3.5 text-white shadow-sm flex-shrink-0 border border-stone-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <GoogleIcon name="auto_awesome" className="text-amber-400 text-sm" />
              <span className="font-bold text-[10px] tracking-wide uppercase text-stone-300">
                Acción recomendada hoy
              </span>
            </div>
            <span className="bg-stone-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-stone-200">
              {recipes.length} receta{recipes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <h2 className="text-base font-extrabold mb-0.5">Modo Vaciar Nevera</h2>
          <p className="text-stone-300 text-[11px] leading-tight mb-2.5 font-normal">
            {riskValue > 0
              ? `Cocina primero para salvar ${riskValue.toFixed(2)}€ y ${(riskWeightKg * 1000).toFixed(0)}g de comida en riesgo.`
              : 'Cocina primero los ingredientes de mayor riesgo para no tirar comida.'}
          </p>

          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="w-full py-2 bg-white text-stone-900 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-stone-100 transition active:scale-98 text-xs tap-subtle cursor-pointer"
          >
            <span>Ver recetas para vaciar nevera</span>
            <GoogleIcon name="arrow_forward" className="text-xs" />
          </button>
        </div>

        {/* Las 4 tarjetas de métricas sin ruido visual */}
        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
          {/* TARJETA 1: Ingredientes registrados */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-2xs flex flex-col justify-between hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                Registrados
              </span>
              <div className="w-5 h-5 rounded-md bg-stone-100 flex items-center justify-center">
                <GoogleIcon name="inventory_2" className="text-stone-600 text-xs" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-stone-900 leading-none">{totalRegistered}</p>
            <p className="text-[10px] text-stone-400 mt-1">≈ {totalValue.toFixed(2)}€ en despensa</p>
          </div>

          {/* TARJETA 2: Ingredientes urgentes */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-2xs flex flex-col justify-between hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                Urgentes
              </span>
              <div className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center">
                <GoogleIcon name="warning" className="text-rose-600 text-xs" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-700 leading-none">{criticalItems.length}</p>
            <p className="text-[10px] text-rose-700 font-bold mt-1">{riskValue > 0 ? `≈ ${riskValue.toFixed(2)}€ en riesgo` : '+0 esta sem.'}</p>
          </div>

          {/* TARJETA 3: Riesgo de desperdicio */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-2xs flex flex-col justify-between hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                Riesgo
              </span>
              <div className="w-5 h-5 rounded-md bg-stone-100 flex items-center justify-center">
                <GoogleIcon name="skillet" className="text-stone-600 text-xs" />
              </div>
            </div>
            <p className="text-lg font-extrabold text-stone-900 leading-none">{wasteRiskLevel}</p>
            <div className="w-full bg-stone-100 rounded-full h-1 mt-1.5 overflow-hidden flex">
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${totalRegistered > 0 ? (criticalItems.length / totalRegistered) * 100 : 0}%` }}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${totalRegistered > 0 ? (warningItems.length / totalRegistered) * 100 : 0}%` }}
              />
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${totalRegistered > 0 ? (okItems.length / totalRegistered) * 100 : 100}%` }}
              />
            </div>
          </div>

          {/* TARJETA 4: Porcentaje estimado de aprovechamiento */}
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-2xs flex flex-col justify-between hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                Aprovechamiento
              </span>
              <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center">
                <GoogleIcon name="pie_chart" className="text-emerald-700 text-xs" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-emerald-800 leading-none">{utilizationPercentage}%</p>
            <p className="text-[10px] text-emerald-700 font-medium mt-1">{utilizedCount} de {totalRegistered} usados</p>
          </div>
        </div>

        {/* Lista visual de alimentos urgentes (Semáforo) */}
        {totalUrgents > 0 && (
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200/70 shadow-2xs flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-bold text-stone-900 text-xs">Semáforo de Vencimiento</h3>
              <button
                onClick={() => navigate('/inventory')}
                className="text-[10px] text-emerald-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver todos</span>
                <GoogleIcon name="chevron_right" className="text-xs" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[...criticalItems, ...warningItems].slice(0, 2).map(item => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[11px] ${
                    item.urgency === 'critical'
                      ? 'bg-rose-50/60 border-rose-200/60 text-rose-900'
                      : 'bg-amber-50/60 border-amber-200/60 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.urgency === 'critical' ? 'bg-rose-600' : 'bg-amber-500'
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
            className="p-2.5 bg-white border border-stone-200/70 rounded-xl text-left hover:border-stone-300 transition shadow-2xs active:scale-98 tap-subtle cursor-pointer hover-lift"
          >
            <p className="text-[10px] text-stone-400 font-medium leading-none">Despensa</p>
            <p className="font-bold text-stone-900 text-xs mt-1">Ver Inventario</p>
          </button>
          <button
            onClick={() => navigate('/impact')}
            className="p-2.5 bg-white border border-stone-200/70 rounded-xl text-left hover:border-stone-300 transition shadow-2xs active:scale-98 tap-subtle cursor-pointer hover-lift"
          >
            <p className="text-[10px] text-stone-400 font-medium leading-none">Sostenibilidad</p>
            <p className="font-bold text-emerald-800 text-xs mt-1 flex items-center gap-1">
              <span>Mi Impacto</span>
              <GoogleIcon name="eco" className="text-emerald-700 text-xs" />
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
