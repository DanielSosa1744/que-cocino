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
    <div className="h-full max-h-full bg-transparent flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* Botón volver discreto */}
      <div className="px-5 pt-safe pb-2 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-stone-400 hover:text-stone-800 transition cursor-pointer"
        >
          ← Volver
        </button>
      </div>

      {/* Contenido editorial */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-7">
        {/* Encabezado: Título y tiempo */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight leading-snug">
            {rawRecipe.name}
          </h1>
          <p className="text-sm text-stone-500 font-normal mt-1">
            {rawRecipe.prep_time || 15} minutos
          </p>
        </div>

        {/* Ingredientes */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Ingredientes
          </h2>
          <ul className="text-sm text-stone-800 leading-relaxed space-y-1">
            {allIngredients.length > 0 ? (
              allIngredients.map((ing: string, i: number) => (
                <li key={i} className="capitalize">
                  - {ing}
                </li>
              ))
            ) : (
              <li className="text-stone-400 italic">Ingredientes generales</li>
            )}
          </ul>
        </section>

        {/* Pasos */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Pasos
          </h2>
          <ol className="text-sm text-stone-800 leading-relaxed space-y-2">
            {steps.map((step, i) => {
              const cleanStep = step.replace(/^\d+[\.\)]\s*/, '')
              return (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-stone-400 text-xs flex-shrink-0 pt-0.5">
                    {i + 1}.
                  </span>
                  <span>{cleanStep}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      {/* Botón discreto inferior */}
      <div className="px-5 py-3 border-t border-stone-200/50 flex-shrink-0 bg-transparent pb-safe">
        <button
          onClick={handleCooked}
          disabled={isPending || hasCooked}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed tap-subtle cursor-pointer text-center"
        >
          {hasCooked
            ? 'Registrado en tu actividad'
            : isPending
            ? 'Guardando...'
            : 'He cocinado esta receta'}
        </button>
      </div>
    </div>
  )
}
