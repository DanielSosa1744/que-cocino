import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSaveCooked, useVaciarNevera, useRecipes } from '../../hooks/useRecipes'
import { useDeleteIngredient, useInventory } from '../../hooks/useInventory'
import { isIngredientMatch, estimateItemValue } from '../../lib/ingredientParser'
import type { RecipeWithScore } from '../../types/app.types'

export default function RecipeDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const stateRecipe = (location.state as { recipe?: RecipeWithScore })?.recipe

  const { mutateAsync: saveCooked, isPending } = useSaveCooked()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { data: inventory = [] } = useInventory()
  const { data: availableRecipes = [] } = useVaciarNevera(inventory)
  const { data: allRawRecipes = [] } = useRecipes()
  const [hasCooked, setHasCooked] = useState(false)

  const rawRecipe = stateRecipe ||
    availableRecipes.find(r => r.id === id) ||
    allRawRecipes.find(r => r.id === id)

  if (!rawRecipe) {
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

  // Pasos limpios numerados
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

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col justify-between overflow-hidden animate-fade-in text-[#2F2A26]">
      {/* Botón volver discreto */}
      <div className="px-5 pt-safe pb-2.5 flex-shrink-0 flex items-center justify-between border-b border-[#A88B57]/15">
        <button
          onClick={() => navigate(-1)}
          className="font-menu-serif text-sm text-[#8F7347] hover:text-[#1C1917] transition cursor-pointer font-medium flex items-center gap-1.5 tap-subtle"
        >
          <span>←</span>
          <span>Volver a la Carta</span>
        </button>
        <div className="flex items-center gap-1 text-[#A88B57] text-xs">
          <span>—</span>
          <span>✦</span>
          <span>—</span>
        </div>
      </div>

      {/* Contenido editorial estilo Guía del Chef */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">
        {/* Encabezado: Título y tiempo */}
        <div className="text-center pb-3 border-b border-[#A88B57]/20">
          <p className="text-xs tracking-[0.25em] uppercase font-semibold text-[#8F7347] mb-1">
            ✦ Ficha de Elaboración Gastronómica ✦
          </p>
          <h1 className="font-menu-title text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight leading-snug">
            {rawRecipe.name}
          </h1>
          <p className="font-menu-serif italic text-sm sm:text-base text-[#766153] mt-1.5">
            · Tiempo estimado de cocina: {rawRecipe.prep_time || 15} minutos ·
          </p>
        </div>

        {/* Comanda de Ingredientes */}
        <section className="menu-card-frame rounded-2xl p-4 sm:p-5 relative">
          {/* Esquinas ornamentales */}
          <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-[#A88B57]/60 pointer-events-none" />

          <h2 className="font-menu-title text-base font-bold text-[#1C1917] tracking-wider uppercase mb-2.5 flex items-center gap-2">
            <span className="text-[#A88B57]">✦</span>
            <span>Comanda de Ingredientes</span>
          </h2>
          <ul className="text-sm sm:text-base text-[#2F2A26] leading-relaxed divide-y divide-[#A88B57]/10">
            {allIngredients.length > 0 ? (
              allIngredients.map((ing: string, i: number) => {
                const isAvailable = matchedIngredients.some(m => isIngredientMatch(m, ing))
                return (
                  <li key={i} className="py-2 flex items-center justify-between">
                    <span className="capitalize font-medium text-[#1C1917] flex items-center gap-2">
                      <span className="text-[#A88B57] text-[10px]">●</span>
                      {ing}
                    </span>
                    {isAvailable ? (
                      <span className="text-xs text-[#4A6B44] bg-[#EBF1E8] px-2.5 py-0.5 rounded-full font-serif border border-[#4A6B44]/20 font-medium">
                        En tu despensa
                      </span>
                    ) : (
                      <span className="text-xs text-[#A68A64] italic font-serif">
                        A completar
                      </span>
                    )}
                  </li>
                )
              })
            ) : (
              <li className="text-[#766153] italic py-2 text-sm">Ingredientes de temporada</li>
            )}
          </ul>
        </section>

        {/* Guía de Elaboración del Chef */}
        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-6 bg-[#A88B57]/40" />
            <h2 className="font-menu-title text-sm font-bold text-[#8F7347] uppercase tracking-wider">
              Pasos de Elaboración
            </h2>
            <span className="h-[1px] flex-1 bg-[#A88B57]/20" />
          </div>

          <ol className="text-sm sm:text-base text-[#2F2A26] leading-relaxed space-y-3">
            {steps.map((step, i) => {
              const cleanStep = step.replace(/^\d+[\.\)]\s*/, '')
              return (
                <li key={i} className="flex gap-3 bg-[#FCFAF7]/90 p-3.5 rounded-xl border border-[#A88B57]/15">
                  <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#A88B57]/40 text-[#8F7347] font-serif text-xs sm:text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-normal text-[#24201D] leading-relaxed pt-0.5">{cleanStep}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      {/* Botón de servicio gastronómico */}
      <div className="px-5 py-3.5 border-t border-[#A88B57]/20 flex-shrink-0 bg-[#FAF7F2]/90 backdrop-blur-xs pb-safe">
        <button
          onClick={handleCooked}
          disabled={isPending || hasCooked}
          className="w-full py-3.5 px-4 bg-[#24201D] hover:bg-black text-[#FAF7F2] text-sm sm:text-base font-menu-serif tracking-wider font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed tap-subtle cursor-pointer text-center border border-[#A88B57]/40 shadow-sm"
        >
          {hasCooked
            ? '✦ Plato Servido y Registrado con Éxito ✦'
            : isPending
            ? 'Anotando en la libreta del chef...'
            : '✦ He elaborado este plato · Registrar servicio ✦'}
        </button>
      </div>
    </div>
  )
}
