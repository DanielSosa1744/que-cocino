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
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
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

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepNum)) next.delete(stepNum)
      else next.add(stepNum)
      return next
    })
  }

  if (!rawRecipe) {
    if (isLoadingVaciar || isLoadingRecipes) {
      return (
        <div className="h-full max-h-full bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-600 text-sm">Cargando receta...</p>
        </div>
      )
    }

    return (
      <div className="h-full max-h-full bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-stone-500 text-sm mb-4">Receta no encontrada.</p>
        <button
          onClick={() => navigate('/recetas')}
          className="text-sm font-medium text-stone-800 underline underline-offset-2 hover:text-black transition cursor-pointer"
        >
          Volver a recetas
        </button>
      </div>
    )
  }

  // Perfil calculado para 4 porciones
  const profile4Servings = useMemo(() => {
    return buildRecipe4ServingsProfile(rawRecipe as any)
  }, [rawRecipe])

  // Normalizar ingredientes para deducción de stock
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

  const matchedInventoryItems = inventory.filter(item =>
    matchedIngredients.some(ing => isIngredientMatch(item.name, ing))
  )

  const handleCooked = async () => {
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

    matchedInventoryItems.forEach(item => deleteItem(item.id))

    setHasCooked(true)
    if (cookedTimerRef.current) clearTimeout(cookedTimerRef.current)
    cookedTimerRef.current = setTimeout(() => {
      navigate('/impact')
    }, 1200)
  }

  const chefTips = (rawRecipe as any).chef_tips || profile4Servings.chefSecret
  const substitutes = (rawRecipe as any).substitutes as Record<string, string> | undefined
  const pairing = (rawRecipe as any).pairing as string | undefined
  const origin = (rawRecipe as any).origin as string | undefined

  return (
    <div className="h-full max-h-full bg-[#FAF8F5] flex flex-col overflow-hidden text-stone-900">
      {/* Encabezado limpio y minimalista */}
      <header className="px-4 sm:px-6 pt-safe pb-3 bg-white/95 backdrop-blur-md border-b border-stone-200/80 flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5 text-sm font-medium cursor-pointer tap-subtle"
          >
            <GoogleIcon name="arrow_back" size={18} />
            <span>Volver a recetas</span>
          </button>
          {rawRecipe.difficulty && (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              rawRecipe.difficulty === 'Difícil'
                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                : rawRecipe.difficulty === 'Media'
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
            }`}>
              Dificultad: {rawRecipe.difficulty}
            </span>
          )}
        </div>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-snug">
            {rawRecipe.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1">
              <GoogleIcon name="schedule" size={16} className="text-stone-400" />
              {rawRecipe.prep_time || 15} minutos
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <GoogleIcon name="group" size={16} className="text-stone-400" />
              4 porciones
            </span>
            {origin && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <GoogleIcon name="location_on" size={16} className="text-stone-400" />
                  {origin}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal con lectura limpia y sin distracciones */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto">
          {/* Columna de Ingredientes: Lista sencilla, clara y marcable */}
          <section className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-6 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  Ingredientes
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Para 4 porciones · Toca para tachar lo preparado
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                {checkedIngredients.size}/{profile4Servings.ingredients4Servings.length}
              </span>
            </div>

            <ul className="divide-y divide-stone-100">
              {profile4Servings.ingredients4Servings.map((item, idx) => {
                const isChecked = checkedIngredients.has(idx)
                const isAvailable = matchedIngredients.some(m => isIngredientMatch(m, item.name))

                return (
                  <li
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`py-3 flex items-start justify-between gap-3 cursor-pointer select-none transition-colors group ${
                      isChecked ? 'opacity-40' : 'hover:bg-stone-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                        isChecked
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'border-stone-300 group-hover:border-stone-400 bg-white'
                      }`}>
                        {isChecked && <GoogleIcon name="check" size={13} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-sm sm:text-base block capitalize text-stone-900 ${
                          isChecked ? 'line-through text-stone-400' : 'font-medium'
                        }`}>
                          {item.name}
                        </span>
                        {item.note && (
                          <span className="text-xs text-stone-400 block truncate mt-0.5">
                            {item.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                      <span className="text-xs sm:text-sm font-semibold text-stone-800">
                        {item.amount}
                      </span>
                      {isAvailable ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          En despensa
                        </span>
                      ) : !item.isSpice ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Falta
                        </span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Columna de Preparación: Pasos legibles sin distracciones */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <section className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                    Preparación
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Sigue cada paso con tranquilidad mientras cocinas
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                  {completedSteps.size}/{profile4Servings.realisticSteps.length} completados
                </span>
              </div>

              <ol className="space-y-3.5">
                {profile4Servings.realisticSteps.map((step) => {
                  const isDone = completedSteps.has(step.stepNumber)

                  return (
                    <li
                      key={step.stepNumber}
                      onClick={() => toggleStep(step.stepNumber)}
                      className={`p-4 sm:p-4.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-stone-50/70 border-stone-200/60 opacity-50'
                          : 'bg-white border-stone-200/80 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all mt-0.5 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 text-white'
                        }`}>
                          {isDone ? <GoogleIcon name="check" size={16} /> : step.stepNumber}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className={`font-bold text-sm sm:text-base ${
                              isDone ? 'line-through text-stone-400' : 'text-stone-900'
                            }`}>
                              {step.title}
                            </span>
                            {(step.durationMinutes || step.fireLevel) && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                                {step.durationMinutes && <span>⏱ {step.durationMinutes} min</span>}
                                {step.durationMinutes && step.fireLevel && <span>•</span>}
                                {step.fireLevel && <span>{step.fireLevel}</span>}
                              </div>
                            )}
                          </div>

                          <p className={`text-sm sm:text-base leading-relaxed ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-700'
                          }`}>
                            {step.action}
                          </p>

                          {step.realisticDetails && !isDone && (
                            <p className="text-xs text-stone-500 pt-1 leading-normal">
                              <span className="font-semibold text-stone-600">Consejo:</span> {step.realisticDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>

            {/* Consejos adicionales si existen (discretos y sin ruido visual) */}
            {(chefTips || (substitutes && Object.keys(substitutes).length > 0) || pairing) && (
              <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm text-stone-600">
                <div className="flex items-center gap-1.5 text-stone-800 font-bold text-sm">
                  <GoogleIcon name="lightbulb" size={18} className="text-amber-500" />
                  <span>Notas y recomendaciones</span>
                </div>
                {chefTips && (
                  <p className="leading-relaxed">
                    <strong className="text-stone-800">Técnica:</strong> {chefTips}
                  </p>
                )}
                {substitutes && Object.keys(substitutes).length > 0 && (
                  <div>
                    <strong className="text-stone-800">Sustitutos:</strong>{' '}
                    {Object.entries(substitutes).map(([k, v]) => `${k} (${v})`).join(' · ')}
                  </div>
                )}
                {pairing && (
                  <p>
                    <strong className="text-stone-800">Acompañamiento:</strong> {pairing}
                  </p>
                )}
              </div>
            )}

            {/* Botón de acción: Registrar plato cocinado */}
            <div className="pt-2">
              <button
                onClick={handleCooked}
                disabled={isPending || hasCooked}
                className="w-full py-3.5 px-5 bg-stone-900 hover:bg-black text-white text-sm sm:text-base font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center gap-2 tap-subtle"
              >
                {hasCooked ? (
                  <>
                    <GoogleIcon name="check_circle" size={18} className="text-emerald-400" />
                    <span>¡Plato registrado con éxito!</span>
                  </>
                ) : isPending ? (
                  <span>Registrando servicio...</span>
                ) : (
                  <>
                    <GoogleIcon name="skillet" size={18} />
                    <span>He elaborado este plato · Registrar y descontar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
