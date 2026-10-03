import { useNavigate } from 'react-router-dom'
import { useCookedHistory } from '../../hooks/useRecipes'
import GoogleIcon from '../../components/GoogleIcon'

export default function ImpactPage() {
  const navigate = useNavigate()
  const { data: history = [], isLoading } = useCookedHistory()

  const totalWaste = history.reduce((sum, h) => sum + (h.waste_avoided_kg ?? 0), 0)
  const totalMoney = history.reduce((sum, h) => sum + (h.money_saved_eur ?? 0), 0)
  const totalCO2 = history.reduce((sum, h) => sum + (h.co2_avoided_kg ?? 0), 0)
  const totalCooked = history.length

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="h-full max-h-full bg-stone-50/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-stone-200/60 flex-shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-1 transition tap-subtle cursor-pointer"
        >
          <GoogleIcon name="arrow_back" className="text-xs" />
          <span className="text-xs font-medium">Volver</span>
        </button>
        <div className="flex items-center gap-1.5">
          <GoogleIcon name="insights" className="text-emerald-700 text-base" />
          <h1 className="text-lg font-extrabold text-stone-900 leading-tight">Mi Impacto</h1>
        </div>
        <p className="text-stone-400 text-xs">
          Lo que has evitado desperdiciar hasta ahora
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2">
          {/* Tarjeta principal con bajo ruido visual */}
          <div className="bg-stone-900 rounded-2xl p-3.5 text-white col-span-2 shadow-sm border border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <p className="text-stone-300 text-[10px] font-bold uppercase tracking-wider">
                Comida salvada
              </p>
              <GoogleIcon name="eco" className="text-emerald-400 text-sm" />
            </div>
            <p className="text-2xl font-black tracking-tight text-white">{(totalWaste * 1000).toFixed(0)}g</p>
            <p className="text-stone-300 text-[11px] mt-0.5">≈ {totalWaste.toFixed(2)} kg de desperdicio evitado</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/70 p-3 shadow-2xs hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Ahorrado</span>
              <GoogleIcon name="payments" className="text-emerald-700 text-base" />
            </div>
            <p className="text-lg font-black text-stone-900">{totalMoney.toFixed(2)}€</p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/70 p-3 shadow-2xs hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">CO₂ Evitado</span>
              <GoogleIcon name="air" className="text-stone-500 text-base" />
            </div>
            <p className="text-lg font-black text-stone-900">{totalCO2.toFixed(2)} kg</p>
          </div>
        </div>

        {/* Cooked count */}
        <div className="bg-white rounded-xl border border-stone-200/70 p-3 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <GoogleIcon name="skillet" className="text-stone-700 text-lg" />
          </div>
          <div>
            <p className="text-base font-extrabold text-stone-900 leading-tight">{totalCooked}</p>
            <p className="text-[11px] text-stone-400 font-medium">
              {totalCooked === 1 ? 'receta cocinada' : 'recetas cocinadas'}
            </p>
          </div>
        </div>

        {/* Context equivalences con diseño sutil y neutral */}
        {totalCO2 > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200/70 p-3.5 shadow-2xs space-y-2">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1">
              <GoogleIcon name="public" className="text-stone-500 text-sm" />
              <span>Equivalencia ambiental</span>
            </p>
            <div className="space-y-1.5 text-xs text-stone-600">
              <p className="flex items-center gap-2">
                <GoogleIcon name="directions_car" className="text-stone-400 text-sm flex-shrink-0" />
                <span>Equivale a <strong>{(totalCO2 / 0.12).toFixed(1)} km</strong> menos en coche</span>
              </p>
              <p className="flex items-center gap-2">
                <GoogleIcon name="forest" className="text-emerald-700 text-sm flex-shrink-0" />
                <span>Equivale a <strong>{(totalCO2 / 21).toFixed(2)} árboles</strong> plantados por un año</span>
              </p>
              <p className="flex items-center gap-2">
                <GoogleIcon name="smartphone" className="text-stone-400 text-sm flex-shrink-0" />
                <span>Equivale a <strong>{Math.round(totalCO2 / 0.008)}</strong> horas de uso de móvil</span>
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8 text-stone-400 text-xs">Cargando historial...</div>
        )}

        {/* Empty history */}
        {!isLoading && history.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-stone-200/70 p-6">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-2">
              <GoogleIcon name="eco" className="text-emerald-700 text-2xl" />
            </div>
            <p className="font-bold text-stone-900 text-sm mb-1">Empieza hoy</p>
            <p className="text-stone-400 text-xs mb-4 max-w-xs mx-auto">
              Cada receta cocinada con ingredientes que iban a caducar cuenta para reducir desperdicio.
            </p>
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs tap-subtle cursor-pointer"
            >
              Ver recetas sugeridas
            </button>
          </div>
        )}

        {/* History entries */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
              Historial de preparaciones
            </p>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-xl border border-stone-200/70 p-3 hover-lift">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-stone-900 text-xs">{h.recipe_name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{formatDate(h.cooked_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-800">{h.money_saved_eur?.toFixed(2)}€ ahorrado</p>
                      <p className="text-[10px] text-stone-400">{(h.waste_avoided_kg! * 1000).toFixed(0)}g evitados</p>
                    </div>
                  </div>
                  {h.ingredients_used.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {h.ingredients_used.map(ing => (
                        <span key={ing} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
