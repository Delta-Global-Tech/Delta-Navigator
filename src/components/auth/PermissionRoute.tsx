import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { AlertCircle, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PermissionRouteProps {
  children: React.ReactNode
  screenId: string
  requiredAction?: 'view' | 'edit' | 'delete' | 'export'
  fallback?: React.ReactNode
  fallbackTitle?: string
  fallbackDescription?: string
}

/**
 * Componente que protege rotas por permissão
 * 
 * EXEMPLOS DE USO:
 * 
 * <PermissionRoute screenId="statement-screen-id">
 *   <StatementPage />
 * </PermissionRoute>
 * 
 * <PermissionRoute 
 *   screenId="admin-users"
 *   requiredAction="edit"
 *   fallbackTitle="Acesso Restrito"
 *   fallbackDescription="Você não tem permissão para editar usuários"
 * >
 *   <UsersManager />
 * </PermissionRoute>
 */
export function PermissionRoute({
  children,
  screenId,
  requiredAction = 'view',
  fallback,
  fallbackTitle = 'Acesso Negado',
  fallbackDescription = 'Você não tem permissão para acessar esta página.'
}: PermissionRouteProps) {
  const { hasPermission, isLoading, isAdmin } = usePermissions()

  // Aguardando carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Verificar permissão
  const hasAccess = hasPermission(screenId, requiredAction)

  // Acesso permitido
  if (hasAccess) {
    return <>{children}</>
  }

  // Fallback customizado
  if (fallback) {
    return <>{fallback}</>
  }

  // Fallback padrão
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{fallbackTitle}</CardTitle>
          <CardDescription>{fallbackDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">O que você pode fazer:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Solicitar acesso ao administrador</li>
                <li>Verificar suas permissões no perfil</li>
                <li>Contatar o suporte</li>
              </ul>
            </div>
          </div>

          {isAdmin && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-600">
                <strong>👤 Administrador:</strong> Você tem acesso ao painel de permissões para gerenciar acessos de outros usuários.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
