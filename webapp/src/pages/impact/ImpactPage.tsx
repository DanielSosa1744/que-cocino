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
    <div className="h-full max-h-full bg-transparent flex flex-col overflow-hidden animate-fade-in text-[#2F2A26]">
      {/* Encabezado editorial */}
      <div className="px-5 pt-safe pb-3.5 border-b border-[#A88B57]/20 flex-shrink-0 bg-transparent text-center">
        <div className="flex items-center justify-center gap-2.5 opacity-90 mb-1.5">
          <span className="h-[1.5px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-[#A88B57]" />
          <span className="text-[#A88B57] text-xs">✦</span>
          <span className="text-xs sm:text-sm tracking-[0.25em] uppercase font-bold text-[#8F7347]">
            Cuaderno de la Casa
          </span>
          <span className="text-[#A88B57] text-xs">✦</span>
          <span className="h-[1.5px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-[#A88B57]" />
        </div>
        <h1 className="font-menu-title text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
          Honor & Sostenibilidad
        </h1>
        <p className="font-menu-serif text-base sm:text-lg text-[#44382F] mt-1 font-medium">
          Registro de aprovechamiento gastronómico y platos servidos
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5">
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
        {isLoading ? (
          <div className="py-12 text-center text-base text-[#5A483D] font-menu-serif italic font-medium">
            Consultando registros del chef...
          </div>
        ) : (
          <>
            {/* Tres pliegos métricos gourmet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="menu-card-frame rounded-2xl p-5 text-center relative">
                <span className="text-[#A88B57] text-xs block mb-1">✦</span>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] font-mono tracking-tight">
                  {cookedCount}
                </p>
                <p className="font-menu-serif font-extrabold text-base sm:text-lg text-[#8F7347] uppercase tracking-wider mt-1.5">
                  Platos Servidos
                </p>
                <p className="font-menu-serif text-sm sm:text-base text-[#5A483D] mt-0.5 font-medium">
                  Elaboraciones culminadas
                </p>
              </div>

              <div className="menu-card-frame rounded-2xl p-5 text-center relative">
                <span className="text-[#A88B57] text-xs block mb-1">✦</span>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] font-mono tracking-tight">
                  {ingredientsCount}
                </p>
                <p className="font-menu-serif font-extrabold text-base sm:text-lg text-[#8F7347] uppercase tracking-wider mt-1.5">
                  Materias Honradas
                </p>
                <p className="font-menu-serif text-sm sm:text-base text-[#5A483D] mt-0.5 font-medium">
                  Aprovechadas a tiempo
                </p>
              </div>

              <div className="menu-card-frame rounded-2xl p-5 text-center relative">
                <span className="text-[#A88B57] text-xs block mb-1">✦</span>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#385333] font-mono tracking-tight">
                  ARS {savingsARS.toLocaleString('es-AR')}
                </p>
                <p className="font-menu-serif font-extrabold text-base sm:text-lg text-[#8F7347] uppercase tracking-wider mt-1.5">
                  Valor Preservado
                </p>
                <p className="font-menu-serif text-sm sm:text-base text-[#5A483D] mt-0.5 font-medium">
                  Ahorro en comanda
                </p>
              </div>
            </div>

            {/* Historial de servicios elaborados */}
            <div className="menu-card-frame rounded-2xl p-5 relative">
              {/* Esquinas ornamentales */}
              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#A88B57]/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#A88B57]/60 pointer-events-none" />

              <div className="pb-3 mb-3 border-b border-[#A88B57]/20 flex items-center justify-between">
                <h2 className="font-menu-title text-base sm:text-lg font-extrabold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-[#A88B57]">✦</span>
                  <span>Libro de Servicios Recientes</span>
                </h2>
                <span className="font-menu-serif text-sm text-[#8F7347] font-semibold">
                  Últimos pases
                </span>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-base text-[#5A483D] font-menu-serif italic font-medium">
                  Aún no se han anotado platos elaborados. Al preparar una receta de La Carta, quedará registrada aquí.
                </div>
              ) : (
                <div className="divide-y divide-[#A88B57]/15">
                  {history.slice(0, 8).map((item, idx) => (
                    <div key={item.id} className="py-3.5 flex items-baseline justify-between text-base sm:text-lg">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-xs sm:text-sm font-mono text-[#8F7347] font-bold">
                          Nº {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <span className="font-menu-title font-bold text-[#1C1917]">
                          {item.recipe_name}
                        </span>
                      </div>
                      <span className="text-[#8F7347] font-menu-serif font-semibold text-xs sm:text-sm whitespace-nowrap ml-2">
                        {new Date(item.cooked_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
