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

/**
 * Extract ingredients and quantities from spoken or typed Spanish text.
 * Incluye deduplicación inteligente y fusión de cantidades de un mismo ingrediente.
 */
export function extractIngredients(text: string): ParsedIngredient[] {
  const rawList: ParsedIngredient[] = []
  const cleanText = collapseRepeats(text)
  
  // Normalizar separadores y cláusulas
  const sentences = cleanText
    .replace(/\b(que vencen|que vence|que caducan|que caduca|vence|vencen)\s+(hoy|manana|el proximo [a-z]+|en \d+ dias?)\b/gi, '')
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
    const tokens = sentence.toLowerCase().split(/\s+/)
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
      rawList.push({
        name: ingredientName,
        quantity: quantity ?? 1,
        unit: unit ?? 'ud',
        category: guessCategory(ingredientName),
        expiryDays: guessShelfLife(ingredientName),
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
