import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { estimateItemValueARS, isIngredientMatch, getIngredientImportance } from '../../lib/ingredientParser'
import { matchCravingRecipes, type RecipeWithCost } from '../../lib/cravingMatcher'

type CategoryChoice = 'ready' | 'one_missing' | 'special' | 'craving'

const CRAVING_SUGGESTIONS = ['Pizza', 'Hamburguesa', 'Pasta', 'Empanadas', 'Sushi']

export default function VaciarNeveraPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // 1. Obtener los ingredientes recientes cargados por el usuario
  const recentIngredients: string[] = useMemo(() => {
    const fromState = (location.state as any)?.recentIngredients
    if (Array.isArray(fromState) && fromState.length > 0) {
      return fromState
    }
    try {
      const stored = sessionStorage.getItem('que_cocino_recent_ingredients')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [location.state, location.key])

  // 2. Obtener IDs de recetas de la tanda anterior para no repetirlas
  const previousRecipeIds: string[] = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('que_cocino_previous_recipe_ids')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [location.key])

  const [activeChoice, setActiveChoice] = useState<CategoryChoice>('ready')
  const [cravingQuery, setCravingQuery] = useState('')

  // Si es una nueva carga desde el inicio, limpiar búsqueda previa de antojo y reajustar categoría
  useEffect(() => {
    if ((location.state as any)?.isNewBatch) {
      setCravingQuery('')
      setActiveChoice('ready')
    }
  }, [location.state])

  const { data: inventory = [], isLoading: loadingInventory } = useInventory()
  const { data: scoredRecipes = [], isLoading: loadingScored } = useVaciarNevera(inventory, recentIngredients)
  const { data: allRawRecipes = [], isLoading: loadingRaw } = useRecipes()

  const isLoading = loadingInventory || loadingScored || loadingRaw

  // Criterios de prioridad requeridos:
  // 1. Mayor cantidad de ingredientes RECIENTES utilizados (priorizar lo recién cargado)
  // 2. Jerarquía e importancia culinaria (no es igual cebolla que carne: la proteína/plato fuerte prima sobre aromáticos)
  // 3. Menor presencia en tandas anteriores (evitar recetas repetitivas)
  // 4. Score de afinidad ponderado
  // 5. Mayor cantidad de ingredientes disponibles en la despensa
  // 6. Mayor aprovechamiento de ingredientes próximos a vencer
  // 7. Menor coste adicional en ARS
  // 8. Menor tiempo de preparación
  const sortPriority = (a: RecipeWithCost, b: RecipeWithCost) => {
    // Evitar estrictamente conflictos de proteína (nunca proponer pollo si el usuario tiene chorizo/chinchulines)
    const confA = a.hasProteinConflict ? 1 : 0
    const confB = b.hasProteinConflict ? 1 : 0
    if (confA !== confB) {
      return confA - confB
    }

    const recentA = a.recentIngredientsUsed ?? 0
    const recentB = b.recentIngredientsUsed ?? 0
    if (recentB !== recentA) {
      return recentB - recentA
    }

    // Jerarquía culinaria de los ingredientes utilizados (carne nivel 4 > pasta nivel 3 > verdura nivel 2 > cebolla nivel 1)
    const domA = a.dominantImportance ?? 0
    const domB = b.dominantImportance ?? 0
    if (domB !== domA) {
      return domB - domA
    }

    const impScoreA = a.importanceScore ?? 0
    const impScoreB = b.importanceScore ?? 0
    if (impScoreB !== impScoreA) {
      return impScoreB - impScoreA
    }

    const aPrev = previousRecipeIds.includes(a.id) ? 1 : 0
    const bPrev = previousRecipeIds.includes(b.id) ? 1 : 0
    if (aPrev !== bPrev) {
      return aPrev - bPrev
    }

    if (b.score !== a.score) {
      return b.score - a.score
    }

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
  const { readyRecipes, oneMissingRecipes, specialRecipes, isReadyFallback } = useMemo(() => {
    const withCost: RecipeWithCost[] = scoredRecipes.map(recipe => {
      const additionalCostARS = recipe.missingIngredients.reduce((sum, ing) => {
        return sum + estimateItemValueARS(ing, 1)
      }, 0)
      return {
        ...recipe,
        additionalCostARS,
      }
    })

    // Filtrar recetas sin conflicto de proteínas y asegurar que usen ingredientes del inventario
    const eligibleWithCost = withCost.filter(r => !r.hasProteinConflict && (inventory.length === 0 || r.totalIngredientsUsed > 0))

    const exactReady = eligibleWithCost
      .filter(r => r.missingIngredients.length === 0 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    const exactOneMissing = eligibleWithCost
      .filter(r => r.missingIngredients.length === 1 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    const exactSpecial = eligibleWithCost
      .filter(r => r.missingIngredients.length >= 2 && r.missingIngredients.length <= 3 && r.totalIngredientsUsed > 0)
      .sort(sortPriority)

    // Si no hay recetas con 0 faltantes exactos, ofrecer las más cercanas con menor faltante siempre coherentes
    const isFallback = exactReady.length === 0
    const ready = exactReady.length > 0
      ? exactReady
      : (exactOneMissing.length > 0 ? exactOneMissing : (exactSpecial.length > 0 ? exactSpecial : eligibleWithCost.slice(0, 4)))

    const oneMissing = exactOneMissing.length > 0
      ? exactOneMissing
      : (exactSpecial.length > 0 ? exactSpecial : eligibleWithCost.slice(0, 4))

    const special = exactSpecial.length > 0
      ? exactSpecial
      : eligibleWithCost.slice(0, 4)

    return {
      readyRecipes: ready,
      oneMissingRecipes: oneMissing,
      specialRecipes: special,
      isReadyFallback: isFallback && exactReady.length === 0,
    }
  }, [scoredRecipes, previousRecipeIds, recentIngredients, inventory.length])

  // Categoría 4: Tengo un antojo con búsqueda multinivel y alternativas garantizadas
  const cravingResult = useMemo(() => {
    return matchCravingRecipes(cravingQuery, allRawRecipes, inventory, recentIngredients)
  }, [cravingQuery, allRawRecipes, inventory, recentIngredients])

  // Lista actual según categoría seleccionada (siempre garantiza resultados)
  const currentCategoryRecipes = useMemo(() => {
    if (activeChoice === 'ready') return readyRecipes
    if (activeChoice === 'one_missing') return oneMissingRecipes
    if (activeChoice === 'special') return specialRecipes
    return cravingResult.recipes
  }, [activeChoice, readyRecipes, oneMissingRecipes, specialRecipes, cravingResult.recipes])

  // Máximo 4 mejores recetas visibles para evitar fatiga de decisión
  const visibleRecipes = currentCategoryRecipes.slice(0, 4)

  // Guardar las recetas actualmente visibles para que una nueva carga en inicio las archive y no se repitan
  useEffect(() => {
    if (visibleRecipes.length > 0) {
      sessionStorage.setItem(
        'que_cocino_current_recipe_ids',
        JSON.stringify(visibleRecipes.map(r => r.id))
      )
    }
  }, [visibleRecipes])

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
              className={`animate-float-btn-1 relative px-3.5 py-2.5 rounded-2xl transition-all duration-300 tap-subtle hover-lift cursor-pointer select-none flex items-center gap-2 ${
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
        ) : (
          <div className="space-y-1">
            {/* Si no hay inventario registrado, avisar amigablemente pero mostrar recetas recomendadas */}
            {inventory.length === 0 && (
              <div className="pt-2 pb-2">
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#A68A64]/30 text-xs text-[#766153] text-left">
                  <p className="font-semibold text-[#2F2A26] mb-0.5">Recetas esenciales para inspirarte</p>
                  <p className="text-[11px] leading-relaxed">
                    Aún no registraste ingredientes en tu despensa. Puedes{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="text-[#5D7A56] underline font-medium hover:text-[#2F2A26] cursor-pointer"
                    >
                      añadirlos con voz o texto aquí
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* Si en "Cocinar ya" se ofrecen las alternativas más cercanas por faltar ingredientes */}
            {activeChoice === 'ready' && isReadyFallback && inventory.length > 0 && (
              <div className="pt-2 pb-1">
                <div className="p-3 rounded-2xl bg-[#FCFAF7] border border-[#A68A64]/30 text-xs text-[#766153] text-left">
                  <p className="font-semibold text-[#2F2A26] mb-0.5">Sugerencias más cercanas</p>
                  <p className="text-[11px] leading-relaxed">
                    Te falta algún ingrediente para completar la receta, pero estas son las opciones que más aprovechan lo que tienes:
                  </p>
                </div>
              </div>
            )}

            {/* Aviso sereno cuando se muestran alternativas inspiradas para un antojo */}
            {activeChoice === 'craving' && cravingResult.isAlternative && cravingResult.notice && (
              <div className="pt-2 pb-1">
                <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#A68A64]/30 shadow-[0_2px_8px_rgba(166,138,100,0.06)] text-left">
                  <p className="text-xs sm:text-sm font-semibold text-[#2F2A26] leading-snug">
                    {cravingResult.notice.title}
                  </p>
                  <p className="text-xs text-[#766153] mt-1 leading-relaxed">
                    {cravingResult.notice.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Encabezado suave para antojos cuando aún no se ha escrito nada */}
            {activeChoice === 'craving' && !cravingQuery.trim() && (
              <div className="pt-2 pb-1 text-left">
                <p className="text-xs text-[#766153]">
                  Ideas para inspirarte con lo que tienes en casa:
                </p>
              </div>
            )}

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

                {/* Si aprovecha ingredientes recién cargados por el usuario, indicarlo sutilmente */}
                {recipe.recentIngredientsUsed != null && recipe.recentIngredientsUsed > 0 && (
                  <div className="mt-1">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#5D7A56]/15 text-[#3b4e37] inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5D7A56]" />
                      Prioriza tus ingredientes recién cargados
                    </span>
                  </div>
                )}

                {/* Ingredientes que utiliza */}
                <div className="mt-2 text-xs leading-relaxed">
                  <p className="text-[#766153] font-medium mb-0.5">
                    Utiliza:
                  </p>
                  <div className="space-y-0.5">
                    {recipe.matchedIngredients.length > 0 ? (
                      [...recipe.matchedIngredients]
                        .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                        .map((ing, i) => {
                          const isRecent = recentIngredients.some(rec => isIngredientMatch(rec, ing) || isIngredientMatch(ing, rec))
                          return (
                            <p key={i} className="text-[#2F2A26] flex items-center gap-1.5">
                              <span className="capitalize font-medium">{ing}</span>
                              {isRecent && (
                                <span className="text-[10px] text-[#5D7A56] font-normal">
                                  · recién añadido
                                </span>
                              )}
                            </p>
                          )
                        })
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
                      {[...recipe.missingIngredients]
                        .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                        .join(', ')}
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

