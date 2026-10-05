import type { InventoryItem } from '../types/app.types'
import { calculateUrgency, defaultExpiryDate, singularize } from './ingredientParser'
import { getFullRecipeCatalog } from './recipeCatalog'

import { INITIAL_RECIPES, type LocalRecipe } from './initialRecipes'
export { INITIAL_RECIPES, type LocalRecipe }

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
      return []
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

  replaceInventory(
    userId: string,
    items: Array<{
      name: string
      quantity: number | null
      unit: string | null
      category?: string
      expires_at?: string | null
    }>
  ): InventoryItem[] {
    // Limpiar completamente el inventario previo para basarse exclusivamente en la tanda actual
    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify([]))
    return localStore.addInventory(userId, items)
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
    return getFullRecipeCatalog()
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
