import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Clock, Users, CheckCircle, Sparkles, ChefHat } from 'lucide-react'
import { useSaveCooked, useVaciarNevera } from '../../hooks/useRecipes'
import { useDeleteIngredient } from '../../hooks/useInventory'
import { useInventory } from '../../hooks/useInventory'
import { isIngredientMatch, estimateItemValue, estimateItemWeightKg } from '../../lib/ingredientParser'
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
  const [cooked, setCooked] = useState(false)

  const recipe = stateRecipe || availableRecipes.find(r => r.id === id)

  if (!recipe) {
    return (
      <div className="min-h-app flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-sm">
          <p className="text-gray-600 font-medium">Receta no especificada.</p>
          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="mt-4 px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm"
          >
            Ir a Vaciar Nevera
          </button>
        </div>
      </div>
    )
  }

  // Pre-calcular impacto real para esta receta
  const matchedInventoryItems = inventory.filter(item =>
    recipe.matchedIngredients.some(ing => isIngredientMatch(item.name, ing))
  )

  let calculatedMoney = 0
  let calculatedWeightKg = 0
  matchedInventoryItems.forEach(item => {
    calculatedMoney += estimateItemValue(item.name, item.quantity ?? 1, item.unit)
    calculatedWeightKg += estimateItemWeightKg(item.name, item.quantity ?? 1, item.unit)
  })

  const moneySavedPreview = calculatedMoney > 0 ? calculatedMoney : recipe.matchedIngredients.length * 1.10
  const wasteAvoidedKgPreview = calculatedWeightKg > 0 ? calculatedWeightKg : recipe.matchedIngredients.length * 0.18
  const co2AvoidedKgPreview = +(wasteAvoidedKgPreview * 2.5).toFixed(2)

  const handleCooked = async () => {
    await saveCooked({
      recipeName: recipe.name,
      recipeId: recipe.id,
      ingredientsUsed: recipe.matchedIngredients,
      wasteAvoidedKg: wasteAvoidedKgPreview,
      moneySavedEur: moneySavedPreview,
      co2AvoidedKg: co2AvoidedKgPreview,
    })

    // Marcar ingredientes consumidos del inventario
    matchedInventoryItems.forEach(item => deleteItem(item.id))

    setCooked(true)
    setTimeout(() => navigate('/impact'), 1800)
  }

  if (cooked) {
    return (
      <div className="min-h-app bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">¡Alimentos salvados!</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Has aprovechado <strong>{recipe.matchedIngredients.length} ingredientes</strong> de tu nevera.
        </p>
        <p className="text-green-600 text-xs font-semibold mt-3 animate-pulse">
          Registrando impacto ambiental y económico...
        </p>
      </div>
    )
  }

  const instructions = recipe.instructions
    ? recipe.instructions.split('\n').filter(l => l.trim())
    : []

  return (
    <div className="h-full max-h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 mb-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Volver</span>
        </button>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Recomendada por vaciado
          </span>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
            {recipe.difficulty}
          </span>
        </div>
        <h1 className="text-lg font-black text-gray-900 leading-tight">{recipe.name}</h1>
        {recipe.description && (
          <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-gray-50">
          <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <Clock className="w-3 h-3 text-orange-500" />
            {recipe.prep_time} min
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <Users className="w-3 h-3 text-blue-500" />
            {recipe.servings} raciones
          </span>
          <span className="flex items-center gap-1 text-[11px] text-green-600 font-bold">
            <Sparkles className="w-3 h-3" />
            Score: {recipe.score}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2.5">
        {/* Resumen de impacto de esta preparación */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-3 text-white shadow-xs">
          <p className="text-[10px] font-bold text-green-100 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <span className="material-symbols-rounded align-middle text-[1.2em] mb-0.5 inline-block">eco</span> Impacto al cocinar esta receta
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
              <p className="text-sm font-black">
                {wasteAvoidedKgPreview.toFixed(2)} kg
              </p>
              <p className="text-[9px] text-green-100 mt-0.5">Comida salvada</p>
            </div>
            <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
              <p className="text-sm font-black">
                {moneySavedPreview.toFixed(2)}€
              </p>
              <p className="text-[9px] text-green-100 mt-0.5">Ahorro est.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
              <p className="text-sm font-black">
                {co2AvoidedKgPreview.toFixed(2)} kg
              </p>
              <p className="text-[9px] text-green-100 mt-0.5">CO₂ evitado</p>
            </div>
          </div>
        </div>

        {/* Ingredientes en tu nevera */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Ingredientes que tienes en casa ({recipe.matchedIngredients.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {recipe.matchedIngredients.map(ing => (
              <span
                key={ing}
                className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg capitalize"
              >
                ✓ {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Ingredientes faltantes */}
        {recipe.missingIngredients.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Ingredientes adicionales ({recipe.missingIngredients.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.missingIngredients.map(ing => (
                <span
                  key={ing}
                  className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg capitalize"
                >
                  + {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pasos de preparación */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-2xs">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5 text-orange-500" />
            Pasos de Preparación
          </p>
          <ol className="space-y-2">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                <p className="pt-0.5">{step.replace(/^\d+\.\s*/, '')}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Botón "¡Lo he cocinado!" */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/95 backdrop-blur-sm border-t border-gray-100 pb-safe">
        <button
          onClick={handleCooked}
          disabled={isPending}
          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-md shadow-green-100 active:scale-98 text-xs"
        >
          {isPending ? 'Registrando en historial...' : (
            <>
              <CheckCircle className="w-4 h-4" />
              ¡Lo he cocinado! (Descontar de nevera)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
