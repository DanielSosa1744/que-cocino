import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAddIngredients } from '../../hooks/useInventory'
import { defaultExpiryDate, guessCategory, guessShelfLife, singularize } from '../../lib/ingredientParser'
import { GoogleIcon } from '../../components/GoogleIcon'
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
  const { mutateAsync: addIngredients, isPending } = useAddIngredients()

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

    const items = rows.map(r => ({
      name: r.name,
      quantity: r.quantity ?? 1,
      unit: r.unit ?? 'ud',
      category: r.category ?? guessCategory(r.name),
      expires_at: r.expiryDays != null ? defaultExpiryDate(r.expiryDays) : null,
    }))

    await addIngredients(items)
    // Mostrar el inventario actualizado
    navigate('/inventory', { replace: true })
  }

  return (
    <div className="h-full max-h-full bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-stone-200/80 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 mb-1 transition tap-subtle">
          <GoogleIcon name="arrow_back" size={16} />
          <span className="text-xs font-medium">Volver</span>
        </button>
        <div className="flex items-center gap-1.5">
          <GoogleIcon name="auto_awesome" size={18} className="text-emerald-700" />
          <h1 className="text-lg font-bold text-stone-900 leading-tight">Confirmar ingredientes</h1>
        </div>
        <p className="text-stone-500 text-xs">
          Revisa o ajusta antes de guardar en tu inventario.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {/* Original text */}
        {rawText && (
          <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-2xs">
            <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-0.5">
              Texto dictado o escrito
            </p>
            <p className="text-stone-700 text-xs italic font-medium">"{rawText}"</p>
          </div>
        )}

        {/* Ingredient list */}
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2 border-b border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
              Ingredientes extraídos ({rows.length})
            </p>
            <span className="text-[10px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              Semáforo automático
            </span>
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-stone-400 text-xs">
              No se detectaron ingredientes. Añade uno manualmente abajo.
            </div>
          )}

          <div className="divide-y divide-stone-100">
            {rows.map((row) => (
              <div key={row.id} className="px-3 py-2 hover:bg-stone-50/70 transition">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      className="w-full text-xs font-semibold text-stone-900 bg-transparent border-b border-stone-200 focus:border-emerald-600 focus:outline-none py-0.5 capitalize"
                      placeholder="Ingrediente..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      value={row.quantity ?? ''}
                      onChange={e => updateRow(row.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Cant."
                      className="w-12 text-xs text-center bg-stone-50 rounded-lg px-1.5 py-1 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium text-stone-800"
                    />
                    <input
                      value={row.unit ?? ''}
                      onChange={e => updateRow(row.id, 'unit', e.target.value || null)}
                      placeholder="ud"
                      className="w-10 text-xs text-center bg-stone-50 rounded-lg px-1 py-1 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-700"
                    />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition flex-shrink-0 tap-subtle"
                    title="Eliminar"
                  >
                    <GoogleIcon name="delete" size={16} />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400">Vida útil:</span>
                    <input
                      type="number"
                      min={1}
                      value={row.expiryDays ?? ''}
                      onChange={e => updateRow(row.id, 'expiryDays', e.target.value ? Number(e.target.value) : null)}
                      className="w-10 text-center bg-stone-50 rounded-md px-1 py-0.5 border border-stone-200 font-bold text-stone-800 text-[11px]"
                    />
                    <span className="text-[10px] text-stone-400">días</span>
                  </div>

                  <span className="text-[10px] text-stone-500 font-medium">
                    {row.expiryDays != null
                      ? `Vence en ${row.expiryDays} día${row.expiryDays === 1 ? '' : 's'}`
                      : 'Sin fecha'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add ingredient manually */}
        <div className="bg-white rounded-2xl border border-stone-200/70 p-2.5 shadow-2xs">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
            + Añadir otro ingrediente
          </p>
          <div className="flex gap-1.5">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()}
              placeholder="Ej: dos yogures, media cebolla..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={addRow}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg disabled:opacity-40 hover:bg-emerald-900 transition font-medium flex items-center gap-1 text-xs shadow-xs tap-subtle"
            >
              <GoogleIcon name="add" size={16} />
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/95 backdrop-blur-sm border-t border-stone-200/80 pb-safe">
        <button
          onClick={handleConfirm}
          disabled={rows.length === 0 || isPending}
          className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-medium rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs active:scale-98 text-sm tap-subtle"
        >
          {isPending ? (
            'Guardando en inventario...'
          ) : (
            <>
              <GoogleIcon name="check_circle" size={18} />
              Guardar en el inventario
            </>
          )}
        </button>
      </div>
    </div>
  )
}
