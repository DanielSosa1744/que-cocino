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
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in">
      {/* Encabezado limpio */}
      <div className="px-5 pt-safe pb-4 border-b border-[#766153]/15 flex-shrink-0 bg-transparent">
        <h1 className="text-xl font-serif font-medium text-[#2F2A26] tracking-tight">
          Mi Despensa
        </h1>
        <p className="text-xs text-[#766153] mt-0.5">
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
            className="flex-1 px-3 py-2 bg-[#FCFAF5] border border-[#766153]/20 rounded-lg text-xs text-[#2F2A26] placeholder:text-[#766153]/50 outline-none focus:border-[#5D7A56] transition"
          />
          <input
            type="number"
            min={1}
            value={newQuantity}
            onChange={e => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 px-2 py-2 bg-[#FCFAF5] border border-[#766153]/20 rounded-lg text-xs text-[#2F2A26] text-center outline-none focus:border-[#5D7A56] transition font-mono"
            title="Cantidad"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-3.5 py-2 bg-[#2F2A26] text-[#F7F3EC] rounded-lg text-xs font-medium hover:bg-[#5D7A56] transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            +
          </button>
        </form>

        {/* Lista simple estilo libreta de cocina */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#766153] font-mono">
            Cargando despensa...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-16 text-center text-[#766153] text-xs">
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
                  className="flex items-center justify-between py-2.5 border-b border-[#766153]/10 group"
                >
                  {/* Formato: Tomates ........ 4 ........ ARS 1800 */}
                  <div className="flex items-baseline flex-1 min-w-0 mr-3">
                    <span className="text-sm font-medium text-[#2F2A26] capitalize truncate max-w-[120px] sm:max-w-none">
                      {item.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-[#766153]/30 mx-2 mb-1" />
                    <span className="text-sm text-[#766153] font-mono flex-shrink-0">
                      {qty}
                    </span>
                    <span className="flex-1 border-b border-dotted border-[#766153]/30 mx-2 mb-1" />
                    <span className="text-xs text-[#A68A64] font-mono whitespace-nowrap flex-shrink-0">
                      ARS {priceARS.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Acciones simples: +, -, Eliminar */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-[#766153]/25 text-[#766153] hover:bg-[#A68A64]/10 text-xs font-mono transition cursor-pointer"
                      title="Restar"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrease(item)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-[#766153]/25 text-[#766153] hover:bg-[#A68A64]/10 text-xs font-mono transition cursor-pointer"
                      title="Aumentar"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-[#766153]/40 hover:text-[#2F2A26] transition cursor-pointer ml-1"
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
