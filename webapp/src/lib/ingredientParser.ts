import type { ParsedIngredient, PriorityLevel } from '../types/app.types'

// Spanish number words mapping
const NUMBER_WORDS: Record<string, number> = {
  'un': 1, 'una': 1, 'uno': 1,
  'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'once': 11, 'doce': 12, 'media': 0.5, 'medio': 0.5,
  'par': 2, 'docena': 12,
}

// Spanish measurement units
const UNITS: Record<string, string> = {
  'kg': 'kg', 'kilo': 'kg', 'kilos': 'kg', 'kilogramo': 'kg', 'kilogramos': 'kg',
  'g': 'g', 'gr': 'g', 'gramo': 'g', 'gramos': 'g',
  'l': 'L', 'litro': 'L', 'litros': 'L',
  'ml': 'mL', 'mililitro': 'mL', 'mililitros': 'mL',
  'unidad': 'ud', 'unidades': 'ud', 'ud': 'ud', 'uds': 'ud',
  'taza': 'taza', 'tazas': 'taza',
  'cucharada': 'cda', 'cucharadas': 'cda',
  'cucharadita': 'cdita', 'cucharaditas': 'cdita',
  'lata': 'lata', 'latas': 'lata',
  'bote': 'bote', 'botes': 'bote',
  'bolsa': 'bolsa', 'bolsas': 'bolsa',
  'paquete': 'paq', 'paquetes': 'paq',
  'manojo': 'manojo', 'manojos': 'manojo',
  'bandeja': 'bandeja',
  'docena': 'docena',
  'diente': 'diente', 'dientes': 'diente',
}

// Shelf life in days per ingredient (Motor de Riesgo)
export const INGREDIENT_SHELF_LIFE: Record<string, number> = {
  'tomate': 7, 'tomates': 7,
  'lechuga': 5, 'lechugas': 5,
  'yogur': 10, 'yogures': 10,
  'arroz': 365,
  'pasta': 365,
  'huevo': 21, 'huevos': 21,
  'cebolla': 30, 'cebollas': 30,
  'queso': 14,
  'pollo': 3, 'pechuga': 3,
  'carne': 3, 'ternera': 3, 'cerdo': 3, 'picada': 2,
  'pescado': 2, 'merluza': 2, 'salmon': 2, 'salmón': 2, 'atun': 365, 'atún': 365,
  'ajo': 60, 'ajos': 60,
  'zanahoria': 14, 'zanahorias': 14,
  'patata': 30, 'patatas': 30, 'papa': 30, 'papas': 30,
  'pimiento': 7, 'pimientos': 7,
  'leche': 7,
  'pan': 5,
  'champiñón': 5, 'champiñones': 5, 'setas': 5,
  'manzana': 14, 'manzanas': 14, 'platano': 6, 'plátano': 6, 'banana': 6, 'bananas': 6,
  'naranja': 14, 'naranjas': 14, 'limon': 21, 'limón': 21,
  'calabacin': 7, 'calabacín': 7, 'berenjena': 7,
  'lentejas': 365, 'garbanzos': 365, 'alubias': 365,
}

// Categories mapping
export const INGREDIENT_CATEGORIES: Record<string, string> = {
  'tomate': 'verdura', 'tomates': 'verdura',
  'lechuga': 'verdura', 'lechugas': 'verdura',
  'cebolla': 'verdura', 'cebollas': 'verdura',
  'ajo': 'verdura', 'ajos': 'verdura',
  'pimiento': 'verdura', 'pimientos': 'verdura',
  'zanahoria': 'verdura', 'zanahorias': 'verdura',
  'patata': 'verdura', 'patatas': 'verdura', 'papa': 'verdura', 'papas': 'verdura',
  'champiñón': 'verdura', 'champiñones': 'verdura',
  'calabacin': 'verdura', 'calabacín': 'verdura', 'berenjena': 'verdura',
  'manzana': 'verdura', 'manzanas': 'verdura', 'platano': 'verdura', 'plátano': 'verdura',
  'banana': 'verdura', 'bananas': 'verdura', 'naranja': 'verdura', 'limon': 'verdura',
  'huevo': 'proteína', 'huevos': 'proteína',
  'pollo': 'proteína', 'pechuga': 'proteína', 'carne': 'proteína', 'ternera': 'proteína', 'cerdo': 'proteína',
  'pescado': 'proteína', 'atun': 'proteína', 'atún': 'proteína', 'salmon': 'proteína', 'salmón': 'proteína',
  'lentejas': 'proteína', 'garbanzos': 'proteína',
  'yogur': 'lácteo', 'yogures': 'lácteo',
  'queso': 'lácteo', 'leche': 'lácteo',
  'arroz': 'despensa', 'pasta': 'despensa', 'pan': 'despensa', 'harina': 'despensa',
}

const SKIP_WORDS = new Set([
  'tengo', 'hay', 'tenemos', 'tiene', 'sobra', 'sobran', 'queda', 'quedan',
  'también', 'tambien', 'además', 'ademas', 'y', 'e', 'de', 'del', 'la', 'el',
  'las', 'los', 'un', 'una', 'unos', 'unas', 'con', 'que', 'vencen', 'vence',
  'vencido', 'vencida', 'vencidos', 'vencidas', 'caduca', 'caducan', 'caducado',
  'mañana', 'hoy', 'pasado', 'próximo', 'próximos', 'dias', 'días', 'disponibles', 'disponible',
  'creo', 'como', 'algo', 'más', 'mas', 'poco', 'pocos', 'pocas', 'por', 'para',
  'fresco', 'fresca', 'frescos', 'frescas', 'maduro', 'madura', 'maduros', 'maduras',
  'entero', 'entera', 'enteros', 'enteras', 'blanco', 'blanca', 'blancos', 'blancas',
  'rojo', 'roja', 'rojos', 'rojas', 'verde', 'verdes', 'amarillo', 'amarilla',
  'natural', 'naturales', 'rallado', 'rallada', 'desnatado', 'desnatada',
])

function parseNumber(token: string): number | null {
  const trimmed = token.toLowerCase().trim()
  if (NUMBER_WORDS[trimmed] !== undefined) return NUMBER_WORDS[trimmed]
  const num = parseFloat(trimmed.replace(',', '.'))
  if (!isNaN(num)) return num
  return null
}

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
    .trim()
}

/**
 * Normaliza un nombre a su forma singular básica para comparaciones y deduplicación.
 */
export function singularize(name: string): string {
  let norm = normalizeIngredientName(name)
  // Remover calificativos comunes que generan falsos negativos
  norm = norm
    .replace(/\b(maduros?|maduras?|frescos?|frescas?|camperos?|camperas?|enteros?|enteras?|naturales?|natural)\b/g, '')
    .trim()

  // Casos comunes en español
  if (norm.endsWith('es')) {
    if (norm.endsWith('ces')) norm = norm.slice(0, -3) + 'z'
    else if (norm.endsWith('tomates')) norm = 'tomate'
    else if (norm.endsWith('yogures')) norm = 'yogur'
    else if (norm.endsWith('limones')) norm = 'limon'
    else if (norm.endsWith('champiñones')) norm = 'champinon'
    else if (norm.endsWith('carnes')) norm = 'carne'
    else norm = norm.slice(0, -2)
  } else if (norm.endsWith('s') && !norm.endsWith('arroz')) {
    norm = norm.slice(0, -1)
  }
  return norm.trim()
}

/**
 * Comprueba si dos ingredientes coinciden por raíz, palabra o sinónimo.
 * Ej: 'pechuga de pollo' coincide con 'pollo', 'tomates maduros' coincide con 'tomate',
 * 'papa' coincide con 'patata'.
 */
export function isIngredientMatch(a: string, b: string): boolean {
  const normA = singularize(a)
  const normB = singularize(b)

  if (normA === normB) return true
  if (normA.includes(normB) || normB.includes(normA)) return true

  // Sinónimos comunes en cocina
  const synonyms: Array<string[]> = [
    ['patata', 'papa'],
    ['pollo', 'pechuga'],
    ['carne', 'ternera', 'cerdo', 'picada'],
    ['seta', 'champinon', 'hongos'],
    ['platano', 'banana'],
    ['alubia', 'judia', 'frijol', 'habichuela'],
  ]

  for (const group of synonyms) {
    const hasA = group.some(w => normA.includes(w) || w.includes(normA))
    const hasB = group.some(w => normB.includes(w) || w.includes(normB))
    if (hasA && hasB) return true
  }

  // Token overlap (al menos una palabra significativa coincide)
  const wordsA = normA.split(/\s+/).filter(w => w.length > 2 && !SKIP_WORDS.has(w))
  const wordsB = normB.split(/\s+/).filter(w => w.length > 2 && !SKIP_WORDS.has(w))

  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb || (wa.length > 3 && wb.length > 3 && (wa.startsWith(wb) || wb.startsWith(wa)))) {
        return true
      }
    }
  }

  return false
}

/**
 * Elimina repeticiones de frases/palabras causadas por buffers de SpeechRecognition acumulativos.
 */
export function collapseRepeats(text: string): string {
  if (!text) return ''
  const words = text.split(/\s+/).filter(Boolean)
  for (let n = 8; n >= 1; n--) {
    for (let i = 0; i + 2 * n <= words.length; ) {
      const a = words.slice(i, i + n).join(' ').toLowerCase()
      const b = words.slice(i + n, i + 2 * n).join(' ').toLowerCase()
      if (a === b) {
        words.splice(i + n, n)
      } else {
        i++
      }
    }
  }
  return words.join(' ')
}

export function guessCategory(name: string): string {
  const norm = normalizeIngredientName(name)
  for (const [key, cat] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (norm.includes(key) || key.includes(norm)) return cat
  }
  return 'despensa'
}

export function guessShelfLife(name: string): number {
  const norm = normalizeIngredientName(name)
  for (const [key, days] of Object.entries(INGREDIENT_SHELF_LIFE)) {
    if (norm.includes(key) || key.includes(norm)) return days
  }
  return 7 // Default 7 days
}

// Catálogo de precios y pesos de referencia para cuantificación económica y huella (Motor de Ahorro)
export const INGREDIENT_PRICE_REF: Record<string, { pricePerUnit: number; defaultWeightKg: number }> = {
  tomate: { pricePerUnit: 0.45, defaultWeightKg: 0.15 },
  lechuga: { pricePerUnit: 1.10, defaultWeightKg: 0.25 },
  yogur: { pricePerUnit: 0.65, defaultWeightKg: 0.125 },
  huevo: { pricePerUnit: 0.28, defaultWeightKg: 0.06 },
  pollo: { pricePerUnit: 3.50, defaultWeightKg: 0.40 },
  carne: { pricePerUnit: 4.80, defaultWeightKg: 0.35 },
  ternera: { pricePerUnit: 5.20, defaultWeightKg: 0.35 },
  cerdo: { pricePerUnit: 3.80, defaultWeightKg: 0.35 },
  pescado: { pricePerUnit: 4.20, defaultWeightKg: 0.30 },
  salmon: { pricePerUnit: 5.50, defaultWeightKg: 0.25 },
  merluza: { pricePerUnit: 3.90, defaultWeightKg: 0.30 },
  atun: { pricePerUnit: 1.30, defaultWeightKg: 0.15 },
  queso: { pricePerUnit: 2.20, defaultWeightKg: 0.20 },
  leche: { pricePerUnit: 1.05, defaultWeightKg: 1.0 },
  arroz: { pricePerUnit: 1.30, defaultWeightKg: 0.5 },
  pasta: { pricePerUnit: 1.15, defaultWeightKg: 0.5 },
  pan: { pricePerUnit: 0.90, defaultWeightKg: 0.25 },
  cebolla: { pricePerUnit: 0.40, defaultWeightKg: 0.15 },
  ajo: { pricePerUnit: 0.25, defaultWeightKg: 0.05 },
  patata: { pricePerUnit: 0.40, defaultWeightKg: 0.20 },
  papa: { pricePerUnit: 0.40, defaultWeightKg: 0.20 },
  zanahoria: { pricePerUnit: 0.30, defaultWeightKg: 0.10 },
  pimiento: { pricePerUnit: 0.60, defaultWeightKg: 0.18 },
  calabacin: { pricePerUnit: 0.70, defaultWeightKg: 0.25 },
  berenjena: { pricePerUnit: 0.80, defaultWeightKg: 0.30 },
  champinon: { pricePerUnit: 1.50, defaultWeightKg: 0.25 },
  manzana: { pricePerUnit: 0.45, defaultWeightKg: 0.18 },
  platano: { pricePerUnit: 0.35, defaultWeightKg: 0.15 },
  naranja: { pricePerUnit: 0.40, defaultWeightKg: 0.20 },
  limon: { pricePerUnit: 0.35, defaultWeightKg: 0.12 },
  lentejas: { pricePerUnit: 1.20, defaultWeightKg: 0.5 },
  garbanzos: { pricePerUnit: 1.20, defaultWeightKg: 0.5 },
}

export function estimateItemValue(name: string, quantity: number = 1, unit?: string | null): number {
  const norm = singularize(name)
  const qty = Number(quantity) || 1
  for (const [key, ref] of Object.entries(INGREDIENT_PRICE_REF)) {
    if (norm.includes(key) || key.includes(norm)) {
      if (unit === 'kg') return +(ref.pricePerUnit * (1 / (ref.defaultWeightKg || 0.2)) * qty).toFixed(2)
      if (unit === 'g') return +((ref.pricePerUnit / ((ref.defaultWeightKg || 0.2) * 1000)) * qty).toFixed(2)
      return +(ref.pricePerUnit * qty).toFixed(2)
    }
  }
  return +(1.20 * qty).toFixed(2)
}

export function estimateItemWeightKg(name: string, quantity: number = 1, unit?: string | null): number {
  const norm = singularize(name)
  const qty = Number(quantity) || 1
  if (unit === 'kg') return qty
  if (unit === 'g') return +(qty / 1000).toFixed(3)
  for (const [key, ref] of Object.entries(INGREDIENT_PRICE_REF)) {
    if (norm.includes(key) || key.includes(norm)) {
      return +(ref.defaultWeightKg * qty).toFixed(3)
    }
  }
  return +(0.18 * qty).toFixed(3)
}

export function calculateInventoryEconomicRisk(
  items: Array<{ name: string; quantity?: number | null; unit?: string | null; urgency: string }>
): {
  totalValue: number
  riskValue: number
  riskWeightKg: number
} {
  let totalValue = 0
  let riskValue = 0
  let riskWeightKg = 0

  for (const item of items) {
    const val = estimateItemValue(item.name, item.quantity ?? 1, item.unit)
    const weight = estimateItemWeightKg(item.name, item.quantity ?? 1, item.unit)
    totalValue += val
    if (item.urgency === 'critical' || item.urgency === 'warning') {
      riskValue += val
      riskWeightKg += weight
    }
  }

  return {
    totalValue: +totalValue.toFixed(2),
    riskValue: +riskValue.toFixed(2),
    riskWeightKg: +riskWeightKg.toFixed(2),
  }
}

function extractClauseExpiryDays(clause: string): number | null {
  const lower = clause.toLowerCase()
  if (/\b(hoy|vence hoy|vencen hoy|caduca hoy|caducan hoy)\b/.test(lower)) return 0
  if (/\b(mañana|manana|vence mañana|vencen mañana|caduca mañana|caducan mañana)\b/.test(lower)) return 1
  if (/\b(pasado mañana|pasado manana)\b/.test(lower)) return 2
  const inDaysMatch = lower.match(/\ben\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete)\s+d[ií]as?\b/)
  if (inDaysMatch) {
    const n = parseNumber(inDaysMatch[1]) ?? parseInt(inDaysMatch[1], 10)
    if (!isNaN(n)) return n
  }
  if (/\b(esta semana)\b/.test(lower)) return 3
  if (/\b(la semana que viene|la proxima semana|la próxima semana)\b/.test(lower)) return 7
  return null
}

/**
 * Extract ingredients and quantities from spoken or typed Spanish text.
 * Incluye extracción precisa de caducidad por cláusula, deduplicación inteligente
 * y fusión de cantidades de un mismo ingrediente.
 */
export function extractIngredients(text: string): ParsedIngredient[] {
  const rawList: ParsedIngredient[] = []
  const cleanText = collapseRepeats(text)
  
  // Normalizar separadores manteniendo la asociación de fechas a cada ingrediente
  const sentences = cleanText
    .replace(/ y /gi, ', ')
    .replace(/ e /gi, ', ')
    .replace(/ más /gi, ', ')
    .replace(/ mas /gi, ', ')
    .replace(/ también /gi, ', ')
    .replace(/ tambien /gi, ', ')
    .split(/[,;.]+/)
    .map(s => s.trim())
    .filter(Boolean)

  for (const sentence of sentences) {
    // 1. Detectar si esta cláusula contiene una fecha de caducidad explícita
    const explicitExpiry = extractClauseExpiryDays(sentence)

    // 2. Limpiar términos de caducidad para no ensuciar el nombre del ingrediente
    const cleanedSentence = sentence
      .replace(/\b(que vencen|que vence|que caducan|que caduca|vence|vencen|caduca|caducan)\s+(hoy|mañana|manana|pasado mañana|pasado manana|esta semana|la semana que viene|la proxima semana|la próxima semana|en \d+ d[ií]as?|en [a-z]+ d[ií]as?)\b/gi, '')
      .replace(/\b(que vencen|que vence|vence|vencen|caduca|caducan)\b/gi, '')
      .trim()

    const tokens = cleanedSentence.toLowerCase().split(/\s+/)
    let quantity: number | null = null
    let unit: string | null = null
    const ingredientTokens: string[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      
      const num = parseNumber(token)
      if (num !== null && quantity === null) {
        quantity = num
        continue
      }

      const unitMatch = UNITS[token]
      if (unitMatch && quantity !== null) {
        unit = unitMatch
        continue
      }

      if (SKIP_WORDS.has(token)) continue

      if (token.length > 1) {
        ingredientTokens.push(token)
      }
    }

    const ingredientName = ingredientTokens.join(' ').trim()
    if (ingredientName.length > 1) {
      const expiryDays = explicitExpiry !== null ? explicitExpiry : guessShelfLife(ingredientName)
      rawList.push({
        name: ingredientName,
        quantity: quantity ?? 1,
        unit: unit ?? 'ud',
        category: guessCategory(ingredientName),
        expiryDays,
      })
    }
  }

  // Deduplicación y fusión: si dos ingredientes coinciden por isIngredientMatch o singularize, fusionar
  const mergedList: ParsedIngredient[] = []

  for (const item of rawList) {
    const existing = mergedList.find(m => isIngredientMatch(m.name, item.name))
    if (existing) {
      // Sumamos cantidades si comparten unidad similar o default
      if (existing.unit === item.unit || existing.unit === 'ud' || item.unit === 'ud') {
        existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1)
      }
      // Conservamos la fecha de caducidad más urgente si ambas están definidas
      if (item.expiryDays != null && (existing.expiryDays == null || item.expiryDays < existing.expiryDays)) {
        existing.expiryDays = item.expiryDays
      }
    } else {
      mergedList.push({ ...item })
    }
  }

  return mergedList
}

/**
 * Motor de Riesgo:
 * Calcula el nivel de urgencia del ingrediente:
 * - Rojo (critical): <= 2 días o vencido
 * - Naranja (warning): <= 7 días
 * - Verde (ok): > 7 días
 */
export function calculateUrgency(expiresAt: string | null): {
  urgency: 'critical' | 'warning' | 'ok'
  daysUntilExpiry: number | null
} {
  if (!expiresAt) return { urgency: 'ok', daysUntilExpiry: null }

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 2) return { urgency: 'critical', daysUntilExpiry: diffDays }
  if (diffDays <= 7) return { urgency: 'warning', daysUntilExpiry: diffDays }
  return { urgency: 'ok', daysUntilExpiry: diffDays }
}

export function formatExpiryLabel(daysUntilExpiry: number | null): string {
  if (daysUntilExpiry === null) return 'Sin fecha'
  if (daysUntilExpiry < 0) return 'Vencido'
  if (daysUntilExpiry === 0) return 'Vence hoy'
  if (daysUntilExpiry === 1) return 'Vence mañana'
  if (daysUntilExpiry <= 7) return `${daysUntilExpiry} días`
  return `${Math.ceil(daysUntilExpiry / 7)} sem`
}

export function defaultExpiryDate(shelfLifeDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + shelfLifeDays)
  return date.toISOString()
}

/**
 * MOTOR VACIAR NEVERA
 * Fórmula requerida:
 * score = ingredientes_urgentes_utilizados + ingredientes_totales_utilizados
 */
export function scoreRecipe(
  recipeIngredients: string[],
  inventory: { name: string; urgency: 'critical' | 'warning' | 'ok' }[]
): {
  score: number
  urgentUsed: number
  totalUsed: number
  priority: PriorityLevel
  matched: string[]
  missing: string[]
} {
  const inventoryNames = inventory.map(i => ({
    raw: i.name,
    normalized: normalizeIngredientName(i.name),
    urgency: i.urgency,
  }))

  const matched: string[] = []
  const missing: string[] = []
  let urgentUsed = 0

  for (const recipeIng of recipeIngredients) {
    const match = inventoryNames.find(item => isIngredientMatch(item.raw, recipeIng))

    if (match) {
      matched.push(recipeIng)
      if (match.urgency === 'critical' || match.urgency === 'warning') {
        urgentUsed += 1
      }
    } else {
      missing.push(recipeIng)
    }
  }

  const totalUsed = matched.length
  
  // Fórmula requerida: score = ingredientes_urgentes_utilizados + ingredientes_totales_utilizados
  const score = urgentUsed + totalUsed

  // Nivel de prioridad
  let priority: PriorityLevel = 'Baja'
  if (urgentUsed >= 1 && totalUsed >= 2) {
    priority = 'Alta'
  } else if (urgentUsed >= 1 || totalUsed >= 2) {
    priority = 'Media'
  }

  return { score, urgentUsed, totalUsed, priority, matched, missing }
}
