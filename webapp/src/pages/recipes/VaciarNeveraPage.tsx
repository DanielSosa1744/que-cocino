import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import {
  ArrowLeft,
  ChefHat,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react'

function PriorityBadge({ priority }: { priority: 'Alta' | 'Media' | 'Baja' }) {
  if (priority === 'Alta') {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-[#F44336] flex items-center gap-1">
        <Flame className="w-3 h-3" />
        Prioridad Alta
      </span>
    )
  }
  if (priority === 'Media') {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-[#FF9800] flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Prioridad Media
      </span>
    )
  }
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-[#4CAF50]">
      Prioridad Normal
    </span>
  )
}

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: recipes = [], isLoading: loadingRecipes } = useVaciarNevera(inventory)

  const isLoading = loadingInventory || loadingRecipes
  const urgentItems = inventory.filter(i => i.urgency === 'critical' || i.urgency === 'warning')

  const topRecipe = recipes.length > 0 ? recipes[0] : null
  const otherRecipes = recipes.length > 1 ? recipes.slice(1) : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-10">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Volver al Dashboard</span>
        </button>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Modo Vaciar Nevera</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">
          ¿Qué debería cocinar hoy para no tirar comida?
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Banner de alimentos en riesgo */}
        {urgentItems.length > 0 && (
          <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Alimentos que vencen pronto ({urgentItems.length})
              </span>
              <span className="text-[11px] text-orange-600 font-semibold">Priorizados por el motor</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {urgentItems.map(item => (
                <span
                  key={item.id}
                  className={`text-xs px-2.5 py-1 rounded-xl font-medium flex items-center gap-1 ${
                    item.urgency === 'critical'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.urgency === 'critical' ? 'bg-[#F44336]' : 'bg-[#FF9800]'
                    }`}
                  />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Calculando puntuación de vaciado...</p>
          </div>
        )}

        {/* Empty inventory */}
        {!isLoading && inventory.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              🛒
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Tu inventario está vacío</h3>
            <p className="text-gray-500 text-xs mb-6 max-w-xs mx-auto">
              Añade los ingredientes que tienes en casa por voz para que el motor te recomiende qué cocinar primero.
            </p>
            <button
              onClick={() => navigate('/voice')}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-sm transition"
            >
              Dictar ingredientes con el micrófono
            </button>
          </div>
        )}

        {/* No compatible recipes */}
        {!isLoading && inventory.length > 0 && recipes.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              🍳
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Sin recetas compatibles</h3>
            <p className="text-gray-500 text-xs mb-5 max-w-xs mx-auto">
              Ninguna receta de la base de datos coincide actualmente con tus ingredientes. Añade más alimentos para descubrir recetas.
            </p>
            <button
              onClick={() => navigate('/voice')}
              className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl text-sm"
            >
              + Añadir más ingredientes
            </button>
          </div>
        )}

        {/* HERO CARD: "Te recomendamos cocinar esto primero" */}
        {!isLoading && topRecipe && (
          <div className="bg-white rounded-3xl border-2 border-orange-400 p-5 shadow-md shadow-orange-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Te recomendamos cocinar esto primero
              </span>
              <PriorityBadge priority={topRecipe.priority} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {topRecipe.name}
              </h2>
              {topRecipe.description && (
                <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                  {topRecipe.description}
                </p>
              )}
            </div>

            {/* Métricas destacadas de la recomendación */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-3 text-center">
              <div>
                <p className="text-base font-extrabold text-orange-600">
                  {topRecipe.totalIngredientsUsed}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tight">Consumidos</p>
              </div>
              <div>
                <p className="text-base font-extrabold text-red-500">
                  {topRecipe.urgentIngredientsUsed}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tight">Urgentes</p>
              </div>
              <div>
                <p className="text-base font-extrabold text-gray-800">
                  {topRecipe.prep_time} min
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tight">Tiempo</p>
              </div>
            </div>

            {/* Ingredientes aprovechados */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Ingredientes aprovechados de tu nevera:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topRecipe.matchedIngredients.map(ing => (
                  <span
                    key={ing}
                    className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-xl capitalize"
                  >
                    ✓ {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Si faltan ingredientes secundarios */}
            {topRecipe.missingIngredients.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Ingredientes adicionales opcionales o faltantes:
                </p>
                <div className="flex flex-wrap gap-1">
                  {topRecipe.missingIngredients.map(ing => (
                    <span
                      key={ing}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg capitalize"
                    >
                      + {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(`/recipe/${topRecipe.id}`, { state: { recipe: topRecipe } })}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition active:scale-98"
            >
              Cocinar {topRecipe.name} ahora
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Otras recetas compatibles ordenadas por score */}
        {!isLoading && otherRecipes.length > 0 && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Otras opciones para no tirar comida ({otherRecipes.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {otherRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 shadow-sm cursor-pointer transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{recipe.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {recipe.prep_time} min · {recipe.difficulty}
                      </p>
                    </div>
                    <PriorityBadge priority={recipe.priority} />
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {recipe.matchedIngredients.map(ing => (
                      <span
                        key={ing}
                        className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium capitalize"
                      >
                        ✓ {ing}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Aprovecha <strong>{recipe.totalIngredientsUsed}</strong> alimento{recipe.totalIngredientsUsed > 1 ? 's' : ''}
                      {recipe.urgentIngredientsUsed > 0 ? ` (${recipe.urgentIngredientsUsed} urgente${recipe.urgentIngredientsUsed > 1 ? 's' : ''})` : ''}
                    </span>
                    <span className="text-orange-500 font-semibold flex items-center gap-0.5">
                      Ver receta <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
