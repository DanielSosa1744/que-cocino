import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { RecipeWithScore, InventoryItem } from '../types/app.types'
import { scoreRecipe } from '../lib/ingredientParser'
import { localStore } from '../lib/localStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface RawRecipe {
  id: string
  name: string
  description: string | null
  difficulty?: 'Fácil' | 'Media' | 'Difícil'
  prep_time?: number | null
  instructions: string | null
  servings?: number | null
  recipe_ingredients: { ingredient_name: string }[]
}

export function useRecipes() {
  return useQuery<RawRecipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return localStore.getRecipes()
      }

      try {
        const { data, error } = await db
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .order('name')

        if (error) throw error
        return (data || []) as RawRecipe[]
      } catch (err) {
        console.warn('Fallback a recetas locales:', err)
        return localStore.getRecipes()
      }
    },
  })
}

/**
 * Motor Vaciar Nevera:
 * Evalúa las recetas contra el inventario real.
 * Fórmula requerida: score = ingredientes_urgentes_utilizados + ingredientes_totales_utilizados
 * Muestra únicamente recetas compatibles con el inventario (totalIngredientsUsed > 0).
 */
export function useVaciarNevera(inventory: InventoryItem[]) {
  return useQuery<RecipeWithScore[]>({
    queryKey: ['vaciar-nevera', inventory.map(i => `${i.id}-${i.name}-${i.urgency}`).join(',')],
    queryFn: async () => {
      if (inventory.length === 0) return []

      let rawRecipes: RawRecipe[] = []

      if (!isSupabaseConfigured) {
        rawRecipes = localStore.getRecipes()
      } else {
        try {
          const { data, error } = await db
            .from('recipes')
            .select('*, recipe_ingredients(*)')

          if (error) throw error
          rawRecipes = (data || []) as RawRecipe[]
        } catch (err) {
          console.warn('Error fetching Supabase recipes, fallback a localStore:', err)
          rawRecipes = localStore.getRecipes()
        }
      }

      const scored: RecipeWithScore[] = rawRecipes.map((recipe) => {
        const recipeIngredientNames = (recipe.recipe_ingredients || []).map(
          (ri: { ingredient_name: string }) => ri.ingredient_name
        )

        const { score, urgentUsed, totalUsed, priority, matched, missing } = scoreRecipe(
          recipeIngredientNames,
          inventory.map(i => ({ name: i.name, urgency: i.urgency }))
        )

        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          difficulty: (recipe.difficulty as 'Fácil' | 'Media' | 'Difícil') || 'Fácil',
          prep_time: recipe.prep_time ?? 15,
          instructions: recipe.instructions,
          servings: recipe.servings ?? 2,
          score,
          urgentIngredientsUsed: urgentUsed,
          totalIngredientsUsed: totalUsed,
          priority,
          matchedIngredients: matched,
          missingIngredients: missing,
        }
      })

      // Únicamente recetas compatibles con el inventario (que aprovechen al menos 1 ingrediente)
      // Ordenadas descendentemente por score (urgencia + total aprovechado)
      const compatible = scored
        .filter(r => r.totalIngredientsUsed > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return b.urgentIngredientsUsed - a.urgentIngredientsUsed
        })

      if (compatible.length > 0) {
        return compatible
      }

      // Fallback Inteligente: Si el usuario tiene ingredientes pero ninguna receta fija coincide,
      // construimos dinámicamente un plato combinado de aprovechamiento basado en sus alimentos.
      const urgentOrFirst = inventory.slice(0, 3)
      const namesList = urgentOrFirst.map(i => i.name)
      const dynamicRecipe: RecipeWithScore = {
        id: 'rec-dynamic-aprovechamiento',
        name: `Salteado rápido de ${namesList.slice(0, 2).join(' y ')}`,
        description: `Plato improvisado de aprovechamiento diseñado específicamente para consumir tus ingredientes antes de que caduquen.`,
        difficulty: 'Fácil',
        prep_time: 12,
        instructions: `1. Lava y trocea ${namesList.join(', ')} en porciones homogéneas.\n2. Calienta 2 cucharadas de aceite en una sartén o wok a fuego vivo.\n3. Saltea los ingredientes durante 6-8 minutos, sazonando con sal, pimienta y tus especias favoritas.\n4. Sirve caliente directamente para disfrutar de todo su sabor y valor nutricional.`,
        servings: 2,
        score: urgentOrFirst.length * 2,
        urgentIngredientsUsed: urgentOrFirst.filter(i => i.urgency === 'critical' || i.urgency === 'warning').length,
        totalIngredientsUsed: urgentOrFirst.length,
        priority: urgentOrFirst.some(i => i.urgency === 'critical') ? 'Alta' : 'Media',
        matchedIngredients: namesList,
        missingIngredients: [],
      }

      return [dynamicRecipe]
    },
    enabled: inventory.length > 0,
  })
}

export function useSaveCooked() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      recipeName: string
      recipeId: string | null
      ingredientsUsed: string[]
      wasteAvoidedKg: number
      moneySavedEur: number
      co2AvoidedKg: number
    }) => {
      if (!user) throw new Error('Not authenticated')

      if (!isSupabaseConfigured) {
        return localStore.saveCookedHistory(user.id, params)
      }

      try {
        const { error } = await db.from('cooked_history').insert({
          user_id: user.id,
          recipe_id: params.recipeId,
          recipe_name: params.recipeName,
          ingredients_used: params.ingredientsUsed,
          waste_avoided_kg: params.wasteAvoidedKg,
          money_saved_eur: params.moneySavedEur,
          co2_avoided_kg: params.co2AvoidedKg,
        })

        if (error) throw error
      } catch (err) {
        console.warn('Fallback a guardado local de cocinado:', err)
        return localStore.saveCookedHistory(user.id, params)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooked-history'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] })
    },
  })
}

export interface CookedHistoryRow {
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

export function useCookedHistory() {
  const { user } = useAuth()

  return useQuery<CookedHistoryRow[]>({
    queryKey: ['cooked-history', user?.id],
    queryFn: async () => {
      if (!user) return []

      if (!isSupabaseConfigured) {
        return localStore.getCookedHistory(user.id) as CookedHistoryRow[]
      }

      try {
        const { data, error } = await db
          .from('cooked_history')
          .select('*')
          .eq('user_id', user.id)
          .order('cooked_at', { ascending: false })

        if (error) throw error
        return (data || []) as CookedHistoryRow[]
      } catch (err) {
        console.warn('Fallback a historial local:', err)
        return localStore.getCookedHistory(user.id) as CookedHistoryRow[]
      }
    },
    enabled: !!user,
  })
}
