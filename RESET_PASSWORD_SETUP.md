# Configuração de Reset de Senha - Delta Navigator

## 📋 Resumo

Este documento descreve como configurar a funcionalidade de reset de senha no Delta Navigator usando Supabase.

## 🔧 Configuração Necessária no Supabase

### 1. Email Templates

Você precisa configurar o template de email de reset de senha no Supabase Dashboard:

1. Acesse: **Supabase Dashboard → Authentication → Email Templates**
2. Procure por **Reset Password** ou **Password Reset**
3. Customize o template (opcional, o padrão é adequado)

### 2. Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` contém:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Configuração de URL de Redirecionamento

A URL de redirecionamento é configurada no código como:
```
{window.location.origin}/reset-password
```

Isso significa:
- **Em desenvolvimento**: `http://localhost:5173/reset-password`
- **Em produção**: `https://seu-dominio.com/reset-password`

Se você tiver um domínio diferente em produção, consulte a seção **Configuração para Produção** abaixo.

## 🚀 Como Funciona

### Fluxo 1: Solicitar Reset de Senha

1. Usuário clica em "Esqueceu sua senha?" no login
2. Inserir o email cadastrado
3. Um email é enviado com um link de reset
4. O link aponta para `/reset-password`

### Fluxo 2: Redefinir Senha

1. Usuário clica no link do email
2. É redirecionado para `/reset-password`
3. Sistema valida se o token é válido
4. Usuário insere nova senha (com validações)
5. Senha é atualizada no Supabase
6. Usuário é redirecionado para login

## ⚙️ Validações de Senha

A nova senha deve atender aos seguintes requisitos:

- ✓ Mínimo 8 caracteres
- ✓ Pelo menos 1 letra maiúscula (A-Z)
- ✓ Pelo menos 1 letra minúscula (a-z)
- ✓ Pelo menos 1 número (0-9)
- ✓ Pelo menos 1 caractere especial (!@#$%^&*)

## 📁 Arquivos Modificados/Criados

### Arquivos Criados

1. **`src/components/auth/ForgotPasswordForm.tsx`**
   - Componente para solicitar reset de senha
   - Envia email com link de reset

2. **`src/components/auth/ResetPasswordForm.tsx`**
   - Componente para redefinir a senha
   - Valida requisitos de senha
   - Atualiza password no Supabase

3. **`src/pages/Login.tsx`**
   - Página de login pública

### Arquivos Modificados

1. **`src/hooks/useAuth.tsx`**
   - Adicionado método `resetPassword(email)`
   - Adicionado método `updatePassword(newPassword)`

2. **`src/components/auth/LoginForm.tsx`**
   - Adicionado botão "Esqueceu sua senha?"
   - Integração com `ForgotPasswordForm`

3. **`src/App.tsx`**
   - Adicionadas rotas públicas `/login` e `/reset-password`
   - Reestruturação para permitir rotas desprotegidas

## 🔐 Configuração para Produção

Se sua URL de produção é diferente da URL do Supabase, você pode:

### Opção 1: Variável de Ambiente (Recomendado)

Adicione no seu `.env.production`:

```env
VITE_RESET_PASSWORD_URL=https://seu-dominio.com/reset-password
```

E atualize `ForgotPasswordForm.tsx`:

```typescript
const resetUrl = import.meta.env.VITE_RESET_PASSWORD_URL || `${window.location.origin}/reset-password`;

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: resetUrl,
})
```

### Opção 2: Configurar no Supabase Dashboard

1. Acesse: **Supabase Dashboard → Authentication → URL Configuration**
2. Configure as URLs de callback/redirect apropriadas

## 🧪 Testes

### Teste Local

1. Inicie o servidor de desenvolvimento
2. Acesse `http://localhost:5173/login`
3. Clique em "Esqueceu sua senha?"
4. Digite um email existente
5. Verifique o console do Supabase ou seu serviço de email
6. Clique no link (pode copiar da URL se estiver em desenvolvimento)
7. Redefinir a senha

### Teste com Email Real

Para testar com email real, você precisa:

1. Configurar um serviço de email no Supabase (SendGrid, etc.)
2. Usar um email válido
3. Verificar a caixa de entrada

## 🐛 Troubleshooting

### Email não chega

1. Verifique a pasta de spam
2. Verifique se o email está correto no banco de dados
3. Verifique a configuração de email no Supabase
4. Verifique os logs do Supabase

### Link inválido ou expirado

1. O link é válido por 24 horas por padrão
2. Solicite um novo reset se o link expirou
3. Verifique se a URL de redirecionamento está correta

### Erro ao redefinir senha

1. Certifique-se de que a senha atende aos requisitos
2. Certifique-se de que o token ainda é válido
3. Verifique os logs do Supabase

## 📱 Componentes Reutilizáveis

### `useAuth` hook

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { resetPassword, updatePassword, loading, error } = useAuth()
  
  // Usar as funções
}
```

### Usar em seu próprio componente

```typescript
import { supabase } from '@/data/supabase'

// Solicitar reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})

// Atualizar password (na página de reset)
await supabase.auth.updateUser({
  password: newPassword,
})
```

## 📞 Suporte

Para mais informações sobre autenticação no Supabase:
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/auth/passwords

---

**Data de Criação**: Novembro 2025
**Versão**: 1.0
