import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('TU-PROYECTO')
)

if (!isSupabaseConfigured) {
  console.info(
    '<span className="material-symbols-rounded align-middle text-[1.2em] mb-0.5 inline-block">info</span>️ ¿Qué Cocino? funcionando en Modo Local/Demostración sin Supabase. ' +
    'Para conectar con PostgreSQL en la nube, añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env'
  )
}

export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key',
)

export default supabase
