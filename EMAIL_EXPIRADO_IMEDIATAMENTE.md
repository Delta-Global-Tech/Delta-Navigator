# 🚨 Email Expirando Imediatamente - Diagnóstico

## ❌ Problema
Link de reset de senha está **expirado na hora que chega no email**

## 🔍 Diagnóstico Rápido

Isso acontece quando:
1. ❌ **Supabase está em modo TEST** (não envia emails de verdade)
2. ❌ **Email template está quebrado**
3. ❌ **Token está sendo gerado com expiração zerada**
4. ❌ **Timezone do banco de dados está errado**

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar Modo de Desenvolvimento

1. Acesse: https://app.supabase.com
2. Seu projeto: **Delta Navigator**
3. Vá para: **Authentication → Providers → Email**
4. Procure por: **Enable Email Provider**
5. Verifique se está: **✅ ON**

### Passo 2: Verificar Email de Teste

Se você está usando **Email local em desenvolvimento**:
1. Vá para: **Authentication → Providers → Email**
2. Procure: **Email Log**
3. Você verá todos os emails enviados (mesmo sem SMTP real)

### Passo 3: Verificar se Email Chegou

1. No **Email Log**, procure seu email
2. Você deve ver:
   - ✅ Email sendido
   - ✅ Link gerado
   - ✅ Hora de envio

3. **Clique** em um email para ver detalhes

### Passo 4: Copiar Link Direto

Se o email chegou:
1. No **Email Log**, encontre o email de reset
2. **Copie o link completo** (deve ter `access_token=xxx`)
3. **Cole na barra de endereços** do navegador
4. Acesse o link DIRETAMENTE

Exemplo:
```
http://192.168.8.149/#/reset-password?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=recovery
```

---

## 🔧 Solução Técnica

O problema pode estar no banco de dados. Execute este SQL no Supabase:

```sql
-- Verificar timezone
SELECT current_setting('TIMEZONE');

-- Se não estiver em UTC, corrigir:
SET TIMEZONE = 'UTC';

-- Verificar expiração de token
SELECT key, value FROM auth.config 
WHERE key LIKE '%expir%';

-- Se estiver vazio/nulo, adicionar padrão:
INSERT INTO auth.config (key, value)
VALUES 
  ('password_reset_token_expiry', '86400'),
  ('email_confirmation_token_expiry', '86400')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
```

---

## 🧪 Teste Prático

### Opção A: Usar Email Log do Supabase

1. Vá para: https://app.supabase.com
2. Projeto: **Delta Navigator**
3. **Authentication → Providers → Email**
4. Role para baixo até: **Email Log**
5. Procure pelo último email
6. **Copie o link de reset**
7. **Cole na barra de endereços**
8. Teste se funciona

### Opção B: Gerar Link via SQL

Se nada funcionar, gere manualmente:

```sql
-- 1. Criar token de reset
SELECT 
  auth.users.id,
  auth.users.email,
  auth.users.email_confirmed_at,
  (SELECT value FROM auth.config WHERE key = 'password_reset_token_expiry') as expiry
FROM auth.users
WHERE email = 'seu-email@email.com';

-- 2. Gerar novo token
UPDATE auth.users
SET recovery_sent_at = now()
WHERE email = 'seu-email@email.com';
```

---

## 🚀 Próximas Ações

1. **Verifique o Email Log** (já está no Supabase, não precisa fazer nada)
2. **Copie o link direto** de lá
3. **Teste o link** na barra de endereços
4. **Se funcionar**: problema é só de timing, aumente expiração
5. **Se não funcionar**: execute SQL acima para resetar configuração

---

## 📋 Checklist de Verificação

- [ ] Email Provider está **ON**?
- [ ] Email chegou no **Email Log**?
- [ ] Link tem `access_token`?
- [ ] Link tem `type=recovery`?
- [ ] Você está logado no Supabase?
- [ ] Projeto está ativo?

---

## 💬 Resumo

Se o link expira **imediatamente**, não é problema de tempo de expiração.
É problema de **como o token está sendo gerado ou validado**.

**Próximo passo**: Verifique o Email Log no Supabase Dashboard para ver se o link foi gerado corretamente.

