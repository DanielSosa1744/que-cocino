export interface InventoryLogEntry {
  id: string
  date: string // ISO string
  action: 'added' | 'increased' | 'decreased' | 'deleted'
  ingredient: string
  quantity: number | null
  unit?: string | null
  display: string // e.g. "+4 tomates", "-2 huevos", "eliminado yogur"
}

const LOGS_STORAGE_PREFIX = 'que_cocino_inv_logs_'

export const inventoryLogger = {
  getLogs(userId: string): InventoryLogEntry[] {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_PREFIX + userId)
      if (!raw) return []
      return JSON.parse(raw) as InventoryLogEntry[]
    } catch {
      return []
    }
  },

  addLog(
    userId: string,
    action: 'added' | 'increased' | 'decreased' | 'deleted',
    ingredient: string,
    quantity: number | null = 1,
    unit?: string | null
  ): InventoryLogEntry {
    let display = ''
    const unitStr = unit && unit !== 'ud' && unit !== 'uds' ? ` ${unit}` : ''
    const qtyStr = quantity != null ? `${quantity}${unitStr}` : ''

    if (action === 'added' || action === 'increased') {
      display = `+${qtyStr || '1'} ${ingredient}`
    } else if (action === 'decreased') {
      display = `-${qtyStr || '1'} ${ingredient}`
    } else if (action === 'deleted') {
      display = `eliminado ${ingredient}`
    }

    const newEntry: InventoryLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      date: new Date().toISOString(),
      action,
      ingredient,
      quantity,
      unit,
      display,
    }

    const current = inventoryLogger.getLogs(userId)
    const updated = [newEntry, ...current].slice(0, 100) // Mantener últimos 100 movimientos
    try {
      localStorage.setItem(LOGS_STORAGE_PREFIX + userId, JSON.stringify(updated))
    } catch (e) {
      console.warn('No se pudo guardar el log de inventario en localStorage:', e)
    }

    // Disparar evento para reactividad instantánea en React
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-logs-updated', { detail: newEntry }))
    }

    return newEntry
  },

  clearLogs(userId: string) {
    try {
      localStorage.removeItem(LOGS_STORAGE_PREFIX + userId)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('inventory-logs-updated'))
      }
    } catch (e) {
      console.warn('Error limpiando logs de inventario:', e)
    }
  },
}
