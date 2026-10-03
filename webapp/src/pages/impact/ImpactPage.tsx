import { useCookedHistory } from '../../hooks/useRecipes'

export default function ImpactPage() {
  const { data: history = [], isLoading } = useCookedHistory()

  const cookedCount = history.length
  const ingredientsCount = history.reduce((sum, h) => {
    const list = h.ingredients_used
    if (Array.isArray(list)) return sum + list.length
    return sum + 2
  }, 0)

  // Estimación en pesos argentinos (ARS)
  const savingsARS = history.reduce((sum, h) => {
    const base = h.money_saved_eur ?? 2.0
    return sum + Math.round(base * 1250)
  }, 0)

  return (
    <div className="h-full max-h-full bg-white flex flex-col overflow-hidden">
      {/* Encabezado editorial */}
      <div className="px-5 pt-safe pb-4 border-b border-stone-100 flex-shrink-0 bg-white">
        <h1 className="text-xl font-semibold text-stone-900 tracking-tight">
          Actividad
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Resumen de aprovechamiento en tu cocina
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-8 space-y-8">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400 font-mono">
            Cargando actividad...
          </div>
        ) : (
          <>
            {/* Tres métricas minimalistas */}
            <div className="space-y-4">
              <div className="py-2 border-b border-stone-100">
                <p className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight font-mono">
                  {cookedCount} {cookedCount === 1 ? 'receta' : 'recetas'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Recetas preparadas
                </p>
              </div>

              <div className="py-2 border-b border-stone-100">
                <p className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight font-mono">
                  {ingredientsCount} ingredientes aprovechados
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Alimentos consumidos antes de vencer
                </p>
              </div>

              <div className="py-2 border-b border-stone-100">
                <p className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight font-mono">
                  ARS {savingsARS.toLocaleString('es-AR')} ahorrados
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Ahorro estimado acumulado
                </p>
              </div>
            </div>

            {/* Historial simple de recetas cocinadas */}
            {history.length > 0 && (
              <div className="pt-4 space-y-3">
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Historial reciente
                </h2>
                <div className="divide-y divide-stone-100">
                  {history.slice(0, 8).map((item) => (
                    <div key={item.id} className="py-2.5 flex items-baseline justify-between text-xs">
                      <span className="font-medium text-stone-800">
                        {item.recipe_name}
                      </span>
                      <span className="text-stone-400 font-mono text-[11px]">
                        {new Date(item.cooked_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
