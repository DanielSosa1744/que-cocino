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
      <div className="px-5 pt-safe pb-2.5 flex-shrink-0 flex items-center justify-between border-b border-[#A88B57]/20">
        <button
          onClick={() => navigate(-1)}
          className="font-menu-serif text-base text-[#8F7347] hover:text-[#1C1917] transition cursor-pointer font-bold flex items-center gap-1.5 tap-subtle"
        >
          <span>←</span>
          <span>Volver a la Carta</span>
        </button>
        <div className="flex items-center gap-1.5 text-[#A88B57] text-sm">
          <span>—</span>
          <span>✦</span>
          <span>—</span>
        </div>
      </div>

      {/* Contenido editorial estilo Guía del Chef */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">
        {/* Encabezado: Título y tiempo */}
        <div className="text-center pb-3 border-b border-[#A88B57]/20">
          <p className="text-xs sm:text-sm tracking-[0.25em] uppercase font-bold text-[#8F7347] mb-1.5">
            ✦ Ficha de Elaboración Gastronómica ✦
          </p>
          <h1 className="font-menu-title text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight leading-snug">
            {rawRecipe.name}
          </h1>
          <p className="font-menu-serif text-base sm:text-lg text-[#5A483D] mt-2 font-medium">
            · Tiempo estimado de cocina: {rawRecipe.prep_time || 15} minutos ·
          </p>
        </div>

        {/* Comanda de Ingredientes */}
        <section className="menu-card-frame rounded-2xl p-5 sm:p-6 relative">
          {/* Esquinas ornamentales */}
          <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-[#A88B57]/60 pointer-events-none" />

          <h2 className="font-menu-title text-lg sm:text-xl font-extrabold text-[#1C1917] tracking-wider uppercase mb-3 flex items-center gap-2">
            <span className="text-[#A88B57]">✦</span>
            <span>Comanda de Ingredientes</span>
          </h2>
          <ul className="text-base sm:text-lg text-[#2F2A26] leading-relaxed divide-y divide-[#A88B57]/15">
            {allIngredients.length > 0 ? (
              allIngredients.map((ing: string, i: number) => {
                const isAvailable = matchedIngredients.some(m => isIngredientMatch(m, ing))
                return (
                  <li key={i} className="py-2.5 flex items-center justify-between">
                    <span className="capitalize font-semibold text-[#1C1917] flex items-center gap-2">
                      <span className="text-[#A88B57] text-xs">●</span>
                      {ing}
                    </span>
                    {isAvailable ? (
                      <span className="text-xs sm:text-sm text-[#385333] bg-[#EBF1E8] px-3 py-1 rounded-full border border-[#5D7A56]/30 font-bold">
                        En tu despensa
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm text-[#8F7347] font-semibold font-serif">
                        A completar
                      </span>
                    )}
                  </li>
                )
              })
            ) : (
              <li className="text-[#766153] italic py-2 text-base">Ingredientes de temporada</li>
            )}
          </ul>
        </section>

        {/* Guía de Elaboración del Chef */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-[1.5px] w-8 bg-[#A88B57]/40" />
            <h2 className="font-menu-title text-base sm:text-lg font-extrabold text-[#8F7347] uppercase tracking-wider">
              Pasos de Elaboración
            </h2>
            <span className="h-[1.5px] flex-1 bg-[#A88B57]/20" />
          </div>

          <ol className="text-base sm:text-lg text-[#2F2A26] leading-relaxed space-y-3.5">
            {steps.map((step, i) => {
              const cleanStep = step.replace(/^\d+[\.\)]\s*/, '')
              return (
                <li key={i} className="flex gap-3.5 bg-[#FCFAF7]/95 p-4 rounded-xl border border-[#A88B57]/20">
                  <span className="w-7 h-7 rounded-full bg-[#FAF7F2] border-2 border-[#A88B57]/50 text-[#8F7347] font-serif text-sm sm:text-base font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-medium text-[#1C1917] leading-relaxed pt-0.5">{cleanStep}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      {/* Botón de servicio gastronómico */}
      <div className="px-5 py-4 border-t border-[#A88B57]/25 flex-shrink-0 bg-[#FAF7F2]/95 backdrop-blur-xs pb-safe">
        <button
          onClick={handleCooked}
          disabled={isPending || hasCooked}
          className="w-full py-4 px-5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] text-base sm:text-lg font-menu-serif tracking-wider font-bold rounded-2xl transition disabled:opacity-45 disabled:cursor-not-allowed tap-subtle cursor-pointer text-center border-2 border-[#A88B57]/50 shadow-md"
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
