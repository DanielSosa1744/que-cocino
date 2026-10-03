import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateUrgency,
  guessCategory,
  isIngredientMatch,
  singularize,
  defaultExpiryDate,
} from '../lib/ingredientParser'
import { localStore } from '../lib/localStore'
import { inventoryLogger } from '../lib/inventoryLogs'
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
        // Intentar consulta con join a la tabla ingredients
        let rows: any[] = []
        const { data, error } = await db
          .from('inventory')
          .select('*, ingredients(id, name, category, shelf_life_days, unit_default)')
          .eq('user_id', user.id)
          .eq('is_consumed', false)
          .order('expires_at', { ascending: true, nullsFirst: false })

        if (error) {
          // Fallback a selección directa si PostgREST no resuelve la relación anidada
          const direct = await db
            .from('inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_consumed', false)
            .order('expires_at', { ascending: true, nullsFirst: false })

          if (direct.error) throw direct.error
          rows = direct.data || []
        } else {
          rows = data || []
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rows.map((row: any): InventoryItem => {
          const { urgency, daysUntilExpiry } = calculateUrgency(row.expires_at)
          return {
            id: row.id,
            name: row.name,
            quantity: row.quantity,
            unit: row.unit ?? 'ud',
            category: row.ingredients?.category ?? row.category ?? guessCategory(row.name),
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
        // 1. Obtener catálogo maestro de ingredients en Supabase
        const { data: dbIngredients, error: ingError } = await db
          .from('ingredients')
          .select('id, name, category, shelf_life_days, unit_default')

        if (ingError) {
          console.warn('Advertencia al consultar catálogo ingredients:', ingError)
        }
        const catalog = dbIngredients || []

        // 2. Obtener registros vigentes en inventory para el usuario
        const { data: existingInventory, error: invError } = await db
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_consumed', false)

        if (invError) {
          console.warn('Advertencia al consultar inventario existente:', invError)
        }
        const currentInventory = existingInventory || []

        // 3. Procesar cada ingrediente: buscar en catálogo y crear o actualizar en inventory
        for (const item of items) {
          const trimmedName = item.name.trim()

          // 3.1 Buscar coincidencia en la tabla ingredients
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matchedCatalog = catalog.find((cat: any) =>
            isIngredientMatch(trimmedName, cat.name) ||
            singularize(trimmedName) === singularize(cat.name) ||
            cat.name.toLowerCase() === trimmedName.toLowerCase()
          )

          const ingredientId = matchedCatalog ? matchedCatalog.id : null
          const unit = item.unit || matchedCatalog?.unit_default || 'ud'

          // Calcular fecha de caducidad si no fue provista
          let expiresAt = item.expires_at || null
          if (!expiresAt && matchedCatalog?.shelf_life_days) {
            expiresAt = defaultExpiryDate(matchedCatalog.shelf_life_days)
          }

          // 3.2 Buscar si ya existe en inventory activo del usuario
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingItem = currentInventory.find((ex: any) => {
            if (ingredientId && ex.ingredient_id && ex.ingredient_id === ingredientId) {
              return true
            }
            return isIngredientMatch(ex.name, trimmedName) ||
              singularize(ex.name) === singularize(trimmedName)
          })

          if (existingItem) {
            // Actualizar registro existente en inventory (incrementar cantidad)
            const newQty = (Number(existingItem.quantity) || 0) + (Number(item.quantity) || 1)
            let updatedExpiresAt = existingItem.expires_at
            if (expiresAt) {
              if (!updatedExpiresAt || new Date(expiresAt) < new Date(updatedExpiresAt)) {
                updatedExpiresAt = expiresAt
              }
            }

            const { error: updateError } = await db
              .from('inventory')
              .update({
                quantity: newQty,
                unit: existingItem.unit || unit,
                expires_at: updatedExpiresAt,
                updated_at: new Date().toISOString(),
                ...(ingredientId && !existingItem.ingredient_id ? { ingredient_id: ingredientId } : {}),
              })
              .eq('id', existingItem.id)

            if (updateError) throw updateError
            inventoryLogger.addLog(user.id, 'increased', trimmedName, item.quantity ?? 1, unit)
          } else {
            // Crear nuevo registro en inventory
            const { error: insertError } = await db
              .from('inventory')
              .insert({
                user_id: user.id,
                ingredient_id: ingredientId,
                name: trimmedName,
                quantity: item.quantity ?? 1,
                unit,
                expires_at: expiresAt,
                is_consumed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (insertError) throw insertError
            inventoryLogger.addLog(user.id, 'added', trimmedName, item.quantity ?? 1, unit)
          }
        }

        return true
      } catch (err) {
        console.warn('Fallback a localStore para añadir:', err)
        for (const item of items) {
          inventoryLogger.addLog(user.id, 'added', item.name, item.quantity ?? 1, item.unit)
        }
        return localStore.addInventory(user.id, items)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['vaciar-nevera'] })
      queryClient.invalidateQueries({ queryKey: ['cooked-history'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useUpdateIngredient() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      actionType?: 'increased' | 'decreased' | 'updated'
      changeQty?: number
      itemName?: string
      unit?: string
    } & Partial<InventoryItem>) => {
      const { id, actionType, changeQty, itemName, unit: logUnit, ...updates } = params
      if (!user) throw new Error('Not authenticated')

      if (actionType && itemName) {
        inventoryLogger.addLog(
          user.id,
          actionType === 'updated' ? 'increased' : actionType,
          itemName,
          changeQty ?? 1,
          logUnit
        )
      }

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
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['vaciar-nevera'] })
      queryClient.invalidateQueries({ queryKey: ['cooked-history'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export function useDeleteIngredient() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: string | { id: string; name?: string }) => {
      const id = typeof params === 'string' ? params : params.id
      const name = typeof params === 'string' ? undefined : params.name
      if (!user) throw new Error('Not authenticated')

      if (name) {
        inventoryLogger.addLog(user.id, 'deleted', name, null)
      }

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
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['vaciar-nevera'] })
      queryClient.invalidateQueries({ queryKey: ['cooked-history'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
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
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['vaciar-nevera'] })
      queryClient.invalidateQueries({ queryKey: ['cooked-history'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
