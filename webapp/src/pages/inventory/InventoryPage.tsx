import { useState } from 'react'
import {
  useInventory,
  useDeleteIngredient,
  useUpdateIngredient,
  useAddIngredients,
  useClearInventory,
} from '../../hooks/useInventory'
import {
  guessCategory,
  guessShelfLife,
  defaultExpiryDate,
  estimateItemValueARS,
} from '../../lib/ingredientParser'
import GoogleIcon from '../../components/GoogleIcon'
import CookingPotAnimation from '../../components/CookingPotAnimation'
import type { InventoryItem } from '../../types/app.types'

export default function InventoryPage() {
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { mutate: updateItem } = useUpdateIngredient()
  const { mutateAsync: addItems } = useAddIngredients()
  const { mutate: clearInventory } = useClearInventory()

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
      {/* Encabezado limpio con acción de vaciar despensa */}
      <div className="px-5 pt-safe pb-3 border-b border-[#A88B57]/20 flex-shrink-0 bg-transparent flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 opacity-90 mb-1">
            <span className="text-[#A88B57] text-xs">✦</span>
            <span className="text-xs sm:text-sm tracking-[0.22em] uppercase font-bold text-[#8F7347]">
              Reserva de Ingredientes
            </span>
          </div>
          <h1 className="font-menu-title text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
            La Despensa
          </h1>
          <p className="font-menu-serif text-base sm:text-lg text-[#44382F] mt-1 font-medium">
            {inventory.length} {inventory.length === 1 ? 'materia prima' : 'materias primas'} registradas en stock
          </p>
        </div>
        {inventory.length > 0 && (
          <button
            type="button"
            onClick={() => clearInventory()}
            className="font-menu-serif text-sm text-[#8F7347] hover:text-[#C84B31] transition px-3.5 py-2 rounded-xl border border-[#A88B57]/35 hover:border-[#C84B31]/40 tap-subtle cursor-pointer bg-[#FAF7F2]/90 font-bold"
            title="Vaciar despensa para empezar de cero"
          >
            Vaciar reserva
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
          {/* Formulario estilizado para añadir a la despensa */}
          <form onSubmit={handleAddSubmit} className="flex gap-2.5 mb-2 p-2 rounded-2xl bg-[#FAF7F2]/90 border border-[#A88B57]/30 shadow-2xs">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Añadir materia prima..."
              className="flex-1 px-4 py-3 bg-white/95 border border-[#A88B57]/30 rounded-xl text-base text-[#1C1917] placeholder:text-[#766153]/60 outline-none focus:border-[#8F7347] transition font-menu-serif font-medium"
            />
            <input
              type="number"
              min={1}
              value={newQuantity}
              onChange={e => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-18 px-2 py-3 bg-white/95 border border-[#A88B57]/30 rounded-xl text-base text-[#1C1917] text-center outline-none focus:border-[#8F7347] transition font-mono font-bold"
              title="Cantidad"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-5 py-3 bg-[#1C1917] text-[#FAF7F2] rounded-xl text-lg font-bold hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-[#A88B57]/40 shadow-2xs"
            >
              +
            </button>
          </form>

          {/* Lista estilo libro de bodega / despensa de alta cocina */}
          {isLoading ? (
            <CookingPotAnimation inline message="Consultando despensa..." />
          ) : inventory.length === 0 ? (
            <div className="py-16 text-center text-[#5A483D] text-base font-menu-serif italic font-medium">
              No hay materias primas registradas en la despensa. Añada una arriba o desde La Cocina.
            </div>
          ) : (
            <div className="menu-card-frame rounded-2xl p-5 relative space-y-1">
              {/* Esquinas ornamentales */}
              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#A88B57]/60 pointer-events-none" />

              <div className="pb-2.5 mb-2 border-b border-[#A88B57]/20 flex items-center justify-between text-xs sm:text-sm font-menu-serif text-[#8F7347] uppercase tracking-wider font-bold">
                <span>Materia Prima</span>
              <span>Existencias · Valor Est.</span>
            </div>

            {inventory.map((item) => {
              const qty = item.quantity ?? 1
              const priceARS = estimateItemValueARS(item.name, qty, item.unit)

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-[#A88B57]/15 group last:border-b-0"
                >
                  {/* Formato adaptativo: Nombre, existencias y valor */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline flex-1 min-w-0 mr-2 sm:mr-3">
                    <div className="flex items-center min-w-0">
                      <span className="text-[#A88B57] text-xs mr-2 flex-shrink-0">✦</span>
                      <span className="font-menu-serif font-extrabold text-base sm:text-xl text-[#1C1917] capitalize truncate">
                        {item.name}
                      </span>
                      <span className="ml-2 text-sm sm:text-base text-[#1C1917] font-mono font-bold flex-shrink-0">
                        · {qty} {item.unit || 'ud'}
                      </span>
                    </div>
                    <span className="hidden sm:inline-block flex-1 border-b border-dotted border-[#A88B57]/30 mx-2 mb-1" />
                    <div className="mt-1 sm:mt-0 flex items-center">
                      <span className="text-xs sm:text-sm text-[#8F7347] font-mono whitespace-nowrap flex-shrink-0 bg-[#A88B57]/15 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-[#A88B57]/25 font-bold">
                        ARS {priceARS.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones refinadas: +, -, Eliminar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#A88B57]/40 text-[#8F7347] hover:bg-[#A88B57]/20 text-base font-mono font-bold transition cursor-pointer"
                      title="Restar"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrease(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#A88B57]/40 text-[#8F7347] hover:bg-[#A88B57]/20 text-base font-mono font-bold transition cursor-pointer"
                      title="Aumentar"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-[#766153]/50 hover:text-[#C84B31] transition cursor-pointer ml-1"
                      title="Eliminar"
                    >
                      <GoogleIcon name="close" size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
