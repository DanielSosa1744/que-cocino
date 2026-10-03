import type { InventoryItem, RecipeWithScore } from '../types/app.types'
import type { RawRecipe } from '../hooks/useRecipes'
import { scoreRecipe, estimateItemValueARS } from './ingredientParser'

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

// Mapa de relaciones culinarias, afinidades e inspiración
const CULINARY_AFFINITIES: Record<string, { relatedKeywords: string[]; categoryName?: string }> = {
  sushi: {
    relatedKeywords: ['roll vegetariano', 'bol de arroz oriental', 'onigiri sencillo', 'ensalada japonesa', 'arroz', 'soja'],
    categoryName: 'Cocina japonesa y oriental',
  },
  japon: {
    relatedKeywords: ['roll vegetariano', 'bol de arroz oriental', 'onigiri sencillo', 'ensalada japonesa'],
    categoryName: 'Cocina japonesa',
  },
  japones: {
    relatedKeywords: ['roll vegetariano', 'bol de arroz oriental', 'onigiri sencillo', 'ensalada japonesa'],
    categoryName: 'Cocina japonesa',
  },
  oriental: {
    relatedKeywords: ['bol de arroz oriental', 'roll vegetariano', 'onigiri sencillo', 'ensalada japonesa'],
    categoryName: 'Cocina oriental',
  },
  asiatico: {
    relatedKeywords: ['bol de arroz oriental', 'roll vegetariano', 'onigiri sencillo', 'ensalada japonesa'],
    categoryName: 'Cocina oriental',
  },
  ramen: {
    relatedKeywords: ['bol de arroz oriental', 'pasta mediterranea', 'crema suave de zanahoria'],
    categoryName: 'Platos orientales reconfortantes',
  },
  pizza: {
    relatedKeywords: ['pizza casera de sarten', 'tosta de queso y tomate', 'pasta mediterranea', 'harina', 'queso'],
    categoryName: 'Cocina italiana y masas',
  },
  hamburguesa: {
    relatedKeywords: ['hamburguesa casera clasica', 'milanesa crocante con guarnicion', 'salteado de pollo', 'tosta de queso y tomate'],
    categoryName: 'Comida rápida casera',
  },
  burger: {
    relatedKeywords: ['hamburguesa casera clasica', 'milanesa crocante con guarnicion', 'salteado de pollo'],
    categoryName: 'Comida rápida casera',
  },
  empanada: {
    relatedKeywords: ['empanadas criollas al horno', 'tortilla de patatas clasica', 'tortilla', 'revuelto'],
    categoryName: 'Tradición y masas',
  },
  milanesa: {
    relatedKeywords: ['milanesa crocante con guarnicion', 'salteado de pollo con verduras', 'tortilla de patatas clasica'],
    categoryName: 'Clásicos caseros',
  },
  pasta: {
    relatedKeywords: ['pasta mediterranea', 'arroz con verduras', 'pizza casera de sarten'],
    categoryName: 'Pastas y cereales',
  },
  fideo: {
    relatedKeywords: ['pasta mediterranea', 'bol de arroz oriental'],
    categoryName: 'Pastas y cereales',
  },
  espagueti: {
    relatedKeywords: ['pasta mediterranea', 'pizza casera de sarten'],
    categoryName: 'Pastas y cereales',
  },
  pollo: {
    relatedKeywords: ['salteado de pollo con verduras', 'milanesa crocante con guarnicion', 'onigiri sencillo'],
    categoryName: 'Carnes blancas',
  },
  carne: {
    relatedKeywords: ['hamburguesa casera clasica', 'empanadas criollas al horno', 'milanesa crocante'],
    categoryName: 'Carnes',
  },
  taco: {
    relatedKeywords: ['salteado de pollo con verduras', 'tosta de queso y tomate', 'empanadas criollas al horno'],
    categoryName: 'Comida rápida y bocados',
  },
  burrito: {
    relatedKeywords: ['salteado de pollo con verduras', 'roll vegetariano', 'empanadas criollas al horno'],
    categoryName: 'Bocados envueltos',
  },
  postre: {
    relatedKeywords: ['bol de yogur con fruta'],
    categoryName: 'Postres y meriendas',
  },
  dulce: {
    relatedKeywords: ['bol de yogur con fruta'],
    categoryName: 'Postres y meriendas',
  },
  sopa: {
    relatedKeywords: ['crema suave de zanahoria', 'arroz con verduras'],
    categoryName: 'Sopas y cremas',
  },
  guiso: {
    relatedKeywords: ['arroz con verduras', 'crema suave de zanahoria'],
    categoryName: 'Platos de cuchara',
  },
  ensalada: {
    relatedKeywords: ['ensalada', 'ensalada japonesa', 'roll vegetariano', 'tosta de queso y tomate'],
    categoryName: 'Platos frescos',
  },
  vegetariano: {
    relatedKeywords: ['roll vegetariano', 'arroz con verduras', 'ensalada', 'crema suave de zanahoria', 'tortilla'],
    categoryName: 'Platos vegetarianos',
  },
}

function scoreAndFormatRecipes(
  recipes: RawRecipe[],
  inventory: InventoryItem[]
): RecipeWithCost[] {
  const scored = recipes.map(recipe => {
    const recipeIngredientNames = (recipe.recipe_ingredients || []).map(ri => ri.ingredient_name)
    const { score, urgentUsed, totalUsed, priority, matched, missing } = scoreRecipe(
      recipeIngredientNames,
      inventory.map(i => ({ name: i.name, urgency: i.urgency }))
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
  // 1. Mayor cantidad de ingredientes disponibles
  // 2. Mayor aprovechamiento de ingredientes próximos a vencer
  // 3. Menor coste adicional en ARS
  // 4. Menor tiempo de preparación
  return scored.sort((a, b) => {
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
  inventory: InventoryItem[]
): CravingResult {
  const cleanTerm = query.trim()
  if (!cleanTerm) {
    // Si no hay término aún, devolver las 4 recetas más compatibles de la despensa como sugerencia inicial
    const formatted = scoreAndFormatRecipes(allRawRecipes, inventory).slice(0, 4)
    return {
      recipes: formatted,
      isAlternative: false,
      displayTerm: '',
      notice: null,
    }
  }

  const normQuery = normalize(cleanTerm)
  const singularQuery = singularizeTerm(cleanTerm)

  // 1. Búsqueda exacta: nombre de la receta contiene directamente el término
  const exactMatches = allRawRecipes.filter(r => {
    const normName = normalize(r.name)
    return normName.includes(normQuery) || normName.includes(singularQuery)
  })

  if (exactMatches.length > 0) {
    const formatted = scoreAndFormatRecipes(exactMatches, inventory).slice(0, 4)
    return {
      recipes: formatted,
      isAlternative: false,
      displayTerm: cleanTerm,
      notice: null,
    }
  }

  // 2. Búsqueda relacionada / inspirada según afinidades culinarias
  let relatedCandidates: RawRecipe[] = []

  // Revisar tabla de afinidad directa
  const affinityKey = Object.keys(CULINARY_AFFINITIES).find(
    k => normQuery.includes(k) || singularQuery.includes(k) || k.includes(normQuery)
  )

  if (affinityKey) {
    const { relatedKeywords } = CULINARY_AFFINITIES[affinityKey]
    relatedCandidates = allRawRecipes.filter(r => {
      const normName = normalize(r.name)
      const normDesc = normalize(r.description || '')
      const hasKeyword = relatedKeywords.some(kw => {
        const normKw = normalize(kw)
        return normName.includes(normKw) || normDesc.includes(normKw)
      })
      const hasIngredient = (r.recipe_ingredients || []).some(ri => {
        const normIng = normalize(ri.ingredient_name)
        return relatedKeywords.some(kw => normIng.includes(normalize(kw)))
      })
      return hasKeyword || hasIngredient
    })
  }

  // 3. Si no hay candidatos por afinidad directa, buscar por coincidencia en ingredientes o descripción
  if (relatedCandidates.length === 0) {
    relatedCandidates = allRawRecipes.filter(r => {
      const normDesc = normalize(r.description || '')
      const ingMatch = (r.recipe_ingredients || []).some(ri => {
        const normIng = normalize(ri.ingredient_name)
        return normIng.includes(normQuery) || normIng.includes(singularQuery)
      })
      return normDesc.includes(normQuery) || normDesc.includes(singularQuery) || ingMatch
    })
  }

  // 4. Si aún no hay candidatos (antojo libre no catalogado), tomar las mejores recetas de la despensa
  // NUNCA devolver lista vacía: El usuario siempre recibe sugerencias útiles.
  if (relatedCandidates.length === 0) {
    relatedCandidates = [...allRawRecipes]
  }

  const formatted = scoreAndFormatRecipes(relatedCandidates, inventory).slice(0, 4)

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
