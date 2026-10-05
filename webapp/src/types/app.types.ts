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
  origin?: string
  chef_tips?: string
  detailed_steps?: string[]
  substitutes?: string
  pairing?: string
  score: number
  recentIngredientsUsed?: number
  importanceScore?: number
  dominantImportance?: number
  urgentIngredientsUsed: number
  totalIngredientsUsed: number
  matchPercentage?: number
  priority: PriorityLevel
  matchedIngredients: string[]
  missingIngredients: string[]
  hasProteinConflict?: boolean
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
