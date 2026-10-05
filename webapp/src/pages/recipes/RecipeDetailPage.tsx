import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSaveCooked, useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { useDeleteIngredient, useInventory } from '../../hooks/useInventory'
import { isIngredientMatch, estimateItemValue } from '../../lib/ingredientParser'
import { localStore } from '../../lib/localStore'
import type { RecipeWithScore } from '../../types/app.types'

export default function RecipeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const stateRecipe = (location.state as { recipe?: RecipeWithScore })?.recipe

  const { mutateAsync: saveCooked, isPending } = useSaveCooked()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { data: inventory = [] } = useInventory()
  const { data: availableRecipes = [], isLoading: isLoadingVaciar } = useVaciarNevera(inventory)
  const { data: allRawRecipes = [], isLoading: isLoadingRecipes } = useRecipes()
  const [hasCooked, setHasCooked] = useState(false)
  const [isDetailedMode, setIsDetailedMode] = useState(false)

  const rawRecipe = stateRecipe ||
    availableRecipes.find(r => r.id === id) ||
    allRawRecipes.find(r => r.id === id) ||
    localStore.getRecipes().find(r => r.id === id)

  if (!rawRecipe) {
    if (isLoadingVaciar || isLoadingRecipes) {
      return (
        <div className="h-full max-h-full bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-600 text-xs tracking-wider uppercase font-serif">Cargando receta...</p>
        </div>
      )
    }

    return (
      <div className="h-full max-h-full bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-stone-500 text-sm mb-4">Receta no encontrada.</p>
        <button
          onClick={() => navigate('/recetas')}
          className="text-xs text-stone-800 underline underline-offset-2 hover:text-black transition cursor-pointer"
        >
          Volver a recetas
        </button>
      </div>
    )
  }

  // Normalizar los ingredientes de la receta
  const allIngredients: string[] =
    'recipe_ingredients' in rawRecipe && Array.isArray(rawRecipe.recipe_ingredients)
      ? rawRecipe.recipe_ingredients.map((ri: { ingredient_name: string }) => ri.ingredient_name)
      : 'matchedIngredients' in rawRecipe
      ? [...(rawRecipe.matchedIngredients || []), ...(rawRecipe.missingIngredients || [])]
      : []

  const matchedIngredients: string[] =
    'matchedIngredients' in rawRecipe
      ? (rawRecipe.matchedIngredients || [])
      : allIngredients.filter(name => inventory.some(item => isIngredientMatch(item.name, name)))

  // Ingredientes del inventario que coinciden
  const matchedInventoryItems = inventory.filter(item =>
    matchedIngredients.some(ing => isIngredientMatch(item.name, ing))
  )

  const handleCooked = async () => {
    // Calcular ahorro estimado
    let calculatedMoney = 0
    matchedInventoryItems.forEach(item => {
      calculatedMoney += estimateItemValue(item.name, item.quantity ?? 1, item.unit)
    })
    const moneySaved = calculatedMoney > 0 ? calculatedMoney : Math.max(1, matchedIngredients.length) * 1.5

    await saveCooked({
      recipeName: rawRecipe.name,
      recipeId: rawRecipe.id,
      ingredientsUsed: matchedIngredients,
      wasteAvoidedKg: Math.max(1, matchedIngredients.length) * 0.2,
      moneySavedEur: moneySaved,
      co2AvoidedKg: Math.max(1, matchedIngredients.length) * 0.4,
    })

    // Descontar ingredientes consumidos de la despensa
    matchedInventoryItems.forEach(item => deleteItem(item.id))

    setHasCooked(true)
    setTimeout(() => {
      navigate('/impact')
    }, 1200)
  }

  // Pasos limpios numerados o pasos detallados si está activo el Modo Detallado
  const detailedSteps = (rawRecipe as any).detailed_steps
  const steps = isDetailedMode && Array.isArray(detailedSteps) && detailedSteps.length > 0
    ? detailedSteps
    : (rawRecipe.instructions
        ? rawRecipe.instructions
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
        : [
            'Preparar y limpiar los ingredientes.',
            'Cocinar a fuego medio según la preparación.',
            'Servir caliente y disfrutar.',
          ])

  const chefTips = (rawRecipe as any).chef_tips
  const substitutes = (rawRecipe as any).substitutes as Record<string, string> | undefined
  const pairing = (rawRecipe as any).pairing as string | undefined
  const origin = (rawRecipe as any).origin as string | undefined

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-recipe-entrance text-[#1C1917]">
      {/* Encabezado fijo: El título de la receta y botón de retorno permanecen fijos en la parte superior */}
      <header className="px-5 pt-safe pb-3 flex-shrink-0 bg-[#F7F3EC]/95 backdrop-blur-md border-b-2 border-[#8F7347]/25 z-20">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={() => navigate(-1)}
            className="font-menu-serif text-base text-[#7A5E30] hover:text-[#1C1917] transition cursor-pointer font-bold flex items-center gap-1.5 tap-subtle"
          >
            <span>←</span>
            <span>Volver a la Carta</span>
          </button>
          <div className="flex items-center gap-1.5 text-[#8F7347] text-sm font-bold">
            <span>—</span>
            <span>✦</span>
            <span>—</span>
          </div>
        </div>

        {/* Título de la receta fijo */}
        <h1 className="font-menu-title text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight leading-snug text-center">
          {rawRecipe.name}
        </h1>
      </header>

      {/* Todo el resto de la página se desplaza: tiempo, ingredientes, pasos y botón de registrar servicio */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 pb-12 space-y-5">
        {/* Selector interactivo de Modo: Síntesis vs Modo Detallado del Chef */}
        <div className="flex justify-center items-center gap-2 max-w-sm mx-auto p-1 bg-white border-2 border-[#8F7347]/40 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setIsDetailedMode(false)}
            className={`flex-1 py-2 px-3 rounded-lg font-menu-serif text-sm sm:text-base font-black transition cursor-pointer ${
              !isDetailedMode
                ? 'bg-[#1C1917] text-[#FAF7F2] shadow-sm'
                : 'text-[#1C1917] hover:bg-[#FAF7F2]'
            }`}
          >
            Modo Síntesis
          </button>
          <button
            type="button"
            onClick={() => setIsDetailedMode(true)}
            className={`flex-1 py-2 px-3 rounded-lg font-menu-serif text-sm sm:text-base font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              isDetailedMode
                ? 'bg-[#1C1917] text-[#FAF7F2] shadow-sm ring-1 ring-[#8F7347]'
                : 'text-[#1C1917] hover:bg-[#FAF7F2]'
            }`}
          >
            <span>✦</span>
            <span>Modo Detallado</span>
          </button>
        </div>

        {/* Subtítulo: Tiempo, Origen y Dificultad */}
        <div className="text-center pb-2 border-b-2 border-[#8F7347]/20 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs sm:text-sm tracking-[0.25em] uppercase font-bold text-[#7A5E30]">
              ✦ Ficha de Elaboración Gastronómica ✦
            </span>
            {origin && (
              <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E6] border border-[#8F7347]/40 text-[#7A5E30] font-menu-serif">
                📍 {origin}
              </span>
            )}
            {rawRecipe.difficulty && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-menu-serif ${
                rawRecipe.difficulty === 'Difícil'
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : rawRecipe.difficulty === 'Media'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                Dificultad: {rawRecipe.difficulty}
              </span>
            )}
          </div>
          <p className="font-menu-serif text-base sm:text-lg text-[#1C1917] font-bold">
            · Tiempo estimado de cocina: {rawRecipe.prep_time || 15} minutos ·
          </p>
        </div>

        {/* Módulo destacado de Modo Detallado: Consejos del Chef, Sustitutos y Maridaje */}
        {isDetailedMode && (
          <div className="space-y-4 animate-fade-in">
            {chefTips && (
              <div className="bg-[#FAF7F2] border-2 border-[#8F7347] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">👨‍🍳</span>
                  <h3 className="font-menu-title text-base sm:text-lg font-black text-[#1C1917] uppercase tracking-wide">
                    Técnica y Secreto del Chef
                  </h3>
                </div>
                <p className="font-menu-serif text-base sm:text-lg text-[#2E241E] leading-relaxed font-medium">
                  {chefTips}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {substitutes && Object.keys(substitutes).length > 0 && (
                <div className="bg-white border-2 border-[#8F7347]/30 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔄</span>
                    <h3 className="font-menu-title text-sm sm:text-base font-black text-[#1C1917] uppercase tracking-wide">
                      Intercambios y Sustitutos Caseros
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-sm sm:text-base font-menu-serif">
                    {Object.entries(substitutes).map(([orig, sub]) => (
                      <li key={orig} className="flex items-start gap-2">
                        <span className="text-[#8F7347] font-bold">•</span>
                        <span>
                          <strong className="capitalize text-[#7A5E30]">{orig}:</strong>{' '}
                          <span className="text-[#1C1917]">{sub}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pairing && (
                <div className="bg-white border-2 border-[#8F7347]/30 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🍷</span>
                    <h3 className="font-menu-title text-sm sm:text-base font-black text-[#1C1917] uppercase tracking-wide">
                      Maridaje y Acompañamiento
                    </h3>
                  </div>
                  <p className="font-menu-serif text-sm sm:text-base text-[#1C1917] italic leading-relaxed">
                    {pairing}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Columna Izquierda: Comanda de Ingredientes */}
          <section className="menu-card-frame rounded-2xl p-5 sm:p-6 relative animate-stagger-1">
            {/* Esquinas ornamentales */}
            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8F7347] pointer-events-none" />

            <h2 className="font-menu-title text-lg sm:text-xl font-black text-[#1C1917] tracking-wider uppercase mb-3 flex items-center gap-2">
              <span className="text-[#8F7347]">✦</span>
              <span>Comanda de Ingredientes</span>
            </h2>
            <ul className="text-base sm:text-lg text-[#1C1917] leading-relaxed divide-y-2 divide-[#8F7347]/15">
              {allIngredients.length > 0 ? (
                allIngredients.map((ing: string, i: number) => {
                  const isAvailable = matchedIngredients.some(m => isIngredientMatch(m, ing))
                  return (
                    <li key={i} className="py-2.5 flex items-center justify-between">
                      <span className="capitalize font-bold text-[#1C1917] flex items-center gap-2">
                        <span className="text-[#8F7347] text-xs">●</span>
                        {ing}
                      </span>
                      {isAvailable ? (
                        <span className="text-xs sm:text-sm text-[#244220] bg-[#E2F0DC] px-3 py-1 rounded-full border-2 border-[#385333] font-bold">
                          En tu despensa
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm text-[#8F2D14] font-black font-serif">
                          A completar
                        </span>
                      )}
                    </li>
                  )
                })
              ) : (
                <li className="text-[#3A2E26] italic py-2 text-base font-semibold">Ingredientes de temporada</li>
              )}
            </ul>
          </section>

          {/* Columna Derecha: Guía de Elaboración del Chef & Botón de Servicio */}
          <div className="space-y-6 animate-stagger-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-8 bg-[#8F7347]" />
                <h2 className="font-menu-title text-base sm:text-lg font-black text-[#1C1917] uppercase tracking-wider">
                  {isDetailedMode ? 'Pasos Detallados de Elaboración' : 'Pasos de Elaboración'}
                </h2>
                <span className="h-[2px] flex-1 bg-[#8F7347]/30" />
              </div>

              <ol className="text-base sm:text-lg text-[#1C1917] leading-relaxed space-y-3.5">
                {steps.map((step, i) => {
                  const cleanStep = step.replace(/^\d+[\.\)]\s*/, '')
                  return (
                    <li key={i} className="flex gap-3.5 bg-white p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs">
                      <span className="w-8 h-8 rounded-full bg-[#1C1917] text-[#FAF7F2] font-mono text-base font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-[#1C1917] leading-relaxed pt-0.5">{cleanStep}</span>
                    </li>
                  )
                })}
              </ol>
            </section>

            {/* Botón de servicio gastronómico */}
            <div className="pt-2 pb-4">
              <button
                onClick={handleCooked}
                disabled={isPending || hasCooked}
                className="w-full py-4 px-5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] text-base sm:text-lg font-menu-serif tracking-wider font-black rounded-2xl transition disabled:opacity-45 disabled:cursor-not-allowed tap-subtle cursor-pointer text-center border-2 border-[#8F7347] shadow-lg"
              >
                {hasCooked
                  ? '✦ Plato Servido y Registrado con Éxito ✦'
                  : isPending
                  ? 'Anotando en la libreta del chef...'
                  : '✦ He elaborado este plato · Registrar servicio ✦'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
