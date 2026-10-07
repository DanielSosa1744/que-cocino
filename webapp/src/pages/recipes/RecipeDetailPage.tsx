import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useSaveCooked, useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { useDeleteIngredient, useInventory } from '../../hooks/useInventory'
import { isIngredientMatch, estimateItemValue } from '../../lib/ingredientParser'
import { localStore } from '../../lib/localStore'
import { registerAbortAction } from '../../lib/actionAbort'
import { buildRecipe4ServingsProfile } from '../../lib/recipeIngredients4Servings'
import GoogleIcon from '../../components/GoogleIcon'
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
  const [activePortionTab, setActivePortionTab] = useState<'todos' | 'especias' | 'principales'>('todos')
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

  // Perfil completo de 4 porciones con especias y técnicas
  const profile4Servings = useMemo(() => {
    return buildRecipe4ServingsProfile(rawRecipe as any)
  }, [rawRecipe])

  // Normalizar los ingredientes de la receta para control de stock
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

  // Filtrado de ingredientes para 4 porciones según la pestaña activa
  const filteredIngredients4Servings = useMemo(() => {
    if (activePortionTab === 'especias') {
      return profile4Servings.ingredients4Servings.filter(item => item.isSpice)
    }
    if (activePortionTab === 'principales') {
      return profile4Servings.ingredients4Servings.filter(item => !item.isSpice)
    }
    return profile4Servings.ingredients4Servings
  }, [profile4Servings, activePortionTab])

  const chefTips = (rawRecipe as any).chef_tips || profile4Servings.chefSecret
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
          {/* Columna Izquierda: Comanda de Ingredientes para 4 Porciones con Especias */}
          <section className="menu-card-frame rounded-2xl p-5 sm:p-6 relative animate-stagger-1 text-left space-y-4">
            {/* Esquinas ornamentales */}
            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#8F7347] pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#8F7347] pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#8F7347]/20 pb-3">
              <div>
                <span className="text-[11px] sm:text-xs tracking-[0.2em] uppercase font-bold text-[#7A5E30] block">
                  ✦ Estandarización de Cocina
                </span>
                <h2 className="font-menu-title text-lg sm:text-xl font-black text-[#1C1917] tracking-wider uppercase flex items-center gap-2">
                  <span className="text-[#8F7347]">✦</span>
                  <span>Ingredientes para 4 Porciones</span>
                </h2>
              </div>
              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#241E19] to-[#120F0C] text-[#FAF2E6] border border-[#C7A971] shadow-2xs">
                🍽 4 comensales
              </span>
            </div>

            {/* Pestañas de filtrado de ingredientes: Todos / Materias Primas / Especias */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5EFE4] rounded-xl border border-[#8F7347]/30 text-xs font-menu-serif font-bold">
              <button
                type="button"
                onClick={() => setActivePortionTab('todos')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activePortionTab === 'todos'
                    ? 'bg-[#1C1917] text-white shadow-xs font-black'
                    : 'text-[#5A483D] hover:text-black'
                }`}
              >
                Todos ({profile4Servings.ingredients4Servings.length})
              </button>
              <button
                type="button"
                onClick={() => setActivePortionTab('principales')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activePortionTab === 'principales'
                    ? 'bg-[#1C1917] text-white shadow-xs font-black'
                    : 'text-[#5A483D] hover:text-black'
                }`}
              >
                Base & Verduras
              </button>
              <button
                type="button"
                onClick={() => setActivePortionTab('especias')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all text-center cursor-pointer ${
                  activePortionTab === 'especias'
                    ? 'bg-[#8F7347] text-white shadow-xs font-black'
                    : 'text-[#7A5E30] hover:text-black'
                }`}
              >
                ✦ Especias ({profile4Servings.spicesSummary.length})
              </button>
            </div>

            {/* Lista exhaustiva y realista con cantidades calculadas para 4 porciones */}
            <ul className="text-sm sm:text-base text-[#1C1917] leading-relaxed divide-y divide-[#8F7347]/15 max-h-[580px] overflow-y-auto pr-1">
              {filteredIngredients4Servings.length > 0 ? (
                filteredIngredients4Servings.map((item, i) => {
                  const isAvailable = matchedIngredients.some(m => isIngredientMatch(m, item.name))

                  return (
                    <li key={i} className="py-2.5 flex items-start justify-between gap-3 group">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${item.isSpice ? 'text-[#8F7347]' : 'text-[#7A5E30]'}`}>
                            {item.isSpice ? '✦' : '●'}
                          </span>
                          <span className="capitalize font-bold text-[#1C1917] text-sm sm:text-base">
                            {item.name}
                          </span>
                          {item.isSpice && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#FAF0E6] text-[#8F7347] border border-[#8F7347]/30 font-bold">
                              especia
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-xs font-menu-serif text-[#6B5749] italic pl-3 mt-0.5">
                            {item.note}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#1C1917] bg-white px-2 py-0.5 rounded border border-[#8F7347]/30 shadow-2xs">
                          {item.amount}
                        </span>
                        {!item.isSpice && (
                          isAvailable ? (
                            <span className="text-[10px] text-[#244220] bg-[#E2F0DC] px-2 py-0.5 rounded-full border border-[#385333]/40 font-bold">
                              ✓ En despensa
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8F2D14] font-serif font-black">
                              A completar
                            </span>
                          )
                        )}
                      </div>
                    </li>
                  )
                })
              ) : (
                <li className="text-[#3A2E26] italic py-3 text-sm">No hay ingredientes en esta sección.</li>
              )}
            </ul>

            {/* Recuadro de Especias y Condimentos recomendados */}
            <div className="bg-[#FAF0E6]/80 p-3 rounded-xl border border-[#8F7347]/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-[#7A5E30] font-black uppercase tracking-wider">
                <GoogleIcon name="eco" size={14} className="text-[#8F7347]" />
                <span>Paleta Aromática de Especias (4 Porciones):</span>
              </div>
              <p className="text-xs sm:text-sm text-[#2E241E] font-menu-serif font-medium leading-relaxed">
                {profile4Servings.spicesSummary.slice(0, 4).join(' · ')}
              </p>
            </div>
          </section>

          {/* Columna Derecha: Pasos Realistas y Detallados de Elaboración */}
          <div className="space-y-6 animate-stagger-2 text-left">
            {/* 1. Pasos de elaboración realistas con control de fuego y tiempos */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-[2px] w-8 bg-[#8F7347]" />
                <h2 className="font-menu-title text-base sm:text-lg font-black text-[#1C1917] uppercase tracking-wider">
                  Instrucciones Realistas de Elaboración (4 Porciones)
                </h2>
                <span className="h-[2px] flex-1 bg-[#8F7347]/30" />
              </div>

              <ol className="text-base text-[#1C1917] leading-relaxed space-y-3.5">
                {profile4Servings.realisticSteps.map((step, i) => (
                  <li key={i} className="flex gap-3.5 bg-white p-4 rounded-xl border-2 border-[#8F7347]/30 shadow-xs hover:border-[#8F7347] transition">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#241E19] to-[#120F0C] text-[#FAF2E6] font-mono text-base font-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs border border-[#C7A971]">
                      {step.stepNumber}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#8F7347]/15 pb-1">
                        <strong className="font-menu-serif text-sm sm:text-base text-[#7A5E30] font-black">
                          {step.title}
                        </strong>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          {step.durationMinutes && (
                            <span className="text-[#5A483D] font-bold">
                              ⏱ {step.durationMinutes} min
                            </span>
                          )}
                          {step.fireLevel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF0E6] text-[#8F7347] border border-[#8F7347]/30 font-bold">
                              🔥 {step.fireLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-[#1C1917] text-sm sm:text-base leading-relaxed pt-0.5">
                        {step.action}
                      </p>
                      <p className="text-xs sm:text-sm font-menu-serif text-[#6B5749] italic bg-[#FAF7F2] p-2 rounded-lg border border-[#8F7347]/20">
                        <span className="font-bold text-[#8F7347]">Detalle técnico: </span>
                        {step.realisticDetails}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* 2. FICHA DETALLADA AL FINAL DE LOS PASOS: Guía minuciosa paso a paso con técnicas y secretos */}
              <div className="pt-4 border-t-2 border-[#8F7347]/30">
                <div className="bg-[#FAF7F2] border-2 border-[#8F7347] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  {/* Encabezado noble de la Ficha Detallada */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#8F7347]/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#241E19] text-[#DDB879] flex items-center justify-center border border-[#C7A971] shadow-2xs">
                        <GoogleIcon name="restaurant" size={20} />
                      </div>
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
                            <span className="text-[#8F7347]">✦</span> Secreto de Fuego & Técnica del Chef:
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
                            <span className="text-[#8F7347]">✦</span> Sustitutos en caso de faltar algún ingrediente:
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
                            <span className="text-[#8F7347]">✦</span> Cómo servir y acompañar:
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
