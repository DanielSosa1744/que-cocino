import type { InventoryItem, RecipeWithScore } from '../types/app.types'
import type { RawRecipe } from '../hooks/useRecipes'
import { scoreRecipe, estimateItemValueARS } from './ingredientParser'
import { resolveCulinaryIntent } from './culinaryTaxonomy'

export interface RecipeWithCost extends RecipeWithScore {
  additionalCostARS: number
}

export interface CravingResult {
  recipes: RecipeWithCost[]
  isAlternative: boolean
  displayTerm: string
  notice: {
    title: string
    subtitle: string
  } | null
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function singularizeTerm(term: string): string {
  const norm = normalize(term)
  if (norm.endsWith('es')) return norm.slice(0, -2)
  if (norm.endsWith('s') && !norm.endsWith('is')) return norm.slice(0, -1)
  return norm
}

function scoreAndFormatRecipes(
  recipes: RawRecipe[],
  inventory: InventoryItem[],
  recentIngredientNames: string[] = []
): RecipeWithCost[] {
  const scored = recipes.map(recipe => {
    const recipeIngredientNames = (recipe.recipe_ingredients || []).map(ri => ri.ingredient_name)
    const { score, recentUsed, importanceScore, dominantImportance, urgentUsed, totalUsed, priority, matched, missing } = scoreRecipe(
      recipeIngredientNames,
      inventory.map(i => ({ name: i.name, urgency: i.urgency })),
      recentIngredientNames
    )
    const additionalCostARS = missing.reduce((sum, ing) => sum + estimateItemValueARS(ing, 1), 0)

    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      difficulty: (recipe.difficulty as 'Fácil' | 'Media' | 'Difícil') || 'Fácil',
      prep_time: recipe.prep_time || 15,
      instructions: recipe.instructions,
      servings: recipe.servings || 2,
      score,
      recentIngredientsUsed: recentUsed,
      importanceScore,
      dominantImportance,
      urgentIngredientsUsed: urgentUsed,
      totalIngredientsUsed: totalUsed,
      matchPercentage: recipeIngredientNames.length > 0 ? Math.round((matched.length / recipeIngredientNames.length) * 100) : 0,
      priority,
      matchedIngredients: matched,
      missingIngredients: missing,
      additionalCostARS,
    }
  })

  // Prioridad:
  // 1. Mayor cantidad de ingredientes RECIENTES utilizados
  // 2. Jerarquía e importancia culinaria (carne/proteína > verdura/cebolla)
  // 3. Score ponderado
  // 4. Mayor cantidad de ingredientes disponibles en despensa
  // 5. Mayor aprovechamiento de ingredientes próximos a vencer
  // 6. Menor coste adicional en ARS
  // 7. Menor tiempo de preparación
  return scored.sort((a, b) => {
    const recentA = a.recentIngredientsUsed ?? 0
    const recentB = b.recentIngredientsUsed ?? 0
    if (recentB !== recentA) {
      return recentB - recentA
    }
    const domA = a.dominantImportance ?? 0
    const domB = b.dominantImportance ?? 0
    if (domB !== domA) {
      return domB - domA
    }
    const impA = a.importanceScore ?? 0
    const impB = b.importanceScore ?? 0
    if (impB !== impA) {
      return impB - impA
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
  })
}

/**
 * Busca recetas basadas en el antojo del usuario garantizando:
 * 1. Búsqueda exacta.
 * 2. Si no hay, búsqueda relacionada / inspirada.
 * 3. Si no hay, misma categoría culinaria.
 * 4. NUNCA lista vacía ni "No encontramos recetas": siempre devuelve alternativas útiles del almacén.
 */
export function matchCravingRecipes(
  query: string,
  allRawRecipes: RawRecipe[],
  inventory: InventoryItem[],
  recentIngredientNames: string[] = []
): CravingResult {
  const cleanTerm = query.trim()
  if (!cleanTerm) {
    // Si no hay término aún, devolver las 4 recetas más compatibles de la despensa como sugerencia inicial
    const formatted = scoreAndFormatRecipes(allRawRecipes, inventory, recentIngredientNames).slice(0, 4)
    return {
      recipes: formatted,
      isAlternative: false,
      displayTerm: '',
      notice: null,
    }
  }

  const normQuery = normalize(cleanTerm)
  const singularQuery = singularizeTerm(cleanTerm)
  const culinaryIntent = resolveCulinaryIntent(cleanTerm)

  // 1. Búsqueda exacta: nombre de la receta contiene directamente el término
  const exactMatches = allRawRecipes.filter(r => {
    const normName = normalize(r.name)
    return normName.includes(normQuery) || normName.includes(singularQuery)
  })

  if (exactMatches.length > 0) {
    const formatted = scoreAndFormatRecipes(exactMatches, inventory, recentIngredientNames).slice(0, 4)
    return {
      recipes: formatted,
      isAlternative: false,
      displayTerm: cleanTerm,
      notice: null,
    }
  }

  // 2. Búsqueda por intención culinaria expandida
  // Ejemplos:
  // "Sushi" -> busca ['sushi', 'maki', 'nigiri', 'onigiri', 'poke', 'poké', 'comida japonesa', 'temaki', 'uramaki', 'sashimi', 'chirashi', 'edamame', 'roll']
  // "Pizza" -> busca ['pizza', 'calzone', 'focaccia', 'masa italiana', 'stromboli', 'pizzeta', 'pan pizza', 'bruschetta']
  // "Hamburguesa" -> busca ['hamburguesa', 'burger', 'cheeseburger', 'medallon', 'smash burger', 'sandwich', 'lomito']
  const intentCandidates = allRawRecipes.filter(r => {
    const normName = normalize(r.name)
    const normDesc = normalize(r.description || '')
    const hasTokenInNameOrDesc = culinaryIntent.intentTokens.some(token => {
      const normToken = normalize(token)
      return normName.includes(normToken) || normDesc.includes(normToken)
    })
    const hasTokenInIngredients = (r.recipe_ingredients || []).some(ri => {
      const normIng = normalize(ri.ingredient_name)
      return culinaryIntent.intentTokens.some(token => normIng.includes(normalize(token)))
    })
    return hasTokenInNameOrDesc || hasTokenInIngredients
  })

  let finalCandidates: RawRecipe[] = intentCandidates

  // 3. Si no hay candidatos por intención específica, buscar por categoría culinaria afinada
  if (finalCandidates.length === 0 && culinaryIntent.matchedCategory) {
    const keywords = culinaryIntent.matchedCategory.representativeKeywords
    finalCandidates = allRawRecipes.filter(r => {
      const normName = normalize(r.name)
      const normDesc = normalize(r.description || '')
      return keywords.some(kw => normName.includes(normalize(kw)) || normDesc.includes(normalize(kw)))
    })
  }

  // 4. Si aún no hay candidatos (antojo libre no catalogado), tomar las mejores recetas de la despensa
  // Regla fundamental: NUNCA mostrar "No encontramos recetas", siempre sugerir alternativas útiles
  if (finalCandidates.length === 0) {
    finalCandidates = [...allRawRecipes]
  }

  const formatted = scoreAndFormatRecipes(finalCandidates, inventory, recentIngredientNames).slice(0, 4)

  return {
    recipes: formatted,
    isAlternative: true,
    displayTerm: cleanTerm,
    notice: {
      title: `No tenemos recetas exactas para ${cleanTerm}.`,
      subtitle: 'Estas alternativas se parecen y podrían interesarte.',
    },
  }
}
