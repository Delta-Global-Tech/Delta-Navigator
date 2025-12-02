import { supabase } from '@/data/supabase'

/**
 * Log de login - chamado automaticamente quando usuário faz login
 */
export async function logAuthLogin(userEmail?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const email = userEmail || user?.email || 'unknown'
    
    await (supabase as any).from('audit_logs').insert([{
      user_email: email,
      user_id: user?.id || null,
      action: 'LOGIN',
      resource: 'Auth',
      status: 'success',
      details: {
        method: 'email_password'
      }
    }])
  } catch (error) {
    // Silencioso - não quebra o fluxo de login
    console.error('Erro ao registrar login:', error)
  }
}

/**
 * Log de logout - chamado automaticamente quando usuário faz logout
 */
export async function logAuthLogout(userEmail?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const email = userEmail || user?.email || 'unknown'
    
    await (supabase as any).from('audit_logs').insert([{
      user_email: email,
      user_id: user?.id || null,
      action: 'LOGOUT',
      resource: 'Auth',
      status: 'success'
    }])
  } catch (error) {
    // Silencioso - não quebra o fluxo de logout
    console.error('Erro ao registrar logout:', error)
  }
}

/**
 * Log de erro de autenticação
 */
export async function logAuthError(action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET', email: string, errorMsg: string) {
  try {
    await (supabase as any).from('audit_logs').insert([{
      user_email: email,
      action: action,
      resource: 'Auth',
      status: 'error',
      error_message: errorMsg,
      details: {
        attempt_email: email
      }
    }])
  } catch (error) {
    console.error('Erro ao registrar erro de autenticação:', error)
  }
}
