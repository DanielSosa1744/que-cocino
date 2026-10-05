/**
 * Sistema global de interrupción y abandono de acciones para Que COCINO.
 * Permite que al tocar cualquier botón del toolbar / dock de navegación se cancele
 * de inmediato cualquier acción anterior en curso (dictado por voz, timers de
 * transición, animaciones de procesamiento, promesas en espera) acelerando al
 * máximo el cambio de pantalla.
 */

type AbortCallback = () => void

const abortCallbacks = new Set<AbortCallback>()

export function registerAbortAction(callback: AbortCallback): () => void {
  abortCallbacks.add(callback)
  return () => {
    abortCallbacks.delete(callback)
  }
}

export function abortActiveActions(): void {
  // 1. Detener inmediatamente síntesis de voz del navegador si estuviera activa
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }

  // 2. Disparar evento global para listeners desacoplados
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('que-cocino:abort-action'))
    } catch {}
  }

  // 3. Ejecutar todas las cancelaciones registradas de páginas y hooks activos
  abortCallbacks.forEach(cb => {
    try {
      cb()
    } catch (err) {
      console.warn('Error al abortar acción previa:', err)
    }
  })
}
