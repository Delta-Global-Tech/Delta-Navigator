import { supabase } from '@/data/supabase'
import { useAuth } from './useAuth'
import { useCallback } from 'react'

export interface AuditLogEntry {
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  status?: 'success' | 'error' | 'warning'
  errorMessage?: string
  durationMs?: number
}

/**
 * Hook para registrar ações de auditoria
 * 
 * @example
 * const { logAction } = useAuditLog()
 * 
 * await logAction({
 *   action: 'CREATE',
 *   resource: 'Contrato',
 *   resourceId: '12345',
 *   details: { valor: 10000, cliente: 'XYZ' }
 * })
 */
export function useAuditLog() {
  const { user } = useAuth()

  const logAction = useCallback(async (entry: AuditLogEntry) => {
    if (!user?.email) {
      console.warn('⚠️ [Audit] Usuário não identificado, log não registrado')
      return null
    }

    try {
      const startTime = performance.now()

      const { data, error } = await (supabase
        .from('audit_logs') as any)
        .insert({
          user_id: user.id,
          user_email: user.email,
          action: entry.action,
          resource: entry.resource,
          resource_id: entry.resourceId,
          details: entry.details || null,
          status: entry.status || 'success',
          error_message: entry.errorMessage || null,
          duration_ms: entry.durationMs || Math.round(performance.now() - startTime),
          ip_address: null, // Será obtido no backend se necessário
          user_agent: navigator.userAgent,
        })
        .select()

      if (error) {
        console.error('❌ [Audit] Erro ao registrar log:', error)
        return null
      }

      console.log(`✅ [Audit] ${entry.action} em ${entry.resource}`, entry.resourceId || '')
      return data?.[0]
    } catch (error) {
      console.error('❌ [Audit] Erro inesperado:', error)
      return null
    }
  }, [user])

  const logView = useCallback(
    (resource: string, resourceId?: string) => {
      return logAction({
        action: 'VIEW',
        resource,
        resourceId,
      })
    },
    [logAction]
  )

  const logCreate = useCallback(
    (resource: string, resourceId: string, details?: Record<string, any>) => {
      return logAction({
        action: 'CREATE',
        resource,
        resourceId,
        details,
      })
    },
    [logAction]
  )

  const logUpdate = useCallback(
    (resource: string, resourceId: string, changes?: Record<string, any>) => {
      return logAction({
        action: 'UPDATE',
        resource,
        resourceId,
        details: { changes },
      })
    },
    [logAction]
  )

  const logDelete = useCallback(
    (resource: string, resourceId: string, details?: Record<string, any>) => {
      return logAction({
        action: 'DELETE',
        resource,
        resourceId,
        details,
      })
    },
    [logAction]
  )

  const logExport = useCallback(
    (resource: string, format: string, count: number) => {
      return logAction({
        action: 'EXPORT',
        resource,
        details: { format, count },
      })
    },
    [logAction]
  )

  const logError = useCallback(
    (resource: string, action: string, errorMsg: string, details?: Record<string, any>) => {
      return logAction({
        action,
        resource,
        status: 'error',
        errorMessage: errorMsg,
        details,
      })
    },
    [logAction]
  )

  const logLogin = useCallback(() => {
    return logAction({
      action: 'LOGIN',
      resource: 'Sistema',
      details: {
        timestamp: new Date().toISOString(),
      },
    })
  }, [logAction])

  const logLogout = useCallback(() => {
    return logAction({
      action: 'LOGOUT',
      resource: 'Sistema',
      details: {
        timestamp: new Date().toISOString(),
      },
    })
  }, [logAction])

  return {
    logAction,
    logView,
    logCreate,
    logUpdate,
    logDelete,
    logExport,
    logError,
    logLogin,
    logLogout,
  }
}
