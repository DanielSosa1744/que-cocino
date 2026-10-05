import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { estimateItemValueARS, isIngredientMatch, getIngredientImportance } from '../../lib/ingredientParser'
import { matchCravingRecipes, type RecipeWithCost } from '../../lib/cravingMatcher'
import { registerAbortAction } from '../../lib/actionAbort'
import CookingPotAnimation from '../../components/CookingPotAnimation'

type CategoryChoice = 'ready' | 'one_missing' | 'special' | 'craving'

const CRAVING_SUGGESTIONS = ['Pizza', 'Farofa', 'Hamburguesa', 'Strogonoff', 'Pasta', 'Empanadas', 'Sushi', 'Polenta', 'Guiso']

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
  }, [location.state])

  // 2. Obtener IDs de recetas de la tanda anterior para no repetirlas
  const previousRecipeIds: string[] = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('que_cocino_previous_recipe_ids')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [])

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

  // Estados para rotación de propuestas y animación de transición a la elaboración
  const [recipeOffset, setRecipeOffset] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  // Lista actual según categoría seleccionada (siempre garantiza resultados)
  const currentCategoryRecipes = useMemo(() => {
    if (activeChoice === 'ready') return readyRecipes
    if (activeChoice === 'one_missing') return oneMissingRecipes
    if (activeChoice === 'special') return specialRecipes
    return cravingResult.recipes
  }, [activeChoice, readyRecipes, oneMissingRecipes, specialRecipes, cravingResult.recipes])

  // Reiniciar offset cuando el usuario cambia de categoría o busca un antojo
  useEffect(() => {
    setRecipeOffset(0)
  }, [activeChoice, cravingQuery])

  const pageSize = 4
  const totalInCategory = currentCategoryRecipes.length

  // Obtener 4 recetas con rotación fluida
  const visibleRecipes = useMemo(() => {
    if (totalInCategory === 0) return []
    if (totalInCategory <= pageSize) return currentCategoryRecipes

    const start = recipeOffset % totalInCategory
    const slice = currentCategoryRecipes.slice(start, start + pageSize)
    if (slice.length < pageSize) {
      const needed = pageSize - slice.length
      return [...slice, ...currentCategoryRecipes.slice(0, needed)]
    }
    return slice
  }, [currentCategoryRecipes, recipeOffset, totalInCategory])

  const selectRecipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Abandonar de inmediato acciones en curso al interactuar con el toolbar
  useEffect(() => {
    const unregister = registerAbortAction(() => {
      if (selectRecipeTimerRef.current) {
        clearTimeout(selectRecipeTimerRef.current)
        selectRecipeTimerRef.current = null
      }
      if (rotatingTimerRef.current) {
        clearTimeout(rotatingTimerRef.current)
        rotatingTimerRef.current = null
      }
      setSelectedRecipeId(null)
      setIsRotating(false)
    })

    return () => {
      unregister()
      if (selectRecipeTimerRef.current) clearTimeout(selectRecipeTimerRef.current)
      if (rotatingTimerRef.current) clearTimeout(rotatingTimerRef.current)
    }
  }, [])

  const handleNextOptions = () => {
    setIsRotating(true)
    if (rotatingTimerRef.current) clearTimeout(rotatingTimerRef.current)
    rotatingTimerRef.current = setTimeout(() => {
      if (totalInCategory > pageSize) {
        setRecipeOffset(prev => prev + pageSize)
      } else {
        // Si hay 4 o menos en la categoría actual, pasar con gracia a la siguiente categoría culinaria
        if (activeChoice === 'ready') setActiveChoice('one_missing')
        else if (activeChoice === 'one_missing') setActiveChoice('special')
        else if (activeChoice === 'special') setActiveChoice('craving')
        else setRecipeOffset(prev => prev + pageSize)
      }
      setIsRotating(false)
    }, 80)
  }

  const handleSelectRecipe = (recipe: RecipeWithCost) => {
    setSelectedRecipeId(recipe.id)
    if (selectRecipeTimerRef.current) clearTimeout(selectRecipeTimerRef.current)
    selectRecipeTimerRef.current = setTimeout(() => {
      navigate(`/recipe/${recipe.id}`, { state: { recipe } })
    }, 80)
  }

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
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in text-[#1C1917]">
      {/* Encabezado fijo: ÚNICAMENTE el título permanece fijo en la parte superior */}
      <header className="px-5 pt-safe pb-2.5 flex-shrink-0 bg-[#F7F3EC]/95 backdrop-blur-md border-b border-[#8F7347]/25 text-center z-20">
        <div className="flex items-center justify-center gap-2 mb-0.5 opacity-90">
          <span className="h-[1.5px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-[#8F7347]" />
          <span className="text-[#8F7347] text-xs">✦</span>
          <span className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-[#7A5E30]">
            Menu du Jour · Selección del Chef
          </span>
          <span className="text-[#8F7347] text-xs">✦</span>
          <span className="h-[1.5px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-[#8F7347]" />
        </div>

        <h1 className="font-menu-title text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
          Carta de Temporada
        </h1>
      </header>

      {/* Todo el resto de la página se desplaza: subtítulo, selector de categorías sin números, buscador y catálogo */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 pb-12 space-y-4">
        {/* Subtítulo descriptivo que se desplaza con la página */}
        <p className="font-menu-serif text-base sm:text-lg text-[#3A2E26] text-center font-semibold max-w-md mx-auto">
          Propuestas de alta cocina elaboradas con los ingredientes de tu despensa
        </p>

        {/* Selector de Categorías de la Carta (SIN NÚMEROS Y CON MÁXIMO CONTRASTE) */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {/* Botón 1: Servicio Directo (sin números, alto contraste) */}
            <button
              type="button"
              onClick={() => setActiveChoice('ready')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
                activeChoice === 'ready'
                  ? 'bg-[#1C1917] border-[#1C1917] text-[#FAF7F2] font-black shadow-md ring-2 ring-[#8F7347]/50'
                  : 'bg-white border-[#8F7347]/45 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#FAF7F2] font-bold shadow-xs'
              }`}
            >
              <span className="font-menu-serif text-sm sm:text-base md:text-lg tracking-wide block truncate">
                Servicio Directo
              </span>
            </button>

            {/* Botón 2: Toque del Chef (sin números, alto contraste) */}
            <button
              type="button"
              onClick={() => setActiveChoice('one_missing')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
                activeChoice === 'one_missing'
                  ? 'bg-[#1C1917] border-[#1C1917] text-[#FAF7F2] font-black shadow-md ring-2 ring-[#8F7347]/50'
                  : 'bg-white border-[#8F7347]/45 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#FAF7F2] font-bold shadow-xs'
              }`}
            >
              <span className="font-menu-serif text-sm sm:text-base md:text-lg tracking-wide block truncate">
                Toque del Chef
              </span>
            </button>

            {/* Botón 3: Platos de Autor (sin números, alto contraste) */}
            <button
              type="button"
              onClick={() => setActiveChoice('special')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
                activeChoice === 'special'
                  ? 'bg-[#1C1917] border-[#1C1917] text-[#FAF7F2] font-black shadow-md ring-2 ring-[#8F7347]/50'
                  : 'bg-white border-[#8F7347]/45 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#FAF7F2] font-bold shadow-xs'
              }`}
            >
              <span className="font-menu-serif text-sm sm:text-base md:text-lg tracking-wide block truncate">
                Platos de Autor
              </span>
            </button>

            {/* Botón 4: A la Carta (sin números, alto contraste) */}
            <button
              type="button"
              onClick={() => setActiveChoice('craving')}
              className={`px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
                activeChoice === 'craving'
                  ? 'bg-[#1C1917] border-[#1C1917] text-[#FAF7F2] font-black shadow-md ring-2 ring-[#8F7347]/50'
                  : 'bg-white border-[#8F7347]/45 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#FAF7F2] font-bold shadow-xs'
              }`}
            >
              <span className="font-menu-serif text-sm sm:text-base md:text-lg tracking-wide block truncate">
                A la Carta
              </span>
            </button>
          </div>
        </div>

        {/* Sección interactiva de "A la Carta" */}
        {activeChoice === 'craving' && (
          <div className="pt-1 pb-2 space-y-2.5 max-w-md mx-auto animate-fade-in text-left">
            <div className="relative">
              <input
                type="text"
                value={cravingQuery}
                onChange={e => setCravingQuery(e.target.value)}
                placeholder="¿Qué plato o antojo desea degustar hoy? (ej. pasta, lomo, pizza...)"
                className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-[#1C1917] focus:border-[#8F7347] focus:outline-none text-base text-[#1C1917] placeholder:text-[#5A483D] transition shadow-xs font-menu-serif font-bold"
              />
              {cravingQuery && (
                <button
                  type="button"
                  onClick={() => setCravingQuery('')}
                  className="absolute right-3.5 top-3.5 text-base text-[#1C1917] font-bold hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Píldoras de sugerencias gastronómicas */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-menu-serif text-[#1C1917] font-bold mr-1">Inspiración:</span>
              {CRAVING_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCravingQuery(item)}
                  className={`px-3.5 py-1.5 rounded-full text-sm sm:text-base transition tap-subtle cursor-pointer font-menu-serif font-bold ${
                    cravingQuery.toLowerCase() === item.toLowerCase()
                      ? 'bg-[#1C1917] text-[#FAF7F2] shadow-sm'
                      : 'bg-white border-2 border-[#8F7347]/40 text-[#1C1917] hover:border-[#1C1917] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Catálogo de la Carta: Pliegos editoriales de alta cocina */}
        {isLoading ? (
          <CookingPotAnimation
            inline
            message="Elaborando propuestas de la Carta..."
            subMessage="Combinando sabores y armonizando ingredientes..."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Si no hay inventario registrado */}
            {inventory.length === 0 && (
              <div className="col-span-full pt-2 pb-1">
                <div className="p-4 rounded-2xl menu-card-frame text-base text-[#2E241E] text-left">
                  <p className="font-menu-title font-bold text-[#1C1917] mb-1.5 text-lg">
                    ✦ Selección del Chef para su inspiración
                  </p>
                  <p className="font-menu-serif leading-relaxed text-base text-[#3A2E26]">
                    Su despensa está libre de ingredientes en este momento. Puede{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="text-[#1C1917] underline decoration-[#8F7347] font-bold hover:text-black cursor-pointer"
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
              <div className="col-span-full pt-1 pb-1">
                <div className="p-4 rounded-2xl bg-white border-2 border-[#8F7347]/40 text-base text-[#2E241E] text-left shadow-xs">
                  <p className="font-menu-title font-bold text-[#1C1917] mb-1 text-base">
                    ✦ Propuestas más afines a su selección
                  </p>
                  <p className="font-menu-serif text-base text-[#3A2E26] leading-relaxed font-medium">
                    Estas alternativas maximizan el uso de los ingredientes presentes en su mesa:
                  </p>
                </div>
              </div>
            )}

            {/* Aviso para antojos */}
            {activeChoice === 'craving' && cravingResult.isAlternative && cravingResult.notice && (
              <div className="col-span-full pt-1 pb-1">
                <div className="p-4 rounded-2xl menu-card-frame text-left">
                  <p className="font-menu-title text-lg font-bold text-[#1C1917] leading-snug">
                    ✦ {cravingResult.notice.title}
                  </p>
                  <p className="font-menu-serif text-base text-[#3A2E26] mt-1.5 leading-relaxed font-medium">
                    {cravingResult.notice.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Encabezado suave para antojos */}
            {activeChoice === 'craving' && !cravingQuery.trim() && (
              <div className="col-span-full pt-1 pb-1 text-center">
                <p className="font-menu-serif text-base text-[#7A5E30] font-bold">
                  — Selección gastronómica para tentar al paladar —
                </p>
              </div>
            )}

            {/* Lista de Platos tipo Carta de Restaurante Gourmet */}
            {visibleRecipes.map((recipe, index) => (
              <article
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                className={`relative menu-card-frame rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl cursor-pointer select-none group flex flex-col justify-between ${
                  selectedRecipeId === recipe.id
                    ? 'ring-4 ring-[#8F7347] scale-[0.985] bg-[#FAF7F2]'
                    : ''
                }`}
              >
                {/* Esquinas ornamentales discretas tipo carta de lujo */}
                <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8F7347] pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8F7347] pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8F7347] pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8F7347] pointer-events-none" />

                {/* Encabezado del plato: Pase, Origen, Dificultad y tiempo */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm tracking-[0.22em] uppercase font-serif text-[#7A5E30] font-black">
                      PASE Nº 0{((recipeOffset + index) % Math.max(1, totalInCategory)) + 1}
                    </span>
                    {recipe.origin && (
                      <span className="text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md bg-[#FAF0E6] border border-[#8F7347]/40 text-[#7A5E30] inline-flex items-center gap-1 font-menu-serif">
                        📍 {recipe.origin}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border font-menu-serif ${
                      recipe.difficulty === 'Difícil'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : recipe.difficulty === 'Media'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}>
                      {recipe.difficulty || 'Fácil'}
                    </span>
                    {recipe.recentIngredientsUsed != null && recipe.recentIngredientsUsed > 0 && (
                      <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0DC] border-2 border-[#385333] text-[#244220] inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#385333]" />
                        ✦ Cosecha prioritaria
                      </span>
                    )}
                  </div>
                  <span className="text-sm sm:text-base font-menu-serif text-[#1C1917] font-bold tracking-wider">
                    · {recipe.prep_time || 15} min de elaboración ·
                  </span>
                </div>

                {/* Título noble del plato */}
                <h2 className="font-menu-title text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight group-hover:text-[#7A5E30] transition leading-snug">
                  {recipe.name}
                </h2>

                {/* Composición del plato (Ingredientes disponibles) */}
                <div className="mt-3.5 pt-3 border-t-2 border-[#8F7347]/20">
                  <p className="font-menu-serif text-sm sm:text-base text-[#3A2E26] font-bold mb-1.5">
                    Composición del plato:
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-base sm:text-lg">
                    {recipe.matchedIngredients.length > 0 ? (
                      [...recipe.matchedIngredients]
                        .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                        .map((ing, i) => {
                          const isRecent = recentIngredients.some(rec => isIngredientMatch(rec, ing) || isIngredientMatch(ing, rec))
                          return (
                            <span key={i} className="text-[#1C1917] inline-flex items-center gap-1.5 font-bold">
                              <span className="text-[#8F7347] text-xs">✦</span>
                              <span className="capitalize">{ing}</span>
                              {isRecent && (
                                <span className="text-xs sm:text-sm text-[#244220] font-black bg-[#E2F0DC] px-2 py-0.5 rounded border border-[#385333]/40">
                                  (fresco)
                                </span>
                              )}
                            </span>
                          )
                        })
                    ) : (
                      <span className="text-[#3A2E26] font-semibold text-base">Propuesta gourmet sugerida</span>
                    )}
                  </div>
                </div>

                {/* Ingredientes faltantes / suplementos sugeridos */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t-2 border-dashed border-[#8F7347]/30 text-sm sm:text-base text-[#2E241E] flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-menu-serif text-[#8F2D14] font-black">
                        {recipe.missingIngredients.length === 1 ? 'Aporte sugerido: ' : 'Aportes sugeridos: '}
                      </span>
                      <span className="text-[#1C1917] font-bold capitalize">
                        {[...recipe.missingIngredients]
                          .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                          .join(', ')}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-mono text-[#7A5E30] bg-[#FAF0E6] px-2.5 py-1 rounded-md font-black border border-[#8F7347]/30">
                      est. ARS {recipe.additionalCostARS.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                {/* Indicador de guía detallada disponible en la elaboración */}
                <div className="mt-3 pt-2.5 border-t border-[#8F7347]/20 flex items-center justify-between text-xs sm:text-sm font-menu-serif text-[#7A5E30] font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span>✦</span>
                    <span>Incluye pasos detallados para principiantes</span>
                  </span>
                  <span className="font-serif italic hidden sm:inline">
                    Secretos del chef en la elaboración
                  </span>
                </div>

                {/* Pie del plato con adorno refinado y llamada a la acción */}
                <div className="mt-3.5 pt-2.5 flex items-center justify-between text-sm sm:text-base border-t-2 border-[#8F7347]/20">
                  <div className="flex items-center gap-1.5 text-[#8F7347] text-sm font-bold">
                    <span>—</span>
                    <span>❖</span>
                    <span>—</span>
                  </div>
                  <span className="font-menu-serif text-base sm:text-lg text-[#1C1917] group-hover:text-[#7A5E30] transition inline-flex items-center gap-1.5 font-black underline decoration-[#8F7347] decoration-2">
                    {selectedRecipeId === recipe.id ? (
                      <span className="inline-flex items-center gap-2 text-[#7A5E30] animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8F7347] animate-ping" />
                        Abriendo elaboración...
                      </span>
                    ) : (
                      <>
                        Consultar elaboración del Chef
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </span>
                </div>
              </article>
            ))}

            {/* Botón de Otras Opciones de la Carta al final de las recetas */}
            {visibleRecipes.length > 0 && (
              <div className="col-span-full pt-4 pb-8 text-center animate-fade-in">
                <button
                  type="button"
                  onClick={handleNextOptions}
                  disabled={isRotating}
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white border-2 border-[#8F7347] text-[#1C1917] hover:bg-[#FAF7F2] hover:border-[#1C1917] font-menu-serif font-black text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-200 tap-subtle cursor-pointer select-none group"
                >
                  <span className={`text-[#8F7347] text-xl transition-transform duration-500 ${isRotating ? 'animate-spin' : 'group-hover:rotate-90'}`}>
                    ✦
                  </span>
                  <span>
                    {isRotating ? 'Renovando propuestas del Chef...' : 'Ver otras opciones de la carta'}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-[#8F7347] bg-[#FAF0E6] px-2.5 py-1 rounded-md border border-[#8F7347]/30 font-bold">
                    {totalInCategory > pageSize ? 'Alternar propuestas' : 'Más recetas'}
                  </span>
                </button>
                <p className="font-menu-serif text-xs sm:text-sm text-[#5A483D] mt-2.5 font-medium italic">
                  ¿Desea otras alternativas? Explore sugerencias y giros culinarios adicionales.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Micro-animación de transición gourmet al pasar a la cocina */}
      {selectedRecipeId && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-[#FAF7F2] border-2 border-[#8F7347] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-scale-up">
            <div className="w-5 h-5 border-2 border-[#8F7347] border-t-transparent rounded-full animate-spin" />
            <span className="font-menu-serif font-black text-[#1C1917] text-base sm:text-lg">
              ✦ Pasando a la elaboración del plato...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

