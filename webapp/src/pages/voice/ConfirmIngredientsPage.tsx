import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useReplaceInventory } from '../../hooks/useInventory'
import { defaultExpiryDate, guessCategory, guessShelfLife, singularize } from '../../lib/ingredientParser'
import { GoogleIcon } from '../../components/GoogleIcon'
import CookingPotAnimation from '../../components/CookingPotAnimation'
import type { ParsedIngredient } from '../../types/app.types'

interface IngredientRow extends ParsedIngredient {
  id: string
  expiryDays: number | null
}

let idCounter = 0
function newId() {
  return `tmp-${Date.now()}-${++idCounter}`
}

export default function ConfirmIngredientsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mutateAsync: replaceInventory } = useReplaceInventory()
  const [isProcessing, setIsProcessing] = useState(false)

  const { parsed = [], rawText = '' } = (location.state as {
    parsed: ParsedIngredient[]
    rawText: string
  }) || {}

  const [rows, setRows] = useState<IngredientRow[]>(() =>
    parsed.map(p => ({
      ...p,
      id: newId(),
      category: p.category || guessCategory(p.name),
      expiryDays: p.expiryDays ?? guessShelfLife(p.name),
    }))
  )

  const [newName, setNewName] = useState('')

  const updateRow = (id: string, field: keyof IngredientRow, value: string | number | null) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const addRow = () => {
    if (!newName.trim()) return
    const name = newName.trim()
    const key = singularize(name)

    setRows(prev => {
      const existingIdx = prev.findIndex(r => singularize(r.name) === key)
      if (existingIdx >= 0) {
        return prev.map((r, i) => i === existingIdx ? { ...r, quantity: (r.quantity ?? 1) + 1 } : r)
      }
      return [...prev, {
        id: newId(),
        name,
        quantity: 1,
        unit: 'ud',
        category: guessCategory(name),
        expiryDays: guessShelfLife(name),
      }]
    })
    setNewName('')
  }

  const handleConfirm = async () => {
    if (rows.length === 0) return
    setIsProcessing(true)

    const items = rows.map(r => ({
      name: r.name,
      quantity: r.quantity ?? 1,
      unit: r.unit ?? 'ud',
      category: r.category ?? guessCategory(r.name),
      expires_at: r.expiryDays != null ? defaultExpiryDate(r.expiryDays) : null,
    }))

    const names = items.map(i => i.name)
    sessionStorage.setItem('que_cocino_recent_ingredients', JSON.stringify(names))

    try {
      await Promise.all([
        replaceInventory(items),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ])
      // Mostrar directamente las recetas compatibles basadas estrictamente en esta tanda
      navigate('/recetas', {
        state: {
          recentIngredients: names,
          isNewBatch: true,
          timestamp: Date.now(),
        },
        replace: true,
      })
    } catch (err) {
      console.error('Error al guardar ingredientes:', err)
      navigate('/recetas', { replace: true })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in text-[#2F2A26]">
      {/* Header */}
      <div className="px-4 pt-safe pb-2.5 border-b border-[#A88B57]/20 flex-shrink-0 bg-transparent">
        <button onClick={() => navigate(-1)} className="font-menu-serif text-sm text-[#8F7347] hover:text-[#1C1917] mb-1.5 transition tap-subtle flex items-center gap-1.5 cursor-pointer font-medium">
          <span>←</span>
          <span>Volver</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
              <span className="text-[#A88B57] text-xs">✦</span>
              <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#8F7347]">
                Revisión de Comanda
              </span>
            </div>
            <h1 className="font-menu-title text-2xl font-bold text-[#1C1917] leading-tight">Composición de Ingredientes</h1>
            <p className="font-menu-serif italic text-[#766153] text-sm mt-0.5">
              Verifique sus materias primas antes de confeccionar la carta
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3.5">
        {/* Original text */}
        {rawText && (
          <div className="bg-[#FAF7F2] rounded-xl p-3.5 border border-[#A88B57]/25 shadow-2xs">
            <p className="text-xs font-semibold text-[#8F7347] uppercase tracking-wider mb-1 font-menu-serif">
              ✦ Texto de comanda registrado:
            </p>
            <p className="text-[#1C1917] text-sm italic font-menu-serif leading-relaxed">"{rawText}"</p>
          </div>
        )}

        {/* Ingredient list */}
        <div className="menu-card-frame rounded-2xl p-4 relative overflow-hidden">
          {/* Esquinas ornamentales */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#A88B57]/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#A88B57]/60 pointer-events-none" />

          <div className="pb-2.5 border-b border-[#A88B57]/15 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-semibold text-[#8F7347] uppercase tracking-wider font-menu-serif">
              ✦ Ingredientes Detectados ({rows.length})
            </p>
            <span className="text-xs text-[#4A6B44] font-menu-serif font-medium bg-[#EBF1E8] border border-[#4A6B44]/25 px-2.5 py-0.5 rounded-full">
              Semáforo de frescura
            </span>
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-[#766153] text-sm font-menu-serif italic">
              No se detectaron materias primas. Añada una manualmente abajo.
            </div>
          )}

          <div className="divide-y divide-[#A88B57]/10">
            {rows.map((row) => (
              <div key={row.id} className="py-3 transition">
                <div className="flex items-center gap-2">
                  <span className="text-[#A88B57] text-[9px]">✦</span>
                  <div className="flex-1 min-w-0">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      className="w-full text-base font-semibold text-[#1C1917] bg-transparent border-b border-[#A88B57]/20 focus:border-[#8F7347] focus:outline-none py-0.5 capitalize font-menu-serif"
                      placeholder="Materia prima..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      value={row.quantity ?? ''}
                      onChange={e => updateRow(row.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Cant."
                      className="w-14 text-sm text-center bg-white/90 rounded-lg px-2 py-1.5 border border-[#A88B57]/25 focus:outline-none focus:border-[#8F7347] font-mono font-bold text-[#1C1917]"
                    />
                    <input
                      value={row.unit ?? ''}
                      onChange={e => updateRow(row.id, 'unit', e.target.value || null)}
                      placeholder="ud"
                      className="w-12 text-sm text-center bg-white/90 rounded-lg px-1.5 py-1.5 border border-[#A88B57]/25 focus:outline-none focus:border-[#8F7347] text-[#766153] font-mono"
                    />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-[#766153]/40 hover:text-[#C84B31] transition flex-shrink-0 tap-subtle cursor-pointer ml-0.5"
                    title="Eliminar"
                  >
                    <GoogleIcon name="delete" size={17} />
                  </button>
                </div>

                <div className="mt-1.5 pl-3 flex items-center justify-between text-xs sm:text-sm text-[#766153]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#8F7347] font-menu-serif">Vida útil:</span>
                    <input
                      type="number"
                      min={1}
                      value={row.expiryDays ?? ''}
                      onChange={e => updateRow(row.id, 'expiryDays', e.target.value ? Number(e.target.value) : null)}
                      className="w-12 text-center bg-white/90 rounded-md px-1.5 py-0.5 border border-[#A88B57]/25 font-bold text-[#1C1917] text-xs font-mono"
                    />
                    <span className="text-xs text-[#766153] font-menu-serif">días</span>
                  </div>

                  <span className="text-xs text-[#766153] font-menu-serif italic">
                    {row.expiryDays != null
                      ? `Consumo sugerido en ${row.expiryDays} día${row.expiryDays === 1 ? '' : 's'}`
                      : 'Sin fecha'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add ingredient manually */}
        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#A88B57]/30 shadow-2xs">
          <p className="text-xs font-semibold text-[#8F7347] uppercase tracking-wider mb-2 font-menu-serif">
            ✦ Añadir otra materia prima:
          </p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()}
              placeholder="Ej: solomillo, espárragos, hierbas..."
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#A88B57]/25 bg-white/90 text-sm sm:text-base text-[#1C1917] focus:outline-none focus:border-[#8F7347] font-menu-serif"
            />
            <button
              onClick={addRow}
              disabled={!newName.trim()}
              className="px-4 py-2.5 bg-[#1C1917] text-[#FAF7F2] rounded-lg disabled:opacity-40 hover:bg-black transition font-menu-serif text-sm shadow-xs tap-subtle cursor-pointer border border-[#A88B57]/40 flex items-center gap-1.5 font-semibold"
            >
              <GoogleIcon name="add" size={17} />
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-4 py-3 bg-[#FAF7F2]/95 backdrop-blur-sm border-t border-[#A88B57]/25 pb-safe">
        <button
          onClick={handleConfirm}
          disabled={rows.length === 0 || isProcessing}
          className="w-full py-3.5 bg-[#1C1917] hover:bg-black text-[#FAF7F2] font-menu-serif font-semibold tracking-wider rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm active:scale-98 text-sm sm:text-base tap-subtle cursor-pointer border border-[#A88B57]/40"
        >
          {isProcessing ? (
            '✦ Elaborando comanda...'
          ) : (
            <>
              <span>✦ Guardar en Despensa y Confeccionar Carta ✦</span>
              <GoogleIcon name="arrow_forward" size={18} />
            </>
          )}
        </button>
      </div>

      {/* Animación de la olla con ingredientes cayendo */}
      {isProcessing && (
        <CookingPotAnimation
          message="¡Al fuego!"
          subMessage="Guardando ingredientes y buscando recetas..."
        />
      )}
    </div>
  )
}
