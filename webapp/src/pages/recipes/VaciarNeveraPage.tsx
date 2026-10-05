import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { estimateItemValueARS, isIngredientMatch, getIngredientImportance } from '../../lib/ingredientParser'
import { matchCravingRecipes, type RecipeWithCost } from '../../lib/cravingMatcher'
import CookingPotAnimation from '../../components/CookingPotAnimation'

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
      {/* Encabezado refinado: Carta de Restaurante Gourmet */}
      <div className="px-5 pt-safe pb-2.5 flex-shrink-0 bg-transparent text-center">
        {/* Filigrana superior con rombos y filetes */}
        <div className="flex items-center justify-center gap-2.5 mb-1.5 opacity-90">
          <span className="h-[1.5px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#A88B57]" />
          <span className="text-[#A88B57] text-sm">✦</span>
          <span className="text-sm sm:text-base tracking-[0.25em] uppercase font-bold text-[#8F7347]">
            Menu du Jour · Selección del Chef
          </span>
          <span className="text-[#A88B57] text-sm">✦</span>
          <span className="h-[1.5px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#A88B57]" />
        </div>

        <h1 className="font-menu-title text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
          Carta de Temporada
        </h1>
        <p className="font-menu-serif text-base sm:text-lg text-[#44382F] mt-1 font-medium">
          Propuestas de alta cocina elaboradas con los ingredientes de tu despensa
        </p>

        {/* Selector de Pliegos / Categorías de la Carta */}
        <div className="pt-3.5 pb-1.5">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2.5">
            {/* Botón 1: Servicio Directo (Cocinar ya) */}
            <button
              type="button"
              onClick={() => setActiveChoice('ready')}
              className={`relative px-4 py-3 rounded-xl transition-all duration-300 tap-subtle cursor-pointer select-none flex items-center justify-between sm:justify-start gap-2 text-left border ${
                activeChoice === 'ready'
                  ? 'bg-[#FAF7F2] border-[#A88B57] text-[#1C1917] shadow-[0_2px_12px_rgba(168,139,87,0.18)] font-bold ring-1 ring-[#A88B57]/40'
                  : 'bg-[#FCFAF7]/90 border-[#A88B57]/20 text-[#5A483D] hover:border-[#A88B57]/50 hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#A88B57] font-serif font-bold">I.</span>
                <span className="font-menu-serif text-base sm:text-lg tracking-wide">Servicio Directo</span>
              </div>
              {readyRecipes.length > 0 && (
                <span
                  className={`text-xs sm:text-sm font-mono px-2.5 py-0.5 rounded-full ${
                    activeChoice === 'ready'
                      ? 'bg-[#A88B57]/20 text-[#8F7347] font-bold'
                      : 'bg-[#766153]/15 text-[#5A483D] font-bold'
                  }`}
                >
                  {readyRecipes.length}
                </span>
              )}
            </button>

            {/* Botón 2: Toque del Chef (Con algo más) */}
            <button
              type="button"
              onClick={() => setActiveChoice('one_missing')}
              className={`relative px-4 py-3 rounded-xl transition-all duration-300 tap-subtle cursor-pointer select-none flex items-center justify-between sm:justify-start gap-2 text-left border ${
                activeChoice === 'one_missing'
                  ? 'bg-[#FAF7F2] border-[#A88B57] text-[#1C1917] shadow-[0_2px_12px_rgba(168,139,87,0.18)] font-bold ring-1 ring-[#A88B57]/40'
                  : 'bg-[#FCFAF7]/90 border-[#A88B57]/20 text-[#5A483D] hover:border-[#A88B57]/50 hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#A88B57] font-serif font-bold">II.</span>
                <span className="font-menu-serif text-base sm:text-lg tracking-wide">Toque del Chef</span>
              </div>
              {oneMissingRecipes.length > 0 && (
                <span
                  className={`text-xs sm:text-sm font-mono px-2.5 py-0.5 rounded-full ${
                    activeChoice === 'one_missing'
                      ? 'bg-[#A88B57]/20 text-[#8F7347] font-bold'
                      : 'bg-[#766153]/15 text-[#5A483D] font-bold'
                  }`}
                >
                  {oneMissingRecipes.length}
                </span>
              )}
            </button>

            {/* Botón 3: Platos de Autor (Plato especial) */}
            <button
              type="button"
              onClick={() => setActiveChoice('special')}
              className={`relative px-4 py-3 rounded-xl transition-all duration-300 tap-subtle cursor-pointer select-none flex items-center justify-between sm:justify-start gap-2 text-left border ${
                activeChoice === 'special'
                  ? 'bg-[#FAF7F2] border-[#A88B57] text-[#1C1917] shadow-[0_2px_12px_rgba(168,139,87,0.18)] font-bold ring-1 ring-[#A88B57]/40'
                  : 'bg-[#FCFAF7]/90 border-[#A88B57]/20 text-[#5A483D] hover:border-[#A88B57]/50 hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#A88B57] font-serif font-bold">III.</span>
                <span className="font-menu-serif text-base sm:text-lg tracking-wide">Platos de Autor</span>
              </div>
              {specialRecipes.length > 0 && (
                <span
                  className={`text-xs sm:text-sm font-mono px-2.5 py-0.5 rounded-full ${
                    activeChoice === 'special'
                      ? 'bg-[#A88B57]/20 text-[#8F7347] font-bold'
                      : 'bg-[#766153]/15 text-[#5A483D] font-bold'
                  }`}
                >
                  {specialRecipes.length}
                </span>
              )}
            </button>

            {/* Botón 4: A la Carta / Caprichos */}
            <button
              type="button"
              onClick={() => setActiveChoice('craving')}
              className={`relative px-4 py-3 rounded-xl transition-all duration-300 tap-subtle cursor-pointer select-none flex items-center justify-between sm:justify-start gap-2 text-left border ${
                activeChoice === 'craving'
                  ? 'bg-[#FAF7F2] border-[#A88B57] text-[#1C1917] shadow-[0_2px_12px_rgba(168,139,87,0.18)] font-bold ring-1 ring-[#A88B57]/40'
                  : 'bg-[#FCFAF7]/90 border-[#A88B57]/20 text-[#5A483D] hover:border-[#A88B57]/50 hover:bg-[#FAF7F2] font-semibold'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#A88B57] font-serif font-bold">IV.</span>
                <span className="font-menu-serif text-base sm:text-lg tracking-wide">A la Carta</span>
              </div>
            </button>
          </div>
        </div>

        {/* Sección interactiva de "A la Carta" */}
        {activeChoice === 'craving' && (
          <div className="pt-2.5 pb-2 space-y-2.5 max-w-md mx-auto animate-fade-in text-left">
            <div className="relative">
              <input
                type="text"
                value={cravingQuery}
                onChange={e => setCravingQuery(e.target.value)}
                placeholder="¿Qué plato o antojo desea degustar hoy? (ej. pasta, lomo, pizza...)"
                className="w-full px-4 py-3.5 rounded-xl bg-[#FAF7F2] border-2 border-[#A88B57]/40 focus:border-[#8F7347] focus:outline-none text-base text-[#1C1917] placeholder:text-[#766153]/70 transition shadow-inner font-menu-serif font-medium"
              />
              {cravingQuery && (
                <button
                  type="button"
                  onClick={() => setCravingQuery('')}
                  className="absolute right-3.5 top-3.5 text-base text-[#766153] hover:text-[#1C1917]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de sugerencias gastronómicas */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-menu-serif text-[#8F7347] font-semibold mr-1">Inspiración:</span>
              {CRAVING_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCravingQuery(item)}
                  className={`px-3.5 py-1.5 rounded-full text-sm sm:text-base transition tap-subtle cursor-pointer font-menu-serif font-semibold ${
                    cravingQuery.toLowerCase() === item.toLowerCase()
                      ? 'bg-[#8F7347] text-[#FAF7F2] shadow-xs'
                      : 'bg-[#FCFAF7] border border-[#A88B57]/30 text-[#1C1917] hover:border-[#8F7347] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Catálogo de la Carta: Pliegos editoriales de alta cocina */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-8 space-y-3.5">
        {isLoading ? (
          <CookingPotAnimation
            inline
            message="Elaborando propuestas de la Carta..."
            subMessage="Combinando sabores y armonizando ingredientes..."
          />
        ) : (
          <div className="space-y-3.5">
            {/* Si no hay inventario registrado */}
            {inventory.length === 0 && (
              <div className="pt-2 pb-1">
                <div className="p-4 rounded-2xl menu-card-frame text-sm text-[#766153] text-left">
                  <p className="font-menu-title font-semibold text-[#1C1917] mb-1 text-base">
                    ✦ Selección del Chef para su inspiración
                  </p>
                  <p className="font-menu-serif leading-relaxed text-sm">
                    Su despensa está libre de ingredientes en este momento. Puede{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="text-[#8F7347] underline font-medium hover:text-[#1C1917] cursor-pointer"
                    >
                      ingresar los ingredientes que tiene a mano
                    </button>{' '}
                    para confeccionar una carta personalizada.
                  </p>
                </div>
              </div>
            )}

            {/* Si en "Servicio Directo" se ofrecen las alternativas más cercanas */}
            {activeChoice === 'ready' && isReadyFallback && inventory.length > 0 && (
              <div className="pt-1 pb-1">
                <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#A88B57]/30 text-sm text-[#766153] text-left">
                  <p className="font-menu-title font-semibold text-[#1C1917] mb-1 text-sm">
                    ✦ Propuestas más afines a su selección
                  </p>
                  <p className="font-menu-serif text-sm leading-relaxed">
                    Estas alternativas maximizan el uso de los ingredientes presentes en su mesa:
                  </p>
                </div>
              </div>
            )}

            {/* Aviso para antojos */}
            {activeChoice === 'craving' && cravingResult.isAlternative && cravingResult.notice && (
              <div className="pt-1 pb-1">
                <div className="p-4 rounded-2xl menu-card-frame text-left">
                  <p className="font-menu-title text-base font-semibold text-[#1C1917] leading-snug">
                    ✦ {cravingResult.notice.title}
                  </p>
                  <p className="font-menu-serif text-sm text-[#766153] mt-1.5 leading-relaxed">
                    {cravingResult.notice.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Encabezado suave para antojos */}
            {activeChoice === 'craving' && !cravingQuery.trim() && (
              <div className="pt-1 pb-1 text-center">
                <p className="font-menu-serif italic text-sm text-[#8F7347]">
                  — Selección gastronómica para tentar al paladar —
                </p>
              </div>
            )}

            {/* Lista de Platos tipo Carta de Restaurante Gourmet */}
            {visibleRecipes.map((recipe, index) => (
              <article
                key={recipe.id}
                onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe } })}
                className="relative menu-card-frame rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg cursor-pointer select-none group"
              >
                {/* Esquinas ornamentales discretas tipo carta de lujo */}
                <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

                {/* Encabezado del plato: Pase y tiempo */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm tracking-[0.22em] uppercase font-serif text-[#8F7347] font-bold">
                      PASE Nº 0{index + 1}
                    </span>
                    {recipe.recentIngredientsUsed != null && recipe.recentIngredientsUsed > 0 && (
                      <span className="text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF1E8] border border-[#5D7A56]/30 text-[#385333] inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#5D7A56]" />
                        ✦ Cosecha prioritaria
                      </span>
                    )}
                  </div>
                  <span className="text-sm sm:text-base font-menu-serif text-[#5A483D] font-medium tracking-wider">
                    · {recipe.prep_time || 15} min de elaboración ·
                  </span>
                </div>

                {/* Título noble del plato */}
                <h2 className="font-menu-title text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight group-hover:text-[#8F7347] transition leading-snug">
                  {recipe.name}
                </h2>

                {/* Composición del plato (Ingredientes disponibles) */}
                <div className="mt-3.5 pt-3 border-t border-[#A88B57]/20">
                  <p className="font-menu-serif text-sm sm:text-base text-[#5A483D] font-semibold mb-1.5">
                    Composición del plato:
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-base sm:text-lg">
                    {recipe.matchedIngredients.length > 0 ? (
                      [...recipe.matchedIngredients]
                        .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                        .map((ing, i) => {
                          const isRecent = recentIngredients.some(rec => isIngredientMatch(rec, ing) || isIngredientMatch(ing, rec))
                          return (
                            <span key={i} className="text-[#1C1917] inline-flex items-center gap-1 font-semibold">
                              <span className="text-[#A88B57] text-xs">✦</span>
                              <span className="capitalize">{ing}</span>
                              {isRecent && (
                                <span className="text-xs sm:text-sm text-[#476640] font-bold bg-[#EBF1E8] px-1.5 py-0.2 rounded">
                                  (fresco)
                                </span>
                              )}
                            </span>
                          )
                        })
                    ) : (
                      <span className="text-[#766153] italic text-base">Propuesta gourmet sugerida</span>
                    )}
                  </div>
                </div>

                {/* Ingredientes faltantes / suplementos sugeridos */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-dashed border-[#A88B57]/30 text-sm sm:text-base text-[#5A483D] flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-menu-serif text-[#8F7347] font-bold">
                        {recipe.missingIngredients.length === 1 ? 'Aporte sugerido: ' : 'Aportes sugeridos: '}
                      </span>
                      <span className="text-[#1C1917] font-semibold capitalize">
                        {[...recipe.missingIngredients]
                          .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                          .join(', ')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-mono text-[#8F7347] bg-[#A88B57]/15 px-2.5 py-1 rounded-md font-bold">
                      est. ARS {recipe.additionalCostARS.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                {/* Pie del plato con adorno refinado y llamada a la acción */}
                <div className="mt-4 pt-3 flex items-center justify-between text-sm sm:text-base border-t border-[#A88B57]/20">
                  <div className="flex items-center gap-1 text-[#A88B57] text-sm">
                    <span>—</span>
                    <span>❖</span>
                    <span>—</span>
                  </div>
                  <span className="font-menu-serif text-base sm:text-lg text-[#8F7347] group-hover:text-[#1C1917] transition inline-flex items-center gap-1 font-bold">
                    Consultar elaboración del Chef
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
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

