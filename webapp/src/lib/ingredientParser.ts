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
  'pollo': 2,
  'carne': 3,
  'pescado': 2,
  'ajo': 60, 'ajos': 60,
  'zanahoria': 14, 'zanahorias': 14,
  'patata': 30, 'patatas': 30, 'papa': 30, 'papas': 30,
  'pimiento': 7, 'pimientos': 7,
  'leche': 7,
  'pan': 5,
  'champiñón': 5, 'champiñones': 5, 'setas': 5,
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
  'huevo': 'proteína', 'huevos': 'proteína',
  'pollo': 'proteína', 'carne': 'proteína', 'pescado': 'proteína', 'atun': 'proteína', 'atún': 'proteína',
  'yogur': 'lácteo', 'yogures': 'lácteo',
  'queso': 'lácteo', 'leche': 'lácteo',
  'arroz': 'despensa', 'pasta': 'despensa', 'pan': 'despensa', 'harina': 'despensa',
}

const SKIP_WORDS = new Set([
  'tengo', 'hay', 'tenemos', 'tiene', 'sobra', 'sobran', 'queda', 'quedan',
  'también', 'tambien', 'además', 'ademas', 'y', 'e', 'de', 'del', 'la', 'el',
  'las', 'los', 'un', 'una', 'unos', 'unas', 'con', 'que', 'vencen', 'vence',
  'mañana', 'hoy', 'pasado', 'próximo', 'próximos', 'dias', 'días', 'disponibles', 'disponible',
  'creo', 'como', 'algo', 'más', 'mas', 'poco', 'pocos', 'pocas', 'por', 'para',
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
  // Casos comunes
  if (norm.endsWith('es')) {
    if (norm.endsWith('ces')) norm = norm.slice(0, -3) + 'z'
    else if (norm.endsWith('tomates')) norm = 'tomate'
    else if (norm.endsWith('yogures')) norm = 'yogur'
    else if (norm.endsWith('limones')) norm = 'limon'
    else norm = norm.slice(0, -2)
  } else if (norm.endsWith('s') && !norm.endsWith('arroz')) {
    norm = norm.slice(0, -1)
  }
  return norm.trim()
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
  
  // Normalizar separadores
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

  // Deduplicación y fusión: si el mismo ingrediente aparece más de una vez, sumar cantidades
  const mergedMap = new Map<string, ParsedIngredient>()

  for (const item of rawList) {
    const key = singularize(item.name)
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!
      // Si las unidades coinciden, sumamos las cantidades
      if (existing.unit === item.unit) {
        existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1)
      }
      // Conservamos la fecha de caducidad más urgente si ambas están definidas
      if (item.expiryDays != null && (existing.expiryDays == null || item.expiryDays < existing.expiryDays)) {
        existing.expiryDays = item.expiryDays
      }
    } else {
      mergedMap.set(key, { ...item })
    }
  }

  return Array.from(mergedMap.values())
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
    const normRecipe = singularize(recipeIng)
    const match = inventoryNames.find(item => {
      const normItem = singularize(item.raw)
      return normItem === normRecipe ||
        normItem.split(/\s+/).includes(normRecipe) ||
        normRecipe.split(/\s+/).includes(normItem)
    })

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
