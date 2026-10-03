import { useNavigate } from 'react-router-dom'
import { useCookedHistory } from '../../hooks/useRecipes'
import { ArrowLeft, TrendingDown, Euro, Wind } from 'lucide-react'

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
    <div className="h-full max-h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 mb-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Volver</span>
        </button>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4 text-green-500" />
          <h1 className="text-lg font-black text-gray-900 leading-tight">Mi Impacto</h1>
        </div>
        <p className="text-gray-400 text-xs">
          Lo que has evitado desperdiciar hasta ahora
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500 rounded-xl p-3 text-white col-span-2">
            <p className="text-green-100 text-[10px] font-bold uppercase tracking-wide mb-0.5">
              Comida salvada
            </p>
            <p className="text-2xl font-black">{(totalWaste * 1000).toFixed(0)}g</p>
            <p className="text-green-100 text-[10px] mt-0.5">≈ {totalWaste.toFixed(2)} kg de desperdicio evitado</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Euro className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Ahorrado</span>
            </div>
            <p className="text-lg font-black text-gray-900">{totalMoney.toFixed(2)}€</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wind className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">CO₂ Evitado</span>
            </div>
            <p className="text-lg font-black text-gray-900">{totalCO2.toFixed(2)} kg</p>
          </div>
        </div>

        {/* Cooked count */}
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
            🍳
          </div>
          <div>
            <p className="text-base font-black text-gray-900 leading-tight">{totalCooked}</p>
            <p className="text-[10px] text-gray-400">
              {totalCooked === 1 ? 'receta cocinada' : 'recetas cocinadas'}
            </p>
          </div>
        </div>

        {/* Context equivalences */}
        {totalCO2 > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
              🌍 ¿Sabes lo que significa?
            </p>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                🚗 Equivale a <strong>{(totalCO2 / 0.12).toFixed(1)} km</strong> menos en coche
              </p>
              <p className="text-sm text-blue-700">
                🌳 Equivale a <strong>{(totalCO2 / 21).toFixed(2)} árboles</strong> plantados por un año
              </p>
              <p className="text-sm text-blue-700">
                📱 Equivale a <strong>{Math.round(totalCO2 / 0.008)}</strong> horas menos de smartphone
              </p>
            </div>
          </div>
        )}

        {/* History */}
        {isLoading && (
          <div className="text-center py-8 text-gray-400 text-sm">Cargando historial...</div>
        )}

        {!isLoading && history.length === 0 && (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🌱</p>
            <p className="font-semibold text-gray-900 mb-1">Empieza hoy</p>
            <p className="text-gray-400 text-sm mb-5">
              Cada receta cocinada con ingredientes que iban a caducar cuenta
            </p>
            <button
              onClick={() => navigate('/vaciar-nevera')}
              className="px-6 py-3 bg-green-500 text-white rounded-2xl font-semibold text-sm"
            >
              Ver recetas sugeridas
            </button>
          </div>
        )}

        {!isLoading && history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Historial
            </p>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{h.recipe_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.cooked_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-green-600">{h.money_saved_eur?.toFixed(2)}€ ahorrado</p>
                      <p className="text-xs text-gray-400">{(h.waste_avoided_kg! * 1000).toFixed(0)}g evitados</p>
                    </div>
                  </div>
                  {h.ingredients_used.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {h.ingredients_used.map(ing => (
                        <span key={ing} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
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
