import type { InventoryItem } from '../types/app.types'
import { calculateUrgency, defaultExpiryDate, singularize } from './ingredientParser'

export interface LocalRecipe {
  id: string
  name: string
  description: string
  difficulty: 'Fácil' | 'Media' | 'Difícil'
  prep_time: number
  instructions: string
  servings: number
  recipe_ingredients: { ingredient_name: string }[]
}

export const INITIAL_RECIPES: LocalRecipe[] = [
  {
    id: 'rec-tortilla',
    name: 'Tortilla',
    description: 'Tortilla casera y jugosa. La mejor forma de aprovechar huevos y cebolla antes de que se echen a perder.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Pica la cebolla finamente y póchala en una sartén con un poco de aceite a fuego medio durante 8 minutos hasta que esté tierna.\n2. Bate los huevos en un bol con una pizca de sal.\n3. Incorpora la cebolla pochada al huevo batido.\n4. Cuaja la tortilla en la sartén 2-3 minutos por cada lado hasta que quede dorada por fuera y jugosa por dentro.',
    servings: 2,
    recipe_ingredients: [
      { ingredient_name: 'huevo' },
      { ingredient_name: 'cebolla' },
    ],
  },
  {
    id: 'rec-ensalada',
    name: 'Ensalada',
    description: 'Ensalada fresca y rápida. Ideal para gastar tomates maduros y lechuga antes de que pierdan frescura.',
    difficulty: 'Fácil',
    prep_time: 10,
    instructions: '1. Lava bien las hojas de lechuga y córtalas con las manos en trozos cómodos.\n2. Corta los tomates en gajos o dados medianos.\n3. Junta los ingredientes en una ensaladera.\n4. Aliña con aceite de oliva virgen extra, vinagre y sal justo antes de servir.',
    servings: 2,
    recipe_ingredients: [
      { ingredient_name: 'tomate' },
      { ingredient_name: 'lechuga' },
    ],
  },
  {
    id: 'rec-pasta-mediterranea',
    name: 'Pasta mediterránea',
    description: 'Pasta reconfortante al estilo mediterráneo. Aprovecha tomates frescos y queso disponible en tu nevera.',
    difficulty: 'Fácil',
    prep_time: 20,
    instructions: '1. Pon a hervir abundante agua con sal y cocina la pasta según las instrucciones del paquete.\n2. En una sartén, saltea los tomates picados en dados con una cucharada de aceite a fuego medio hasta que suelten su jugo.\n3. Escurre la pasta al dente y mézclala directamente en la sartén con el tomate.\n4. Apaga el fuego, añade el queso desmenuzado o rallado por encima y mezcla para que se funda ligeramente.',
    servings: 2,
    recipe_ingredients: [
      { ingredient_name: 'pasta' },
      { ingredient_name: 'tomate' },
      { ingredient_name: 'queso' },
    ],
  },
  {
    id: 'rec-revuelto',
    name: 'Revuelto de tomate y huevo',
    description: 'Plato exprés altamente nutritivo para salvar tomates blandos y huevos frescos.',
    difficulty: 'Fácil',
    prep_time: 12,
    instructions: '1. Trocea los tomates y saltéalos 3 minutos en una sartén con un hilo de aceite.\n2. Vierte los huevos batidos con sal.\n3. Remueve constantemente a fuego suave hasta obtener una textura cremosa.',
    servings: 2,
    recipe_ingredients: [
      { ingredient_name: 'tomate' },
      { ingredient_name: 'huevo' },
    ],
  },
  {
    id: 'rec-arroz-verduras',
    name: 'Arroz con verduras',
    description: 'Arroz de aprovechamiento para usar cualquier verdura que tengas en la nevera.',
    difficulty: 'Media',
    prep_time: 25,
    instructions: '1. Sofríe cebolla y tomate picados en una sartén.\n2. Agrega el arroz y remueve durante 2 minutos.\n3. Añade el doble de agua caliente o caldo y cocina a fuego medio 18 minutos.',
    servings: 3,
    recipe_ingredients: [
      { ingredient_name: 'arroz' },
      { ingredient_name: 'cebolla' },
      { ingredient_name: 'tomate' },
    ],
  },
]

export const INITIAL_DEMO_INVENTORY: Array<{
  name: string
  quantity: number
  unit: string
  category: string
  daysToExpire: number
}> = [
  { name: 'tomates', quantity: 4, unit: 'ud', category: 'verdura', daysToExpire: 1 },    // ROJO: <=2 días
  { name: 'huevos', quantity: 6, unit: 'ud', category: 'proteína', daysToExpire: 4 },    // NARANJA: <=7 días
  { name: 'media cebolla', quantity: 0.5, unit: 'ud', category: 'verdura', daysToExpire: 12 }, // VERDE: >7 días
  { name: 'lechuga', quantity: 1, unit: 'ud', category: 'verdura', daysToExpire: 2 },    // ROJO: <=2 días
  { name: 'queso', quantity: 150, unit: 'g', category: 'lácteo', daysToExpire: 5 },       // NARANJA: <=7 días
  { name: 'pasta', quantity: 500, unit: 'g', category: 'despensa', daysToExpire: 180 },   // VERDE: >7 días
]

const STORAGE_KEYS = {
  INVENTORY: 'que_cocino_inventory_',
  COOKED: 'que_cocino_cooked_',
  AUTH_USER: 'que_cocino_demo_user',
}

export const localStore = {
  getInventory(userId: string): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY + userId)
    if (!raw) {
      // Seed with initial items for a new session
      const seeded: InventoryItem[] = INITIAL_DEMO_INVENTORY.map((item, index) => {
        const expires_at = defaultExpiryDate(item.daysToExpire)
        const { urgency, daysUntilExpiry } = calculateUrgency(expires_at)
        return {
          id: `demo-${index + 1}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          expires_at,
          created_at: new Date().toISOString(),
          urgency,
          days_until_expiry: daysUntilExpiry,
        }
      })
      localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify(seeded))
      return seeded
    }
    try {
      const items = JSON.parse(raw) as InventoryItem[]
      return items.map(i => {
        const { urgency, daysUntilExpiry } = calculateUrgency(i.expires_at)
        return {
          ...i,
          urgency,
          days_until_expiry: daysUntilExpiry,
        }
      })
    } catch {
      return []
    }
  },

  addInventory(
    userId: string,
    items: Array<{
      name: string
      quantity: number | null
      unit: string | null
      category?: string
      expires_at?: string | null
    }>
  ): InventoryItem[] {
    const current = [...localStore.getInventory(userId)]

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]
      const key = singularize(item.name)
      const existingIndex = current.findIndex(c => singularize(c.name) === key && c.unit === (item.unit ?? 'ud'))

      if (existingIndex >= 0) {
        // Fusionar sumando cantidades
        const existing = current[existingIndex]
        const newQty = (existing.quantity ?? 1) + (item.quantity ?? 1)
        
        let newExpiresAt = existing.expires_at
        if (item.expires_at) {
          if (!newExpiresAt || new Date(item.expires_at) < new Date(newExpiresAt)) {
            newExpiresAt = item.expires_at
          }
        }
        const { urgency, daysUntilExpiry } = calculateUrgency(newExpiresAt)
        
        current[existingIndex] = {
          ...existing,
          quantity: newQty,
          expires_at: newExpiresAt,
          urgency,
          days_until_expiry: daysUntilExpiry,
        }
      } else {
        const expires_at = item.expires_at ?? defaultExpiryDate(7)
        const { urgency, daysUntilExpiry } = calculateUrgency(expires_at)
        current.unshift({
          id: `item-${Date.now()}-${idx}`,
          name: item.name,
          quantity: item.quantity ?? 1,
          unit: item.unit ?? 'ud',
          category: item.category ?? 'despensa',
          expires_at,
          created_at: new Date().toISOString(),
          urgency,
          days_until_expiry: daysUntilExpiry,
        })
      }
    }

    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify(current))
    return current
  },

  deleteInventory(userId: string, itemId: string): void {
    const current = localStore.getInventory(userId)
    const filtered = current.filter(i => i.id !== itemId)
    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify(filtered))
  },

  updateInventory(userId: string, itemId: string, updates: Partial<InventoryItem>): void {
    const current = localStore.getInventory(userId)
    const updated = current.map(i => i.id === itemId ? { ...i, ...updates } : i)
    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify(updated))
  },

  clearInventory(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify([]))
  },

  getRecipes(): LocalRecipe[] {
    return INITIAL_RECIPES
  },

  getCookedHistory(userId: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.COOKED + userId)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  saveCookedHistory(
    userId: string,
    entry: {
      recipeName: string
      recipeId: string | null
      ingredientsUsed: string[]
      wasteAvoidedKg: number
      moneySavedEur: number
      co2AvoidedKg: number
    }
  ) {
    const current = localStore.getCookedHistory(userId)
    const newEntry = {
      id: `cooked-${Date.now()}`,
      user_id: userId,
      recipe_id: entry.recipeId,
      recipe_name: entry.recipeName,
      ingredients_used: entry.ingredientsUsed,
      waste_avoided_kg: entry.wasteAvoidedKg,
      money_saved_eur: entry.moneySavedEur,
      co2_avoided_kg: entry.co2AvoidedKg,
      cooked_at: new Date().toISOString(),
    }
    const updated = [newEntry, ...current]
    localStorage.setItem(STORAGE_KEYS.COOKED + userId, JSON.stringify(updated))
    return newEntry
  },
}
