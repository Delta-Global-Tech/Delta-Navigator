import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { supabase } from '@/data/supabase'
import { User, Session } from '@supabase/supabase-js'
import { setCurrentUser } from '@/services/requestMonitoring'
import { logAuthLogin, logAuthLogout, logAuthError } from '@/utils/authLogging'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setCurrentUser(session?.user ?? null) // Notificar monitoring
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setCurrentUser(session?.user ?? null) // Notificar monitoring
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Log de sucesso
      await logAuthLogin(email)
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao fazer login'
      setError(errorMsg)
      // Log de erro
      await logAuthError('LOGIN', email, errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      
      // Log antes do logout
      await logAuthLogout(user?.email)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer logout')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Usar URL configurada no env ou fallback para window.location.origin
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/#/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar email de reset')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Erro ao atualizar a senha')
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        login,
        logout,
        resetPassword,
        updatePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
