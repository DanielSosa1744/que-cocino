import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useSaveCooked, useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { useDeleteIngredient, useInventory } from '../../hooks/useInventory'
import { isIngredientMatch, estimateItemValue } from '../../lib/ingredientParser'
import { localStore } from '../../lib/localStore'
import { registerAbortAction } from '../../lib/actionAbort'
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
  const [isDetailedExpanded, setIsDetailedExpanded] = useState(true)
  const cookedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unregister = registerAbortAction(() => {
      if (cookedTimerRef.current) {
        clearTimeout(cookedTimerRef.current)
        cookedTimerRef.current = null
      }
      setHasCooked(false)
    })

    return () => {
      unregister()
      if (cookedTimerRef.current) clearTimeout(cookedTimerRef.current)
    }
  }, [])

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
    if (cookedTimerRef.current) clearTimeout(cookedTimerRef.current)
    cookedTimerRef.current = setTimeout(() => {
      navigate('/impact')
    }, 1200)
  }

  // Pasos sintéticos numerados de la receta
  const steps = rawRecipe.instructions
    ? rawRecipe.instructions
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    : [
        'Preparar y limpiar los ingredientes.',
        'Cocinar a fuego medio según la preparación.',
        'Servir caliente y disfrutar.',
      ]

  const chefTips = (rawRecipe as any).chef_tips
  const substitutes = (rawRecipe as any).substitutes as Record<string, string> | undefined
  const pairing = (rawRecipe as any).pairing as string | undefined
  const origin = (rawRecipe as any).origin as string | undefined

  // Pasos detallados y técnicas culinarias paso a paso
  const detailedGuideSteps = useMemo(() => {
    const rawDetailed = (rawRecipe as any).detailed_steps
    if (Array.isArray(rawDetailed) && rawDetailed.length > 0) {
      return rawDetailed.map((item: string, idx: number) => {
        const colonIndex = item.indexOf(':')
        if (colonIndex > 0) {
          return {
            title: item.slice(0, colonIndex).trim(),
            detail: item.slice(colonIndex + 1).trim(),
          }
        }
        return {
          title: `Paso Técnico ${idx + 1}`,
          detail: item.trim(),
        }
      })
    }

    // Guía pedagógica minuciosa paso a paso con técnicas del chef
    const cleanSteps = (rawRecipe.instructions || '')
      .split('\n')
      .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean)

    if (cleanSteps.length === 0) {
      return [
        {
          title: 'Paso 1 · Preparación previa y mise en place',
          detail: 'Lava, pela y corta todos los ingredientes antes de encender el fuego. Tener todo cortado y medido sobre la mesada evita distracciones y quemaduras.',
        },
        {
          title: 'Paso 2 · Manejo del fuego y cocción',
          detail: 'Cocina a fuego medio constante. Si notas que la preparación humea o salpica fuerte, reduce la llama de inmediato.',
        },
        {
          title: 'Paso 3 · Punto de sal y reposo',
          detail: 'Prueba una pequeña muestra antes de apagar. Deja reposar 1 a 2 minutos fuera del fuego antes de servir para integrar los jugos.',
        },
      ]
    }

    return cleanSteps.map((step, idx) => {
      if (idx === 0) {
        return {
          title: `Paso ${idx + 1} · Preparación de ingredientes y fuego inicial`,
          detail: `${step} — Consejo práctico: Corta todos los alimentos en tamaños similares para que se cocinen al mismo tiempo sin que queden partes crudas ni quemadas.`,
        }
      }
      if (idx === cleanSteps.length - 1) {
        return {
          title: `Paso ${idx + 1} · Punto final de cocción, sazón y reposo`,
          detail: `${step} — Consejo práctico: Verifica que el centro esté bien caliente, prueba el punto de sal y apaga la hornalla. Deja reposar la comida 2 minutos fuera del fuego antes de emplatar.`,
        }
      }
      return {
        title: `Paso ${idx + 1} · Cocción y control de temperatura`,
        detail: `${step} — Consejo práctico: Mantén fuego medio o medio-bajo. Si notas que la base se seca con rapidez, agrega 2 cucharadas de agua, caldo o manteca para cuidar el fondo.`,
      }
    })
  }, [rawRecipe])

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

      {/* Todo el resto de la página se desplaza: tiempo, ingredientes, pasos y al final la ficha detallada */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 pb-12 space-y-5">
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

          {/* Columna Derecha: Pasos de Elaboración & Ficha Detallada al Final */}
          <div className="space-y-6 animate-stagger-2">
            {/* 1. Pasos directos de elaboración */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-8 bg-[#8F7347]" />
                <h2 className="font-menu-title text-base sm:text-lg font-black text-[#1C1917] uppercase tracking-wider">
                  Pasos de Elaboración
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

              {/* 2. FICHA DETALLADA AL FINAL DE LOS PASOS: Guía minuciosa paso a paso con técnicas y secretos */}
              <div className="pt-4 border-t-2 border-[#8F7347]/30">
                <div className="bg-[#FAF7F2] border-2 border-[#8F7347] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  {/* Encabezado noble de la Ficha Detallada */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#8F7347]/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">👨‍🍳</span>
                      <div>
                        <h3 className="font-menu-title text-base sm:text-lg font-black text-[#1C1917] uppercase tracking-wide">
                          Ficha Detallada del Chef
                        </h3>
                        <p className="font-menu-serif text-xs sm:text-sm text-[#7A5E30] font-bold">
                          Guía minuciosa paso a paso con técnicas y secretos de cocina
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDetailedExpanded(prev => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-white border-2 border-[#8F7347] text-[#1C1917] font-menu-serif text-xs sm:text-sm font-black hover:bg-[#FAF7F2] transition cursor-pointer shadow-xs tap-subtle"
                    >
                      {isDetailedExpanded ? '▲ Plegar guía detallada' : '✦ Desplegar guía paso a paso'}
                    </button>
                  </div>

                  {/* Contenido detallado paso a paso */}
                  {isDetailedExpanded && (
                    <div className="space-y-4 animate-fade-in text-left">
                      {/* Desglose exhaustivo de los pasos de cocina */}
                      <div>
                        <h4 className="font-menu-title text-sm sm:text-base font-black text-[#1C1917] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span className="text-[#8F7347]">✦</span>
                          <span>Pasos de Cocina Explicados en Detalle:</span>
                        </h4>
                        <div className="space-y-3">
                          {detailedGuideSteps.map((dStep, idx) => (
                            <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#8F7347] text-white font-mono text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                                  {idx + 1}
                                </span>
                                <div className="text-sm sm:text-base font-menu-serif text-[#1C1917] leading-relaxed">
                                  <strong className="text-[#7A5E30] block mb-1 font-black">
                                    {dStep.title}
                                  </strong>
                                  <p className="font-medium text-[#2E241E]">
                                    {dStep.detail}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Secretos del Chef: Control del fuego y temperatura */}
                      {chefTips && (
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs">
                          <h4 className="font-menu-title text-xs sm:text-sm font-black text-[#7A5E30] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span>💡</span> Secreto de Fuego & Técnica del Chef:
                          </h4>
                          <p className="font-menu-serif text-sm sm:text-base text-[#1C1917] font-medium leading-relaxed">
                            {chefTips}
                          </p>
                        </div>
                      )}

                      {/* Sustitutos caseros si falta algún ingrediente */}
                      {substitutes && Object.keys(substitutes).length > 0 && (
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs">
                          <h4 className="font-menu-title text-xs sm:text-sm font-black text-[#7A5E30] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <span>🔄</span> Sustitutos en caso de faltar algún ingrediente:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(substitutes).map(([orig, sub]) => (
                              <span key={orig} className="text-xs sm:text-sm bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#8F7347]/30 text-[#1C1917]">
                                <strong className="capitalize text-[#7A5E30]">{orig}:</strong> {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Maridaje y acompañamiento sugerido */}
                      {pairing && (
                        <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs">
                          <h4 className="font-menu-title text-xs sm:text-sm font-black text-[#7A5E30] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <span>🍷</span> Cómo servir y acompañar:
                          </h4>
                          <p className="font-menu-serif text-sm sm:text-base text-[#1C1917] italic leading-relaxed">
                            {pairing}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Botón de servicio gastronómico */}
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
