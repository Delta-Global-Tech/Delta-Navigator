# 🔐 Aumentar Expiração de Token - Passo a Passo

## ❌ Problema
Link de reset de senha expirando muito rápido (menos de 24h)

## ✅ Solução

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://app.supabase.com
2. Faça login com sua conta
3. Selecione o projeto: **Delta Navigator**

### Passo 2: Ir para SQL Editor
1. No menu lateral esquerdo, clique em: **SQL Editor**
2. Clique em: **New Query**

### Passo 3: Copiar e Executar Script

Copie este script abaixo e cole no SQL Editor:

```sql
-- Aumentar expiração de token para 7 dias
UPDATE auth.config 
SET value = '604800'
WHERE key = 'password_reset_token_expiry';

-- Aumentar expiração de confirmação de email para 7 dias
UPDATE auth.config 
SET value = '604800'
WHERE key = 'email_confirmation_token_expiry';

-- Verificar
SELECT key, value FROM auth.config 
WHERE key IN ('password_reset_token_expiry', 'email_confirmation_token_expiry');
```

### Passo 4: Clicar em "Execute"
- Você verá uma mensagem "Query executed successfully"

### Passo 5: Verificar Resultado
- Você verá uma tabela com os valores atualizados
- **password_reset_token_expiry**: deve estar `604800` (7 dias em segundos)

---

## ⏱️ Tempos de Expiração

| Tempo | Segundos |
|-------|----------|
| 1 hora | 3600 |
| 6 horas | 21600 |
| 24 horas | 86400 |
| 7 dias | 604800 |
| 30 dias | 2592000 |

Se quiser outro tempo, substitua `604800` no script acima.

---

## 🧪 Testar Depois

Depois de executar o script:

1. Vá para: http://192.168.8.149/#/login
2. Clique em: "Esqueceu sua senha?"
3. Digite seu email
4. **AGUARDE 1 MINUTO** (para Supabase processar a mudança)
5. Receba o email
6. **Deixe o link de lado por alguns dias**
7. Quando quiser, clique no link - agora durará 7 dias

---

## ⚠️ Se Não Funcionar

Se o comando acima não funcionar, tente esta alternativa:

1. No Supabase Dashboard, vá para: **Authentication → Providers → Email**
2. Procure por: **Email Templates**
3. Edite o template de reset de senha
4. Procure por alguma menção a expiração
5. Ou contate suporte Supabase

---

## 📚 Explicação

- **password_reset_token_expiry**: Tempo que o link de reset dura
- **email_confirmation_token_expiry**: Tempo que o link de confirmação de email dura
- Ambos em **segundos**

Com 604800 segundos (7 dias), você tem muito mais tempo para usar o link.

---

## ✨ Resultado Final

Após executar o script, os links de reset de senha durarão **7 dias** em vez de 1 hora!

