# 🔐 Sistema de Reset de Senha - Guia Rápido

## ✅ O que foi implementado

Criei um sistema completo de reset de senha com:

### 1️⃣ **Fluxo de Esqueci a Senha**
- Usuário clica em "Esqueceu sua senha?" na tela de login
- Insere seu email
- Recebe um email com link de reset de senha

### 2️⃣ **Página de Reset de Senha**
- Link do email leva para `/reset-password`
- Validação de token
- Pedido de nova senha com requisitos de segurança:
  - Mínimo 8 caracteres
  - Letra maiúscula, minúscula, número e caractere especial
- Confirmação de senha

### 3️⃣ **Integração com Supabase**
- Usa `resetPasswordForEmail()` do Supabase
- Usa `updateUser()` para atualizar a password
- Validação de token automática

---

## 🎯 Arquivos Criados

```
src/
├── components/auth/
│   ├── ForgotPasswordForm.tsx      (novo)
│   ├── ResetPasswordForm.tsx       (novo)
│   └── LoginForm.tsx               (modificado)
├── pages/
│   └── Login.tsx                   (novo)
├── hooks/
│   └── useAuth.tsx                 (modificado)
└── App.tsx                         (modificado)
```

---

## 🚀 Como Usar

### Para o Usuário Final
1. Ir para o login
2. Clicar em "Esqueceu sua senha?"
3. Inserir o email
4. Clicar no link no email
5. Criar uma nova senha
6. Fazer login com a nova senha

### Para o Desenvolvedor

Se quiser usar as funções no seu código:

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { resetPassword, updatePassword, loading, error } = useAuth()
  
  // Solicitar reset
  await resetPassword('usuario@email.com')
  
  // Atualizar senha (dentro de /reset-password)
  await updatePassword('Nova@Senha123!')
}
```

---

## ⚙️ Configuração Necessária

### No Supabase Dashboard

1. **Verificar Email Service**
   - Ir em: `Authentication → Providers`
   - Supabase Email deve estar ativado (padrão)

2. **Templates (opcional)**
   - Ir em: `Authentication → Email Templates`
   - O template padrão já funciona

3. **URL de Callback**
   - Deve aceitar: `https://seu-dominio.com/reset-password`

### No Seu `.env.local`

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

---

## 🧪 Testar Localmente

1. Start o projeto:
```bash
npm run dev
```

2. Acesse: `http://localhost:5173/login`

3. Clique em "Esqueceu sua senha?"

4. Digite um email cadastrado (ou qualquer email se estiver em desenvolvimento)

5. Para testar localmente sem email real:
   - Verificar nos logs do Supabase
   - Ou verificar na tabela `auth.users`

---

## 📋 Fluxo Técnico

```
┌─────────────────────────────────────────────┐
│ LoginForm                                   │
│ - Clique em "Esqueceu sua senha?"           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ ForgotPasswordForm                          │
│ - Solicita email                            │
│ - Chama supabase.auth.resetPasswordForEmail │
│ - Email enviado com link                    │
└──────────────┬──────────────────────────────┘
               │
               │ Usuário clica no link do email
               │ URL: /reset-password?code=xxxxx
               ▼
┌─────────────────────────────────────────────┐
│ ResetPasswordForm                           │
│ - Valida token do Supabase                  │
│ - Pede nova senha                           │
│ - Valida requisitos (8 chars, uppercase...)│
│ - Chama supabase.auth.updateUser()          │
│ - Redireciona para login                    │
└─────────────────────────────────────────────┘
```

---

## 🔐 Requisitos de Senha

A nova senha DEVE ter:

- ✅ **Mínimo 8 caracteres** (`12345678`)
- ✅ **Letra maiúscula** (`ABC...`)
- ✅ **Letra minúscula** (`abc...`)
- ✅ **Número** (`0-9`)
- ✅ **Caractere especial** (`!@#$%^&*`)

**Exemplo válido**: `Senha@123`
**Exemplo inválido**: `senha123` (sem maiúscula, sem caractere especial)

---

## ❌ Erros Comuns

| Erro | Solução |
|------|---------|
| "Link inválido ou expirado" | Link válido por 24h, solicite um novo |
| Email não chega | Verifique spam, configure email no Supabase |
| "Senha não atende requisitos" | Adicione maiúscula, número e caractere especial |
| "Sessão inválida" | Clique no link do email diretamente |

---

## 📚 Documentação Completa

Consulte `RESET_PASSWORD_SETUP.md` para:
- Configuração detalhada
- Troubleshooting
- Customizações
- Testes em produção

---

## 💡 Dicas

1. **Customizar email**: Vá para `Email Templates` no Supabase
2. **Mudar duração do link**: Supabase → Auth Settings → Link expiração
3. **Requisitos diferentes**: Edite `ResetPasswordForm.tsx` função `validatePassword`
4. **Temas diferentes**: Use componentes de UI do seu design system

---

**Status**: ✅ Pronto para usar
**Versão**: 1.0
**Atualizado**: Novembro 2025
