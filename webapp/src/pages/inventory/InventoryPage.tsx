import { useState } from 'react'
import {
  useInventory,
  useDeleteIngredient,
  useUpdateIngredient,
  useAddIngredients,
} from '../../hooks/useInventory'
import {
  guessCategory,
  guessShelfLife,
  defaultExpiryDate,
  estimateItemValueARS,
} from '../../lib/ingredientParser'
import GoogleIcon from '../../components/GoogleIcon'
import type { InventoryItem } from '../../types/app.types'

export default function InventoryPage() {
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { mutate: updateItem } = useUpdateIngredient()
  const { mutateAsync: addItems } = useAddIngredients()

  const [newName, setNewName] = useState('')
  const [newQuantity, setNewQuantity] = useState<number>(1)

  const handleIncrease = (item: InventoryItem) => {
    const currentQty = Number(item.quantity) || 0
    updateItem({
      id: item.id,
      quantity: currentQty + 1,
    })
  }

  const handleDecrease = (item: InventoryItem) => {
    const currentQty = Number(item.quantity) || 0
    if (currentQty <= 1) {
      deleteItem(item.id)
    } else {
      updateItem({
        id: item.id,
        quantity: currentQty - 1,
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteItem(id)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    const name = newName.trim()
    const shelfLife = guessShelfLife(name)
    await addItems([
      {
        name,
        quantity: Number(newQuantity) || 1,
        unit: 'ud',
        category: guessCategory(name),
        expires_at: defaultExpiryDate(shelfLife),
      },
    ])
    setNewName('')
    setNewQuantity(1)
  }

  return (
    <div className="h-full max-h-full bg-white flex flex-col overflow-hidden">
      {/* Encabezado limpio */}
      <div className="px-5 pt-safe pb-4 border-b border-stone-100 flex-shrink-0 bg-white">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          Mi Despensa
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {inventory.length} {inventory.length === 1 ? 'ingrediente' : 'ingredientes'} en stock
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {/* Formulario simple para añadir */}
        <form onSubmit={handleAddSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Añadir ingrediente..."
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-800 transition"
          />
          <input
            type="number"
            min={1}
            value={newQuantity}
            onChange={e => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 px-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 text-center outline-none focus:border-stone-800 transition font-mono"
            title="Cantidad"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            +
          </button>
        </form>

        {/* Lista simple estilo Notion / Bear */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400 font-mono">
            Cargando despensa...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            No tienes ingredientes en tu despensa. Añade uno arriba o desde Inicio.
          </div>
        ) : (
          <div className="space-y-1">
            {inventory.map((item) => {
              const qty = item.quantity ?? 1
              const priceARS = estimateItemValueARS(item.name, qty, item.unit)

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 border-b border-stone-100 group"
                >
                  {/* Formato: Tomates ........ 4 ........ ARS 1800 */}
                  <div className="flex items-baseline flex-1 min-w-0 mr-3">
                    <span className="text-sm font-medium text-stone-900 capitalize truncate max-w-[120px] sm:max-w-none">
                      {item.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-stone-300 mx-2 mb-1" />
                    <span className="text-sm text-stone-700 font-mono flex-shrink-0">
                      {qty}
                    </span>
                    <span className="flex-1 border-b border-dotted border-stone-300 mx-2 mb-1" />
                    <span className="text-xs text-stone-500 font-mono whitespace-nowrap flex-shrink-0">
                      ARS {priceARS.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Acciones simples: +, -, Eliminar */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-mono transition cursor-pointer"
                      title="Restar"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrease(item)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-mono transition cursor-pointer"
                      title="Aumentar"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-stone-300 hover:text-stone-700 transition cursor-pointer ml-1"
                      title="Eliminar"
                    >
                      <GoogleIcon name="close" size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
