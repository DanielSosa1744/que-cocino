import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAddIngredients } from '../../hooks/useInventory'
import { defaultExpiryDate, guessCategory, guessShelfLife, singularize } from '../../lib/ingredientParser'
import { ArrowLeft, Plus, Trash2, CheckCircle, Sparkles } from 'lucide-react'
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
    // Siguiente paso del flujo: Dashboard
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="h-full max-h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 mb-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Volver</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-green-500" />
          <h1 className="text-lg font-black text-gray-900 leading-tight">Confirmar ingredientes</h1>
        </div>
        <p className="text-gray-400 text-xs">
          Revisa o ajusta antes de guardar en tu inventario.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {/* Original text */}
        {rawText && (
          <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-2xs">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Texto dictado o escrito
            </p>
            <p className="text-gray-700 text-xs italic font-medium">"{rawText}"</p>
          </div>
        )}

        {/* Ingredient list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2 border-b border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Ingredientes extraídos ({rows.length})
            </p>
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
              Semáforo automático
            </span>
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400 text-xs">
              No se detectaron ingredientes. Añade uno manualmente abajo.
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {rows.map((row) => (
              <div key={row.id} className="px-3 py-2 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      className="w-full text-xs font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-green-400 focus:outline-none py-0.5 capitalize"
                      placeholder="Ingrediente..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      value={row.quantity ?? ''}
                      onChange={e => updateRow(row.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Cant."
                      className="w-12 text-xs text-center bg-gray-50 rounded-lg px-1.5 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-400 font-medium"
                    />
                    <input
                      value={row.unit ?? ''}
                      onChange={e => updateRow(row.id, 'unit', e.target.value || null)}
                      placeholder="ud"
                      className="w-10 text-xs text-center bg-gray-50 rounded-lg px-1 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Vida útil:</span>
                    <input
                      type="number"
                      min={1}
                      value={row.expiryDays ?? ''}
                      onChange={e => updateRow(row.id, 'expiryDays', e.target.value ? Number(e.target.value) : null)}
                      className="w-10 text-center bg-gray-50 rounded-md px-1 py-0.5 border border-gray-200 font-bold text-gray-800 text-[11px]"
                    />
                    <span className="text-[10px] text-gray-400">días</span>
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-2.5 shadow-2xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            + Añadir otro ingrediente
          </p>
          <div className="flex gap-1.5">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()}
              placeholder="Ej: dos yogures, media cebolla..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <button
              onClick={addRow}
              disabled={!newName.trim()}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg disabled:opacity-40 hover:bg-green-600 transition font-bold flex items-center gap-1 text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/95 backdrop-blur-sm border-t border-gray-100 pb-safe">
        <button
          onClick={handleConfirm}
          disabled={rows.length === 0 || isPending}
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-green-100 active:scale-98 text-sm"
        >
          {isPending ? (
            'Guardando en inventario...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Guardar e ir al Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  )
}
