import { useAuth } from './useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/data/supabase'

interface Screen {
  id: string
  name: string
  slug: string
  route: string
  description?: string
  category: string
  sort_order: number
  active: boolean
  icon?: string
}

export function usePermissions() {
  const { user } = useAuth()

  // Buscar role do usuário
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return 'user'
      
      try {
        const { data } = await (supabase as any)
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        return data?.role || 'user'
      } catch (error) {
        console.error('[usePermissions] Erro ao buscar role:', error)
        return 'user'
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Buscar telas disponíveis
  const { data: screens = [] } = useQuery({
    queryKey: ['availableScreens'],
    queryFn: async () => {
      try {
        const { data } = await (supabase as any)
          .from('app_screens')
          .select('*')
          .eq('active', true)
          .order('sort_order')
        
        return (data as Screen[]) || []
      } catch (error) {
        console.error('[usePermissions] Erro ao buscar telas:', error)
        return []
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  })

  // Buscar permissões do usuário por tela
  const { data: screenPermissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['screenPermissions', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      try {
        const { data } = await (supabase as any)
          .from('user_screen_permissions')
          .select('screen_id, can_view, can_edit, can_delete, can_export')
          .eq('user_id', user.id)

        return data || []
      } catch (error) {
        console.error('[usePermissions] Erro ao buscar permissões:', error)
        return []
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  /**
   * Verifica se o usuário tem permissão para acessar uma tela
   * @param screenId - ID da tela
   * @param action - Ação: view, edit, delete, export
   * @returns boolean
   */
  const hasPermission = (
    screenId: string,
    action: 'view' | 'edit' | 'delete' | 'export' = 'view'
  ): boolean => {
    // Masters têm acesso a tudo
    if (userRole === 'master') return true

    // Admins têm acesso a tudo
    if (userRole === 'admin') return true

    // Usuários comuns verificam permissão específica
    const permission = screenPermissions?.find(p => p.screen_id === screenId)
    if (!permission) return false

    const actionMap: Record<string, boolean> = {
      view: permission.can_view || false,
      edit: permission.can_edit || false,
      delete: permission.can_delete || false,
      export: permission.can_export || false,
    }

    return actionMap[action] || false
  }

  /**
   * Verifica se o usuário pode executar uma ação em uma tela
   * Função mais verbosa, útil para debug
   */
  const canAccess = (screenId: string, action: 'view' | 'edit' | 'delete' | 'export' = 'view'): boolean => {
    const hasAccess = hasPermission(screenId, action)
    
    if (!hasAccess) {
      console.warn(`[Permissão Negada] Usuário ${user?.email} tentou ${action} na tela ${screenId}`)
    }

    return hasAccess
  }

  return {
    // Estado
    userRole,
    screenPermissions,
    screens,
    isLoading: roleLoading || permissionsLoading,

    // Helpers
    isMaster: userRole === 'master',
    isAdmin: userRole === 'admin' || userRole === 'master',
    isUser: userRole === 'user',

    // Métodos
    hasPermission,
    canAccess,
  }
}

/**
 * EXEMPLOS DE USO:
 * 
 * // No componente:
 * const { hasPermission, isMaster, isLoading } = usePermissions()
 * 
 * // Verificar se pode ver uma tela
 * if (hasPermission('statement-screen-id', 'view')) {
 *   return <StatementPage />
 * }
 * 
 * // Mostrar/esconder botão de editar
 * {hasPermission('statement-screen-id', 'edit') && (
 *   <Button>Editar</Button>
 * )}
 * 
 * // Master pode fazer tudo
 * if (isMaster) {
 *   return <AdminPanel />
 * }
 * 
 * // Verificar com debug
 * if (!canAccess('statement-screen-id', 'edit')) {
 *   return <AccessDenied />
 * }
 */
