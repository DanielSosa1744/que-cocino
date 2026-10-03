// Auto-generated type definitions for Supabase database
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
      catalog_ingredients: {
        Row: {
          id: string
          name: string
          name_aliases: string[] | null
          category: string | null
          shelf_life_days: number
          unit_default: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['catalog_ingredients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['catalog_ingredients']['Insert']>
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          catalog_ingredient_id: string | null
          name: string
          quantity: number | null
          unit: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
          is_consumed: boolean
        }
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inventory']['Insert']>
      }
      recipes: {
        Row: {
          id: string
          name: string
          description: string | null
          instructions: string | null
          prep_time_minutes: number | null
          servings: number | null
          image_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          catalog_ingredient_id: string | null
          ingredient_name: string
          quantity: number | null
          unit: string | null
          is_optional: boolean
        }
        Insert: Omit<Database['public']['Tables']['recipe_ingredients']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['recipe_ingredients']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['cooked_history']['Row'], 'id' | 'cooked_at'>
        Update: Partial<Database['public']['Tables']['cooked_history']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
