import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAddIngredients } from '../../hooks/useInventory'
import { defaultExpiryDate, guessCategory, guessShelfLife } from '../../lib/ingredientParser'
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
    setRows(prev => [...prev, {
      id: newId(),
      name,
      quantity: 1,
      unit: 'ud',
      category: guessCategory(name),
      expiryDays: guessShelfLife(name),
    }])
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-500" />
          <h1 className="text-xl font-bold text-gray-900">Confirmar ingredientes</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Extracción inteligente completada. Revisa o ajusta antes de guardar.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Original text */}
        {rawText && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Texto dictado o escrito
            </p>
            <p className="text-gray-700 text-sm italic font-medium">"{rawText}"</p>
          </div>
        )}

        {/* Ingredient list */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Ingredientes extraídos ({rows.length})
            </p>
            <span className="text-[11px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              Semáforo automático
            </span>
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No se detectaron ingredientes. Añade uno manualmente abajo.
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {rows.map((row) => (
              <div key={row.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, 'name', e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-green-400 focus:outline-none py-1 capitalize"
                      placeholder="Ingrediente..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      value={row.quantity ?? ''}
                      onChange={e => updateRow(row.id, 'quantity', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Cant."
                      className="w-14 text-xs text-center bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-400 font-medium"
                    />
                    <input
                      value={row.unit ?? ''}
                      onChange={e => updateRow(row.id, 'unit', e.target.value || null)}
                      placeholder="ud"
                      className="w-12 text-xs text-center bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">Vida útil:</span>
                    <input
                      type="number"
                      min={1}
                      value={row.expiryDays ?? ''}
                      onChange={e => updateRow(row.id, 'expiryDays', e.target.value ? Number(e.target.value) : null)}
                      className="w-12 text-center bg-gray-50 rounded-lg px-1.5 py-0.5 border border-gray-200 font-semibold text-gray-800"
                    />
                    <span className="text-[11px] text-gray-400">días</span>
                  </div>

                  <span className="text-[11px] text-gray-400">
                    {row.expiryDays != null
                      ? `Vence: ${new Date(Date.now() + row.expiryDays * 86400000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                      : 'Sin fecha'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add ingredient manually */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
            + Añadir otro ingrediente manualmente
          </p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()}
              placeholder="Ej: dos yogures, media cebolla..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
            <button
              onClick={addRow}
              disabled={!newName.trim()}
              className="px-4 py-2.5 bg-green-500 text-white rounded-xl disabled:opacity-40 hover:bg-green-600 transition font-medium flex items-center gap-1 text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Añadir
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-5 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleConfirm}
          disabled={rows.length === 0 || isPending}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-98"
        >
          {isPending ? (
            'Guardando en inventario...'
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Guardar en inventario e ir al Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  )
}
