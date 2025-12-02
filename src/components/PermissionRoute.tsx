import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

interface PermissionRouteProps {
  screenId: string
  action?: 'view' | 'edit' | 'delete' | 'export'
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionRoute({
  screenId,
  action = 'view',
  children,
  fallback,
}: PermissionRouteProps) {
  const { hasPermission, isLoading, userRole } = usePermissions()

  if (isLoading) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Carregando permissões...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const hasAccess = hasPermission(screenId, action)

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription className="mt-2">
              Você não tem permissão para acessar este conteúdo.
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-4">
              Seu role: <strong>{userRole}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Ação solicitada: <strong>{action}</strong>
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Entre em contato com um administrador se acredita que isso é um erro.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
