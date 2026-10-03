export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string
          name: string
          category: string
          shelf_life_days: number
          unit_default: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string
          shelf_life_days?: number
          unit_default?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          shelf_life_days?: number
          unit_default?: string | null
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string | null
          name: string
          quantity: number | null
          unit: string | null
          expires_at: string | null
          is_consumed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id?: string | null
          name: string
          quantity?: number | null
          unit?: string | null
          expires_at?: string | null
          is_consumed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_id?: string | null
          name?: string
          quantity?: number | null
          unit?: string | null
          expires_at?: string | null
          is_consumed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          description: string | null
          difficulty: 'Fácil' | 'Media' | 'Difícil' | string | null
          prep_time: number | null
          instructions: string | null
          servings: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          difficulty?: 'Fácil' | 'Media' | 'Difícil' | string | null
          prep_time?: number | null
          instructions?: string | null
          servings?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          difficulty?: 'Fácil' | 'Media' | 'Difícil' | string | null
          prep_time?: number | null
          instructions?: string | null
          servings?: number | null
          created_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string | null
          ingredient_name: string
          quantity: number | null
          unit: string | null
          is_optional: boolean
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id?: string | null
          ingredient_name: string
          quantity?: number | null
          unit?: string | null
          is_optional?: boolean
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          quantity?: number | null
          unit?: string | null
          is_optional?: boolean
        }
      }
      cooked_history: {
        Row: {
          id: string
          user_id: string
          recipe_id: string | null
          recipe_name: string
          ingredients_used: string[]
          waste_avoided_kg: number | null
          money_saved_eur: number | null
          co2_avoided_kg: number | null
          cooked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id?: string | null
          recipe_name: string
          ingredients_used?: string[]
          waste_avoided_kg?: number | null
          money_saved_eur?: number | null
          co2_avoided_kg?: number | null
          cooked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string | null
          recipe_name?: string
          ingredients_used?: string[]
          waste_avoided_kg?: number | null
          money_saved_eur?: number | null
          co2_avoided_kg?: number | null
          cooked_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
