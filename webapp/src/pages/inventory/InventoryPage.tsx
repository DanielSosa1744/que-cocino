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
          <div className="flex items-center gap-1.5 opacity-80 mb-0.5">
            <span className="text-[#A88B57] text-[9px]">✦</span>
            <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-[#8F7347]">
              Reserva de Ingredientes
            </span>
          </div>
          <h1 className="font-menu-title text-2xl font-bold text-[#1C1917] tracking-tight">
            La Despensa de la Casa
          </h1>
          <p className="font-menu-serif italic text-sm sm:text-base text-[#766153] mt-1">
            {inventory.length} {inventory.length === 1 ? 'materia prima' : 'materias primas'} registradas en stock
          </p>
        </div>
        {inventory.length > 0 && (
          <button
            type="button"
            onClick={() => clearInventory()}
            className="font-menu-serif text-xs sm:text-sm text-[#8F7347] hover:text-[#C84B31] transition px-3 py-1.5 rounded-lg border border-[#A88B57]/35 hover:border-[#C84B31]/40 tap-subtle cursor-pointer bg-[#FAF7F2]/80"
            title="Vaciar despensa para empezar de cero"
          >
            Vaciar reserva
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {/* Formulario estilizado para añadir a la despensa */}
        <form onSubmit={handleAddSubmit} className="flex gap-2 mb-6 p-2 rounded-xl bg-[#FAF7F2]/80 border border-[#A88B57]/30 shadow-2xs">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Añadir materia prima..."
            className="flex-1 px-3.5 py-2.5 bg-white/90 border border-[#A88B57]/25 rounded-lg text-sm sm:text-base text-[#1C1917] placeholder:text-[#766153]/50 outline-none focus:border-[#8F7347] transition font-menu-serif"
          />
          <input
            type="number"
            min={1}
            value={newQuantity}
            onChange={e => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-2.5 bg-white/90 border border-[#A88B57]/25 rounded-lg text-sm text-[#1C1917] text-center outline-none focus:border-[#8F7347] transition font-mono font-bold"
            title="Cantidad"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-4 py-2.5 bg-[#1C1917] text-[#FAF7F2] rounded-lg text-sm font-bold hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-[#A88B57]/40 shadow-2xs"
          >
            +
          </button>
        </form>

        {/* Lista estilo libro de bodega / despensa de alta cocina */}
        {isLoading ? (
          <CookingPotAnimation inline message="Consultando despensa..." />
        ) : inventory.length === 0 ? (
          <div className="py-16 text-center text-[#766153] text-sm font-menu-serif italic">
            No hay materias primas registradas en la despensa. Añada una arriba o desde La Cocina.
          </div>
        ) : (
          <div className="menu-card-frame rounded-2xl p-4 sm:p-5 relative space-y-1">
            {/* Esquinas ornamentales */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#A88B57]/60 pointer-events-none" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#A88B57]/60 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#A88B57]/60 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#A88B57]/60 pointer-events-none" />

            <div className="pb-2.5 mb-2 border-b border-[#A88B57]/20 flex items-center justify-between text-xs sm:text-sm font-menu-serif text-[#8F7347] uppercase tracking-wider font-semibold">
              <span>Materia Prima</span>
              <span>Existencias · Valor Est.</span>
            </div>

            {inventory.map((item) => {
              const qty = item.quantity ?? 1
              const priceARS = estimateItemValueARS(item.name, qty, item.unit)

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 border-b border-[#A88B57]/10 group last:border-b-0"
                >
                  {/* Formato: ✦ Tomates ........ 4 ........ ARS 1800 */}
                  <div className="flex items-baseline flex-1 min-w-0 mr-3">
                    <span className="text-[#A88B57] text-[9px] mr-1.5 flex-shrink-0">✦</span>
                    <span className="font-menu-serif font-bold text-base sm:text-lg text-[#1C1917] capitalize truncate max-w-[140px] sm:max-w-none">
                      {item.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-[#A88B57]/30 mx-2 mb-1" />
                    <span className="text-sm text-[#1C1917] font-mono font-semibold flex-shrink-0">
                      {qty} {item.unit || 'ud'}
                    </span>
                    <span className="flex-1 border-b border-dotted border-[#A88B57]/30 mx-2 mb-1" />
                    <span className="text-xs sm:text-sm text-[#8F7347] font-mono whitespace-nowrap flex-shrink-0 bg-[#A88B57]/10 px-2 py-0.5 rounded border border-[#A88B57]/20 font-semibold">
                      ARS {priceARS.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Acciones refinadas: +, -, Eliminar */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleDecrease(item)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-[#A88B57]/30 text-[#8F7347] hover:bg-[#A88B57]/15 text-sm font-mono font-bold transition cursor-pointer"
                      title="Restar"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleIncrease(item)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-[#A88B57]/30 text-[#8F7347] hover:bg-[#A88B57]/15 text-sm font-mono font-bold transition cursor-pointer"
                      title="Aumentar"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-[#766153]/40 hover:text-[#C84B31] transition cursor-pointer ml-1"
                      title="Eliminar"
                    >
                      <GoogleIcon name="close" size={16} />
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
