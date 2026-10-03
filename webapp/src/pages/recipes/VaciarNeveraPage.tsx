import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { estimateItemValueARS, scoreRecipe } from '../../lib/ingredientParser'
import type { RecipeWithScore } from '../../types/app.types'

type CategoryChoice = 'ready' | 'one_missing' | 'special' | 'craving'

interface RecipeWithCost extends RecipeWithScore {
  additionalCostARS: number
}

const CRAVING_SUGGESTIONS = ['Pizza', 'Hamburguesa', 'Pasta', 'Empanadas', 'Sushi']

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: scoredRecipes = [], isLoading: loadingScored } = useVaciarNevera(inventory)
  const { data: allRawRecipes = [], isLoading: loadingRaw } = useRecipes()

  const isLoading = loadingInventory || loadingScored || loadingRaw
  const [activeChoice, setActiveChoice] = useState<CategoryChoice>('ready')
  const [cravingQuery, setCravingQuery] = useState('')

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

  // Categorías fijas basadas en el inventario actual
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

  // Categoría 4: Tengo un antojo
  const cravingRecipes = useMemo(() => {
    if (!cravingQuery.trim()) return []

    const query = cravingQuery.toLowerCase().trim()
    const matchedRaw = allRawRecipes.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(query)
      const descMatch = r.description ? r.description.toLowerCase().includes(query) : false
      const ingMatch = (r.recipe_ingredients || []).some(ri =>
        ri.ingredient_name.toLowerCase().includes(query)
      )
      return nameMatch || descMatch || ingMatch
    })

    const scoredCraving: RecipeWithCost[] = matchedRaw.map(recipe => {
      const recipeIngredientNames = (recipe.recipe_ingredients || []).map(ri => ri.ingredient_name)
      const { score, urgentUsed, totalUsed, priority, matched, missing } = scoreRecipe(
        recipeIngredientNames,
        inventory.map(i => ({ name: i.name, urgency: i.urgency }))
      )
      const additionalCostARS = missing.reduce((sum, ing) => sum + estimateItemValueARS(ing, 1), 0)

      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        difficulty: recipe.difficulty || 'Fácil',
        prep_time: recipe.prep_time || 15,
        instructions: recipe.instructions,
        servings: recipe.servings || 2,
        score,
        urgentIngredientsUsed: urgentUsed,
        totalIngredientsUsed: totalUsed,
        matchPercentage: recipeIngredientNames.length > 0 ? Math.round((matched.length / recipeIngredientNames.length) * 100) : 0,
        priority,
        matchedIngredients: matched,
        missingIngredients: missing,
        additionalCostARS,
      }
    })

    return scoredCraving.sort(sortPriority)
  }, [cravingQuery, allRawRecipes, inventory])

  // Si no hay recetas con 0 faltantes al inicio, sugerir suavemente "Con algo más"
  useEffect(() => {
    if (readyRecipes.length === 0 && oneMissingRecipes.length > 0 && activeChoice === 'ready') {
      setActiveChoice('one_missing')
    }
  }, [readyRecipes.length, oneMissingRecipes.length, activeChoice])

  // Lista actual según categoría seleccionada
  const currentCategoryRecipes = useMemo(() => {
    if (activeChoice === 'ready') return readyRecipes
    if (activeChoice === 'one_missing') return oneMissingRecipes
    if (activeChoice === 'special') return specialRecipes
    return cravingRecipes
  }, [activeChoice, readyRecipes, oneMissingRecipes, specialRecipes, cravingRecipes])

  // Máximo 4 mejores recetas visibles para evitar fatiga de decisión
  const visibleRecipes = currentCategoryRecipes.slice(0, 4)

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in text-[#2F2A26]">
      {/* Encabezado sereno tipo Cuaderno de Cocina */}
      <div className="px-5 pt-safe pb-2 flex-shrink-0 bg-transparent">
        <h1 className="text-xl font-semibold text-[#2F2A26] tracking-tight">
          ¿Qué te apetece preparar?
        </h1>
        <p className="text-xs text-[#766153] mt-0.5">
          Elige una opción para ver las 4 mejores alternativas
        </p>

        {/* Selector Orgánico de 4 Botones Flotantes (Apple Journal / Headspace / Calm) */}
        <div className="pt-3 pb-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {/* Botón 1: Cocinar ya */}
            <button
              type="button"
              onClick={() => setActiveChoice('ready')}
              className={`animate-float-btn-1 relative px-3.5 py-2.5 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'ready'
                  ? 'bg-[#EFF4EC] border-2 border-[#5D7A56] text-[#2F2A26] shadow-[0_4px_16px_rgba(93,122,86,0.18)] font-semibold scale-[1.02]'
                  : 'bg-[#FCFAF7] border border-[#766153]/20 text-[#2F2A26] hover:border-[#766153]/40 hover:bg-[#FAF7F2] shadow-[0_2px_10px_rgba(47,42,38,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Cocinar ya</span>
              {readyRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'ready'
                      ? 'bg-[#5D7A56]/15 text-[#3b4e37]'
                      : 'bg-[#F7F3EC] text-[#766153]'
                  }`}
                >
                  {readyRecipes.length}
                </span>
              )}
              {activeChoice === 'ready' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D7A56] animate-pulse" />
              )}
            </button>

            {/* Botón 2: Con algo más */}
            <button
              type="button"
              onClick={() => setActiveChoice('one_missing')}
              className={`animate-float-btn-2 relative px-3.5 py-2.5 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'one_missing'
                  ? 'bg-[#EFF4EC] border-2 border-[#5D7A56] text-[#2F2A26] shadow-[0_4px_16px_rgba(93,122,86,0.18)] font-semibold scale-[1.02]'
                  : 'bg-[#FCFAF7] border border-[#766153]/20 text-[#2F2A26] hover:border-[#766153]/40 hover:bg-[#FAF7F2] shadow-[0_2px_10px_rgba(47,42,38,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Con algo más</span>
              {oneMissingRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'one_missing'
                      ? 'bg-[#5D7A56]/15 text-[#3b4e37]'
                      : 'bg-[#F7F3EC] text-[#766153]'
                  }`}
                >
                  {oneMissingRecipes.length}
                </span>
              )}
              {activeChoice === 'one_missing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D7A56] animate-pulse" />
              )}
            </button>

            {/* Botón 3: Plato especial */}
            <button
              type="button"
              onClick={() => setActiveChoice('special')}
              className={`animate-float-btn-3 relative px-3.5 py-2.5 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'special'
                  ? 'bg-[#EFF4EC] border-2 border-[#5D7A56] text-[#2F2A26] shadow-[0_4px_16px_rgba(93,122,86,0.18)] font-semibold scale-[1.02]'
                  : 'bg-[#FCFAF7] border border-[#766153]/20 text-[#2F2A26] hover:border-[#766153]/40 hover:bg-[#FAF7F2] shadow-[0_2px_10px_rgba(47,42,38,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Plato especial</span>
              {specialRecipes.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeChoice === 'special'
                      ? 'bg-[#5D7A56]/15 text-[#3b4e37]'
                      : 'bg-[#F7F3EC] text-[#766153]'
                  }`}
                >
                  {specialRecipes.length}
                </span>
              )}
              {activeChoice === 'special' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D7A56] animate-pulse" />
              )}
            </button>

            {/* Botón 4: Tengo un antojo */}
            <button
              type="button"
              onClick={() => setActiveChoice('craving')}
              className={`animate-float-btn-4 relative px-3.5 py-2.5 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
                activeChoice === 'craving'
                  ? 'bg-[#EFF4EC] border-2 border-[#5D7A56] text-[#2F2A26] shadow-[0_4px_16px_rgba(93,122,86,0.18)] font-semibold scale-[1.02]'
                  : 'bg-[#FCFAF7] border border-[#766153]/20 text-[#2F2A26] hover:border-[#766153]/40 hover:bg-[#FAF7F2] shadow-[0_2px_10px_rgba(47,42,38,0.04)] font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Tengo un antojo</span>
              {activeChoice === 'craving' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D7A56] animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Sección interactiva de "Tengo un antojo" */}
        {activeChoice === 'craving' && (
          <div className="pt-2 pb-2 space-y-2.5 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                value={cravingQuery}
                onChange={e => setCravingQuery(e.target.value)}
                placeholder="¿Qué comida deseas? (ej. pasta, pizza, empanadas...)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFAF7] border border-[#766153]/25 focus:border-[#5D7A56] focus:outline-none text-xs text-[#2F2A26] placeholder:text-[#766153]/60 transition shadow-2xs"
              />
              {cravingQuery && (
                <button
                  type="button"
                  onClick={() => setCravingQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[#766153] hover:text-[#2F2A26]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de sugerencias rápidas */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#766153] mr-1">Sugerencias:</span>
              {CRAVING_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCravingQuery(item)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition tap-subtle cursor-pointer ${
                    cravingQuery.toLowerCase() === item.toLowerCase()
                      ? 'bg-[#5D7A56] text-white font-medium'
                      : 'bg-[#FCFAF7] border border-[#766153]/25 text-[#2F2A26] hover:border-[#5D7A56] hover:bg-[#EFF4EC]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista editorial limitada estrictamente a las 4 mejores recetas */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 divide-y divide-[#766153]/15 pb-8">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#766153] font-mono">
            Buscando combinaciones en tu cocina...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <p className="text-sm text-[#766153]">
              Aún no tienes ingredientes registrados en tu despensa.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-[#2F2A26] text-[#F7F3EC] rounded-xl text-xs font-medium hover:bg-black transition tap-subtle cursor-pointer"
            >
              Ir a Inicio
            </button>
          </div>
        ) : activeChoice === 'craving' && !cravingQuery.trim() ? (
          <div className="py-16 text-center space-y-2 px-4">
            <p className="text-sm text-[#2F2A26] font-medium">
              ¿Qué comida se te antoja hoy?
            </p>
            <p className="text-xs text-[#766153] max-w-xs mx-auto leading-relaxed">
              Escribe lo que quieres comer o toca una de las sugerencias arriba para compararla con lo que tienes en tu despensa.
            </p>
          </div>
        ) : currentCategoryRecipes.length === 0 ? (
          <div className="py-16 text-center space-y-2.5 px-4">
            <p className="text-sm text-[#2F2A26] font-medium">
              {activeChoice === 'craving'
                ? `No encontramos recetas para "${cravingQuery}".`
                : activeChoice === 'ready'
                ? 'No hay recetas con todos los ingredientes listos.'
                : activeChoice === 'one_missing'
                ? 'No hay recetas donde falte un solo ingrediente.'
                : 'No hay recetas en esta categoría.'}
            </p>
            <p className="text-xs text-[#766153] max-w-xs mx-auto leading-relaxed">
              {activeChoice === 'craving'
                ? 'Prueba buscando con otra palabra clave como pasta, pizza o pollo.'
                : activeChoice === 'ready' && oneMissingRecipes.length > 0
                ? 'Puedes tocar "Con algo más" para ver qué plato preparar con solo 1 compra rápida.'
                : 'Añade más ingredientes desde Inicio para descubrir nuevas recetas.'}
            </p>
            {activeChoice === 'ready' && oneMissingRecipes.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveChoice('one_missing')}
                className="mt-2 text-xs text-[#5D7A56] underline underline-offset-4 hover:text-[#2F2A26] transition cursor-pointer font-medium"
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
                className="py-4 hover:bg-[#FCFAF7]/60 transition cursor-pointer select-none group"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-semibold text-[#2F2A26] leading-snug group-hover:text-black">
                    {recipe.name}
                  </h2>
                  <span className="text-xs text-[#766153] font-mono flex-shrink-0 ml-2">
                    {recipe.prep_time || 15} min
                  </span>
                </div>

                {/* Ingredientes que utiliza */}
                <div className="mt-2 text-xs leading-relaxed">
                  <p className="text-[#766153] font-medium mb-0.5">
                    Utiliza de tu despensa:
                  </p>
                  <div className="space-y-0.5">
                    {recipe.matchedIngredients.length > 0 ? (
                      recipe.matchedIngredients.map((ing, i) => (
                        <p key={i} className="capitalize text-[#2F2A26]">
                          {ing}
                        </p>
                      ))
                    ) : (
                      <p className="text-[#766153] italic">Ninguno disponible actualmente</p>
                    )}
                  </div>
                </div>

                {/* Ingredientes faltantes y coste adicional en ARS */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-2.5 text-xs text-[#766153]">
                    <span className="font-medium text-[#766153]">
                      {recipe.missingIngredients.length === 1 ? 'Falta: ' : 'Faltan: '}
                    </span>
                    <span className="text-[#A68A64] font-medium capitalize">
                      {recipe.missingIngredients.join(', ')}
                    </span>
                    <span className="text-[#766153] font-mono ml-1.5">
                      · ARS {recipe.additionalCostARS.toLocaleString('es-AR')} est.
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-xs text-[#5D7A56] group-hover:text-[#2F2A26] transition inline-flex items-center gap-1 font-medium">
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
