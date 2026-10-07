import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useInventory } from '../../hooks/useInventory'
import { useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { estimateItemValueARS, isIngredientMatch, getIngredientImportance } from '../../lib/ingredientParser'
import { matchCravingRecipes, type RecipeWithCost } from '../../lib/cravingMatcher'
import { registerAbortAction } from '../../lib/actionAbort'
import CookingPotAnimation from '../../components/CookingPotAnimation'
import GoogleIcon from '../../components/GoogleIcon'
import {
  PREFERENCE_CATEGORIES,
  classifyRecipe,
  filterRecipesByPreference,
  calculatePreferenceStats,
  type MainCategory,
} from '../../lib/recipeTaxonomy'

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

  // Estados para preferencia culinaria del comensal y subcategorías
  const [selectedPreference, setSelectedPreference] = useState<MainCategory>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')

  const handleSelectPreference = (pref: MainCategory) => {
    setSelectedPreference(pref)
    setSelectedSubcategory('all')
    setRecipeOffset(0)
  }

  const handleSelectSubcategory = (subId: string) => {
    setSelectedSubcategory(subId)
    setRecipeOffset(0)
  }

  const activeCategoryDef = useMemo(() => {
    return PREFERENCE_CATEGORIES.find(c => c.id === selectedPreference) || PREFERENCE_CATEGORIES[0]
  }, [selectedPreference])

  // Estadísticas en tiempo real de disponibilidad por categoría según los ingredientes del usuario
  const preferenceStats = useMemo(() => {
    return calculatePreferenceStats(scoredRecipes, inventory)
  }, [scoredRecipes, inventory])

  // Lista base según categoría de disponibilidad seleccionada
  const baseRecipesForChoice = useMemo(() => {
    if (activeChoice === 'ready') return readyRecipes
    if (activeChoice === 'one_missing') return oneMissingRecipes
    if (activeChoice === 'special') return specialRecipes
    return cravingResult.recipes
  }, [activeChoice, readyRecipes, oneMissingRecipes, specialRecipes, cravingResult.recipes])

  // Filtrado final aplicando la Preferencia Culinaria y su Subcategoría
  const { currentCategoryRecipes, isPreferenceFallback } = useMemo(() => {
    // 1. Filtrar dentro de la disponibilidad actual
    const directFiltered = filterRecipesByPreference(baseRecipesForChoice, selectedPreference, selectedSubcategory)
    if (directFiltered.length > 0) {
      return { currentCategoryRecipes: directFiltered, isPreferenceFallback: false }
    }

    // 2. Si no hay en Servicio Directo, buscar con gracia en Toque del Chef o recetas de Autor
    if (selectedPreference !== 'all') {
      const fallbackOne = filterRecipesByPreference(oneMissingRecipes, selectedPreference, selectedSubcategory)
      if (fallbackOne.length > 0) {
        return { currentCategoryRecipes: fallbackOne, isPreferenceFallback: true }
      }
      const fallbackSpec = filterRecipesByPreference(specialRecipes, selectedPreference, selectedSubcategory)
      if (fallbackSpec.length > 0) {
        return { currentCategoryRecipes: fallbackSpec, isPreferenceFallback: true }
      }
    }

    return { currentCategoryRecipes: directFiltered, isPreferenceFallback: false }
  }, [baseRecipesForChoice, selectedPreference, selectedSubcategory, oneMissingRecipes, specialRecipes])

  // Texto dinámico con análisis de la despensa del comensal
  const currentPreferenceMatchedText = useMemo(() => {
    if (inventory.length === 0) {
      return 'Despensa libre de materias primas: explorando propuestas de inspiración.'
    }
    const stat = preferenceStats[selectedPreference]
    if (selectedPreference === 'all') {
      const sample = inventory.slice(0, 4).map(i => i.name).join(', ')
      return `Analizado con tu despensa (${sample}${inventory.length > 4 ? '...' : ''}): ${stat.readyCount} platos con 100% de ingredientes listos.`
    }
    if (selectedPreference === 'carnes') {
      return stat.matchedIngredients.length > 0
        ? `Aprovechando tus materias primas: ${stat.matchedIngredients.join(', ')}. ${stat.total} recetas cárnicas disponibles.`
        : `Sin carnes registradas en tu despensa: propuestas del Chef con proteínas sugeridas (${stat.total} opciones).`
    }
    if (selectedPreference === 'verduras') {
      return stat.matchedIngredients.length > 0
        ? `Aprovechando tu huerta: ${stat.matchedIngredients.join(', ')}. ${stat.total} recetas de huerta disponibles.`
        : `Propuestas frescas de huerta sugeridas por el Chef (${stat.total} opciones).`
    }
    if (selectedPreference === 'pastas') {
      return stat.matchedIngredients.length > 0
        ? `Aprovechando tu despensa: ${stat.matchedIngredients.join(', ')}. ${stat.total} recetas de pastas y masas.`
        : `Propuestas de pastas y horneados del Chef (${stat.total} opciones).`
    }
    if (selectedPreference === 'veggie') {
      return `100% libre de carnes. ${stat.total} recetas vegetarianas calculadas con tus vegetales y materias primas.`
    }
    if (selectedPreference === 'low_cal') {
      return `Baja densidad calórica y platos livianos para digestión ágil (${stat.total} opciones disponibles).`
    }
    if (selectedPreference === 'fitness') {
      return `Alta proteína y energía limpia para entrenamiento o nutrición activa (${stat.total} opciones disponibles).`
    }
    return `${stat.total} opciones calculadas con tus ingredientes.`
  }, [inventory, preferenceStats, selectedPreference])

  // Estados para rotación de propuestas y animación de transición a la elaboración
  const [recipeOffset, setRecipeOffset] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  // Reiniciar offset cuando el usuario cambia de categoría o busca un antojo
  useEffect(() => {
    setRecipeOffset(0)
  }, [activeChoice, cravingQuery, selectedPreference, selectedSubcategory])

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

        {/* ========================================================
            PANEL MAESTRO DE PREFERENCIAS CULINARIAS DEL COMENSAL
            (Filtro previo por Categorías, Subcategorías e Ingredientes)
            ======================================================== */}
        <section className="w-full max-w-5xl xl:max-w-6xl mx-auto menu-card-frame bg-[#FAF7F2] border-2 border-[#8F7347]/50 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 relative text-left">
          {/* Adornos en las esquinas */}
          <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8F7347]/60 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8F7347]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8F7347]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8F7347]/60 pointer-events-none" />

          {/* Encabezado del Panel */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#8F7347]/25 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-[#7A5E30] text-xs sm:text-sm font-bold uppercase tracking-wider">
                <span>✦</span>
                <span>Preferencia Culinaria del Comensal</span>
                <span>✦</span>
              </div>
              <h2 className="font-menu-title text-base sm:text-xl md:text-2xl font-black text-[#1C1917] tracking-tight">
                Filtre por preferencia según sus ingredientes disponibles:
              </h2>
            </div>
            {selectedPreference !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectPreference('all')}
                className="px-3 py-1.5 text-xs sm:text-sm font-menu-serif font-black rounded-xl border border-[#8F7347]/40 bg-white text-[#7A5E30] hover:text-[#1C1917] hover:border-[#1C1917] transition cursor-pointer shadow-2xs"
              >
                ✕ Ver toda la carta
              </button>
            )}
          </div>

          {/* Selector de Categorías Principales y Estilos de Vida */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {PREFERENCE_CATEGORIES.map(category => {
              const isSelected = selectedPreference === category.id
              const stats = preferenceStats[category.id]
              const hasIngredientsInStock = stats.matchedIngredients.length > 0

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectPreference(category.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none text-left flex flex-col justify-between tap-subtle relative overflow-hidden group min-h-[95px] ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#241E19] via-[#1B1612] to-[#120F0C] border-[#C7A971] text-[#FAF2E6] shadow-[0_6px_20px_rgba(20,17,14,0.35),0_0_12px_rgba(199,169,113,0.2)] ring-1 ring-[#DDB879]/60'
                      : 'bg-gradient-to-b from-[#FDFBF7] via-[#F8F3EA] to-[#EFE7D8] border-[#A88B57]/45 text-[#1C1917] hover:border-[#8F7347] hover:from-white hover:to-[#F3ECE0] shadow-[0_2px_8px_rgba(47,42,38,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#3A3026]/80 border-[#C7A971]/60 text-[#DDB879] shadow-inner'
                        : 'bg-[#F2ECE1] border-[#8F7347]/30 text-[#8F7347] group-hover:bg-[#EAE1D2]'
                    }`}>
                      <GoogleIcon name={category.iconName} size={18} filled={isSelected} />
                    </div>
                    {hasIngredientsInStock && category.id !== 'all' && (
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#244220] to-[#34592E] text-[#FAF7F2] border-[#8F7347]/50'
                          : 'bg-[#EBF5E7] text-[#244220] border-[#385333]/40'
                      }`}>
                        <span className="text-[8px]">✓</span> despensa
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-menu-serif text-sm sm:text-base font-black block leading-tight truncate">
                      {category.shortLabel}
                    </span>
                    <span className={`text-xs block mt-0.5 font-mono ${
                      isSelected ? 'text-[#DDB879]' : 'text-[#7A5E30]'
                    }`}>
                      {stats.total} opciones
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Subcategorías refinadas según la categoría activa */}
          {activeCategoryDef && activeCategoryDef.subcategories.length > 1 && (
            <div className="pt-3 border-t border-[#8F7347]/20 animate-fade-in space-y-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#7A5E30] font-menu-serif font-bold">
                <span className="text-[#8F7347]">✦</span>
                <span>Subcategorías de {activeCategoryDef.label}:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeCategoryDef.subcategories.map(sub => {
                  const isSubSelected = selectedSubcategory === sub.id
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-menu-serif font-bold transition-all duration-150 cursor-pointer tap-subtle inline-flex items-center gap-1.5 border shadow-2xs ${
                        isSubSelected
                          ? 'bg-gradient-to-r from-[#8F7347] to-[#6E552E] border-[#8F7347] text-white shadow-xs font-black'
                          : 'bg-gradient-to-b from-white to-[#F5EFE4] border-[#8F7347]/35 text-[#2E241E] hover:border-[#1C1917] hover:to-[#EDE3D2]'
                      }`}
                      title={sub.description}
                    >
                      <GoogleIcon name={sub.iconName} size={15} className={isSubSelected ? 'text-white' : 'text-[#8F7347]'} />
                      <span>{sub.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Resumen inteligente según ingredientes de que disponga */}
          <div className="pt-2.5 border-t border-[#8F7347]/20 flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-base font-menu-serif text-[#5A483D]">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[#8F7347] font-bold">✦</span>
              <span>
                {currentPreferenceMatchedText}
              </span>
            </span>
            <span className="font-mono text-[#7A5E30] font-black text-xs sm:text-sm">
              {totalInCategory} recetas filtradas
            </span>
          </div>
        </section>

        {/* Selector de Categorías de la Carta (SIN NÚMEROS Y CON MÁXIMO CONTRASTE) */}
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Botón 1: Servicio Directo (sin números, alto contraste) */}
            <button
              type="button"
              onClick={() => setActiveChoice('ready')}
              className={`px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
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
              className={`px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
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
              className={`px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
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
              className={`px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all duration-200 tap-subtle cursor-pointer select-none text-center border-2 ${
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
          <div className="pt-1 pb-2 space-y-2.5 max-w-lg lg:max-w-xl mx-auto animate-fade-in text-left">
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 opacity-40 pointer-events-none select-none">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className="menu-card-frame rounded-2xl p-5 relative space-y-3 animate-pulse bg-white/70 border border-[#8F7347]/30">
                  <div className="h-4 bg-[#8F7347]/20 rounded-md w-3/4" />
                  <div className="h-3 bg-[#8F7347]/15 rounded-md w-1/2" />
                  <div className="h-14 bg-[#8F7347]/10 rounded-xl w-full" />
                </div>
              ))}
            </div>
            <CookingPotAnimation
              message="Elaborando propuestas de la Carta..."
              subMessage="Combinando sabores y armonizando ingredientes..."
            />
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
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

            {/* Aviso cuando se presentan alternativas del Chef para la preferencia seleccionada */}
            {isPreferenceFallback && selectedPreference !== 'all' && (
              <div className="col-span-full pt-1 pb-1 animate-fade-in">
                <div className="p-4 rounded-2xl bg-[#FAF0E6] border-2 border-[#8F7347]/40 text-[#7A5E30] text-left shadow-xs space-y-1">
                  <p className="font-menu-title font-bold text-[#1C1917] text-base flex items-center gap-1.5">
                    <span>✦</span>
                    <span>Sugerencias del Chef para {activeCategoryDef.label}:</span>
                  </p>
                  <p className="font-menu-serif text-sm sm:text-base text-[#3A2E26] leading-relaxed">
                    Para los ingredientes actuales de su despensa no encontramos opciones con 0 faltantes en esta subcategoría exacta, pero aquí tiene propuestas del Chef con un aporte menor.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso si la combinación de filtros no arroja recetas */}
            {visibleRecipes.length === 0 && !isLoading && (
              <div className="col-span-full py-12 px-4 text-center menu-card-frame rounded-2xl bg-white space-y-3 animate-fade-in">
                <p className="font-menu-title text-xl font-bold text-[#1C1917]">
                  No se encontraron platos para la subcategoría seleccionada
                </p>
                <p className="font-menu-serif text-base text-[#5A483D] max-w-md mx-auto">
                  Pruebe seleccionando otra subcategoría o vuelva a explorar todas las propuestas de {activeCategoryDef.label}.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectSubcategory('all')}
                  className="px-5 py-2.5 rounded-xl bg-[#1C1917] text-[#FAF7F2] font-menu-serif font-black text-sm border-2 border-[#8F7347] shadow-sm hover:bg-black cursor-pointer tap-subtle"
                >
                  Ver todas las opciones de {activeCategoryDef.label}
                </button>
              </div>
            )}

            {/* Lista de Platos tipo Carta de Restaurante Gourmet */}
            {visibleRecipes.map((recipe, index) => {
              const classification = classifyRecipe(recipe)

              return (
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
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm sm:text-base tracking-[0.22em] uppercase font-serif text-[#7A5E30] font-black">
                        PASE Nº 0{((recipeOffset + index) % Math.max(1, totalInCategory)) + 1}
                      </span>
                      {recipe.origin && (
                        <span className="text-sm sm:text-base font-bold px-3 py-1 rounded-lg bg-[#FAF0E6] border border-[#8F7347]/40 text-[#7A5E30] inline-flex items-center gap-1.5 font-menu-serif">
                          <GoogleIcon name="location_on" size={15} className="text-[#8F7347]" />
                          <span>{recipe.origin}</span>
                        </span>
                      )}
                      <span className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-md border font-menu-serif ${
                        recipe.difficulty === 'Difícil'
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : recipe.difficulty === 'Media'
                          ? 'bg-amber-50 border-amber-300 text-amber-800'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}>
                        {recipe.difficulty || 'Fácil'}
                      </span>
                      {recipe.recentIngredientsUsed != null && recipe.recentIngredientsUsed > 0 && (
                        <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-[#E2F0DC] border-2 border-[#385333] text-[#244220] inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#385333]" />
                          ✦ Cosecha prioritaria
                        </span>
                      )}
                    </div>
                    <span className="text-base sm:text-lg font-menu-serif text-[#1C1917] font-bold tracking-wider">
                      · {recipe.prep_time || 15} min de elaboración ·
                    </span>
                  </div>

                  {/* Título noble del plato */}
                  <h2 className="font-menu-title text-2xl sm:text-3xl md:text-4xl font-black text-[#1C1917] tracking-tight group-hover:text-[#7A5E30] transition leading-snug">
                    {recipe.name}
                  </h2>

                  {/* Insignias de Categoría, Subcategoría y Estilo Nutricional */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 mb-1.5">
                    {classification.badgeList.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border font-menu-serif inline-flex items-center gap-1.5 shadow-2xs ${badge.colorClass}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    ))}
                  </div>

                {/* Composición del plato (Ingredientes disponibles) */}
                <div className="mt-4 pt-3.5 border-t-2 border-[#8F7347]/20">
                  <p className="font-menu-serif text-base sm:text-lg text-[#3A2E26] font-black mb-2">
                    Composición del plato:
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2.5 text-lg sm:text-xl">
                    {recipe.matchedIngredients.length > 0 ? (
                      [...recipe.matchedIngredients]
                        .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                        .map((ing, i) => {
                          const isRecent = recentIngredients.some(rec => isIngredientMatch(rec, ing) || isIngredientMatch(ing, rec))
                          return (
                            <span key={i} className="text-[#1C1917] inline-flex items-center gap-1.5 font-bold">
                              <span className="text-[#8F7347] text-sm">✦</span>
                              <span className="capitalize">{ing}</span>
                              {isRecent && (
                                <span className="text-xs sm:text-sm text-[#244220] font-black bg-[#E2F0DC] px-2.5 py-0.5 rounded border border-[#385333]/40">
                                  (fresco)
                                </span>
                              )}
                            </span>
                          )
                        })
                    ) : (
                      <span className="text-[#3A2E26] font-semibold text-lg">Propuesta gourmet sugerida</span>
                    )}
                  </div>
                </div>

                {/* Ingredientes faltantes / suplementos sugeridos */}
                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t-2 border-dashed border-[#8F7347]/30 text-base sm:text-lg text-[#2E241E] flex flex-wrap items-baseline justify-between gap-2.5">
                    <div>
                      <span className="font-menu-serif text-[#8F2D14] font-black">
                        {recipe.missingIngredients.length === 1 ? 'Aporte sugerido: ' : 'Aportes sugeridos: '}
                      </span>
                      <span className="text-[#1C1917] font-black capitalize">
                        {[...recipe.missingIngredients]
                          .sort((a, b) => getIngredientImportance(b) - getIngredientImportance(a))
                          .join(', ')}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-mono text-[#7A5E30] bg-[#FAF0E6] px-3 py-1 rounded-lg font-black border border-[#8F7347]/30">
                      est. ARS {recipe.additionalCostARS.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}

                {/* Indicador de guía detallada para 4 porciones disponible en la elaboración */}
                <div className="mt-4 pt-3 border-t border-[#8F7347]/20 flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base font-menu-serif text-[#7A5E30] font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#8F7347]">✦</span>
                    <span>Ingredientes estandarizados para 4 porciones con especias</span>
                  </span>
                  <span className="font-serif italic text-xs sm:text-sm bg-[#FAF0E6] px-2.5 py-1 rounded-md border border-[#8F7347]/30 text-[#8F7347] font-bold">
                    🍽 4 porciones · Pasos realistas
                  </span>
                </div>

                {/* Pie del plato con adorno refinado y botón de acción */}
                <div className="mt-4 pt-3 flex items-center justify-between text-base sm:text-lg border-t-2 border-[#8F7347]/20">
                  <div className="flex items-center gap-1.5 text-[#8F7347] text-base font-bold">
                    <span>—</span>
                    <span>❖</span>
                    <span>—</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectRecipe(recipe)
                    }}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#1C1917] text-[#FAF7F2] hover:bg-black font-menu-serif text-base sm:text-lg font-black border-2 border-[#8F7347] shadow-sm hover:shadow-md transition-all duration-150 inline-flex items-center gap-2.5 tap-subtle cursor-pointer select-none group-hover:border-[#C7A971]"
                  >
                    {selectedRecipeId === recipe.id ? (
                      <>
                        <span className="w-3 h-3 rounded-full bg-[#C7A971] animate-ping" />
                        <span>Abriendo receta...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#C7A971]">✦</span>
                        <span>Receta del chef</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            )
          })}

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
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/25 backdrop-blur-sm animate-fade-in p-4">
          <div className="flex flex-col items-center justify-center animate-float-gourmet w-full max-w-[90vw] sm:max-w-md">
            <div className="bg-[#FAF7F2] border-2 border-[#8F7347] px-6 py-4.5 rounded-2xl shadow-2xl flex items-center justify-center gap-3.5 animate-scale-up w-full">
              <div className="w-5 h-5 border-2 border-[#8F7347] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="font-menu-serif font-black text-[#1C1917] text-sm sm:text-base md:text-lg">
                ✦ Pasando a la elaboración del plato...
              </span>
            </div>
            <div className="w-36 sm:w-44 h-3 bg-black/25 rounded-full blur-md mt-3 mx-auto animate-float-shadow pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  )
}

