import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import GoogleIcon from '../../components/GoogleIcon'
import { estimateItemValue, isIngredientMatch } from '../../lib/ingredientParser'
import type { RecipeWithScore } from '../../types/app.types'

function PriorityBadge({ priority }: { priority: 'Alta' | 'Media' | 'Baja' }) {
  if (priority === 'Alta') {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center gap-1">
        <GoogleIcon name="local_fire_department" className="text-xs text-rose-600" />
        Prioridad Alta
      </span>
    )
  }
  if (priority === 'Media') {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1">
        <GoogleIcon name="warning" className="text-xs text-amber-600" />
        Prioridad Media
      </span>
    )
  }
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
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

  const getRecipeSavings = (rec: RecipeWithScore) => {
    return rec.matchedIngredients.reduce((sum, ingName) => {
      const invItem = inventory.find(i => isIngredientMatch(i.name, ingName))
      return sum + estimateItemValue(ingName, invItem?.quantity ?? 1, invItem?.unit)
    }, 0)
  }

  return (
    <div className="h-full max-h-full bg-stone-50/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-stone-200/60 flex-shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-1 transition tap-subtle cursor-pointer"
        >
          <GoogleIcon name="arrow_back" className="text-xs" />
          <span className="text-xs font-medium">Dashboard</span>
        </button>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center">
            <GoogleIcon name="skillet" className="text-stone-700 text-sm" />
          </div>
          <h1 className="text-lg font-extrabold text-stone-900 leading-tight">Modo Vaciar Nevera</h1>
        </div>
        <p className="text-stone-400 text-xs">
          Cocina primero lo que vence antes para no tirar comida
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2.5">
        {/* Banner de alimentos en riesgo */}
        {urgentItems.length > 0 && (
          <div className="bg-stone-100/70 rounded-xl p-2.5 border border-stone-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1">
                <GoogleIcon name="warning" className="text-amber-600 text-xs" />
                Alimentos que vencen pronto ({urgentItems.length})
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">Priorizados</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {urgentItems.map(item => (
                <span
                  key={item.id}
                  className={`text-[11px] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 ${
                    item.urgency === 'critical'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.urgency === 'critical' ? 'bg-rose-600' : 'bg-amber-500'
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
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-stone-500 text-xs font-medium">Calculando puntuación de vaciado...</p>
          </div>
        )}

        {/* Empty inventory */}
        {!isLoading && inventory.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center border border-stone-200/70 shadow-2xs">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-stone-400">
              <GoogleIcon name="shopping_cart" className="text-2xl text-stone-500" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Tu inventario está vacío</h3>
            <p className="text-stone-500 text-xs mb-4 max-w-xs mx-auto">
              Añade los ingredientes que tienes en casa por voz para recomendarte qué cocinar primero.
            </p>
            <button
              onClick={() => navigate('/voice')}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition shadow-xs tap-subtle cursor-pointer"
            >
              Dictar ingredientes con el micrófono
            </button>
          </div>
        )}

        {/* No compatible recipes */}
        {!isLoading && inventory.length > 0 && recipes.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center border border-stone-200/70 shadow-2xs">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-stone-400">
              <GoogleIcon name="skillet" className="text-2xl text-stone-500" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">Sin recetas compatibles</h3>
            <p className="text-stone-500 text-xs mb-4 max-w-xs mx-auto">
              Ninguna receta coincide con tus ingredientes. Añade más alimentos para descubrir recetas.
            </p>
            <button
              onClick={() => navigate('/voice')}
              className="px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs tap-subtle cursor-pointer"
            >
              + Añadir más ingredientes
            </button>
          </div>
        )}

        {/* HERO CARD: "Te recomendamos cocinar esto primero" */}
        {!isLoading && topRecipe && (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs space-y-2.5 hover-lift">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                <GoogleIcon name="auto_awesome" className="text-xs text-emerald-700" />
                Cocinar primero
              </span>
              <div className="flex items-center gap-1.5">
                {topRecipe.matchPercentage !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    {topRecipe.matchPercentage}% coincidencia
                  </span>
                )}
                <PriorityBadge priority={topRecipe.priority} />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-stone-900 leading-snug">
                {topRecipe.name}
              </h2>
              {topRecipe.description && (
                <p className="text-stone-500 text-xs mt-0.5 leading-snug line-clamp-2">
                  {topRecipe.description}
                </p>
              )}
            </div>

            {/* Métricas destacadas de la recomendación */}
            <div className="grid grid-cols-4 gap-1.5 bg-stone-50 rounded-xl p-2 text-center border border-stone-200/50">
              <div>
                <p className="text-sm font-extrabold text-stone-900">
                  {topRecipe.totalIngredientsUsed}
                </p>
                <p className="text-[9px] text-stone-400 uppercase tracking-tight">Consumidos</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-rose-700">
                  {topRecipe.urgentIngredientsUsed}
                </p>
                <p className="text-[9px] text-stone-400 uppercase tracking-tight">Urgentes</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-800">
                  {topRecipe.matchPercentage}%
                </p>
                <p className="text-[9px] text-stone-400 uppercase tracking-tight">Match</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-stone-800">
                  {topRecipe.prep_time}m
                </p>
                <p className="text-[9px] text-stone-400 uppercase tracking-tight">Tiempo</p>
              </div>
            </div>

            {/* Ahorro económico estimado */}
            {getRecipeSavings(topRecipe) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold">
                <GoogleIcon name="payments" className="text-sm text-emerald-700 flex-shrink-0" />
                <span>Salvas ≈ {getRecipeSavings(topRecipe).toFixed(2)}€ aprovechando estos alimentos</span>
              </div>
            )}

            {/* Ingredientes aprovechados */}
            <div>
              <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <GoogleIcon name="check_circle" className="text-xs text-emerald-700" />
                Aprovecha de tu nevera:
              </p>
              <div className="flex flex-wrap gap-1">
                {topRecipe.matchedIngredients.map(ing => (
                  <span
                    key={ing}
                    className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-lg capitalize"
                  >
                    ✓ {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Si faltan ingredientes secundarios */}
            {topRecipe.missingIngredients.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-1">
                  {topRecipe.missingIngredients.map(ing => (
                    <span
                      key={ing}
                      className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md capitalize"
                    >
                      + {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(`/recipe/${topRecipe.id}`, { state: { recipe: topRecipe } })}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 text-xs tap-subtle cursor-pointer"
            >
              <span>Cocinar {topRecipe.name} ahora</span>
              <GoogleIcon name="arrow_forward" className="text-xs" />
            </button>
          </div>
        )}

        {/* Otras recetas compatibles ordenadas por score */}
        {!isLoading && otherRecipes.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Otras opciones para no tirar comida ({otherRecipes.length})
              </h3>
            </div>

            <div className="space-y-2">
              {otherRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                  className="bg-white rounded-2xl p-3.5 border border-stone-200/70 hover:border-stone-300 shadow-2xs cursor-pointer transition hover-lift"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{recipe.name}</h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {recipe.prep_time} min · {recipe.difficulty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {recipe.matchPercentage !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {recipe.matchPercentage}%
                        </span>
                      )}
                      <PriorityBadge priority={recipe.priority} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {recipe.matchedIngredients.map(ing => (
                      <span
                        key={ing}
                        className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-medium capitalize border border-emerald-100"
                      >
                        ✓ {ing}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center gap-1 flex-wrap">
                      <span>
                        Aprovecha <strong>{recipe.totalIngredientsUsed}</strong> alimento{recipe.totalIngredientsUsed > 1 ? 's' : ''}
                        {recipe.urgentIngredientsUsed > 0 ? ` (${recipe.urgentIngredientsUsed} urgente${recipe.urgentIngredientsUsed > 1 ? 's' : ''})` : ''}
                      </span>
                      {getRecipeSavings(recipe) > 0 && (
                        <span className="text-emerald-800 font-bold ml-1">· Salvas ≈ {getRecipeSavings(recipe).toFixed(2)}€</span>
                      )}
                    </span>
                    <span className="text-stone-800 font-semibold flex items-center gap-0.5 flex-shrink-0">
                      <span>Ver receta</span>
                      <GoogleIcon name="arrow_forward" className="text-xs" />
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
