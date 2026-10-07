/**
 * Motor Gastronómico de Porcionado (4 Porciones), Especias Culinarias
 * e Instrucciones Detalladas y Realistas de Cocina.
 *
 * Cumple con:
 * 1. Para cada receta se da una lista de ingredientes calculada exactamente para 4 porciones.
 * 2. Inclusión explícita de especias, condimentos y aromáticas apropiadas según el perfil gastronómico.
 * 3. Instrucciones realistas, minuciosas y ordenadas paso a paso con control de fuego, tiempos y técnicas.
 */

export interface IngredientPortionItem {
  name: string
  amount: string
  category: 'principal' | 'verdura' | 'grano_base' | 'especia' | 'aromatico' | 'aceite_grasa'
  note?: string
  isSpice?: boolean
}

export interface DetailedInstructionStep {
  stepNumber: number
  title: string
  action: string
  realisticDetails: string
  fireLevel?: 'Fuego bajo / corona' | 'Fuego medio' | 'Fuego vivo / fuerte' | 'Sin fuego / Reposo' | 'Horno 200°C'
  durationMinutes?: number
}

export interface Recipe4ServingsProfile {
  servings: 4
  ingredients4Servings: IngredientPortionItem[]
  spicesSummary: string[]
  realisticSteps: DetailedInstructionStep[]
  chefSecret: string
  prepTimeTotal: number
}

// Perfiles de especias por estilo culinario
const SPICE_PROFILES = {
  carne_roja: [
    { name: 'Sal fina y pimienta negra molida al momento', amount: '1 cdita y 1/2 cdita', note: 'al gusto' },
    { name: 'Pimentón dulce o ahumado', amount: '1 cdita colmada', note: 'aroma y color profundo' },
    { name: 'Comino molido', amount: '1/3 cdita', note: 'toque sutil criollo tradicional' },
    { name: 'Orégano seco campesino', amount: '1 cdita', note: 'frotado con las palmas' },
    { name: 'Ajo picado fino o en polvo', amount: '2 dientes o 1/2 cdita', note: 'base aromática' },
  ],
  pollo_ave: [
    { name: 'Sal marina fina y pimienta blanca/negra', amount: '1 cdita y 1/2 cdita', note: 'al gusto' },
    { name: 'Pimentón dulce / paprika', amount: '1 cdita rasa', note: 'dorado parejo' },
    { name: 'Romero o tomillo fresco/seco', amount: '1/2 cdita', note: 'aromática noble de bosque' },
    { name: 'Orégano o estragón', amount: '1 cdita', note: 'perfume equilibrado' },
    { name: 'Ajo picado fino', amount: '2 dientes', note: 'aroma base' },
  ],
  pescado_mar: [
    { name: 'Sal fina y pimienta blanca molida', amount: '1 cdita rasa', note: 'sabor limpio' },
    { name: 'Jengibre rallado o en polvo', amount: '1/2 cdita', note: 'toque fresco y digestivo' },
    { name: 'Pimentón o ají molido suave', amount: '1/3 cdita', note: 'color sutil' },
    { name: 'Perejil fresco picado', amount: '2 cdas colmadas', note: 'al final para mantener clorofila' },
    { name: 'Jugo y ralladura de limón', amount: '1 limón entero', note: 'brillo y acidez equilibrada' },
  ],
  pasta_masas: [
    { name: 'Sal gruesa para el agua de cocción', amount: '1 cda colmada (15 g)', note: 'por cada 3L de agua' },
    { name: 'Pimienta negra recién partida', amount: '1/2 cdita', note: 'aroma pungente en boca' },
    { name: 'Nuez moscada recién rallada', amount: '1 pizca generosa', note: 'redondea salsas y quesos' },
    { name: 'Orégano y albahaca fresca', amount: '1 cdita seco / 6 hojas frescas', note: 'perfume mediterráneo' },
    { name: 'Aceite de oliva virgen extra', amount: '2 cdas soperas', note: 'brillo y emulsión' },
  ],
  verdura_huerta: [
    { name: 'Sal fina y pimienta negra molida', amount: '1 cdita y 1/3 cdita', note: 'al gusto' },
    { name: 'Pimentón dulce o cúrcuma', amount: '1/2 cdita', note: 'resalta el tono de las hortalizas' },
    { name: 'Orégano seco o tomillo', amount: '1 cdita', note: 'aroma silvestre' },
    { name: 'Ajo picado en brunoise', amount: '2 dientes', note: 'sofrito suave' },
    { name: 'Aceite de oliva virgen extra', amount: '2 cdas soperas (30 ml)', note: 'vehículo de sabor' },
  ],
  farofa_granos: [
    { name: 'Sal fina', amount: '1 cdita rasa', note: 'absorbida por la harina' },
    { name: 'Pimienta negra molida o ají suave', amount: '1/3 cdita', note: 'chispa justa' },
    { name: 'Pimentón dulce o colorau / urucum', amount: '1/2 cdita', note: 'tinte dorado brasileño' },
    { name: 'Perejil o cebollita de verdeo fresca', amount: '3 cdas picadas', note: 'frescor al retirar del fuego' },
    { name: 'Manteca o grasa vacuna noble', amount: '3 cdas colmadas (50 g)', note: 'humedad esencial' },
  ],
  oriental_sushi: [
    { name: 'Sal fina y azúcar para el shari/arroz', amount: '1 cdita sal y 2 cditas azúcar', note: 'equilibrio dulce-salado' },
    { name: 'Vinagre de arroz o vinagre de manzana suave', amount: '3 cdas soperas', note: 'aderezo del grano' },
    { name: 'Semillas de sésamo tostadas (blanco y negro)', amount: '1 cda colmada', note: 'crocante y nuez' },
    { name: 'Salsa de soja baja en sodio', amount: '3 cdas soperas', note: 'umami natural' },
    { name: 'Jengibre fresco en láminas o rallado', amount: '1 cdita', note: 'frescura picante' },
  ],
}

/**
 * Cantidades realistas estandarizadas para 4 porciones según el ingrediente base
 */
function getPortionForIngredient(name: string): { amount: string; category: IngredientPortionItem['category']; note?: string } {
  const n = name.toLowerCase().trim()

  // Carnes vacunas / cerdo
  if (n.includes('carne') || n.includes('lomo') || n.includes('bife') || n.includes('ternera') || n.includes('vacio') || n.includes('cuadril')) {
    return { amount: '600 g a 700 g', category: 'principal', note: 'cortado en 4 porciones o dados parejos' }
  }
  if (n.includes('picada') || n.includes('hamburguesa')) {
    return { amount: '500 g a 600 g', category: 'principal', note: '140 g por persona aprox.' }
  }
  if (n.includes('cerdo') || n.includes('bondiola') || n.includes('solomillo') || n.includes('costilla')) {
    return { amount: '650 g', category: 'principal', note: 'desgrasado y porcionado para 4' }
  }
  if (n.includes('panceta') || n.includes('bacon')) {
    return { amount: '150 g a 200 g', category: 'principal', note: 'cortada en bastones o cubitos crocantes' }
  }
  if (n.includes('chorizo') || n.includes('morcilla') || n.includes('embutido') || n.includes('salchicha')) {
    return { amount: '4 unidades medianas (aprox. 400 g)', category: 'principal', note: 'desgranado o en ruedas' }
  }

  // Aves
  if (n.includes('pollo') || n.includes('pechuga') || n.includes('suprema')) {
    return { amount: '650 g a 750 g (2 pechugas enteras)', category: 'principal', note: 'fileteadas o en dados para 4' }
  }
  if (n.includes('muslo') || n.includes('pata')) {
    return { amount: '4 unidades enteras o deshuesadas', category: 'principal', note: '1 pieza generosa por comensal' }
  }

  // Pescados y Mariscos
  if (n.includes('salmon') || n.includes('salmón') || n.includes('merluza') || n.includes('pescado')) {
    return { amount: '600 g de filetes frescos', category: 'principal', note: '4 medallones o porciones limpias' }
  }
  if (n.includes('atun') || n.includes('atún')) {
    return { amount: '2 a 3 latas de 170 g (o 500 g fresco)', category: 'principal', note: 'bien escurrido' }
  }
  if (n.includes('camaron') || n.includes('langostino') || n.includes('marisco')) {
    return { amount: '450 g limpios', category: 'principal', note: 'pelados y desvenados' }
  }

  // Huevos
  if (n.includes('huevo') || n.includes('huevos')) {
    return { amount: '6 a 8 unidades grandes', category: 'principal', note: 'a temperatura ambiente' }
  }

  // Quesos y Lácteos
  if (n.includes('queso') || n.includes('mozzarella') || n.includes('provoleta') || n.includes('cuartirolo')) {
    return { amount: '250 g a 300 g', category: 'principal', note: 'rallado grueso o en cubos para fundir' }
  }
  if (n.includes('crema') || n.includes('leche')) {
    return { amount: '250 ml a 300 ml', category: 'principal', note: 'crema de leche o leche entera' }
  }
  if (n.includes('manteca') || n.includes('mantequilla')) {
    return { amount: '50 g a 60 g', category: 'aceite_grasa', note: 'en dados fríos' }
  }

  // Pastas y Masas
  if (n.includes('pasta') || n.includes('fideo') || n.includes('espagueti') || n.includes('tallarines') || n.includes('penne') || n.includes('ravioli') || n.includes('gnocchi') || n.includes('ñoquis')) {
    return { amount: '400 g a 500 g de pasta seca (o 600 g fresca)', category: 'grano_base', note: '100-125 g de pasta seca por porción' }
  }
  if (n.includes('arroz')) {
    return { amount: '320 g a 350 g (aprox. 1 taza y media colmada)', category: 'grano_base', note: 'rinde 4 porciones cocidas holgadas' }
  }
  if (n.includes('harina de mandioca') || n.includes('mandioca')) {
    return { amount: '300 g a 350 g de harina de mandioca', category: 'grano_base', note: 'tostada con manteca dorada' }
  }
  if (n.includes('harina') || n.includes('masa')) {
    return { amount: '400 g de harina común (o 2 tapas de tarta/12 de empanadas)', category: 'grano_base', note: 'base para 4 comensales' }
  }
  if (n.includes('pan')) {
    return { amount: '4 panes individuales o 8 rebanadas de campo', category: 'grano_base', note: 'ligeramente tostados' }
  }
  if (n.includes('polenta') || n.includes('harina de maiz')) {
    return { amount: '250 g de sémola de maíz para polenta', category: 'grano_base', note: 'cocida en 1 litro de líquido' }
  }

  // Hortalizas y Verduras
  if (n.includes('cebolla') || n.includes('cebollas')) {
    return { amount: '2 unidades medianas (aprox. 250 g)', category: 'verdura', note: 'picada en brunoise o pluma' }
  }
  if (n.includes('tomate') || n.includes('tomates')) {
    return { amount: '4 unidades medianas maduras (aprox. 450 g)', category: 'verdura', note: 'en concassé o gajos' }
  }
  if (n.includes('zanahoria') || n.includes('zanahorias')) {
    return { amount: '2 a 3 unidades medianas (aprox. 250 g)', category: 'verdura', note: 'rallada fina o en rodajas' }
  }
  if (n.includes('morron') || n.includes('pimiento')) {
    return { amount: '1 unidad grande o 2 medianas (rojo/verde)', category: 'verdura', note: 'limpio y en juliana' }
  }
  if (n.includes('papa') || n.includes('patata')) {
    return { amount: '4 a 5 unidades medianas (aprox. 700 g)', category: 'verdura', note: 'peladas y cortadas parejas' }
  }
  if (n.includes('lechuga') || n.includes('rucula') || n.includes('rúcula') || n.includes('espinaca')) {
    return { amount: '1 planta grande o 200 g de hojas limpias', category: 'verdura', note: 'lavadas, centrifugadas y secas' }
  }
  if (n.includes('palta') || n.includes('aguacate')) {
    return { amount: '2 unidades medianas en punto justo', category: 'verdura', note: 'en láminas o dados con limón' }
  }
  if (n.includes('pepino')) {
    return { amount: '2 unidades medianas frescas', category: 'verdura', note: 'sin semillas, en bastones' }
  }
  if (n.includes('choclo') || n.includes('maiz')) {
    return { amount: '2 choclos desgranados o 1 lata de 300 g', category: 'verdura', note: 'granos tiernos' }
  }
  if (n.includes('champiñon') || n.includes('setas') || n.includes('hongos')) {
    return { amount: '300 g frescos', category: 'verdura', note: 'laminados en seco' }
  }
  if (n.includes('zapallito') || n.includes('zucchini') || n.includes('calabacin')) {
    return { amount: '2 unidades medianas', category: 'verdura', note: 'en medias lunas firmes' }
  }
  if (n.includes('ajo')) {
    return { amount: '3 a 4 dientes frescos', category: 'aromatico', note: 'pelados y picados fino' }
  }
  if (n.includes('verdeo') || n.includes('puerro')) {
    return { amount: '2 a 3 tallos tiernos', category: 'verdura', note: 'parte blanca para sofrito, verde para final' }
  }

  // Default prudente para 4 porciones
  return { amount: '250 g a 350 g (para 4 porciones)', category: 'verdura', note: 'fresco y acondicionado' }
}

/**
 * Deduce el perfil aromático de especias para 4 porciones
 */
function getSpicePackForRecipe(recipe: { name: string; description?: string | null; instructions?: string | null; origin?: string }): IngredientPortionItem[] {
  const full = `${recipe.name} ${recipe.description || ''} ${recipe.instructions || ''} ${recipe.origin || ''}`.toLowerCase()

  let basePack = SPICE_PROFILES.verdura_huerta
  if (full.includes('carne') || full.includes('lomo') || full.includes('ternera') || full.includes('hamburguesa') || full.includes('empanada') || full.includes('guiso') || full.includes('estofado')) {
    basePack = SPICE_PROFILES.carne_roja
  } else if (full.includes('pollo') || full.includes('ave') || full.includes('suprema') || full.includes('strogonoff')) {
    basePack = SPICE_PROFILES.pollo_ave
  } else if (full.includes('salmon') || full.includes('salmón') || full.includes('pescado') || full.includes('merluza') || full.includes('atun') || full.includes('atún') || full.includes('ceviche')) {
    basePack = SPICE_PROFILES.pescado_mar
  } else if (full.includes('sushi') || full.includes('maki') || full.includes('nigiri') || full.includes('onigiri') || full.includes('oriental') || full.includes('teriyaki')) {
    basePack = SPICE_PROFILES.oriental_sushi
  } else if (full.includes('farofa') || full.includes('mandioca') || full.includes('feijoada') || full.includes('brasile')) {
    basePack = SPICE_PROFILES.farofa_granos
  } else if (full.includes('pasta') || full.includes('fideo') || full.includes('pizza') || full.includes('ravioles') || full.includes('lasa') || full.includes('gnocchi')) {
    basePack = SPICE_PROFILES.pasta_masas
  }

  return basePack.map(item => ({
    name: item.name,
    amount: item.amount,
    category: 'especia',
    note: item.note,
    isSpice: true,
  }))
}

/**
 * Genera pasos realistas y minuciosos de cocina para 4 porciones
 */
function generateRealisticSteps(recipe: {
  name: string
  instructions?: string | null
  prep_time?: number | null
  detailed_steps?: string[]
  chef_tips?: string
}): DetailedInstructionStep[] {
  // Si ya tiene detailed_steps de buena calidad, estructurarlos detalladamente
  if (Array.isArray(recipe.detailed_steps) && recipe.detailed_steps.length >= 3) {
    return recipe.detailed_steps.map((st, i) => {
      const parts = st.split(':')
      const title = parts.length > 1 ? parts[0].trim() : `Paso ${i + 1} de elaboración`
      const body = parts.length > 1 ? parts.slice(1).join(':').trim() : st.trim()

      let fire: DetailedInstructionStep['fireLevel'] = 'Fuego medio'
      if (i === 0) fire = 'Sin fuego / Reposo'
      else if (i === 1) fire = 'Fuego vivo / fuerte'
      else if (i === recipe.detailed_steps!.length - 1) fire = 'Sin fuego / Reposo'
      else if (body.toLowerCase().includes('horno')) fire = 'Horno 200°C'
      else if (body.toLowerCase().includes('suave') || body.toLowerCase().includes('bajo')) fire = 'Fuego bajo / corona'

      return {
        stepNumber: i + 1,
        title,
        action: body,
        realisticDetails: `Control exacto para 4 porciones: cuida el espaciado en la sartén o fuente para que el calor circule parejo y no hierva por exceso de volumen.`,
        fireLevel: fire,
        durationMinutes: Math.max(3, Math.round(((recipe.prep_time || 20) / recipe.detailed_steps!.length))),
      }
    })
  }

  // Si tiene instrucciones estándar en texto, desglosar con enriquecimiento culinario realista
  const rawList = (recipe.instructions || '')
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean)

  if (rawList.length > 0) {
    return rawList.map((step, idx) => {
      const isFirst = idx === 0
      const isLast = idx === rawList.length - 1

      let title = `Paso ${idx + 1} · Cocción y sazón`
      let fire: DetailedInstructionStep['fireLevel'] = 'Fuego medio'
      let realisticDetails = 'Monitorea con cuchara de madera o espátula despegando los fondos dorados (reacción de Maillard) para enriquecer el sabor general.'

      if (isFirst) {
        title = `Paso 1 · Mise en place (Corte parejo para 4 porciones)`
        fire = 'Sin fuego / Reposo'
        realisticDetails = 'Lava las verduras, seca las carnes con papel absorbente y corta todo en tamaños uniformes. Esto garantiza que todos los trozos alcancen el punto perfecto al mismo tiempo.'
      } else if (isLast) {
        title = `Paso ${idx + 1} · Ajuste final de especias, reposo y servicio`
        fire = 'Sin fuego / Reposo'
        realisticDetails = 'Apaga el fuego y deja reposar la preparación 2 minutos antes de servir en 4 platos precalentados para que los jugos internos se redistribuyan y no se pierda terneza.'
      } else if (step.toLowerCase().includes('sella') || step.toLowerCase().includes('dora') || step.toLowerCase().includes('plancha')) {
        title = `Paso ${idx + 1} · Sellado a alta temperatura`
        fire = 'Fuego vivo / fuerte'
        realisticDetails = 'No satures la sartén: si el recipiente es pequeño, realiza el dorado en dos tandas para no bajar bruscamente la temperatura del aceite.'
      } else if (step.toLowerCase().includes('hierve') || step.toLowerCase().includes('caldo') || step.toLowerCase().includes('suave')) {
        title = `Paso ${idx + 1} · Estofado y concentración de sabores`
        fire = 'Fuego bajo / corona'
        realisticDetails = 'Tapa parcialmente la cacerola permitiendo una evaporación lenta y controlada que concentre los aromas de las especias sin quemar el fondo.'
      }

      return {
        stepNumber: idx + 1,
        title,
        action: step,
        realisticDetails,
        fireLevel: fire,
        durationMinutes: Math.max(3, Math.round(((recipe.prep_time || 20) / Math.max(1, rawList.length)))),
      }
    })
  }

  // Generador de respaldo realista
  return [
    {
      stepNumber: 1,
      title: 'Mise en place y acondicionamiento (4 Porciones)',
      action: 'Lava y corta los ingredientes frescos en proporciones simétricas. Mide las especias secas en un cuenco para tenerlas listas.',
      realisticDetails: 'Tener todos los ingredientes pesados y cortados en la mesada evita descuidos, quemaduras y garantiza una cocción uniforme.',
      fireLevel: 'Sin fuego / Reposo',
      durationMinutes: 6,
    },
    {
      stepNumber: 2,
      title: 'Sofreír aromáticos e iniciar cocción activa',
      action: 'Calienta aceite de oliva o manteca en sartén o cacerola amplia. Dora los aromáticos y sella la base a fuego medio-alto.',
      realisticDetails: 'El dorado inicial carameliza los azúcares naturales aportando un tono dorado apetitoso y aroma de cocina profesional.',
      fireLevel: 'Fuego medio',
      durationMinutes: 8,
    },
    {
      stepNumber: 3,
      title: 'Integración de especias y punto óptimo de cocción',
      action: 'Añade la mezcla de especias y hierbas aromáticas. Integra con suavidad para que el calor libere los aceites esenciales sin quemarlas.',
      realisticDetails: 'Las especias se agregan con humedad para extraer su perfume sin amargar.',
      fireLevel: 'Fuego bajo / corona',
      durationMinutes: 6,
    },
    {
      stepNumber: 4,
      title: 'Rectificación de sal, reposo y servicio',
      action: 'Prueba una pequeña muestra, ajusta sal y pimienta recién molida. Retira del fuego, deja reposar 2 minutos y distribuye en 4 platos.',
      realisticDetails: 'El reposo previo al emplatado asienta las densidades y realza la temperatura de degustación.',
      fireLevel: 'Sin fuego / Reposo',
      durationMinutes: 2,
    },
  ]
}

/**
 * Obtiene la ficha de porcionado para 4 personas, especias y pasos realistas
 */
export function buildRecipe4ServingsProfile(recipe: {
  id?: string
  name: string
  description?: string | null
  instructions?: string | null
  prep_time?: number | null
  servings?: number | null
  recipe_ingredients?: { ingredient_name: string }[] | string[]
  matchedIngredients?: string[]
  missingIngredients?: string[]
  origin?: string
  detailed_steps?: string[]
  chef_tips?: string
}): Recipe4ServingsProfile {
  // 1. Extraer todos los ingredientes base de la receta
  const rawList: string[] = []
  if (Array.isArray(recipe.recipe_ingredients)) {
    recipe.recipe_ingredients.forEach(item => {
      const name = typeof item === 'string' ? item : item.ingredient_name
      if (name && !rawList.includes(name.toLowerCase())) rawList.push(name.toLowerCase())
    })
  }
  if (Array.isArray(recipe.matchedIngredients)) {
    recipe.matchedIngredients.forEach(item => {
      if (item && !rawList.includes(item.toLowerCase())) rawList.push(item.toLowerCase())
    })
  }
  if (Array.isArray(recipe.missingIngredients)) {
    recipe.missingIngredients.forEach(item => {
      if (item && !rawList.includes(item.toLowerCase())) rawList.push(item.toLowerCase())
    })
  }

  // 2. Mapear cada ingrediente a su porción exacta para 4 comensales
  const portionedIngredients: IngredientPortionItem[] = rawList.map(ing => {
    const data = getPortionForIngredient(ing)
    return {
      name: ing,
      amount: data.amount,
      category: data.category,
      note: data.note,
      isSpice: false,
    }
  })

  // 3. Obtener el paquete de especias y condimentos correspondiente
  const spices = getSpicePackForRecipe(recipe)

  // 4. Combinar la lista completa para 4 porciones: Materias primas + Especias & Aromáticos
  const fullIngredients4Servings = [...portionedIngredients, ...spices]

  // 5. Pasos realistas de cocina
  const realisticSteps = generateRealisticSteps(recipe)

  // 6. Resumen de especias para badge y destaque visual
  const spicesSummary = spices.map(s => s.name)

  return {
    servings: 4,
    ingredients4Servings: fullIngredients4Servings,
    spicesSummary,
    realisticSteps,
    chefSecret: recipe.chef_tips || 'Cocina siempre con ingredientes a temperatura ambiente para evitar caídas bruscas de calor al incorporarlos a la sartén o cacerola.',
    prepTimeTotal: recipe.prep_time || 20,
  }
}
