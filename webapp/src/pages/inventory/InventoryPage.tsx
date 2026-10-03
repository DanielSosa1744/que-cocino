import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useInventory,
  useDeleteIngredient,
  useUpdateIngredient,
  useAddIngredients
} from '../../hooks/useInventory'
import {
  guessCategory,
  guessShelfLife,
  defaultExpiryDate
} from '../../lib/ingredientParser'
import UrgencyBadge from '../../components/UrgencyBadge'
import {
  ArrowLeft,
  Mic,
  Search,
  X,
  Trash2,
  Edit2,
  Plus,
  Check,
  ChevronRight
} from 'lucide-react'
import type { InventoryItem } from '../../types/app.types'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { mutate: updateItem } = useUpdateIngredient()
  const { mutateAsync: addItems, isPending: addingItem } = useAddIngredients()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')

  // Modal / Form para agregar manualmente
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQuantity, setAddQuantity] = useState<number | ''>(1)
  const [addUnit, setAddUnit] = useState('ud')
  const [addCategory, setAddCategory] = useState('verdura')
  const [addShelfLife, setAddShelfLife] = useState<number | ''>(7)

  // Estado de edición rápida
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQuantity, setEditQuantity] = useState<number | ''>('')
  const [editUnit, setEditUnit] = useState('')
  const [editDays, setEditDays] = useState<number | ''>('')

  const handleStartEdit = (item: InventoryItem) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditQuantity(item.quantity ?? '')
    setEditUnit(item.unit ?? 'ud')
    setEditDays(item.days_until_expiry ?? 7)
  }

  const handleSaveEdit = (id: string) => {
    const days = typeof editDays === 'number' ? editDays : 7
    updateItem({
      id,
      name: editName.trim() || 'Ingrediente',
      quantity: typeof editQuantity === 'number' ? editQuantity : 1,
      unit: editUnit || 'ud',
      expires_at: defaultExpiryDate(days),
    })
    setEditingItemId(null)
  }

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim()) return

    const days = typeof addShelfLife === 'number' ? addShelfLife : guessShelfLife(addName)
    await addItems([{
      name: addName.trim(),
      quantity: typeof addQuantity === 'number' ? addQuantity : 1,
      unit: addUnit,
      category: addCategory || guessCategory(addName),
      expires_at: defaultExpiryDate(days),
    }])

    setAddName('')
    setAddQuantity(1)
    setAddUnit('ud')
    setAddShelfLife(7)
    setShowAddModal(false)
  }

  const filtered = inventory.filter(item => {
    if (filter !== 'all' && item.urgency !== filter) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const criticalCount = inventory.filter(i => i.urgency === 'critical').length
  const warningCount = inventory.filter(i => i.urgency === 'warning').length
  const okCount = inventory.filter(i => i.urgency === 'ok').length

  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-app bg-gray-50 flex flex-col pb-12">
      {/* Header */}
      <div className="bg-white px-5 pt-safe pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <h1 className="text-base font-extrabold text-gray-900">Inventario de Despensa</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition shadow-sm"
            title="Agregar ingrediente manualmente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre (tomate, huevo...)"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>

        {/* Semáforo Tabs de filtro */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({inventory.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
              filter === 'critical' ? 'bg-[#F44336] text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Rojo · ≤2 días ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
              filter === 'warning' ? 'bg-[#FF9800] text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Naranja · ≤7 días ({warningCount})
          </button>
          <button
            onClick={() => setFilter('ok')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
              filter === 'ok' ? 'bg-[#4CAF50] text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Verde · Bien ({okCount})
          </button>
        </div>
      </div>

      {/* Lista de Alimentos */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Cargando despensa...
          </div>
        )}

        {!isLoading && inventory.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm mt-4">
            <p className="text-4xl mb-3">🧺</p>
            <h3 className="font-bold text-gray-900 text-base">Inventario vacío</h3>
            <p className="text-gray-400 text-xs mt-1 mb-5">
              Registra lo que tienes en casa por voz o agregando manualmente.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/voice')}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" /> Dictar por voz
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs"
              >
                + Agregar manualmente
              </button>
            </div>
          </div>
        )}

        {!isLoading && inventory.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-xs">
            No hay alimentos coincidentes con el filtro seleccionado.
          </div>
        )}

        {filtered.map(item => {
          const isEditing = editingItemId === item.id

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition p-4 ${
                item.urgency === 'critical'
                  ? 'bg-red-50/50 border-red-200'
                  : item.urgency === 'warning'
                  ? 'bg-orange-50/50 border-orange-200'
                  : 'bg-white border-gray-100 shadow-xs'
              }`}
            >
              {isEditing ? (
                /* Modo edición */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Nombre..."
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={e => setEditQuantity(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Cant."
                      className="w-16 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-center font-medium"
                    />
                    <input
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      placeholder="ud"
                      className="w-14 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-center font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>Días para caducar:</span>
                      <input
                        type="number"
                        value={editDays}
                        onChange={e => setEditDays(e.target.value ? Number(e.target.value) : '')}
                        className="w-12 px-1.5 py-1 bg-white border border-gray-300 rounded-lg text-xs text-center font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Modo visualización estándar */
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Semáforo indicador */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          item.urgency === 'critical'
                            ? 'bg-[#F44336]'
                            : item.urgency === 'warning'
                            ? 'bg-[#FF9800]'
                            : 'bg-[#4CAF50]'
                        }`}
                      />
                      <h4 className="font-extrabold text-gray-900 text-sm capitalize truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="font-medium text-gray-800">
                        {item.quantity != null ? `${item.quantity} ${item.unit}` : '1 ud'}
                      </span>
                      <span>·</span>
                      <span className="text-gray-400">
                        Reg: {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <UrgencyBadge item={item} />
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      title="Editar ingrediente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar de la despensa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA Inferior a Vaciar Nevera */}
      {inventory.length > 0 && (
        <div className="sticky bottom-0 z-30 px-5 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl transition shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-98 text-sm"
          >
            Modo Vaciar Nevera ({criticalCount + warningCount} en riesgo)
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL / FORMULARIO PARA AGREGAR MANUALMENTE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end md:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-base">
                Agregar Alimento a Despensa
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nombre del ingrediente
                </label>
                <input
                  value={addName}
                  onChange={e => {
                    const val = e.target.value
                    setAddName(val)
                    setAddCategory(guessCategory(val))
                    setAddShelfLife(guessShelfLife(val))
                  }}
                  required
                  placeholder="Ej: Tomate, Yogur, Pollo..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={addQuantity}
                    onChange={e => setAddQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unidad</label>
                  <select
                    value={addUnit}
                    onChange={e => setAddUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium"
                  >
                    <option value="ud">ud (unidades)</option>
                    <option value="g">gramos (g)</option>
                    <option value="kg">kilos (kg)</option>
                    <option value="L">litros (L)</option>
                    <option value="lata">lata</option>
                    <option value="paq">paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
                  <select
                    value={addCategory}
                    onChange={e => setAddCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium"
                  >
                    <option value="verdura">Verdura / Fruta</option>
                    <option value="proteína">Proteína</option>
                    <option value="lácteo">Lácteo</option>
                    <option value="despensa">Despensa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vida útil (días)</label>
                  <input
                    type="number"
                    min="1"
                    value={addShelfLife}
                    onChange={e => setAddShelfLife(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingItem}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-green-100"
                >
                  {addingItem ? 'Guardando...' : 'Guardar alimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
