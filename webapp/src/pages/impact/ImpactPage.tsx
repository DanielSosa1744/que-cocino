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
    <div className="min-h-app bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-safe pb-5 border-b border-gray-100">
        <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-gray-400 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-green-500" />
          <h1 className="text-xl font-bold text-gray-900">Mi Impacto</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Lo que has evitado desperdiciar hasta ahora
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500 rounded-2xl p-4 text-white col-span-2">
            <p className="text-green-100 text-xs font-semibold uppercase tracking-wide mb-1">
              Comida salvada
            </p>
            <p className="text-4xl font-black">{(totalWaste * 1000).toFixed(0)}g</p>
            <p className="text-green-100 text-xs mt-1">≈ {totalWaste.toFixed(2)} kg de desperdicio evitado</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Euro className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalMoney.toFixed(2)}€</p>
            <p className="text-xs text-gray-500 mt-0.5">ahorrados</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wind className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCO2.toFixed(2)} kg</p>
            <p className="text-xs text-gray-500 mt-0.5">CO₂ evitado</p>
          </div>
        </div>

        {/* Cooked count */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">
            🍳
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCooked}</p>
            <p className="text-xs text-gray-500">
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
