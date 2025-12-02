import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/data/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Settings, Users, Lock, Clock, Shield, LogOut } from "lucide-react"

export function AdminSettingsMenu() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Buscar role do usuário - VERSÃO ROBUSTA COM DEBUG
  useEffect(() => {
    if (!user?.id) {
      console.log('[AdminSettingsMenu] Nenhum usuário logado')
      setUserRole(null)
      return
    }

    let isMounted = true

    const fetchUserRole = async () => {
      try {
        console.log('[AdminSettingsMenu] Buscando role para:', user.id)
        setLoading(true)

        // Tenta fazer query ao Supabase
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!isMounted) return

        if (error) {
          console.error('[AdminSettingsMenu] Erro na query:', error.message)
          console.error('[AdminSettingsMenu] Código do erro:', error.code)
          // Tentar buscar através de outro método
          console.log('[AdminSettingsMenu] Tentando buscar através de auth metadata...')
          setUserRole(null)
        } else if (data?.role) {
          console.log('[AdminSettingsMenu] ✅ Role encontrada:', data.role)
          setUserRole(data.role)
        } else {
          console.warn('[AdminSettingsMenu] ⚠️ Nenhum role retornado - data:', data)
          setUserRole(null)
        }
      } catch (err: any) {
        if (!isMounted) return
        console.error('[AdminSettingsMenu] ❌ Erro ao buscar role:', err.message)
        console.error('[AdminSettingsMenu] Stack:', err.stack)
        setUserRole(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUserRole()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // DEBUG: log quando role muda
  useEffect(() => {
    console.log('[AdminSettingsMenu] Render:', { userRole, loading, hasUser: !!user?.id })
  }, [userRole, loading, user?.id])

  // Se não for admin ou master, não mostrar o menu
  if (!userRole || !['admin', 'master'].includes(userRole)) {
    console.log('[AdminSettingsMenu] Menu não será exibido:', {
      userRole,
      isValidRole: ['admin', 'master'].includes(userRole || ''),
      hasUser: !!user?.id,
      reason: !userRole ? 'Sem role' : `Role inválida: ${userRole}`
    })
    return null
  }

  const handleNavigation = (path: string) => {
    console.log('[AdminSettingsMenu] Navegando para:', path)
    navigate(path)
  }

  const handleLogout = async () => {
    console.log('[AdminSettingsMenu] Fazendo logout')
    await supabase.auth.signOut()
    navigate('/')
  }

  console.log('[AdminSettingsMenu] Renderizando menu para role:', userRole)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="relative hover:bg-amber-500/10"
          title={`Admin Panel - Role: ${userRole}`}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* Header */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-amber-500" />
          <span>Painel Admin</span>
          <span className="text-xs text-amber-500 ml-auto">{userRole}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Admin Options */}
        <DropdownMenuItem 
          onSelect={() => handleNavigation('/admin/users')}
          className="cursor-pointer"
        >
          <Users className="h-4 w-4 mr-2" />
          <span>Gerenciar Usuários</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onSelect={() => handleNavigation('/admin/permissions')}
          className="cursor-pointer"
        >
          <Lock className="h-4 w-4 mr-2" />
          <span>Gerenciar Permissões</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onSelect={() => handleNavigation('/admin/audit')}
          className="cursor-pointer"
        >
          <Clock className="h-4 w-4 mr-2" />
          <span>Log de Auditoria</span>
        </DropdownMenuItem>

        {/* Master Only */}
        {userRole === 'master' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Opções Master
            </DropdownMenuLabel>

            <DropdownMenuItem 
              onSelect={() => handleNavigation('/admin/settings')}
              className="cursor-pointer"
            >
              <Shield className="h-4 w-4 mr-2" />
              <span>Configurações Avançadas</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem 
          onSelect={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
