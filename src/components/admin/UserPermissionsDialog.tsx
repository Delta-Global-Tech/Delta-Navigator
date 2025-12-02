import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/data/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, Edit, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'

interface UserPermissionsDialogProps {
  userId: string
  userEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Screen {
  id: string
  name: string
  slug: string
  route: string
  category: string
  sort_order: number
}

interface Permission {
  id: string
  screen_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_export: boolean
}

export function UserPermissionsDialog({
  userId,
  userEmail,
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Buscar telas
  const { data: screens = [], isLoading: screensLoading } = useQuery({
    queryKey: ['screens'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('app_screens')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      return (data as Screen[]) || []
    },
  })

  // Buscar permissões do usuário
  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('user_screen_permissions')
        .select('*')
        .eq('user_id', userId)
      return (data as Permission[]) || []
    },
    enabled: open && !!userId,
  })

  const getPermissionForScreen = (screenId: string) => {
    return permissions.find(p => p.screen_id === screenId) || {
      can_view: false,
      can_edit: false,
      can_delete: false,
      can_export: false,
    }
  }

  const categories = Array.from(new Set(screens.map(s => s.category)))
  
  const filteredScreens = selectedCategory
    ? screens.filter(s => s.category === selectedCategory)
    : screens

  const getPermissionCount = () => {
    return permissions.filter(p => p.can_view).length
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      main: 'default',
      reports: 'secondary',
      admin: 'destructive',
      data: 'outline',
      system: 'outline',
    }
    return colors[category] || 'outline'
  }

  const isLoading = screensLoading || permsLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões do Usuário</DialogTitle>
          <DialogDescription>
            {userEmail}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{getPermissionCount()}</div>
                  <p className="text-xs text-muted-foreground">Telas com acesso</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {permissions.filter(p => p.can_edit).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Com permissão de editar</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {permissions.filter(p => p.can_delete).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Com permissão de deletar</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {permissions.filter(p => p.can_export).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Com permissão de exportar</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtro de categorias */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todas ({screens.length})
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Badge variant={getCategoryBadge(category)} className="mr-2">
                    {category}
                  </Badge>
                  {screens.filter(s => s.category === category).length}
                </Button>
              ))}
            </div>

            {/* Tabela de permissões */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tela</TableHead>
                    <TableHead className="text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Deletar</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScreens.map(screen => {
                    const perm = getPermissionForScreen(screen.id)
                    const hasAnyPermission = perm.can_view || perm.can_edit || perm.can_delete || perm.can_export

                    return (
                      <TableRow 
                        key={screen.id}
                        className={hasAnyPermission ? 'bg-muted/30' : ''}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{screen.name}</p>
                            <p className="text-xs text-muted-foreground">{screen.route}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.can_view ? (
                            <Badge variant="default" className="bg-green-600">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.can_edit ? (
                            <Badge variant="secondary">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.can_delete ? (
                            <Badge variant="destructive">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {perm.can_export ? (
                            <Badge variant="outline">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Resumo */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
              ✓ Verde: Pode ver | ✓ Secundário: Pode editar | ✓ Vermelho: Pode deletar | ✓ Contorno: Pode exportar
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
