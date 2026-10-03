// Application-level types

export type UrgencyLevel = 'critical' | 'warning' | 'ok'
export type PriorityLevel = 'Alta' | 'Media' | 'Baja'

export interface InventoryItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  category: string
  expires_at: string | null
  created_at: string
  ingredient_id?: string | null
  urgency: UrgencyLevel
  days_until_expiry: number | null
}

export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: string | null
  category?: string
  expiryDays?: number | null
}

export interface RecipeWithScore {
  id: string
  name: string
  description: string | null
  difficulty: 'Fácil' | 'Media' | 'Difícil'
  prep_time: number | null // minutos
  instructions: string | null
  servings: number | null
  score: number // score = ingredientes_urgentes_utilizados + ingredientes_totales_utilizados
  urgentIngredientsUsed: number
  totalIngredientsUsed: number
  priority: PriorityLevel
  matchedIngredients: string[]
  missingIngredients: string[]
}

export interface ImpactStats {
  totalCooked: number
  totalIngredientsRescued: number
  wasteAvoidedKg: number
  moneySavedEur: number
  co2AvoidedKg: number
}

export interface DashboardStats {
  registeredIngredients: number
  urgentIngredients: number
  wasteRiskLevel: 'Alto' | 'Medio' | 'Bajo'
  wasteRiskPercentage: number
  utilizationPercentage: number
}
