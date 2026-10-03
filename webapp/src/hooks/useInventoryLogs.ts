import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { inventoryLogger, type InventoryLogEntry } from '../lib/inventoryLogs'

export function useInventoryLogs() {
  const { user } = useAuth()
  const userId = user?.id || 'demo-user-1'

  const [logs, setLogs] = useState<InventoryLogEntry[]>(() =>
    inventoryLogger.getLogs(userId)
  )

  const refreshLogs = useCallback(() => {
    setLogs(inventoryLogger.getLogs(userId))
  }, [userId])

  useEffect(() => {
    refreshLogs()

    const handleUpdate = () => {
      refreshLogs()
    }

    window.addEventListener('inventory-logs-updated', handleUpdate)
    return () => {
      window.removeEventListener('inventory-logs-updated', handleUpdate)
    }
  }, [userId, refreshLogs])

  const clearLogs = useCallback(() => {
    inventoryLogger.clearLogs(userId)
    setLogs([])
  }, [userId])

  return {
    logs,
    clearLogs,
    refreshLogs,
  }
}
