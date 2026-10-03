import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import { estimateItemValueARS } from '../../lib/ingredientParser'
import type { RecipeWithScore } from '../../types/app.types'

type CategoryTab = 'ready' | 'one_missing' | 'special'

interface RecipeWithCost extends RecipeWithScore {
  additionalCostARS: number
}

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: scoredRecipes = [], isLoading: loadingScored } = useVaciarNevera(inventory)

  const isLoading = loadingInventory || loadingScored
  const [activeTab, setActiveTab] = useState<CategoryTab>('ready')
  const [expanded, setExpanded] = useState(false)

  // Calcular coste adicional en ARS y ordenar recetas
  const { readyRecipes, oneMissingRecipes, specialRecipes } = useMemo(() => {
    const withCost: RecipeWithCost[] = scoredRecipes.map(recipe => {
      const additionalCostARS = recipe.missingIngredients.reduce((sum, ing) => {
        return sum + estimateItemValueARS(ing, 1)
      }, 0)
      return {
        ...recipe,
        additionalCostARS,
      }
    })

    // Función de ordenación según los 4 criterios de prioridad:
    // 1. Mayor cantidad de ingredientes disponibles
    // 2. Mayor aprovechamiento de ingredientes próximos al vencimiento
    // 3. Menor coste adicional
    // 4. Menor tiempo de preparación
    const sortPriority = (a: RecipeWithCost, b: RecipeWithCost) => {
      if (b.totalIngredientsUsed !== a.totalIngredientsUsed) {
        return b.totalIngredientsUsed - a.totalIngredientsUsed
      }
      if (b.urgentIngredientsUsed !== a.urgentIngredientsUsed) {
        return b.urgentIngredientsUsed - a.urgentIngredientsUsed
      }
      if (a.additionalCostARS !== b.additionalCostARS) {
        return a.additionalCostARS - b.additionalCostARS
      }
      return (a.prep_time || 15) - (b.prep_time || 15)
    }

    const ready = withCost
      .filter(r => r.missingIngredients.length === 0 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    const oneMissing = withCost
      .filter(r => r.missingIngredients.length === 1 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    const special = withCost
      .filter(r => r.missingIngredients.length >= 2 && r.missingIngredients.length <= 3 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    return {
      readyRecipes: ready,
      oneMissingRecipes: oneMissing,
      specialRecipes: special,
    }
  }, [scoredRecipes])

  // Si no hay recetas con 0 faltantes, sugerir automáticamente la pestaña de 1 faltante
  useEffect(() => {
    if (readyRecipes.length === 0 && oneMissingRecipes.length > 0 && activeTab === 'ready') {
      setActiveTab('one_missing')
    }
  }, [readyRecipes.length, oneMissingRecipes.length, activeTab])

  // Obtener lista actual según categoría
  const currentCategoryRecipes = useMemo(() => {
    if (activeTab === 'ready') return readyRecipes
    if (activeTab === 'one_missing') return oneMissingRecipes
    return specialRecipes
  }, [activeTab, readyRecipes, oneMissingRecipes, specialRecipes])

  // Limitar inicialmente a máximo 4 recetas visibles para evitar fatiga de decisión
  const visibleRecipes = expanded
    ? currentCategoryRecipes
    : currentCategoryRecipes.slice(0, 4)

  const handleTabChange = (tab: CategoryTab) => {
    setActiveTab(tab)
    setExpanded(false)
  }

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in">
      {/* Encabezado editorial */}
      <div className="px-5 pt-safe pb-2.5 border-b border-stone-200/50 flex-shrink-0 bg-transparent">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          Recetas
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Opciones recomendadas para decidir en segundos
        </p>

        {/* 3 Botones / Pestañas horizontales */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
          <button
            type="button"
            onClick={() => handleTabChange('ready')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition tap-subtle whitespace-nowrap cursor-pointer ${
              activeTab === 'ready'
                ? 'bg-stone-900 text-white font-medium shadow-2xs'
                : 'bg-white/80 border border-stone-200/80 text-stone-600 hover:text-stone-900'
            }`}
          >
            Cocinar ahora {readyRecipes.length > 0 && `(${readyRecipes.length})`}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('one_missing')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition tap-subtle whitespace-nowrap cursor-pointer ${
              activeTab === 'one_missing'
                ? 'bg-stone-900 text-white font-medium shadow-2xs'
                : 'bg-white/80 border border-stone-200/80 text-stone-600 hover:text-stone-900'
            }`}
          >
            Me falta 1 ingrediente {oneMissingRecipes.length > 0 && `(${oneMissingRecipes.length})`}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('special')}
            className={`px-3.5 py-1.5 rounded-full text-xs transition tap-subtle whitespace-nowrap cursor-pointer ${
              activeTab === 'special'
                ? 'bg-stone-900 text-white font-medium shadow-2xs'
                : 'bg-white/80 border border-stone-200/80 text-stone-600 hover:text-stone-900'
            }`}
          >
            Algo especial {specialRecipes.length > 0 && `(${specialRecipes.length})`}
          </button>
        </div>
      </div>

      {/* Lista de resultados limitada y priorizada */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 divide-y divide-stone-200/60 pb-6">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-400 font-mono">
            Analizando despensa...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <p className="text-sm text-stone-600">
              Aún no tienes ingredientes registrados en tu despensa.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-black transition tap-subtle cursor-pointer"
            >
              Ir a Inicio
            </button>
          </div>
        ) : currentCategoryRecipes.length === 0 ? (
          <div className="py-16 text-center space-y-2.5 px-4">
            <p className="text-sm text-stone-700 font-medium">
              {activeTab === 'ready'
                ? 'No hay recetas con el 100% de ingredientes disponibles.'
                : activeTab === 'one_missing'
                ? 'No hay recetas donde falte un solo ingrediente.'
                : 'No hay recetas en esta categoría.'}
            </p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'ready' && oneMissingRecipes.length > 0
                ? 'Puedes revisar la pestaña "Me falta 1 ingrediente" para cocinar con una compra mínima.'
                : 'Prueba añadiendo otros alimentos desde Inicio para descubrir más platos.'}
            </p>
            {activeTab === 'ready' && oneMissingRecipes.length > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange('one_missing')}
                className="mt-2 text-xs text-stone-800 underline underline-offset-4 hover:text-black transition cursor-pointer"
              >
                Ver opciones con 1 ingrediente faltante ({oneMissingRecipes.length})
              </button>
            )}
          </div>
        ) : (
          <>
            {visibleRecipes.map((recipe) => (
              <article
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                className="py-4 hover:bg-white/40 transition cursor-pointer select-none group"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-semibold text-stone-900 leading-snug group-hover:text-black">
                    {recipe.name}
                  </h2>
                  <span className="text-xs text-stone-400 font-mono flex-shrink-0 ml-2">
                    {recipe.prep_time || 15} min
                  </span>
                </div>

                {/* Ingredientes disponibles que utiliza */}
                <div className="mt-2 text-xs leading-relaxed">
                  <p className="text-stone-400 font-medium mb-0.5">
                    Utiliza:
                  </p>
                  <div className="text-stone-700 space-y-0.5">
                    {recipe.matchedIngredients.map((ing, i) => (
                      <p key={i} className="capitalize text-stone-600">
                        {ing}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Ingredientes faltantes y coste adicional en ARS */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-2.5 text-xs text-stone-600">
                    <span className="text-stone-400 font-medium">
                      {recipe.missingIngredients.length === 1 ? 'Falta: ' : 'Faltan: '}
                    </span>
                    <span className="text-stone-800 font-medium capitalize">
                      {recipe.missingIngredients.join(', ')}
                    </span>
                    <span className="text-stone-400 font-mono ml-1.5">
                      · ARS {recipe.additionalCostARS.toLocaleString('es-AR')} est.
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-xs text-stone-500 group-hover:text-stone-900 transition inline-flex items-center gap-1 font-medium">
                    Ver receta →
                  </span>
                </div>
              </article>
            ))}

            {/* Si existen más de 4 resultados, botón para ver más */}
            {!expanded && currentCategoryRecipes.length > 4 && (
              <div className="py-4 text-center">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-4 transition tap-subtle cursor-pointer font-medium"
                >
                  Ver más recetas ({currentCategoryRecipes.length - 4} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
