import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateUrgency, guessCategory } from '../lib/ingredientParser'
import { localStore } from '../lib/localStore'
import type { InventoryItem } from '../types/app.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useInventory() {
  const { user } = useAuth()

  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user) return []

      if (!isSupabaseConfigured) {
        return localStore.getInventory(user.id)
      }

      try {
        const { data, error } = await db
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_consumed', false)
          .order('expires_at', { ascending: true, nullsFirst: false })

        if (error) throw error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any): InventoryItem => {
          const { urgency, daysUntilExpiry } = calculateUrgency(row.expires_at)
          return {
            id: row.id,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit ?? 'ud',
            category: row.category ?? guessCategory(row.name),
            expires_at: row.expires_at,
            created_at: row.created_at,
            ingredient_id: row.ingredient_id,
            urgency,
            days_until_expiry: daysUntilExpiry,
          }
        })
      } catch (err) {
        console.warn('Fallo conectando a Supabase, recurriendo a almacenamiento local:', err)
        return localStore.getInventory(user.id)
      }
    },
    enabled: !!user,
  })
}

export function useAddIngredients() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (items: {
      name: string
      quantity: number | null
      unit: string | null
      category?: string
      expires_at?: string | null
    }[]) => {
      if (!user) throw new Error('Not authenticated')

      if (!isSupabaseConfigured) {
        return localStore.addInventory(user.id, items)
      }

      try {
        const rows = items.map(item => ({
          user_id: user.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit ?? 'ud',
          expires_at: item.expires_at ?? null,
          is_consumed: false,
        }))

        const { data, error } = await db.from('inventory').insert(rows).select()
        if (error) throw error
        return data
      } catch (err) {
        console.warn('Fallback a localStore para añadir:', err)
        return localStore.addInventory(user.id, items)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] })
    },
  })
}

export function useUpdateIngredient() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string } & Partial<InventoryItem>) => {
      const { id, ...updates } = params
      if (!user) throw new Error('Not authenticated')

      if (!isSupabaseConfigured) {
        localStore.updateInventory(user.id, id, updates)
        return
      }

      try {
        const { data, error } = await db
          .from('inventory')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err) {
        console.warn('Fallback a localStore para actualizar:', err)
        localStore.updateInventory(user.id, id, updates)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] })
    },
  })
}

export function useDeleteIngredient() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated')

      if (!isSupabaseConfigured) {
        localStore.deleteInventory(user.id, id)
        return
      }

      try {
        const { error } = await db
          .from('inventory')
          .update({ is_consumed: true, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (error) throw error
      } catch (err) {
        console.warn('Fallback a localStore para eliminar:', err)
        localStore.deleteInventory(user.id, id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] })
    },
  })
}

export function useClearInventory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')

      if (!isSupabaseConfigured) {
        localStore.clearInventory(user.id)
        return
      }

      try {
        const { error } = await db
          .from('inventory')
          .update({ is_consumed: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_consumed', false)

        if (error) throw error
      } catch (err) {
        console.warn('Fallback a localStore para limpiar:', err)
        localStore.clearInventory(user.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] })
    },
  })
}
