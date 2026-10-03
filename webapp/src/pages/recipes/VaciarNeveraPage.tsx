import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera } from '../../hooks/useRecipes'
import { estimateItemValueARS } from '../../lib/ingredientParser'
import type { RecipeWithScore } from '../../types/app.types'

type CategoryChoice = 'ready' | 'one_missing' | 'special'

interface RecipeWithCost extends RecipeWithScore {
  additionalCostARS: number
}

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: scoredRecipes = [], isLoading: loadingScored } = useVaciarNevera(inventory)

  const isLoading = loadingInventory || loadingScored
  const [activeChoice, setActiveChoice] = useState<CategoryChoice>('ready')

  // Calcular coste adicional en ARS y ordenar recetas por prioridad
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

    // Criterios de prioridad requeridos:
    // 1. Mayor cantidad de ingredientes disponibles
    // 2. Mayor aprovechamiento de ingredientes próximos a vencer
    // 3. Menor coste adicional en ARS
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

  // Si no hay recetas con 0 faltantes, sugerir automáticamente "Con algo más"
  useEffect(() => {
    if (readyRecipes.length === 0 && oneMissingRecipes.length > 0 && activeChoice === 'ready') {
      setActiveChoice('one_missing')
    }
  }, [readyRecipes.length, oneMissingRecipes.length, activeChoice])

  // Obtener lista actual según la categoría elegida
  const currentCategoryRecipes = useMemo(() => {
    if (activeChoice === 'ready') return readyRecipes
    if (activeChoice === 'one_missing') return oneMissingRecipes
    return specialRecipes
  }, [activeChoice, readyRecipes, oneMissingRecipes, specialRecipes])

  // Mostrar ÚNICAMENTE las 4 mejores recetas de esa categoría para evitar listas largas y fatiga de decisión
  const visibleRecipes = currentCategoryRecipes.slice(0, 4)

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in">
      {/* Encabezado sereno tipo Journal */}
      <div className="px-5 pt-safe pb-2 flex-shrink-0 bg-transparent">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          ¿Qué te apetece preparar?
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Elige una opción para ver las 4 mejores alternativas
        </p>

        {/* Selector Orgánico de Tres Botones Flotantes (Apple Journal / Headspace / Calm) */}
        <div className="pt-3 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {/* Botón 1: Cocinar ya */}
            <button
              type="button"
              onClick={() => setActiveChoice('ready')}
              className={`animate-float-btn-1 relative px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'ready'
                  ? 'bg-[#f4f6f0] border-2 border-[#526639] text-[#2c381d] shadow-[0_4px_16px_rgba(82,102,57,0.15)] font-semibold scale-[1.02]'
                  : 'bg-[#fdfcf9] border border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-white shadow-[0_2px_10px_rgba(40,30,20,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Cocinar ya</span>
              {readyRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'ready'
                      ? 'bg-[#526639]/15 text-[#3b4b27]'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {readyRecipes.length}
                </span>
              )}
              {activeChoice === 'ready' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#526639] animate-pulse" />
              )}
            </button>

            {/* Botón 2: Con algo más */}
            <button
              type="button"
              onClick={() => setActiveChoice('one_missing')}
              className={`animate-float-btn-2 relative px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'one_missing'
                  ? 'bg-[#f4f6f0] border-2 border-[#526639] text-[#2c381d] shadow-[0_4px_16px_rgba(82,102,57,0.15)] font-semibold scale-[1.02]'
                  : 'bg-[#fdfcf9] border border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-white shadow-[0_2px_10px_rgba(40,30,20,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Con algo más</span>
              {oneMissingRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'one_missing'
                      ? 'bg-[#526639]/15 text-[#3b4b27]'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {oneMissingRecipes.length}
                </span>
              )}
              {activeChoice === 'one_missing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#526639] animate-pulse" />
              )}
            </button>

            {/* Botón 3: Plato especial */}
            <button
              type="button"
              onClick={() => setActiveChoice('special')}
              className={`animate-float-btn-3 relative px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'special'
                  ? 'bg-[#f4f6f0] border-2 border-[#526639] text-[#2c381d] shadow-[0_4px_16px_rgba(82,102,57,0.15)] font-semibold scale-[1.02]'
                  : 'bg-[#fdfcf9] border border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-white shadow-[0_2px_10px_rgba(40,30,20,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Plato especial</span>
              {specialRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'special'
                      ? 'bg-[#526639]/15 text-[#3b4b27]'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {specialRecipes.length}
                </span>
              )}
              {activeChoice === 'special' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#526639] animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista editorial limitada estrictamente a las 4 mejores recetas */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 divide-y divide-stone-200/60 pb-8">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-stone-400 font-mono">
            Buscando combinaciones en tu cocina...
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
              {activeChoice === 'ready'
                ? 'No hay recetas con todos los ingredientes listos.'
                : activeChoice === 'one_missing'
                ? 'No hay recetas donde falte un solo ingrediente.'
                : 'No hay recetas en esta categoría.'}
            </p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
              {activeChoice === 'ready' && oneMissingRecipes.length > 0
                ? 'Puedes tocar "Con algo más" para ver qué plato preparar con solo 1 compra rápida.'
                : 'Añade más ingredientes desde Inicio para descubrir nuevas recetas.'}
            </p>
            {activeChoice === 'ready' && oneMissingRecipes.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveChoice('one_missing')}
                className="mt-2 text-xs text-[#526639] underline underline-offset-4 hover:text-[#334221] transition cursor-pointer font-medium"
              >
                Ver recetas "Con algo más" ({oneMissingRecipes.length})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
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

                {/* Ingredientes que utiliza */}
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
                    <span className="text-[#3b4b27] font-medium capitalize">
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
          </div>
        )}
      </div>
    </div>
  )
}
