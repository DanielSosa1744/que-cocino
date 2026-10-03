import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: scoredRecipes = [], isLoading: loadingScored } = useVaciarNevera(inventory)
  const { data: allRawRecipes = [], isLoading: loadingAll } = useRecipes()

  const isLoading = loadingInventory || loadingScored || loadingAll

  // Si hay recetas compatibles en base al inventario, usarlas; de lo contrario mostrar catálogo general
  const displayRecipes = scoredRecipes.length > 0
    ? scoredRecipes
    : allRawRecipes.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        difficulty: r.difficulty || 'Fácil',
        prep_time: r.prep_time || 15,
        instructions: r.instructions,
        servings: r.servings || 2,
        score: 0,
        urgentIngredientsUsed: 0,
        totalIngredientsUsed: 0,
        matchedIngredients: (r.recipe_ingredients || []).map(ri => ri.ingredient_name),
        missingIngredients: [],
      }))

  return (
    <div className="h-full max-h-full bg-white flex flex-col overflow-hidden">
      {/* Encabezado editorial limpio */}
      <div className="px-5 pt-safe pb-3 border-b border-stone-100 flex-shrink-0 bg-white">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          Recetas
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {scoredRecipes.length > 0
            ? 'Ordenadas por los ingredientes que tienes disponibles'
            : 'Todas las recetas disponibles'}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 divide-y divide-stone-100">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400 font-mono">
            Cargando recetas...
          </div>
        ) : displayRecipes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-stone-500">
              No hay recetas disponibles en este momento.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="text-xs text-stone-800 underline underline-offset-2 hover:text-black transition"
            >
              Ir a Inicio para añadir ingredientes
            </button>
          </div>
        ) : (
          displayRecipes.map((recipe) => (
            <article
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
              className="py-4 hover:bg-stone-50/50 transition cursor-pointer select-none"
            >
              <h2 className="text-base font-semibold text-stone-900 leading-snug">
                {recipe.name}
              </h2>

              <div className="mt-2 text-xs leading-relaxed">
                <p className="text-stone-400 font-medium mb-0.5">
                  Ingredientes disponibles:
                </p>
                <div className="text-stone-700 space-y-0.5">
                  {recipe.matchedIngredients && recipe.matchedIngredients.length > 0 ? (
                    recipe.matchedIngredients.slice(0, 4).map((ing, i) => (
                      <p key={i} className="capitalize text-stone-600">
                        {ing}
                      </p>
                    ))
                  ) : (
                    <p className="text-stone-400 italic">Ver en detalle</p>
                  )}
                </div>
              </div>

              <div className="mt-2.5 text-xs text-stone-500">
                <span className="text-stone-400 font-medium">Tiempo: </span>
                <span>{recipe.prep_time || 15} min</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
