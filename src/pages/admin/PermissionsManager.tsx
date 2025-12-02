import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/data/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { PermissionRoute } from '@/components/auth/PermissionRoute'
import { toast } from 'sonner'

interface Screen {
  id: string
  name: string
  slug: string
  route: string
  category: string
}

interface UserPermission {
  id: string
  user_id: string
  screen_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_export: boolean
}

interface User {
  id: string
  email: string
  full_name?: string
  role: string
}

export function PermissionsManager() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Buscar todos os usuários
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['allUsersForPermissions'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('role', 'user')
        .order('full_name')
      return data || []
    },
  })

  // Buscar todas as telas
  const { data: screens, isLoading: screensLoading } = useQuery({
    queryKey: ['allScreens'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('app_screens')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      return data || []
    },
  })

  // Buscar permissões do usuário selecionado
  const { data: permissions, isLoading: permissionsLoading, refetch } = useQuery({
    queryKey: ['userPermissions', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return []
      const { data } = await (supabase as any)
        .from('user_screen_permissions')
        .select('*')
        .eq('user_id', selectedUserId)
      return data || []
    },
    enabled: !!selectedUserId,
  })

  // Mutation para atualizar permissão
  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      screenId,
      action,
      value,
    }: {
      screenId: string
      action: 'can_view' | 'can_edit' | 'can_delete' | 'can_export'
      value: boolean
    }) => {
      // Primeiro verificar se existe
      const { data: existing } = await (supabase as any)
        .from('user_screen_permissions')
        .select('id')
        .eq('user_id', selectedUserId)
        .eq('screen_id', screenId)
        .single()

      if (existing?.id) {
        // Atualizar se existir
        const { error } = await (supabase as any)
          .from('user_screen_permissions')
          .update({ [action]: value })
          .eq('user_id', selectedUserId)
          .eq('screen_id', screenId)

        if (error) throw error
      } else {
        // Inserir se não existir (com os outros campos em false)
        const { error } = await (supabase as any)
          .from('user_screen_permissions')
          .insert({
            user_id: selectedUserId,
            screen_id: screenId,
            can_view: action === 'can_view' ? value : false,
            can_edit: action === 'can_edit' ? value : false,
            can_delete: action === 'can_delete' ? value : false,
            can_export: action === 'can_export' ? value : false,
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      refetch()
      toast.success('Permissão atualizada!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar permissão')
    },
  })

  const getPermissionForScreen = (screenId: string) => {
    return permissions?.find(p => p.screen_id === screenId) || {
      can_view: false,
      can_edit: false,
      can_delete: false,
      can_export: false,
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      main: 'bg-blue-100 text-blue-800',
      reports: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const isLoading = usersLoading || screensLoading || permissionsLoading

  return (
    <PermissionRoute screenId="permissions">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Permissões</h1>
          <p className="text-muted-foreground mt-2">
            Atribua permissões de acesso por tela para cada usuário
          </p>
        </div>

        {/* User Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Table */}
        {selectedUserId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Permissões de {users?.find(u => u.id === selectedUserId)?.full_name || 'Usuário'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tela</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Ver</TableHead>
                        <TableHead className="text-center">Editar</TableHead>
                        <TableHead className="text-center">Deletar</TableHead>
                        <TableHead className="text-center">Exportar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {screens?.map((screen: Screen) => {
                        const perm = getPermissionForScreen(screen.id)
                        return (
                          <TableRow key={screen.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{screen.name}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(screen.category)}`}>
                                {screen.category}
                              </span>
                            </TableCell>

                            {/* Ver */}
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_view || false}
                                onCheckedChange={(checked) =>
                                  updatePermissionMutation.mutate({
                                    screenId: screen.id,
                                    action: 'can_view',
                                    value: !!checked,
                                  })
                                }
                                disabled={updatePermissionMutation.isPending}
                              />
                            </TableCell>

                            {/* Editar */}
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_edit || false}
                                onCheckedChange={(checked) =>
                                  updatePermissionMutation.mutate({
                                    screenId: screen.id,
                                    action: 'can_edit',
                                    value: !!checked,
                                  })
                                }
                                disabled={!perm.can_view || updatePermissionMutation.isPending}
                                title={!perm.can_view ? 'Ative "Ver" primeiro' : ''}
                              />
                            </TableCell>

                            {/* Deletar */}
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_delete || false}
                                onCheckedChange={(checked) =>
                                  updatePermissionMutation.mutate({
                                    screenId: screen.id,
                                    action: 'can_delete',
                                    value: !!checked,
                                  })
                                }
                                disabled={!perm.can_edit || updatePermissionMutation.isPending}
                                title={!perm.can_edit ? 'Ative "Editar" primeiro' : ''}
                              />
                            </TableCell>

                            {/* Exportar */}
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.can_export || false}
                                onCheckedChange={(checked) =>
                                  updatePermissionMutation.mutate({
                                    screenId: screen.id,
                                    action: 'can_export',
                                    value: !!checked,
                                  })
                                }
                                disabled={!perm.can_view || updatePermissionMutation.isPending}
                                title={!perm.can_view ? 'Ative "Ver" primeiro' : ''}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <p className="font-medium">📋 Hierarquia de Permissões:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Ver:</strong> Usuário consegue acessar a tela</li>
                <li><strong>Editar:</strong> Requer "Ver" ativado primeiro</li>
                <li><strong>Deletar:</strong> Requer "Editar" ativado primeiro</li>
                <li><strong>Exportar:</strong> Permite exportar dados (requer "Ver")</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionRoute>
  )
}
