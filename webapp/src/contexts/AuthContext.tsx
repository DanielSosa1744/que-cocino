import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInDemo: () => void
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const LOCAL_USER_KEY = 'que_cocino_current_user'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Supabase Cloud Auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      // Local / Offline demo mode
      const saved = localStorage.getItem(LOCAL_USER_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setUser(parsed)
        } catch {
          setUser(null)
        }
      }
      setIsDemoMode(true)
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error | null }
    }

    // Modo local / demo
    const localUser = {
      id: 'demo-user-1',
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User
    setUser(localUser)
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
    return { error: null }
  }

  const signInDemo = () => {
    const demoUser = {
      id: 'demo-user-1',
      email: 'demo@quecocino.app',
      app_metadata: {},
      user_metadata: { name: 'Chef Sostenible' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User
    setUser(demoUser)
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser))
  }

  const signUp = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signUp({ email, password })
      return { error: error as Error | null }
    }

    const localUser = {
      id: 'demo-user-1',
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User
    setUser(localUser)
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
    return { error: null }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    localStorage.removeItem(LOCAL_USER_KEY)
  }

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error as Error | null }
    }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isDemoMode,
      signIn,
      signInDemo,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
