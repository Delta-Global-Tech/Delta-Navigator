import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/data/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react'
import { PermissionRoute } from '@/components/auth/PermissionRoute'
import { UserPermissionsDialog } from '@/components/admin/UserPermissionsDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  full_name?: string
  role: 'master' | 'admin' | 'user'
  department?: string
  active: boolean
  created_at: string
}

export function UsersManager() {
  const queryClient = useQueryClient()
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState<'master' | 'admin' | 'user'>('user')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState('')
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null)
  const [editingRoleValue, setEditingRoleValue] = useState<'master' | 'admin' | 'user'>('user')

  // Buscar usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      return data || []
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  })

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async () => {
      try {
        // 1. Primeiro, verificar se o email já existe na Auth
        // Se existir, não conseguimos deletar via frontend (precisa service_role_key)
        try {
          const { data: existingUsers } = await (supabase as any)
            .from('user_profiles')
            .select('id')
            .eq('email', newEmail)
            .maybeSingle()

          if (existingUsers?.id) {
            console.log('Email já existe em user_profiles com ID:', existingUsers.id)
            // Nota: Deletar da auth requer service_role_key no backend
            // Por enquanto, apenas informamos e deixamos para criar novo perfil
          }
        } catch (checkError) {
          console.log('Erro ao verificar email existente:', checkError)
        }

        // 2. Criar usuário na Auth
        const { data, error } = await supabase.auth.signUp({
          email: newEmail,
          password: newPassword,
        })

        if (error) {
          // Se der erro de "user already exists", tenta uma abordagem alternativa
          if (error.message.includes('already') || error.message.includes('exists')) {
            console.warn('Usuário já existe na Auth, tentando deletar...', error)
            // Aqui você pode informar ao usuário que precisa contatar suporte
            // ou usar uma RPC específica para limpar
            throw new Error(
              'Email já registrado no sistema. Se foi deletado recentemente, pode levar alguns minutos para liberar. Tente novamente em alguns minutos.'
            )
          }
          throw error
        }

        if (!data.user?.id) throw new Error('Falha ao criar usuário')

        // 3. Verificar se profile já existe
        const { data: existingProfile } = await (supabase as any)
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        // 4. Criar ou atualizar profile
        if (existingProfile?.id) {
          // Se existe, atualizar
          const { error: updateError } = await (supabase as any)
            .from('user_profiles')
            .update({
              full_name: newFullName,
              role: newRole,
              department: 'Geral',
              active: true,
            })
            .eq('id', data.user.id)
          if (updateError) throw updateError
        } else {
          // Se não existe, inserir
          const { error: insertError } = await (supabase as any)
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: newEmail,
              full_name: newFullName,
              role: newRole,
              department: 'Geral',
              active: true,
            })
          if (insertError) throw insertError
        }

        return data.user
      } catch (error: any) {
        console.error('Erro completo ao criar usuário:', error)
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['allUsers'] })
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setNewRole('user')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar usuário')
    },
  })

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        // 1. Deletar permissões do usuário
        const { error: permError } = await (supabase as any)
          .from('user_screen_permissions')
          .delete()
          .eq('user_id', userId)

        if (permError) {
          console.warn('Erro ao deletar permissões (não crítico):', permError)
        }

        // 2. Deletar perfil do usuário
        const { error: profileError } = await (supabase as any)
          .from('user_profiles')
          .delete()
          .eq('id', userId)

        if (profileError) throw profileError

        // 3. Nota sobre deletar da auth:
        // A exclusão da autenticação Supabase requer a service_role_key
        // que é uma credencial administrativa e não deve estar no frontend.
        // Para deletar usuários da auth, é necessário:
        // - Configurar a service_role_key no backend Supabase
        // - Criar um RPC PostgreSQL que delete usuários (recomendado)
        // - Ou criar um endpoint seguro no backend Node.js
        //
        // Por enquanto, o usuário foi deletado do app (permissões e perfil),
        // mas ainda existe na autenticação Supabase.
        // Isso impede que ele faça login, pois não tem mais perfil.
        console.log('Usuário deletado das tabelas do app (permissões e perfil)')
        console.warn('NOTA: Para deletar completamente da autenticação Supabase, configure a service_role_key no backend')
      } catch (error: any) {
        console.error('Erro crítico ao deletar usuário:', error)
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Usuário deletado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['allUsers'] })
      setDeleteConfirmOpen(false)
      setSelectedUserId(null)
    },
    onError: (error: any) => {
      console.error('Erro completo no delete:', error)
      toast.error(error.message || 'Erro ao deletar usuário')
    },
  })

  // Atualizar role do usuário
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'master' | 'admin' | 'user' }) => {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Role atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['allUsers'] })
      setEditingRoleUserId(null)
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar role')
    },
  })

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      master: 'destructive',
      admin: 'default',
      user: 'secondary',
    }
    return variants[role] || 'outline'
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      master: '👑 Master',
      admin: '🔐 Admin',
      user: '👤 Usuário',
    }
    return labels[role] || role
  }

  return (
    <PermissionRoute screenId="users">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Crie, edite e delete usuários do sistema
          </p>
        </div>

        {/* Criar Novo Usuário */}
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="João Silva"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 Usuário</SelectItem>
                    <SelectItem value="admin">🔐 Admin</SelectItem>
                    <SelectItem value="master">👑 Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!newEmail || !newPassword || createUserMutation.isPending}
              className="mt-4"
            >
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema ({users?.length || 0})</CardTitle>
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
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell>
                          {editingRoleUserId === user.id ? (
                            <Select
                              value={editingRoleValue}
                              onValueChange={(value: any) => {
                                setEditingRoleValue(value)
                                updateUserRoleMutation.mutate({
                                  userId: user.id,
                                  newRole: value,
                                })
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">👤 Usuário</SelectItem>
                                <SelectItem value="admin">🔐 Admin</SelectItem>
                                <SelectItem value="master">👑 Master</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={getRoleBadge(user.role)}
                              className="cursor-pointer hover:opacity-80"
                              onClick={() => {
                                setEditingRoleUserId(user.id)
                                setEditingRoleValue(user.role as 'master' | 'admin' | 'user')
                              }}
                              title="Clique para editar"
                            >
                              {getRoleLabel(user.role)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.active ? 'default' : 'outline'}>
                            {user.active ? '✓ Ativo' : '✕ Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setSelectedUserEmail(user.email)
                                setPermissionsDialogOpen(true)
                              }}
                              title="Ver permissões"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirm Delete Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Usuário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O usuário será removido do sistema permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedUserId) {
                    deleteUserMutation.mutate(selectedUserId)
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deletar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Permissions Dialog */}
        {selectedUserId && (
          <UserPermissionsDialog
            userId={selectedUserId}
            userEmail={selectedUserEmail}
            open={permissionsDialogOpen}
            onOpenChange={setPermissionsDialogOpen}
          />
        )}
      </div>
    </PermissionRoute>
  )
}
