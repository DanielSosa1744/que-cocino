// Motor de Clasificación, Categorización y Filtrado por Preferencias Culinarias
// Soporta categorías por base (Carnes, Verduras, Pastas) y estilos de vida (Veggie, Baja en Calorías, Fitness)

import type { InventoryItem } from '../types/app.types'

export type MainCategory = 'all' | 'carnes' | 'verduras' | 'pastas' | 'veggie' | 'low_cal' | 'fitness'

export interface SubcategoryDef {
  id: string
  label: string
  icon: string
  description: string
}

export interface CategoryDef {
  id: MainCategory
  label: string
  shortLabel: string
  icon: string
  badgeLabel: string
  description: string
  subcategories: SubcategoryDef[]
}

export interface RecipeClassification {
  mainBase: 'carnes' | 'verduras' | 'pastas' | 'otros'
  categoryName: string
  subcategory: string
  subcategoryId: string
  isVeggie: boolean
  isLowCal: boolean
  isFitness: boolean
  badgeList: { label: string; icon: string; colorClass: string }[]
}

// Catálogo de Categorías y Subcategorías del Chef
export const PREFERENCE_CATEGORIES: CategoryDef[] = [
  {
    id: 'all',
    label: 'Toda la Carta',
    shortLabel: 'Toda la Carta',
    icon: '🌟',
    badgeLabel: 'Carta Completa',
    description: 'Explore la selección completa de platos diseñados por el Chef.',
    subcategories: [
      { id: 'all', label: 'Todas las propuestas', icon: '✦', description: 'Todas las creaciones culinarias' },
      { id: 'rapidas', label: 'Rápidas (< 20 min)', icon: '⏱️', description: 'Elaboraciones ágiles y sencillas' },
      { id: 'gourmet', label: 'Platos de Autor', icon: '👑', description: 'Técnicas y creaciones especiales' },
    ],
  },
  {
    id: 'carnes',
    label: 'Carnes y Proteínas',
    shortLabel: 'Carnes',
    icon: '🥩',
    badgeLabel: 'Base Carnes',
    description: 'Platos sustanciosos en base a cortes vacunos, aves, pescados o cerdo.',
    subcategories: [
      { id: 'all_carnes', label: 'Todas las carnes', icon: '🥩', description: 'Todos los platos cárnicos' },
      { id: 'vacuno', label: 'Vacuno y Ternera', icon: '🥩', description: 'Bifes, lomos, picadas y cortes nobles' },
      { id: 'pollo', label: 'Pollo y Aves', icon: '🍗', description: 'Pechugas, supremas y salteados de ave' },
      { id: 'pescado', label: 'Pescados y Mariscos', icon: '🐟', description: 'Salmón, atún, merluza y sushi fresco' },
      { id: 'cerdo', label: 'Cerdo y Embutidos', icon: '🥓', description: 'Panceta, chorizo, bondiola y jamón' },
    ],
  },
  {
    id: 'verduras',
    label: 'Verduras y Huerta',
    shortLabel: 'Verduras',
    icon: '🥗',
    badgeLabel: 'Base Huerta',
    description: 'Platos donde los vegetales frescos de la huerta son los protagonistas.',
    subcategories: [
      { id: 'all_verduras', label: 'Todas las verduras', icon: '🥗', description: 'Todas las recetas de la huerta' },
      { id: 'ensaladas', label: 'Ensaladas y Frescos', icon: '🥬', description: 'Hojas verdes, tomates y aliños aromáticos' },
      { id: 'salteados', label: 'Salteados y Woks', icon: '🍳', description: 'Vegetales salteados y crujientes' },
      { id: 'tartas_tortillas', label: 'Tortillas y Tartas', icon: '🥧', description: 'Tortillas jugosas, revueltos y quiches' },
      { id: 'guisos_huerta', label: 'Guisos y Cazuelas', icon: '🍲', description: 'Caldos reconfortantes y cremas de huerta' },
    ],
  },
  {
    id: 'pastas',
    label: 'Pastas y Masas',
    shortLabel: 'Pastas',
    icon: '🍝',
    badgeLabel: 'Base Pastas',
    description: 'Pastas tradicionales, fideos, pizzas, arroces, farofas y horneados.',
    subcategories: [
      { id: 'all_pastas', label: 'Todas las pastas', icon: '🍝', description: 'Todas las pastas y masas' },
      { id: 'fideos', label: 'Pastas y Fideos', icon: '🍝', description: 'Espaguetis, tallarines, ravioles y ñoquis' },
      { id: 'pizzas_empanadas', label: 'Pizzas y Empanadas', icon: '🍕', description: 'Pizzas a la piedra y empanadas horneadas' },
      { id: 'arroces', label: 'Arroces y Risottos', icon: '🍚', description: 'Arroces salteados, paellas y granos' },
      { id: 'farofas_masas', label: 'Farofas y Acompañamientos', icon: '🌾', description: 'Farofas brasileñas y masas de maíz' },
    ],
  },
  {
    id: 'veggie',
    label: 'Veggie / Vegetariano',
    shortLabel: 'Veggie',
    icon: '🥬',
    badgeLabel: '100% Veggie',
    description: 'Opciones 100% libres de carne animal, ricas en sabor y nutrientes vegetales.',
    subcategories: [
      { id: 'all_veggie', label: 'Todas veggie', icon: '🥬', description: 'Todas las opciones vegetarianas' },
      { id: 'veggie_frescos', label: 'Frescos y Ensaladas', icon: '🥑', description: 'Platos crudos, paltas y huerta' },
      { id: 'veggie_pastas', label: 'Pastas Vegetarianas', icon: '🍝', description: 'Pastas y arroces sin carnes' },
      { id: 'veggie_huevos', label: 'Huevos y Quesos', icon: '🧀', description: 'Tortillas, revueltos y gratines' },
    ],
  },
  {
    id: 'low_cal',
    label: 'Baja en Calorías',
    shortLabel: 'Baja en Calorías',
    icon: '⚡',
    badgeLabel: 'Ligera & Saludable',
    description: 'Platos ligeros, digestivos y de baja densidad calórica sin resignar sabor.',
    subcategories: [
      { id: 'all_low_cal', label: 'Todas bajas en calorías', icon: '⚡', description: 'Todas las opciones ligeras' },
      { id: 'low_ensaladas', label: 'Ensaladas Ligeras', icon: '🥗', description: 'Hojas verdes, cítricos y tomates' },
      { id: 'low_plancha', label: 'A la Plancha y Vapor', icon: '♨️', description: 'Proteínas y verduras sin frituras' },
      { id: 'low_sopas', label: 'Caldos y Sopas Claras', icon: '🥣', description: 'Fondos aromáticos y vegetales' },
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness / Proteica',
    shortLabel: 'Fitness',
    icon: '💪',
    badgeLabel: 'Alta Proteína Fitness',
    description: 'Platos ricos en proteínas de calidad y energía limpia para entrenamiento o nutrición activa.',
    subcategories: [
      { id: 'all_fitness', label: 'Todas fitness', icon: '💪', description: 'Todas las opciones proteicas' },
      { id: 'fit_pollo_pavo', label: 'Pollo y Carnes Magras', icon: '🍗', description: 'Pechuga a la plancha, lomo magro' },
      { id: 'fit_huevos', label: 'Huevos y Omelettes', icon: '🍳', description: 'Revueltos, tortillas proteicas' },
      { id: 'fit_pescados', label: 'Pescados y Salmón Fit', icon: '🐟', description: 'Atún, salmón y sushi proteico' },
    ],
  },
]

// Palabras clave de clasificación
const VACUNO_KEYWORDS = [
  'carne', 'ternera', 'lomo', 'bife', 'picada', 'asado', 'vacio', 'vacío',
  'entrana', 'entraña', 'cuadril', 'matambre', 'roast beef', 'osobuco',
  'milanesa', 'hamburguesa', 'costilla', 'colita', 'tira de asado', 'peceto', 'bola de lomo',
]

const POLLO_KEYWORDS = [
  'pollo', 'pechuga', 'muslo', 'alitas', 'pavo', 'pavita', 'suprema',
  'alita', 'trozos de pollo', 'strogonoff de pollo',
]

const PESCADO_KEYWORDS = [
  'salmon', 'salmón', 'atun', 'atún', 'merluza', 'pescado', 'langostinos',
  'camarones', 'calamar', 'sushi', 'poke', 'maki', 'nigiri', 'mariscos',
  'corvina', 'pejerrey', 'rabas', 'sashimi', 'kanikama',
]

const CERDO_KEYWORDS = [
  'cerdo', 'panceta', 'bacon', 'chorizo', 'chinchulin', 'chinchulines',
  'morcilla', 'bondiola', 'jamon', 'jamón', 'salchicha', 'costillitas',
  'lomo de cerdo', 'solomillo de cerdo', 'longaniza', 'linguiça',
]

const PASTA_KEYWORDS = [
  'pasta', 'fideos', 'espagueti', 'spaghetti', 'tallarines', 'macarrones',
  'ravioli', 'ravioles', 'gnocchi', 'ñoquis', 'lasaña', 'lasagna', 'canelones',
  'tagliatelle', 'penne', 'ramen', 'fideos secos', 'fideos frescos',
]

const PIZZA_EMPANADA_KEYWORDS = [
  'pizza', 'pizzeta', 'calzone', 'focaccia', 'empanada', 'empanadas',
  'tarta salada', 'quiche', 'pascualina',
]

const ARROZ_KEYWORDS = [
  'arroz', 'risotto', 'paella', 'chaufa', 'arroz blanco', 'arroz integral',
  'quinoa', 'arroz basmati', 'arroz jazmin', 'arroz con',
]

const FAROFA_KEYWORDS = [
  'farofa', 'harina de mandioca', 'mandioca', 'polenta', 'humita', 'chipa',
  'sopa paraguaya', 'masa',
]

const ENSALADA_KEYWORDS = [
  'ensalada', 'fresca', 'fresco', 'lechuga', 'rucula', 'rúcula', 'pepino',
  'palta', 'zanahoria rallada', 'radicheta', 'tomate fresco',
]

const SALTEADO_KEYWORDS = [
  'salteado', 'salteados', 'salteada', 'salteadas', 'wok', 'salteadas al wok',
  'a la sarten', 'a la sartén',
]

const TORTILLA_KEYWORDS = [
  'tortilla', 'revuelto', 'omelette', 'omelet', 'tarta de', 'souffle', 'soufflé',
]

const GUISO_HUERTA_KEYWORDS = [
  'sopa', 'crema de', 'guiso de verduras', 'cazuela de verduras', 'caldo de verduras',
  'estofado de verduras',
]

const ALL_MEAT_KEYWORDS = [...VACUNO_KEYWORDS, ...POLLO_KEYWORDS, ...PESCADO_KEYWORDS, ...CERDO_KEYWORDS]

/**
 * Determina si un texto contiene alguna palabra clave
 */
function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

/**
 * Clasificador culinario exhaustivo para cualquier receta del catálogo
 */
export function classifyRecipe(recipe: {
  name: string
  description?: string | null
  instructions?: string | null
  recipe_ingredients?: { ingredient_name: string }[] | string[]
  matchedIngredients?: string[]
  missingIngredients?: string[]
}): RecipeClassification {
  const name = recipe.name.toLowerCase()
  const desc = (recipe.description || '').toLowerCase()
  const inst = (recipe.instructions || '').toLowerCase()
  const rawIngs: string[] = (recipe.recipe_ingredients || []).map(item =>
    typeof item === 'string' ? item.toLowerCase() : item.ingredient_name.toLowerCase()
  )
  const matched: string[] = (recipe.matchedIngredients || []).map(i => i.toLowerCase())
  const missing: string[] = (recipe.missingIngredients || []).map(i => i.toLowerCase())
  const ingredients = Array.from(new Set([...rawIngs, ...matched, ...missing]))
  const fullText = `${name} ${desc} ${inst} ${ingredients.join(' ')}`

  // 1. Detección de carnes
  const hasVacuno = matchesAny(fullText, VACUNO_KEYWORDS)
  const hasPollo = matchesAny(fullText, POLLO_KEYWORDS)
  const hasPescado = matchesAny(fullText, PESCADO_KEYWORDS)
  const hasCerdo = matchesAny(fullText, CERDO_KEYWORDS)
  const hasAnyMeat = hasVacuno || hasPollo || hasPescado || hasCerdo

  // 2. Detección de pastas y harinas
  const hasPasta = matchesAny(fullText, PASTA_KEYWORDS)
  const hasPizzaEmpanada = matchesAny(fullText, PIZZA_EMPANADA_KEYWORDS)
  const hasArroz = matchesAny(fullText, ARROZ_KEYWORDS)
  const hasFarofa = matchesAny(fullText, FAROFA_KEYWORDS)
  const isPastaBase = hasPasta || hasPizzaEmpanada || hasArroz || hasFarofa

  // 3. Detección de verduras
  const isEnsalada = matchesAny(fullText, ENSALADA_KEYWORDS)
  const isSalteado = matchesAny(fullText, SALTEADO_KEYWORDS)
  const isTortilla = matchesAny(fullText, TORTILLA_KEYWORDS)
  const isGuisoHuerta = matchesAny(fullText, GUISO_HUERTA_KEYWORDS)

  // 4. Determinar base principal
  let mainBase: 'carnes' | 'verduras' | 'pastas' | 'otros' = 'otros'
  let categoryName = 'Otras Creaciones'
  let subcategory = 'Platos del Chef'
  let subcategoryId = 'all'

  if (hasAnyMeat) {
    mainBase = 'carnes'
    categoryName = 'Carnes y Proteínas'
    if (hasVacuno) {
      subcategory = 'Vacuno y Ternera'
      subcategoryId = 'vacuno'
    } else if (hasPollo) {
      subcategory = 'Pollo y Aves'
      subcategoryId = 'pollo'
    } else if (hasPescado) {
      subcategory = 'Pescados y Mariscos'
      subcategoryId = 'pescado'
    } else {
      subcategory = 'Cerdo y Embutidos'
      subcategoryId = 'cerdo'
    }
  } else if (isPastaBase) {
    mainBase = 'pastas'
    categoryName = 'Pastas y Masas'
    if (hasPasta) {
      subcategory = 'Pastas y Fideos'
      subcategoryId = 'fideos'
    } else if (hasPizzaEmpanada) {
      subcategory = 'Pizzas y Empanadas'
      subcategoryId = 'pizzas_empanadas'
    } else if (hasArroz) {
      subcategory = 'Arroces y Granos'
      subcategoryId = 'arroces'
    } else {
      subcategory = 'Farofas y Acompañamientos'
      subcategoryId = 'farofas_masas'
    }
  } else {
    mainBase = 'verduras'
    categoryName = 'Verduras y Huerta'
    if (isEnsalada) {
      subcategory = 'Ensaladas y Frescos'
      subcategoryId = 'ensaladas'
    } else if (isSalteado) {
      subcategory = 'Salteados y Woks'
      subcategoryId = 'salteados'
    } else if (isTortilla) {
      subcategory = 'Tortillas y Tartas'
      subcategoryId = 'tartas_tortillas'
    } else if (isGuisoHuerta) {
      subcategory = 'Guisos y Cazuelas'
      subcategoryId = 'guisos_huerta'
    } else {
      subcategory = 'Guisos y Cazuelas'
      subcategoryId = 'guisos_huerta'
    }
  }

  // 5. Atributos de estilo de vida / salud
  // Veggie: absolutamente ninguna carne
  const isVeggie = !hasAnyMeat

  // Baja en calorías: ensaladas, salteados ligeros, pescados a la plancha, platos sin frituras ni embutidos densos
  const hasHeavyFats = matchesAny(fullText, ['panceta', 'bacon', 'chorizo', 'chinchulin', 'frito', 'frita', 'rebozado', 'crema pesada'])
  const isLowCal = (isEnsalada || isSalteado || (hasPescado && !hasHeavyFats) || (hasPollo && (name.includes('plancha') || name.includes('vapor') || name.includes('ensalada')))) && !hasHeavyFats

  // Fitness: proteínas limpias (pollo, ternera magra, huevos, atún, salmón, legumbres) y equilibrio
  const isFitness = (
    hasPollo ||
    (hasVacuno && (name.includes('lomo') || name.includes('bife') || name.includes('plancha'))) ||
    hasPescado ||
    isTortilla || // huevos / revueltos
    fullText.includes('huevo') ||
    fullText.includes('proteina')
  ) && !matchesAny(fullText, ['chinchulin', 'morcilla', 'chorizo grasoso', 'fritura'])

  // 6. Generar lista de insignias editoriales
  const badgeList: { label: string; icon: string; colorClass: string }[] = []

  // Insignia de Base
  if (mainBase === 'carnes') {
    badgeList.push({ label: subcategory, icon: '🥩', colorClass: 'bg-[#FAF0E6] text-[#8F2D14] border-[#8F2D14]/30' })
  } else if (mainBase === 'pastas') {
    badgeList.push({ label: subcategory, icon: '🍝', colorClass: 'bg-[#FFF9E6] text-[#8F6A14] border-[#8F6A14]/30' })
  } else {
    badgeList.push({ label: subcategory, icon: '🥗', colorClass: 'bg-[#F2F7F0] text-[#3F6335] border-[#3F6335]/30' })
  }

  // Insignia Veggie si aplica
  if (isVeggie) {
    badgeList.push({ label: 'Veggie', icon: '🥬', colorClass: 'bg-[#EBF7EA] text-[#2E6B24] border-[#2E6B24]/30' })
  }

  // Insignia Baja en Calorías si aplica
  if (isLowCal) {
    badgeList.push({ label: 'Baja en Calorías', icon: '⚡', colorClass: 'bg-[#F5F3FF] text-[#5B3F96] border-[#5B3F96]/30' })
  }

  // Insignia Fitness si aplica
  if (isFitness) {
    badgeList.push({ label: 'Fitness', icon: '💪', colorClass: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#1D4ED8]/30' })
  }

  return {
    mainBase,
    categoryName,
    subcategory,
    subcategoryId,
    isVeggie,
    isLowCal,
    isFitness,
    badgeList,
  }
}

/**
 * Filtra una lista de recetas según la preferencia y subcategoría seleccionadas
 */
export function filterRecipesByPreference<T extends { name: string; description?: string | null; recipe_ingredients?: any }>(
  recipes: T[],
  preference: MainCategory,
  subcategoryId: string = 'all'
): T[] {
  if (preference === 'all') {
    if (subcategoryId === 'rapidas') {
      return recipes.filter(r => ((r as any).prep_time || 15) <= 20)
    }
    if (subcategoryId === 'gourmet') {
      return recipes.filter(r => (r as any).id?.startsWith('cat-') || (r as any).difficulty === 'Media' || (r as any).difficulty === 'Difícil')
    }
    return recipes
  }

  return recipes.filter(recipe => {
    const classification = classifyRecipe(recipe)

    // Filtros por Base Culinaria
    if (preference === 'carnes') {
      if (classification.mainBase !== 'carnes') return false
      if (subcategoryId && subcategoryId !== 'all_carnes' && subcategoryId !== 'all') {
        return classification.subcategoryId === subcategoryId
      }
      return true
    }

    if (preference === 'verduras') {
      if (classification.mainBase !== 'verduras') return false
      if (subcategoryId && subcategoryId !== 'all_verduras' && subcategoryId !== 'all') {
        return classification.subcategoryId === subcategoryId
      }
      return true
    }

    if (preference === 'pastas') {
      if (classification.mainBase !== 'pastas') return false
      if (subcategoryId && subcategoryId !== 'all_pastas' && subcategoryId !== 'all') {
        return classification.subcategoryId === subcategoryId
      }
      return true
    }

    // Filtros por Estilo y Nutrición
    if (preference === 'veggie') {
      if (!classification.isVeggie) return false
      if (subcategoryId === 'veggie_frescos') return classification.subcategory.includes('Ensaladas')
      if (subcategoryId === 'veggie_pastas') return classification.mainBase === 'pastas'
      if (subcategoryId === 'veggie_huevos') return classification.subcategory.includes('Tortillas') || (recipe as any).name?.toLowerCase().includes('huevo')
      return true
    }

    if (preference === 'low_cal') {
      if (!classification.isLowCal) return false
      if (subcategoryId === 'low_ensaladas') return classification.subcategory.includes('Ensaladas')
      if (subcategoryId === 'low_plancha') return (recipe as any).name?.toLowerCase().includes('plancha') || classification.subcategory.includes('Salteados')
      if (subcategoryId === 'low_sopas') return classification.subcategory.includes('Guisos') || (recipe as any).name?.toLowerCase().includes('sopa')
      return true
    }

    if (preference === 'fitness') {
      if (!classification.isFitness) return false
      if (subcategoryId === 'fit_pollo_pavo') return classification.subcategoryId === 'pollo' || classification.subcategoryId === 'vacuno'
      if (subcategoryId === 'fit_huevos') return classification.subcategory.includes('Tortillas') || (recipe as any).name?.toLowerCase().includes('huevo')
      if (subcategoryId === 'fit_pescados') return classification.subcategoryId === 'pescado'
      return true
    }

    return true
  })
}

/**
 * Calcula en tiempo real las estadísticas y disponibilidad de cada categoría
 * según los ingredientes reales que el usuario tiene en su despensa.
 */
export function calculatePreferenceStats<T extends { name: string; description?: string | null; recipe_ingredients?: any; totalIngredientsUsed?: number; missingIngredients?: string[] }>(
  allEligibleRecipes: T[],
  inventory: InventoryItem[]
): Record<MainCategory, { total: number; readyCount: number; matchedIngredients: string[] }> {
  const result: Record<MainCategory, { total: number; readyCount: number; matchedIngredients: string[] }> = {
    all: { total: 0, readyCount: 0, matchedIngredients: [] },
    carnes: { total: 0, readyCount: 0, matchedIngredients: [] },
    verduras: { total: 0, readyCount: 0, matchedIngredients: [] },
    pastas: { total: 0, readyCount: 0, matchedIngredients: [] },
    veggie: { total: 0, readyCount: 0, matchedIngredients: [] },
    low_cal: { total: 0, readyCount: 0, matchedIngredients: [] },
    fitness: { total: 0, readyCount: 0, matchedIngredients: [] },
  }

  // Ingredientes que pertenecen a cada categoría presentes en la despensa
  const carnesInStock = inventory.filter(i => matchesAny(i.name, ALL_MEAT_KEYWORDS)).map(i => i.name)
  const pastasInStock = inventory.filter(i => matchesAny(i.name, [...PASTA_KEYWORDS, ...PIZZA_EMPANADA_KEYWORDS, ...ARROZ_KEYWORDS, ...FAROFA_KEYWORDS])).map(i => i.name)
  const verdurasInStock = inventory.filter(i => !matchesAny(i.name, ALL_MEAT_KEYWORDS) && (i.category === 'verdura' || matchesAny(i.name, ['tomate', 'cebolla', 'lechuga', 'zanahoria', 'papa', 'zapallo', 'morron', 'espinaca', 'acelga']))).map(i => i.name)
  const veggieInStock = inventory.filter(i => !matchesAny(i.name, ALL_MEAT_KEYWORDS)).map(i => i.name)

  result.carnes.matchedIngredients = carnesInStock
  result.pastas.matchedIngredients = pastasInStock
  result.verduras.matchedIngredients = verdurasInStock
  result.veggie.matchedIngredients = veggieInStock
  result.low_cal.matchedIngredients = verdurasInStock
  result.fitness.matchedIngredients = inventory.filter(i => matchesAny(i.name, [...POLLO_KEYWORDS, ...PESCADO_KEYWORDS, 'huevo', 'lomo', 'atun', 'salmon'])).map(i => i.name)
  result.all.matchedIngredients = inventory.map(i => i.name)

  for (const recipe of allEligibleRecipes) {
    const classification = classifyRecipe(recipe)
    const isReady = (recipe.missingIngredients?.length ?? 0) === 0 && ((recipe.totalIngredientsUsed ?? 0) > 0 || inventory.length === 0)

    // All
    result.all.total++
    if (isReady) result.all.readyCount++

    // Carnes
    if (classification.mainBase === 'carnes') {
      result.carnes.total++
      if (isReady) result.carnes.readyCount++
    }

    // Verduras
    if (classification.mainBase === 'verduras') {
      result.verduras.total++
      if (isReady) result.verduras.readyCount++
    }

    // Pastas
    if (classification.mainBase === 'pastas') {
      result.pastas.total++
      if (isReady) result.pastas.readyCount++
    }

    // Veggie
    if (classification.isVeggie) {
      result.veggie.total++
      if (isReady) result.veggie.readyCount++
    }

    // Low Cal
    if (classification.isLowCal) {
      result.low_cal.total++
      if (isReady) result.low_cal.readyCount++
    }

    // Fitness
    if (classification.isFitness) {
      result.fitness.total++
      if (isReady) result.fitness.readyCount++
    }
  }

  return result
}
