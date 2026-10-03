import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useInventory,
  useDeleteIngredient,
  useUpdateIngredient,
  useAddIngredients,
} from '../../hooks/useInventory'
import { useInventoryLogs } from '../../hooks/useInventoryLogs'
import {
  guessCategory,
  guessShelfLife,
  defaultExpiryDate,
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
  Minus,
  Check,
  ChevronRight,
  History,
  AlertCircle,
} from 'lucide-react'
import type { InventoryItem } from '../../types/app.types'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { data: inventory = [], isLoading } = useInventory()
  const { mutate: deleteItem } = useDeleteIngredient()
  const { mutate: updateItem } = useUpdateIngredient()
  const { mutateAsync: addItems, isPending: addingItem } = useAddIngredients()
  const { logs, clearLogs } = useInventoryLogs()

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')

  // Modales de confirmación requeridos
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null)
  const [zeroQtyConfirmItem, setZeroQtyConfirmItem] = useState<InventoryItem | null>(null)

  // Modal para agregar manualmente (Botón flotante)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addName, setAddName] = useState('')
  const [addQuantity, setAddQuantity] = useState<number | ''>(1)
  const [addUnit, setAddUnit] = useState('ud')
  const [addCategory, setAddCategory] = useState('verdura')

  // Modal / Drawer de Historial / Control de Inventario
  const [showLogsModal, setShowLogsModal] = useState(false)

  // Estado de edición secundaria
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQuantity, setEditQuantity] = useState<number | ''>('')
  const [editUnit, setEditUnit] = useState('')
  const [editDays, setEditDays] = useState<number | ''>('')

  // ==========================================
  // MANEJO DE ACCIONES DE UN SOLO TOQUE
  // ==========================================

  // 1. ➕ Aumentar cantidad (1 toque)
  const handleIncrease = (item: InventoryItem) => {
    const currentQty = Number(item.quantity) || 0
    const newQty = currentQty + 1
    updateItem({
      id: item.id,
      quantity: newQty,
      actionType: 'increased',
      changeQty: 1,
      itemName: item.name,
      unit: item.unit ?? undefined,
    })
  }

  // 2. ➖ Restar cantidad (1 toque o confirmación si llega a 0)
  const handleDecrease = (item: InventoryItem) => {
    const currentQty = Number(item.quantity) || 1
    if (currentQty <= 1) {
      // Llega a cero: preguntar "¿Ya no quedan [ingrediente]. ¿Eliminar del inventario?"
      setZeroQtyConfirmItem(item)
    } else {
      const newQty = currentQty - 1
      updateItem({
        id: item.id,
        quantity: newQty,
        actionType: 'decreased',
        changeQty: 1,
        itemName: item.name,
        unit: item.unit ?? undefined,
      })
    }
  }

  // Confirmar eliminación cuando la cantidad llega a 0
  const confirmZeroQtyDelete = () => {
    if (!zeroQtyConfirmItem) return
    deleteItem({ id: zeroQtyConfirmItem.id, name: zeroQtyConfirmItem.name })
    setZeroQtyConfirmItem(null)
  }

  // Confirmar eliminación manual con icono de papelera
  const confirmDelete = () => {
    if (!deleteConfirmItem) return
    deleteItem({ id: deleteConfirmItem.id, name: deleteConfirmItem.name })
    setDeleteConfirmItem(null)
  }

  // Formulario simple: Añadir ingrediente manualmente
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim()) return

    const name = addName.trim()
    const quantity = typeof addQuantity === 'number' ? addQuantity : 1
    const shelfLife = guessShelfLife(name)

    await addItems([
      {
        name,
        quantity,
        unit: addUnit,
        category: addCategory || guessCategory(name),
        expires_at: defaultExpiryDate(shelfLife),
      },
    ])

    setAddName('')
    setAddQuantity(1)
    setAddUnit('ud')
    setAddCategory('verdura')
    setShowAddModal(false)
  }

  // Edición secundaria completa
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

  // Filtrado de la lista
  const filtered = inventory.filter(item => {
    if (filter !== 'all' && item.urgency !== filter) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const criticalCount = inventory.filter(i => i.urgency === 'critical').length
  const warningCount = inventory.filter(i => i.urgency === 'warning').length
  const okCount = inventory.filter(i => i.urgency === 'ok').length

  const formatExpiryText = (item: InventoryItem) => {
    if (item.days_until_expiry == null) return 'Sin fecha'
    if (item.days_until_expiry <= 0) return 'Vence hoy'
    if (item.days_until_expiry === 1) return 'Vence mañana'
    return `Vence en ${item.days_until_expiry} días`
  }

  const formatLogDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="h-full max-h-full bg-gray-50 flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-3.5 pt-safe pb-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black text-gray-900 leading-none">Mi Despensa</h1>
            <span className="text-[10px] text-gray-400 font-medium">
              {inventory.length} alimento{inventory.length !== 1 ? 's' : ''} disponibles
            </span>
          </div>
          {/* Botón de control de inventario / historial */}
          <button
            onClick={() => setShowLogsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition active:scale-95"
            title="Ver control y movimientos de inventario"
          >
            <History className="w-3.5 h-3.5 text-gray-500" />
            <span>Historial</span>
            {logs.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Buscador de alimentos */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en despensa (tomate, huevo, leche...)"
            className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro Semáforo */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
              filter === 'all'
                ? 'bg-gray-900 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({inventory.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1 ${
              filter === 'critical'
                ? 'bg-[#F44336] text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            ≤2 días ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1 ${
              filter === 'warning'
                ? 'bg-[#FF9800] text-white'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            ≤7 días ({warningCount})
          </button>
          <button
            onClick={() => setFilter('ok')}
            className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1 ${
              filter === 'ok'
                ? 'bg-[#4CAF50] text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Bien ({okCount})
          </button>
        </div>
      </div>

      {/* Contenido principal scrolleable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {/* BANNER PROTAGONISTA: AÑADIR POR VOZ */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-3 text-white shadow-xs flex items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">🎙️</span>
              <h2 className="text-xs sm:text-sm font-black tracking-tight leading-none">
                Añadir alimentos por voz
              </h2>
            </div>
            <p className="text-[11px] text-emerald-100 italic leading-snug line-clamp-1">
              "Tengo cuatro tomates y dos yogures."
            </p>
          </div>
          <button
            onClick={() => navigate('/voice')}
            className="flex-shrink-0 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hablar</span>
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400 text-xs">
            <div className="w-7 h-7 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span>Actualizando despensa...</span>
          </div>
        )}

        {/* Estado vacío */}
        {!isLoading && inventory.length === 0 && (
          <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-2xs mt-2">
            <p className="text-4xl mb-2">🧺</p>
            <h3 className="font-extrabold text-gray-900 text-base">Tu despensa está vacía</h3>
            <p className="text-gray-400 text-xs mt-1 mb-4 max-w-xs mx-auto">
              Mantén tu inventario al día dictando por voz o añadiendo alimentos manualmente.
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => navigate('/voice')}
                className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
              >
                <Mic className="w-4 h-4" /> Dictar por voz
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition active:scale-95"
              >
                + Añadir manualmente
              </button>
            </div>
          </div>
        )}

        {/* Sin resultados por filtro */}
        {!isLoading && inventory.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-xs">
            No se encontraron ingredientes con el filtro aplicado.
          </div>
        )}

        {/* TARJETAS INDIVIDUALES DE INGREDIENTES */}
        <div className="space-y-2 pb-16">
          {filtered.map(item => {
            const isEditing = editingItemId === item.id
            const quantity = Number(item.quantity) || 1

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-3.5 shadow-2xs ${
                  item.urgency === 'critical'
                    ? 'border-red-200 ring-1 ring-red-100'
                    : item.urgency === 'warning'
                    ? 'border-orange-200 ring-1 ring-orange-100'
                    : 'border-gray-100'
                }`}
              >
                {isEditing ? (
                  /* Modo edición secundaria */
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Nombre..."
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={e =>
                          setEditQuantity(e.target.value ? Number(e.target.value) : '')
                        }
                        placeholder="Cant."
                        className="w-14 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-center font-bold"
                      />
                      <input
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                        placeholder="ud"
                        className="w-12 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-center font-medium"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>Días caducidad:</span>
                        <input
                          type="number"
                          value={editDays}
                          onChange={e =>
                            setEditDays(e.target.value ? Number(e.target.value) : '')
                          }
                          className="w-12 px-1.5 py-1 bg-white border border-gray-300 rounded-lg text-xs text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg font-medium"
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
                  /* TARJETA INDIVIDUAL DE INGREDIENTE */
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Información del ingrediente */}
                    <div className="flex-1 min-w-0">
                      {/* 1. Nombre */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            item.urgency === 'critical'
                              ? 'bg-[#F44336] animate-pulse'
                              : item.urgency === 'warning'
                              ? 'bg-[#FF9800]'
                              : 'bg-[#4CAF50]'
                          }`}
                        />
                        <h3 className="font-black text-gray-900 text-sm capitalize truncate">
                          {item.name}
                        </h3>
                        {/* 2. Categoría */}
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0">
                          {item.category || 'General'}
                        </span>
                      </div>

                      {/* 3. Vencimiento con semáforo amigable */}
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`text-xs font-semibold ${
                            item.urgency === 'critical'
                              ? 'text-red-600 font-bold'
                              : item.urgency === 'warning'
                              ? 'text-orange-600 font-bold'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatExpiryText(item)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <UrgencyBadge item={item} />
                      </div>
                    </div>

                    {/* ACCIONES VISIBLES POR INGREDIENTE */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* BOTONES DE CANTIDAD: [-] Cantidad [+] */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-0.5 shadow-2xs">
                        {/* ➖ Restar cantidad */}
                        <button
                          onClick={() => handleDecrease(item)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center font-bold transition active:scale-90"
                          title="Restar 1 unidad"
                          aria-label={`Restar ${item.name}`}
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-700" />
                        </button>

                        {/* Cantidad central */}
                        <div className="px-2 text-center min-w-[36px]">
                          <span className="font-black text-gray-900 text-sm leading-none block">
                            {quantity}
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase">
                            {item.unit || 'ud'}
                          </span>
                        </div>

                        {/* ➕ Aumentar cantidad */}
                        <button
                          onClick={() => handleIncrease(item)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center font-bold transition active:scale-90"
                          title="Añadir 1 unidad"
                          aria-label={`Aumentar ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-700" />
                        </button>
                      </div>

                      {/* Editar datos secundarios */}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Editar nombre o caducidad"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 🗑 Botón Eliminar con papelera */}
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition active:scale-95"
                        title="Eliminar del inventario"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* BOTÓN FLOTANTE: ➕ Añadir ingrediente */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black py-3 px-4.5 rounded-full shadow-lg shadow-emerald-500/35 border-2 border-white flex items-center gap-2 transition"
          aria-label="Añadir ingrediente manualmente"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wide">
            Añadir ingrediente
          </span>
        </button>
      </div>

      {/* CTA Inferior fijo a Vaciar Nevera */}
      {inventory.length > 0 && (
        <div className="flex-shrink-0 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-10">
          <button
            onClick={() => navigate('/vaciar-nevera')}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 text-xs"
          >
            Modo Vaciar Nevera ({criticalCount + warningCount} en riesgo)
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: FORMULARIO SIMPLE PARA AÑADIR MANUALMENTE */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-1 border-b border-gray-50">
              <div>
                <h3 className="font-black text-gray-900 text-base">Añadir a Despensa</h3>
                <p className="text-gray-400 text-xs">Formulario simple de registro</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3">
              {/* Campo: Ingrediente */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ingrediente
                </label>
                <input
                  value={addName}
                  onChange={e => {
                    const val = e.target.value
                    setAddName(val)
                    setAddCategory(guessCategory(val))
                  }}
                  required
                  autoFocus
                  placeholder="Ej: Tomate, Huevos, Queso..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
                />
              </div>

              {/* Campo: Cantidad y Unidad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={addQuantity}
                    onChange={e =>
                      setAddQuantity(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center font-black focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={addUnit}
                    onChange={e => setAddUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

              {/* Campo: Categoría */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={addCategory}
                  onChange={e => setAddCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="verdura">Verduras / Frutas</option>
                  <option value="proteína">Proteína (Huevos, Carnes, Pescados)</option>
                  <option value="lácteo">Lácteos (Yogur, Queso, Leche)</option>
                  <option value="despensa">Despensa (Arroz, Pasta, Legumbres)</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingItem}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  {addingItem ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: CONFIRMAR ELIMINACIÓN CON PAPELERA          */}
      {/* ==================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 shadow-2xl border border-gray-100 text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-black text-gray-900 text-base leading-snug">
                ¿Eliminar este ingrediente del inventario?
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Se retirará <strong>"{deleteConfirmItem.name}"</strong> de tu despensa.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-red-500/20 active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CONFIRMAR CUANDO CANTIDAD LLEGA A CERO      */}
      {/* ==================================================== */}
      {zeroQtyConfirmItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 shadow-2xl border border-gray-100 text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-black text-gray-900 text-base leading-snug">
                Ya no quedan {zeroQtyConfirmItem.name}. ¿Eliminar del inventario?
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                La cantidad ha llegado a cero unidades.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setZeroQtyConfirmItem(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmZeroQtyDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-red-500/20 active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CONTROL DE INVENTARIO / HISTORIAL           */}
      {/* ==================================================== */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col p-5 shadow-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-base">Control de Inventario</h3>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 flex-shrink-0">
              Registro cronológico de todas las modificaciones realizadas en tu despensa:
            </p>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Aún no hay movimientos registrados. Modifica o añade alimentos para ver el registro.
                </div>
              ) : (
                logs.map(log => {
                  const isAdd = log.action === 'added' || log.action === 'increased'
                  const isDecrease = log.action === 'decreased'

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                            isAdd
                              ? 'bg-emerald-100 text-emerald-700'
                              : isDecrease
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isAdd ? '+' : isDecrease ? '-' : '🗑'}
                        </span>
                        <div className="truncate">
                          <span className="font-extrabold text-gray-900 block truncate">
                            {log.display}
                          </span>
                          <span className="text-[10px] text-gray-400 capitalize">
                            {log.action === 'added'
                              ? 'Añadido'
                              : log.action === 'increased'
                              ? 'Incrementado'
                              : log.action === 'decreased'
                              ? 'Restado'
                              : 'Eliminado'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                        {formatLogDate(log.date)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 flex gap-2 flex-shrink-0 border-t border-gray-50">
              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition"
                >
                  Limpiar historial
                </button>
              )}
              <button
                onClick={() => setShowLogsModal(false)}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
