import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from '@/data/supabase'
import { useNavigate, useLocation } from 'react-router-dom'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Validar se o token de reset é válido
  useEffect(() => {
    const validateToken = async () => {
      try {
        console.log('🔍 ResetPasswordForm inicializado')
        console.log('📍 URL completa:', window.location.href)
        console.log('� Hash:', window.location.hash)
        console.log('🌐 Origin:', window.location.origin)
        
        // Supabase deveria ter detectado o token na hash
        // e criado uma sessão automaticamente
        const { data } = await supabase.auth.getSession()
        
        console.log('✅ Sessão obtida:', data.session ? 'SIM - Usuário pode resetar' : 'NÃO - Link inválido/expirado')
        
        if (!data.session) {
          console.warn('⚠️ Nenhuma sessão encontrada. Token pode estar expirado ou inválido.')
          setError('Link de reset inválido ou expirado. Solicite um novo link.')
        } else {
          console.log('👤 Usuário:', data.session.user?.email)
        }
        
        setValidating(false)
      } catch (error: any) {
        console.error('❌ Erro ao validar token:', error)
        setError('Erro ao validar o link de reset')
        setValidating(false)
      }
    }

    validateToken()
  }, [location])

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra maiúscula'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra minúscula'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'A senha deve conter pelo menos um número'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'A senha deve conter pelo menos um caractere especial (!@#$%^&*)'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar senhas
    if (password !== confirmPassword) {
      setError('As senhas não correspondem')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir a senha')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Senha redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Você será redirecionado para o login em 3 segundos...
              </AlertDescription>
            </Alert>
            
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para o login agora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite uma nova senha segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">Requisitos de senha:</p>
              <ul className="space-y-1 text-xs">
                <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                  ✓ Mínimo 8 caracteres
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                  ✓ Pelo menos 1 letra maiúscula
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                  ✓ Pelo menos 1 letra minúscula
                </li>
                <li className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                  ✓ Pelo menos 1 número
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                  ✓ Pelo menos 1 caractere especial
                </li>
              </ul>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
