import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, CheckCircle, Mail } from "lucide-react"
import { supabase } from '@/data/supabase'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Usar URL configurada no env ou fallback para window.location.origin
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/#/reset-password`
      
      console.log('📧 Enviando reset para:', email)
      console.log('🔗 Redirect URL:', redirectUrl)
      console.log('🌐 VITE_APP_URL:', import.meta.env.VITE_APP_URL)
      console.log('📍 window.location.origin:', window.location.origin)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        // Mostrar mensagem de sucesso mesmo se o email não existe (por segurança)
        setSuccess(true)
        return
      }

      setSuccess(true)
      setEmail('')
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar email de reset')
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-2xl font-bold">Email enviado!</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Próximos passos:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Verifique seu email</li>
                <li>✓ Clique no link de reset de senha</li>
                <li>✓ Crie uma nova senha</li>
              </ul>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Não recebeu o email? Verifique a pasta de spam ou{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-primary"
                onClick={() => setSuccess(false)}
              >
                tente novamente
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
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
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de reset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Você receberá um email com instruções para redefinir sua senha
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de reset'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
